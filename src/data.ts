import type { FoodItem } from "./types";

export const foodItems: FoodItem[] = [
  { id: 1, name: "Chicken Rice", canteen: "Frontier", stall: "Stall 3 - Wok & Rice", calories: 487, protein: 38, carbs: 58, fat: 2.1, sodium: 2.1, tags: ["High Protein"] },
  { id: 2, name: "Grilled Chicken Set", canteen: "Frontier", stall: "Stall 7 - Western", calories: 520, protein: 41, carbs: 44, fat: 16, sodium: 1.4, tags: ["High Protein"] },
  { id: 3, name: "Chicken Curry Rice", canteen: "Frontier", stall: "Stall 8 - Best Packing", calories: 610, protein: 30, carbs: 72, fat: 18, sodium: 2.3, tags: [] },
  { id: 4, name: "Yong Tau Foo", canteen: "Frontier", stall: "Stall 5 - YTF", calories: 290, protein: 18, carbs: 32, fat: 8, sodium: 1.2, tags: ["Low Cal"] },
  { id: 5, name: "Laksa", canteen: "The Deck", stall: "Stall 2 - Noodles", calories: 560, protein: 22, carbs: 68, fat: 18, sodium: 2.8, tags: [] },
  { id: 6, name: "Salmon Soba Bowl", canteen: "The Deck", stall: "Stall 6 - Japanese", calories: 480, protein: 30, carbs: 50, fat: 14, sodium: 1.1, tags: ["High Protein", "Low Cal"] },
  { id: 7, name: "Ban Mian", canteen: "TechnoEdge", stall: "Stall 1 - Noodles", calories: 420, protein: 22, carbs: 55, fat: 12, sodium: 1.8, tags: ["Low Cal"] },
  { id: 8, name: "Veggie Bee Hoon", canteen: "TechnoEdge", stall: "Stall 4 - Mixed Veg", calories: 320, protein: 10, carbs: 58, fat: 6, sodium: 0.9, tags: ["Vegetarian", "Low Cal"] },
];

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function userKey(email: string) {
  return `nutrinus_user_${email}`;
}

// "2026-09-19" -> "19/09/2026". Only for display text - never for <input type="date">
// values, which must stay ISO for the native picker to parse correctly.
export function formatDateSlash(isoDate: string) {
  const [y, m, d] = isoDate.split("-");
  return y && m && d ? `${d}/${m}/${y}` : isoDate;
}

export function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

export function isValidAge(a: string) {
  const n = Number(a);
  return Number.isFinite(n) && n >= 10 && n <= 120;
}

export function isValidHeight(h: string) {
  const n = Number(h);
  return Number.isFinite(n) && n >= 50 && n <= 250;
}

export function isValidWeight(w: string) {
  const n = Number(w);
  return Number.isFinite(n) && n >= 20 && n <= 300;
}

export function isValidTargetBmi(b: string) {
  const n = Number(b);
  return Number.isFinite(n) && n >= 15 && n <= 40;
}

export function isValidTargetDate(d: string) {
  const target = new Date(d);
  if (isNaN(target.getTime())) return false;
  const now = new Date();
  const twoYearsOut = new Date(now.getTime() + 2 * 365 * 86400000);
  return target.getTime() > now.getTime() && target.getTime() <= twoYearsOut.getTime();
}

export const KCAL_PER_KG_BODYWEIGHT = 7700;
export const SAFE_MAX_DAILY_CALORIE_ADJUSTMENT = 1000;

// ── Challenges / points ──
export const POINTS_DAILY_STREAK = 2;
export const POINTS_THREE_STALLS = 20;
export const POINTS_TWO_CANTEENS = 20;
export const POINTS_FIVE_DAY_STREAK = 50;
export const POINTS_TEN_DAY_CALORIE_STREAK = 100;
export const POINTS_HEALTHY_PICK = 50;
export const POINTS_GOAL_HIT_BY_DEADLINE = 500;
export const POINTS_BITE_TIER = 30;
export const POINTS_CUISINE_PICK = 40;
export const VOUCHER_DRINK_COST = 500;
export const VOUCHER_FOOD_COST = 1000;

// Repeatable, escalating tier every 10 lifetime active days (replaces a one-off "first item" badge).
export function biteTierName(days: number) {
  const tier = Math.round(days / 10);
  if (tier <= 1) return "Bite Challenger";
  if (tier === 2) return "Bite Master";
  return "Bite Legend";
}

function simpleHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

// Mala and fried dishes are excluded regardless of tags - they're not genuinely
// "healthy option" fare even if they happen to be tagged Low Cal/High Protein.
function isUnhealthyPick(name: string) {
  const text = name.toLowerCase();
  return text.includes("mala") || text.includes("fried") || text.includes("deep-fried") || text.includes("deep fried");
}

// Deterministic per-day pick (same date+goal always yields the same items), so no
// impure Math.random()/Date.now() calls are needed - avoids react-hooks/purity issues.
export function getTodaysHealthyPicks<T extends { id: string; name: string; tags: string[] }>(
  items: T[],
  goal: string,
  dateKey: string
): T[] {
  const healthyCandidates = items.filter(f => !isUnhealthyPick(f.name));
  const preferredTag = goal === "Gain muscle" ? "High Protein" : "Low Cal";
  const eligible = healthyCandidates.filter(f => f.tags.includes(preferredTag));
  const pool = eligible.length > 0 ? eligible : healthyCandidates;
  if (pool.length === 0) return [];

  const seed = simpleHash(`${dateKey}|${goal}`);
  const count = Math.min(2, pool.length);
  const picks: T[] = [];
  const usedIndices = new Set<number>();
  for (let i = 0; picks.length < count && i < pool.length * 2; i++) {
    const idx = (seed + i * 7) % pool.length;
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      picks.push(pool[idx]);
    }
  }
  return picks;
}

// No cuisine field exists on FoodItem yet - inferred from name/stall keywords as a
// reasonable heuristic. Defaults to "Chinese" (the majority of the current menu).
export function inferCuisine(name: string, stall: string) {
  const text = `${name} ${stall}`.toLowerCase();
  if (text.includes("korean")) return "Korean";
  if (text.includes("japanese") || text.includes("soba") || text.includes("sushi")) return "Japanese";
  if (text.includes("western") || text.includes("grilled")) return "Western";
  if (text.includes("laksa") || text.includes("malay")) return "Malay";
  if (text.includes("curry") || text.includes("indian")) return "Indian";
  if (text.includes("thai")) return "Thai";
  return "Chinese";
}

// Picks 2 items from 2 DIFFERENT cuisines for daily variety (e.g. "1 Korean, 1 Western"),
// deterministic per day like getTodaysHealthyPicks - no impure calls needed.
export function getTodaysCuisinePicks<T extends { id: string; name: string; stall: string }>(
  items: T[],
  dateKey: string
): T[] {
  if (items.length === 0) return [];
  const byCuisine = new Map<string, T[]>();
  items.forEach(item => {
    const cuisine = inferCuisine(item.name, item.stall);
    if (!byCuisine.has(cuisine)) byCuisine.set(cuisine, []);
    byCuisine.get(cuisine)!.push(item);
  });
  const cuisines = Array.from(byCuisine.keys()).sort();
  if (cuisines.length === 0) return [];

  const seed = simpleHash(`cuisine|${dateKey}`);
  const count = Math.min(2, cuisines.length);
  const picks: T[] = [];
  const usedCuisines = new Set<string>();
  for (let i = 0; picks.length < count && i < cuisines.length * 2; i++) {
    const cuisine = cuisines[(seed + i * 11) % cuisines.length];
    if (usedCuisines.has(cuisine)) continue;
    usedCuisines.add(cuisine);
    const pool = byCuisine.get(cuisine)!;
    picks.push(pool[(seed + i * 13) % pool.length]);
  }
  return picks;
}
