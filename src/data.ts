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
