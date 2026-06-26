import { createContext, useContext, useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { foodItems as fallbackFoodItems, isValidEmail } from "../data";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from "firebase/firestore";

type FoodItem = {
  id: string;
  name: string;
  canteen: string;
  stall: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium?: number;
  tags: string[];
  estimated?: boolean;
};

type AppContextType = {
  // Auth
  email: string;
  emailInput: string;
  setEmailInput: (v: string) => void;
  emailError: string;
  emailConfirmed: boolean;
  browsingAsGuest: boolean;
  startGuestBrowsing: () => void;
  stopGuestBrowsing: () => void;
  signInWithPassword: (password: string) => Promise<void>;
  createAccountWithPassword: (password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
  logHistory: Record<string, Record<string, number>>;
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
const googleProvider = new GoogleAuthProvider();
const bundledFoodItems: FoodItem[] = fallbackFoodItems.map((item) => ({
  ...item,
  id: String(item.id),
}));

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
  const [browsingAsGuest, setBrowsingAsGuest] = useState(false);
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
  const [logHistory, setLogHistory] = useState<Record<string, Record<string, number>>>({});

  // Streak
  const [streakDays, setStreakDays] = useState(0);
  const hasLoggedThisSession = useRef(false);
  // Blocks persistLog from firing before Firestore data has loaded on sign-in
  const hasRestoredFromFirestore = useRef(false);

  // Food items from Firestore
  const [foodItems, setFoodItems] = useState<FoodItem[]>(bundledFoodItems);
  const [foodLoading, setFoodLoading] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          hasRestoredFromFirestore.current = false;
          setCurrentUser(user);
          setEmail(user.email || "");
          setEmailConfirmed(true);
          setBrowsingAsGuest(false);
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

            // Load full log history and today's counts
            const logsData: Record<string, Record<string, number>> = data.logs || {};
            setLogHistory(logsData);
            if (logsData[today]) {
              setLoggedCounts(logsData[today]);
            } else if (data.dailyLog?.date === today && data.dailyLog?.counts) {
              // Migrate from old dailyLog format
              setLoggedCounts(data.dailyLog.counts);
            }
            // Allow persistLog to run only after Firestore data is loaded
            hasRestoredFromFirestore.current = true;
          }
        } else {
          // User signed out
          hasRestoredFromFirestore.current = false;
          setCurrentUser(null);
          setEmail("");
          setEmailConfirmed(false);
          setProfileCreated(false);
          setLoggedCounts({});
          setLogHistory({});
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
        const foodRef = collection(db, "foodItems");
        const snapshot = await getDocs(foodRef);
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        } as FoodItem));
        const nextItems = items.length > 0 ? items : bundledFoodItems;
        setFoodItems(nextItems.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error("Failed to load food items:", error);
        setFoodItems(bundledFoodItems.sort((a, b) => a.name.localeCompare(b.name)));
      } finally {
        setFoodLoading(false);
      }
    };

    loadFoodItems();
  }, []);

  // Persist daily food log
  useEffect(() => {
    if (!currentUser || !hasRestoredFromFirestore.current) return;

    const today = new Date().toDateString();

    const persistLog = async () => {
      const userDocRef = doc(db, "users", currentUser.uid);
      try {
        await updateDoc(userDocRef, {
          [`logs.${today}`]: loggedCounts,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        // Document may not exist yet for brand-new users
        await setDoc(userDocRef, { logs: { [today]: loggedCounts }, updatedAt: new Date().toISOString() }, { merge: true });
      }
      setLogHistory(prev => ({ ...prev, [today]: loggedCounts }));
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
  const getAuthErrorMessage = (error: unknown) => {
    const code = typeof error === "object" && error && "code" in error
      ? String((error as { code?: string }).code)
      : "";

    switch (code) {
      case "auth/email-already-in-use":
        return "An account already exists for this email. Try signing in instead.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email or password is incorrect.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was closed before it finished.";
      case "auth/account-exists-with-different-credential":
        return "This email is already linked to another sign-in method.";
      default:
        return error instanceof Error ? error.message : "Authentication failed. Try again.";
    }
  };

  const getTrimmedEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return null;
    }
    return trimmed;
  };

  const signInWithPassword = async (password: string) => {
    const trimmed = getTrimmedEmail();
    if (!trimmed) return;
    if (!password) {
      setEmailError("Please enter your password.");
      return;
    }

    try {
      setEmailError("");
      await signInWithEmailAndPassword(auth, trimmed, password);
    } catch (error) {
      setEmailError(getAuthErrorMessage(error));
    }
  };

  const createAccountWithPassword = async (password: string) => {
    const trimmed = getTrimmedEmail();
    if (!trimmed) return;
    if (password.length < 6) {
      setEmailError("Password should be at least 6 characters.");
      return;
    }

    try {
      setEmailError("");
      await createUserWithEmailAndPassword(auth, trimmed, password);
    } catch (error) {
      setEmailError(getAuthErrorMessage(error));
    }
  };

  const signInWithGoogle = async () => {
    try {
      setEmailError("");
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setEmailError(getAuthErrorMessage(error));
    }
  };

  const startGuestBrowsing = () => {
    setEmailError("");
    setBrowsingAsGuest(true);
    navigate("/search");
  };

  const stopGuestBrowsing = () => {
    setBrowsingAsGuest(false);
    navigate("/");
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
      setBrowsingAsGuest(false);
      navigate("/home");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <AppContext.Provider value={{
      email, emailInput, setEmailInput, emailError, emailConfirmed,
      browsingAsGuest, startGuestBrowsing, stopGuestBrowsing,
      signInWithPassword, createAccountWithPassword, signInWithGoogle, signOut, authLoading,
      name, setName, gender, setGender, age, setAge,
      height, setHeight, weight, setWeight, goal, setGoal,
      profileCreated, profileComplete, profilePrompt, setProfilePrompt, saveProfile, editProfile,
      loggedCounts, logHistory, addFood, removeFood,
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
