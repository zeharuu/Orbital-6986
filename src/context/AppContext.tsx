import { createContext, useContext, useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { isValidEmail } from "../data";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

type FoodItem = {
  id: string;
  name: string;
  canteen: string;
  stall: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  tags: string[];
};

type AppContextType = {
  // Auth
  email: string;
  emailInput: string;
  setEmailInput: (v: string) => void;
  emailError: string;
  emailConfirmed: boolean;
  confirmEmail: () => Promise<void>;
  signOut: () => Promise<void>;
  authLoading: boolean;

  // Profile
  name: string; setName: (v: string) => void;
  gender: string; setGender: (v: string) => void;
  age: string; setAge: (v: string) => void;
  height: string; setHeight: (v: string) => void;
  weight: string; setWeight: (v: string) => void;
  goal: string; setGoal: (v: string) => void;
  profileCreated: boolean;
  profileComplete: boolean;
  profilePrompt: boolean;
  setProfilePrompt: (v: boolean) => void;
  saveProfile: () => Promise<void>;
  editProfile: () => void;

  // Food log
  loggedCounts: Record<string, number>;
  addFood: (id: string) => void;
  removeFood: (id: string) => void;

  // Streak
  streakDays: number;

  // Food items
  foodItems: FoodItem[];
  foodLoading: boolean;

  // Computed
  bmi: string | null;
  bmr: number;
  calorieTarget: number | null;
  loggedEntries: (FoodItem & { count: number })[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  isOverLimit: boolean;
  calorieProgress: number;
  remaining: number | null;
  initials: string;
};

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  // Auth
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [email, setEmail] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Profile
  const [name, setName] = useState("");
  const [gender, setGender] = useState("Female");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("Maintain weight");
  const [profileCreated, setProfileCreated] = useState(false);
  const [profilePrompt, setProfilePrompt] = useState(false);

  // Food log
  const [loggedCounts, setLoggedCounts] = useState<Record<string, number>>({});

  // Streak
  const [streakDays, setStreakDays] = useState(0);
  const hasLoggedThisSession = useRef(false);

  // Food items from Firestore
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [foodLoading, setFoodLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          setEmail(user.email || "");
          setEmailConfirmed(true);
          hasLoggedThisSession.current = false;

          // Load user profile from Firestore
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.profileCreated) {
              setName(data.name || "");
              setGender(data.gender || "Female");
              setAge(data.age || "");
              setHeight(data.height || "");
              setWeight(data.weight || "");
              setGoal(data.goal || "Maintain weight");
              setProfileCreated(true);
            }

            // Load streak
            const s = data.streak || {};
            const today = new Date().toDateString();
            const yesterday = new Date(Date.now() - 864e5).toDateString();
            if (s.lastDate === today || s.lastDate === yesterday) {
              setStreakDays(s.count || 0);
            }

            // Load today's food log
            const dl = data.dailyLog || {};
            if (dl.date === today && dl.counts) {
              setLoggedCounts(dl.counts);
            }
          }
        } else {
          // User signed out
          setCurrentUser(null);
          setEmail("");
          setEmailConfirmed(false);
          setProfileCreated(false);
          setLoggedCounts({});
          setStreakDays(0);
          setName("");
          setAge("");
          setHeight("");
          setWeight("");
          setGender("Female");
          setGoal("Maintain weight");
          setProfilePrompt(false);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Load food items from Firestore
  useEffect(() => {
    const loadFoodItems = async () => {
      try {
        setFoodLoading(true);
        const foodRef = collection(db, "foodItems");
        const snapshot = await getDocs(foodRef);
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        } as FoodItem));
        setFoodItems(items.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error("Failed to load food items:", error);
        setFoodLoading(false);
      }
    };

    loadFoodItems();
  }, []);

  // Persist daily food log
  useEffect(() => {
    if (!currentUser) return;

    const persistLog = async () => {
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(
          userDocRef,
          {
            dailyLog: { date: new Date().toDateString(), counts: loggedCounts },
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Failed to persist food log:", error);
      }
    };

    const timer = setTimeout(persistLog, 500);
    return () => clearTimeout(timer);
  }, [loggedCounts, currentUser]);

  // Streak logic
  useEffect(() => {
    if (!currentUser) return;

    const updateStreak = async () => {
      try {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 864e5).toDateString();
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const saved = userDoc.data() || {};
        const s = saved.streak || {};

        if (Object.keys(loggedCounts).length === 0) {
          if (hasLoggedThisSession.current && s.lastDate === today) {
            const prevCount = Math.max(0, (s.count || 1) - 1);
            const newStreak = prevCount > 0 ? { count: prevCount, lastDate: yesterday } : {};
            await setDoc(
              userDocRef,
              { streak: newStreak, updatedAt: new Date().toISOString() },
              { merge: true }
            );
            setStreakDays(prevCount);
          }
          return;
        }

        hasLoggedThisSession.current = true;
        if (s.lastDate === today) return;

        const newCount = s.lastDate === yesterday ? (s.count || 0) + 1 : 1;
        await setDoc(
          userDocRef,
          {
            streak: { count: newCount, lastDate: today },
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        setStreakDays(newCount);
      } catch (error) {
        console.error("Failed to update streak:", error);
      }
    };

    updateStreak();
  }, [loggedCounts, currentUser]);

  // Computed
  const heightM = Number(height) / 100;
  const bmi = height && weight ? (Number(weight) / (heightM * heightM)).toFixed(1) : null;

  const bmr = useMemo(() => {
    const w = Number(weight), h = Number(height), a = Number(age);
    if (!w || !h || !a) return 0;
    return gender === "Male"
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;
  }, [weight, height, age, gender]);

  const calorieTarget = bmr === 0 ? null
    : Math.round(bmr * 1.4 + (goal === "Gain muscle" ? 300 : goal === "Lose weight" ? -300 : 0));

  const loggedEntries = foodItems
    .filter(f => (loggedCounts[f.id] || 0) > 0)
    .map(f => ({ ...f, count: loggedCounts[f.id] }));

  const totalCalories = loggedEntries.reduce((s, f) => s + f.calories * f.count, 0);
  const totalProtein  = Math.round(loggedEntries.reduce((s, f) => s + f.protein * f.count, 0));
  const totalCarbs    = Math.round(loggedEntries.reduce((s, f) => s + f.carbs * f.count, 0));
  const totalFat      = Math.round(loggedEntries.reduce((s, f) => s + f.fat * f.count, 0));
  const isOverLimit   = calorieTarget !== null && totalCalories > calorieTarget;
  const calorieProgress = calorieTarget ? Math.min((totalCalories / calorieTarget) * 100, 100) : 0;
  const remaining     = calorieTarget !== null ? calorieTarget - totalCalories : null;
  const profileComplete = profileCreated && !!height && !!weight;
  const initials = name
    ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : email ? email.slice(0, 2).toUpperCase() : "?";

  // Actions
  const confirmEmail = async () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    try {
      setEmailError("");
      // Try sign up first
      try {
        await createUserWithEmailAndPassword(auth, trimmed, "firebase-auto-generated");
      } catch (error: any) {
        // If account exists, try signing in
        if (error.code === "auth/email-already-in-use") {
          await signInWithEmailAndPassword(auth, trimmed, "firebase-auto-generated");
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      setEmailError(error.message || "Authentication failed");
    }
  };

  const saveProfile = async () => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(
        userDocRef,
        {
          name,
          gender,
          age,
          height,
          weight,
          goal,
          profileCreated: true,
          email: currentUser.email,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setProfileCreated(true);
      setProfilePrompt(false);
      navigate("/home");
    } catch (error) {
      console.error("Failed to save profile:", error);
      setEmailError("Failed to save profile. Try again.");
    }
  };

  const addFood = (id: string) => {
    if (!profileComplete) { setProfilePrompt(true); navigate("/profile"); return; }
    setLoggedCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFood = (id: string) => {
    setLoggedCounts(prev => {
      const next = { ...prev };
      if ((next[id] || 0) <= 1) delete next[id];
      else next[id] = next[id] - 1;
      return next;
    });
  };

  const editProfile = () => setProfileCreated(false);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      navigate("/home");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <AppContext.Provider value={{
      email, emailInput, setEmailInput, emailError, emailConfirmed, confirmEmail, signOut, authLoading,
      name, setName, gender, setGender, age, setAge,
      height, setHeight, weight, setWeight, goal, setGoal,
      profileCreated, profileComplete, profilePrompt, setProfilePrompt, saveProfile, editProfile,
      loggedCounts, addFood, removeFood,
      streakDays,
      foodItems, foodLoading,
      bmi, bmr, calorieTarget, loggedEntries,
      totalCalories, totalProtein, totalCarbs, totalFat,
      isOverLimit, calorieProgress, remaining, initials,
    }}>
      {children}
    </AppContext.Provider>
  );
}
