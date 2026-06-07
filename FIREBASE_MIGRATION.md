# Firebase Migration — What Changed

## Created Files (New)

### `src/firebase.ts`
Firebase initialization and configuration. Exports `auth` and `db` for use throughout the app.

### `.env.local`
Template with Firebase credentials (you fill in the values from Firebase Console).

### `scripts/seed-firebase.js`
Node script to populate Firestore with 10 food items. Run once after setup.

### `FIREBASE_SETUP.md`
Detailed step-by-step guide to create Firebase project and configure it.

### `FIREBASE_INTEGRATION.md`
Complete architecture guide explaining how Firebase integration works.

### `FIREBASE_QUICKSTART.md`
Quick checklist for getting started.

## Modified Files

### `src/context/AppContext.tsx` (Major rewrite)
**What changed:**
- Removed localStorage logic
- Removed `foodItems` import (now loaded from Firestore)
- Removed `userKey` helper (not needed)
- Added Firebase Auth integration via `onAuthStateChanged`
- Added Firestore document reads/writes
- Functions now `async` (confirmEmail, saveProfile, signOut)
- Added `authLoading` and `foodLoading` states
- Added `currentUser` state to track Firebase user
- Food items now come from Firestore collection
- All persistence now goes to Firestore instead of localStorage

**Key additions:**
```typescript
const [currentUser, setCurrentUser] = useState<User | null>(null);
const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
const [foodLoading, setFoodLoading] = useState(true);
const [authLoading, setAuthLoading] = useState(true);
```

**Behavioral changes:**
- `confirmEmail` is now async and uses Firebase Auth
- `saveProfile` writes to Firestore, not localStorage
- `addFood` and `removeFood` use string IDs (from Firestore doc IDs)
- Auto sign-in via `onAuthStateChanged` listener

### `src/routes/Search.tsx` (Minor updates)
**What changed:**
- Removed `import { foodItems } from "../data"`
- Get `foodItems` and `foodLoading` from context instead
- Get canteens dynamically from `foodItems` using `useMemo` (was static before)
- Added loading state: shows "Loading food items..." while Firestore fetches
- Added fallback: shows "No food items available" if empty
- Food IDs are now strings (Firestore doc IDs) instead of numbers

**Code changes:**
```typescript
// Before
import { foodItems } from "../data";
const canteens = ["All", ...]; // static

// After
const canteens = useMemo(() => 
  ["All", ...Array.from(new Set(foodItems.map(f => f.canteen)))],
  [foodItems]
);

// Added loading UI
{foodLoading ? (
  <div className="empty-card">Loading food items...</div>
) : foodItems.length === 0 ? (
  <div className="empty-card">No food items available yet</div>
) : (
  // render results
)}
```

### `src/routes/EmailGate.tsx` (Minor updates)
**What changed:**
- Added `authLoading` state handling
- Made `confirmEmail` async with loading state
- Added "Signing in..." button text during submission
- Added `onKeyDown={e => e.key === "Enter" && handleSubmit()}` for Enter key support

**New JSX:**
```typescript
{authLoading ? (
  <div>Loading...</div>
) : (
  // form
)}

const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
    await confirmEmail();
  } finally {
    setIsSubmitting(false);
  }
};
```

### `package.json` (Minor update)
**What changed:**
- Added `"firebase": "^12.14.0"` to dependencies
- Added `"firebase-admin": "^12.7.0"` to devDependencies

### `src/App.css` (Minor addition)
**What changed:**
- Added `.save-btn:disabled` styles for disabled button state

```css
.save-btn:disabled {
  background: #b3b3b3;
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}
```

### `.gitignore` (Minor update)
**What changed:**
- Reordered entries for clarity
- Added `serviceAccountKey.json` to exclude Firebase service account keys
- `*.local` already covers `.env.local`

## What Stayed the Same

### Untouched Files
- `src/App.tsx` — No changes needed (uses context)
- `src/App.css` — Mostly unchanged (only added disabled button styles)
- `src/types.ts` — No changes (types still match)
- `src/components/BottomNav.tsx` — No changes
- `src/routes/Home.tsx` — No changes (uses context)
- `src/routes/Log.tsx` — No changes (uses context)
- `src/routes/Profile.tsx` — No changes (uses context)
- `src/main.tsx` — No changes
- `src/data.ts` — Still exists with `isValidEmail` helper (we still use it)

Components don't change because they all go through `useApp()` context hook, which abstracts the storage layer.

## State Type Changes

### AppContext Type Changes

Old:
```typescript
loggedCounts: Record<number, number>;
addFood: (id: number) => void;
removeFood: (id: number) => void;
```

New:
```typescript
loggedCounts: Record<string, number>;
addFood: (id: string) => void;
removeFood: (id: string) => void;
foodItems: FoodItem[];
foodLoading: boolean;
authLoading: boolean;
confirmEmail: () => Promise<void>;
saveProfile: () => Promise<void>;
signOut: () => Promise<void>;
```

The key change: IDs are now strings (Firestore document IDs) instead of numbers.

## No Breaking Changes for Components

Since all state access goes through `useApp()`, components work the same way:

```typescript
// This works exactly the same in both versions
const { addFood, loggedCounts, foodItems } = useApp();
addFood(food.id); // Now food.id is a string, but code is identical
```

## Performance Impact

**Neutral/Positive:**
- Firestore queries batched in useEffect (efficient)
- Food items loaded once and cached in state (not re-fetched)
- Debounced Firestore writes (500ms throttle prevents excessive writes)
- Same render count as localStorage version

**Potential improvements:**
- Real-time sync if we add Firestore listeners (future)
- Offline persistence (future)
- Shared data across devices (future)

## Migration Checklist Summary

- [x] Firebase SDK installed
- [x] Firebase config file created
- [x] AppContext migrated to Firestore
- [x] Search component updated
- [x] EmailGate component updated  
- [x] Environment template created
- [x] Seed script ready
- [x] Documentation written
- [x] Components remain unchanged (abstracted by context)
- [ ] **User needs to: Set up Firebase project and get credentials**
- [ ] **User needs to: Populate `.env.local` with Firebase config**
- [ ] **User needs to: Run seed script**
- [ ] **User needs to: Test the app**

The app is ready to go once you complete the Firebase setup!
