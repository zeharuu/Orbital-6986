import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useApp } from "./AppContext";
import {
  getTodaysHealthyPicks, getTodaysCuisinePicks, biteTierName,
  POINTS_DAILY_STREAK, POINTS_THREE_STALLS, POINTS_TWO_CANTEENS,
  POINTS_FIVE_DAY_STREAK, POINTS_TEN_DAY_CALORIE_STREAK, POINTS_HEALTHY_PICK,
  POINTS_GOAL_HIT_BY_DEADLINE, POINTS_BITE_TIER, POINTS_CUISINE_PICK,
  VOUCHER_DRINK_COST, VOUCHER_FOOD_COST,
} from "../data";

type Voucher = {
  id: string;
  type: "drink" | "food";
  cost: number;
  redeemedAt: string;
  used: boolean;
};

type HealthyPick = { id: string; name: string; stall: string; canteen: string };

type PendingClaim = { id: string; label: string; points: number };

type ChallengesContextType = {
  loading: boolean;
  todayKey: string;
  points: number;
  lifetimePoints: number;
  goalAchievedForTarget: string;
  threeStallsClaimedDate: string;
  twoCanteensClaimedDate: string;
  calorieStreak: number;
  lifetimeActiveDays: number;
  claimedBiteDaysAt: number;
  todaysHealthyPicks: HealthyPick[];
  todaysCuisinePicks: HealthyPick[];
  pendingClaims: PendingClaim[];
  claim: (id: string) => void;
  vouchers: Voucher[];
  redeemDrink: () => void;
  redeemFood: () => void;
  markVoucherUsed: (id: string) => void;
};

const ChallengesContext = createContext<ChallengesContextType | null>(null);

export function useChallenges() {
  const ctx = useContext(ChallengesContext);
  if (!ctx) throw new Error("useChallenges must be used inside ChallengesProvider");
  return ctx;
}

export function ChallengesProvider({ children }: { children: React.ReactNode }) {
  const {
    loggedCounts, logHistory, foodItems, streakDays, calorieTarget, goal,
    bmi, useTargetMode, targetBmi, targetDate, weightDiffKg,
  } = useApp();

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [points, setPoints] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  // Signature (targetBmi|targetDate) of the target Goal Crusher was already claimed
  // for - stays one-time per target, but a genuinely new target makes it claimable again.
  const [goalAchievedForTarget, setGoalAchievedForTarget] = useState("");
  // "Claimed up to" thresholds / "claimed on this date" markers - a milestone being
  // reached doesn't award points on its own; the user must click Claim.
  const [claimedStreakAt, setClaimedStreakAt] = useState(0);
  const [claimedCalorieStreakAt, setClaimedCalorieStreakAt] = useState(0);
  const [claimedBiteDaysAt, setClaimedBiteDaysAt] = useState(0);
  const [healthyPickClaimedDate, setHealthyPickClaimedDate] = useState("");
  const [cuisinePickClaimedDate, setCuisinePickClaimedDate] = useState("");
  const [dailyStreakClaimedDate, setDailyStreakClaimedDate] = useState("");
  const [threeStallsClaimedDate, setThreeStallsClaimedDate] = useState("");
  const [twoCanteensClaimedDate, setTwoCanteensClaimedDate] = useState("");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  // Lazy initializer keeps Date.now() out of the render body (react-hooks/purity).
  const [now] = useState(() => Date.now());
  const todayKey = useMemo(() => new Date(now).toDateString(), [now]);

  // Own, independent auth listener - does not rely on AppContext exposing the user.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const ref = doc(db, "challenges", user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            setPoints(data.points || 0);
            setLifetimePoints(data.lifetimePoints || 0);
            setGoalAchievedForTarget(data.goalAchievedForTarget || "");
            setClaimedStreakAt(data.claimedStreakAt || 0);
            setClaimedCalorieStreakAt(data.claimedCalorieStreakAt || 0);
            setClaimedBiteDaysAt(data.claimedBiteDaysAt || 0);
            setHealthyPickClaimedDate(data.healthyPickClaimedDate || "");
            setCuisinePickClaimedDate(data.cuisinePickClaimedDate || "");
            setDailyStreakClaimedDate(data.dailyStreakClaimedDate || "");
            setThreeStallsClaimedDate(data.threeStallsClaimedDate || "");
            setTwoCanteensClaimedDate(data.twoCanteensClaimedDate || "");
            setVouchers(data.vouchers || []);
          }
        } catch (error) {
          console.error("Failed to load challenges:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setUid(null);
        setPoints(0);
        setLifetimePoints(0);
        setGoalAchievedForTarget("");
        setClaimedStreakAt(0);
        setClaimedCalorieStreakAt(0);
        setClaimedBiteDaysAt(0);
        setHealthyPickClaimedDate("");
        setCuisinePickClaimedDate("");
        setDailyStreakClaimedDate("");
        setThreeStallsClaimedDate("");
        setTwoCanteensClaimedDate("");
        setVouchers([]);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Today's distinct stalls/canteens - resets daily (Stall Explorer / Canteen Hopper
  // are daily variety challenges, not lifetime milestones).
  const { distinctStalls, distinctCanteens } = useMemo(() => {
    const stalls = new Set<string>();
    const canteens = new Set<string>();
    Object.entries(loggedCounts).forEach(([id, count]) => {
      if (count <= 0) return;
      const item = foodItems.find(f => f.id === id);
      if (item) { stalls.add(item.stall); canteens.add(item.canteen); }
    });
    return { distinctStalls: stalls, distinctCanteens: canteens };
  }, [loggedCounts, foodItems]);

  // Lifetime count of distinct calendar days with at least one item logged (not
  // necessarily consecutive - drives the repeatable "Bite Tier" achievement).
  const lifetimeActiveDays = useMemo(() => {
    const days = new Set<string>();
    Object.entries(logHistory).forEach(([date, dayMap]) => {
      if (Object.values(dayMap).some(count => count > 0)) days.add(date);
    });
    if (Object.values(loggedCounts).some(count => count > 0)) days.add(todayKey);
    return days.size;
  }, [logHistory, loggedCounts, todayKey]);

  const todaysHealthyPicks = useMemo(
    () => getTodaysHealthyPicks(foodItems, goal, todayKey),
    [foodItems, goal, todayKey]
  );

  // 2 daily picks from different cuisines (e.g. 1 Korean, 1 Western) for variety.
  const todaysCuisinePicks = useMemo(
    () => getTodaysCuisinePicks(foodItems, todayKey),
    [foodItems, todayKey]
  );

  // Consecutive days (including today) where totalCalories landed within calorieTarget.
  const calorieStreak = useMemo(() => {
    if (calorieTarget === null) return 0;
    const caloriesById = new Map(foodItems.map(f => [f.id, f.calories]));
    let streak = 0;
    let cursor = new Date(now);
    for (;;) {
      const key = cursor.toDateString();
      const dayLog = key === todayKey ? loggedCounts : logHistory[key];
      if (!dayLog) break;
      const total = Object.entries(dayLog).reduce((sum, [id, count]) => sum + (caloriesById.get(id) || 0) * count, 0);
      if (total > 0 && total <= calorieTarget) {
        streak++;
        cursor = new Date(cursor.getTime() - 86400000);
      } else {
        break;
      }
    }
    return streak;
  }, [logHistory, loggedCounts, foodItems, calorieTarget, todayKey, now]);

  const targetSignature = useTargetMode && targetBmi && targetDate ? `${targetBmi}|${targetDate}` : "";

  // Pure derivation of "what's ready to claim right now" - no side effects, so nothing
  // is awarded automatically. Points only move into the balance via claim() below,
  // which runs from a button click, not an effect.
  const pendingClaims: PendingClaim[] = useMemo(() => {
    const claims: PendingClaim[] = [];

    if (lifetimeActiveDays >= claimedBiteDaysAt + 10) {
      claims.push({ id: "biteTier", label: biteTierName(claimedBiteDaysAt + 10), points: POINTS_BITE_TIER });
    }
    if (distinctStalls.size >= 3 && threeStallsClaimedDate !== todayKey) {
      claims.push({ id: "threeStalls", label: "Stall Explorer", points: POINTS_THREE_STALLS });
    }
    if (distinctCanteens.size >= 2 && twoCanteensClaimedDate !== todayKey) {
      claims.push({ id: "twoCanteens", label: "Canteen Hopper", points: POINTS_TWO_CANTEENS });
    }
    if (targetSignature && targetSignature !== goalAchievedForTarget && bmi !== null && weightDiffKg !== null) {
      const goalAchieved = weightDiffKg < 0 ? Number(bmi) <= Number(targetBmi) : Number(bmi) >= Number(targetBmi);
      if (goalAchieved) {
        claims.push({ id: "goalHitByDeadline", label: "Goal Crusher", points: POINTS_GOAL_HIT_BY_DEADLINE });
      }
    }
    if (streakDays > 0 && dailyStreakClaimedDate !== todayKey) {
      claims.push({ id: "dailyStreak", label: "Daily Streak Bonus", points: POINTS_DAILY_STREAK });
    }
    if (streakDays >= claimedStreakAt + 5) {
      claims.push({ id: "streak", label: `${claimedStreakAt + 5}-Day Logging Streak`, points: POINTS_FIVE_DAY_STREAK });
    }
    if (calorieStreak >= claimedCalorieStreakAt + 10) {
      claims.push({ id: "calorieStreak", label: `${claimedCalorieStreakAt + 10}-Day Calorie Streak`, points: POINTS_TEN_DAY_CALORIE_STREAK });
    }
    if (healthyPickClaimedDate !== todayKey && todaysHealthyPicks.some(p => (loggedCounts[p.id] || 0) > 0)) {
      claims.push({ id: "healthyPick", label: "Today's Healthy Pick", points: POINTS_HEALTHY_PICK });
    }
    if (cuisinePickClaimedDate !== todayKey && todaysCuisinePicks.some(p => (loggedCounts[p.id] || 0) > 0)) {
      claims.push({ id: "cuisinePick", label: "Try Something New", points: POINTS_CUISINE_PICK });
    }

    return claims;
  }, [
    lifetimeActiveDays, claimedBiteDaysAt, distinctStalls, distinctCanteens, threeStallsClaimedDate, twoCanteensClaimedDate,
    targetSignature, goalAchievedForTarget, bmi, targetBmi, weightDiffKg,
    streakDays, dailyStreakClaimedDate, claimedStreakAt, calorieStreak, claimedCalorieStreakAt, healthyPickClaimedDate, todaysHealthyPicks,
    cuisinePickClaimedDate, todaysCuisinePicks, loggedCounts, todayKey,
  ]);

  const persistNow = (fields: {
    points: number; lifetimePoints: number; goalAchievedForTarget: string;
    claimedStreakAt: number; claimedCalorieStreakAt: number; claimedBiteDaysAt: number;
    healthyPickClaimedDate: string; cuisinePickClaimedDate: string; dailyStreakClaimedDate: string;
    threeStallsClaimedDate: string; twoCanteensClaimedDate: string; vouchers: Voucher[];
  }) => {
    if (!uid) return;
    setDoc(doc(db, "challenges", uid), { ...fields, updatedAt: new Date().toISOString() }, { merge: true })
      .catch(error => console.error("Failed to save challenges:", error));
  };

  // Called from a button click - collects one pending claim into the point balance.
  const claim = (claimId: string) => {
    const found = pendingClaims.find(c => c.id === claimId);
    if (!found || !uid) return;

    const newPoints = points + found.points;
    const newLifetimePoints = lifetimePoints + found.points;
    let newGoalAchievedForTarget = goalAchievedForTarget;
    let newClaimedStreakAt = claimedStreakAt;
    let newClaimedCalorieStreakAt = claimedCalorieStreakAt;
    let newClaimedBiteDaysAt = claimedBiteDaysAt;
    let newHealthyPickClaimedDate = healthyPickClaimedDate;
    let newCuisinePickClaimedDate = cuisinePickClaimedDate;
    let newDailyStreakClaimedDate = dailyStreakClaimedDate;
    let newThreeStallsClaimedDate = threeStallsClaimedDate;
    let newTwoCanteensClaimedDate = twoCanteensClaimedDate;

    if (claimId === "goalHitByDeadline") {
      newGoalAchievedForTarget = targetSignature;
    } else if (claimId === "streak") {
      newClaimedStreakAt = claimedStreakAt + 5;
    } else if (claimId === "calorieStreak") {
      newClaimedCalorieStreakAt = claimedCalorieStreakAt + 10;
    } else if (claimId === "biteTier") {
      newClaimedBiteDaysAt = claimedBiteDaysAt + 10;
    } else if (claimId === "healthyPick") {
      newHealthyPickClaimedDate = todayKey;
    } else if (claimId === "cuisinePick") {
      newCuisinePickClaimedDate = todayKey;
    } else if (claimId === "dailyStreak") {
      newDailyStreakClaimedDate = todayKey;
    } else if (claimId === "threeStalls") {
      newThreeStallsClaimedDate = todayKey;
    } else if (claimId === "twoCanteens") {
      newTwoCanteensClaimedDate = todayKey;
    }

    setPoints(newPoints);
    setLifetimePoints(newLifetimePoints);
    setGoalAchievedForTarget(newGoalAchievedForTarget);
    setClaimedStreakAt(newClaimedStreakAt);
    setClaimedCalorieStreakAt(newClaimedCalorieStreakAt);
    setClaimedBiteDaysAt(newClaimedBiteDaysAt);
    setHealthyPickClaimedDate(newHealthyPickClaimedDate);
    setCuisinePickClaimedDate(newCuisinePickClaimedDate);
    setDailyStreakClaimedDate(newDailyStreakClaimedDate);
    setThreeStallsClaimedDate(newThreeStallsClaimedDate);
    setTwoCanteensClaimedDate(newTwoCanteensClaimedDate);

    persistNow({
      points: newPoints, lifetimePoints: newLifetimePoints, goalAchievedForTarget: newGoalAchievedForTarget,
      claimedStreakAt: newClaimedStreakAt, claimedCalorieStreakAt: newClaimedCalorieStreakAt,
      claimedBiteDaysAt: newClaimedBiteDaysAt, healthyPickClaimedDate: newHealthyPickClaimedDate,
      cuisinePickClaimedDate: newCuisinePickClaimedDate, dailyStreakClaimedDate: newDailyStreakClaimedDate,
      threeStallsClaimedDate: newThreeStallsClaimedDate, twoCanteensClaimedDate: newTwoCanteensClaimedDate,
      vouchers,
    });
  };

  const redeem = (type: "drink" | "food", cost: number) => {
    if (points < cost || !uid) return;
    const newPoints = points - cost;
    const newVouchers = [...vouchers, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type, cost, redeemedAt: new Date().toISOString(), used: false,
    }];

    setPoints(newPoints);
    setVouchers(newVouchers);

    persistNow({
      points: newPoints, lifetimePoints, goalAchievedForTarget,
      claimedStreakAt, claimedCalorieStreakAt, claimedBiteDaysAt, healthyPickClaimedDate,
      cuisinePickClaimedDate, dailyStreakClaimedDate, threeStallsClaimedDate, twoCanteensClaimedDate,
      vouchers: newVouchers,
    });
  };

  const redeemDrink = () => redeem("drink", VOUCHER_DRINK_COST);
  const redeemFood = () => redeem("food", VOUCHER_FOOD_COST);
  const markVoucherUsed = (id: string) => {
    if (!uid) return;
    const newVouchers = vouchers.map(voucher => voucher.id === id ? { ...voucher, used: true } : voucher);
    setVouchers(newVouchers);
    persistNow({
      points, lifetimePoints, goalAchievedForTarget,
      claimedStreakAt, claimedCalorieStreakAt, claimedBiteDaysAt, healthyPickClaimedDate,
      cuisinePickClaimedDate, dailyStreakClaimedDate, threeStallsClaimedDate, twoCanteensClaimedDate,
      vouchers: newVouchers,
    });
  };

  return (
    <ChallengesContext.Provider value={{
      loading, todayKey, points, lifetimePoints, goalAchievedForTarget,
      threeStallsClaimedDate, twoCanteensClaimedDate, calorieStreak,
      lifetimeActiveDays, claimedBiteDaysAt,
      todaysHealthyPicks, todaysCuisinePicks, pendingClaims, claim,
      vouchers, redeemDrink, redeemFood, markVoucherUsed,
    }}>
      {children}
    </ChallengesContext.Provider>
  );
}
