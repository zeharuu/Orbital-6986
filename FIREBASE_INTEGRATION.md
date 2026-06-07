# Firebase Integration for NutriNUS — Complete Guide

## What Changed

Your app now uses **Firebase** for real user authentication and data persistence instead of localStorage. This means:

✅ Real user accounts with email authentication
✅ Data persists across devices (users can log in from any device)
✅ Food items loaded from Firestore database
✅ User profiles, food logs, and streaks saved server-side
✅ Professional-grade backend infrastructure

## Key Files Modified/Created

### New Files
- `src/firebase.ts` — Firebase configuration and initialization
- `.env.local` — Environment variables (your Firebase credentials)
- `FIREBASE_SETUP.md` — Step-by-step Firebase project setup
- `scripts/seed-firebase.js` — Script to populate food data into Firestore

### Modified Files
- `src/context/AppContext.tsx` — Rewritten to use Firebase Auth & Firestore
- `src/routes/Search.tsx` — Updated to get food items from Firestore
- `src/routes/EmailGate.tsx` — Added loading states and async auth
- `package.json` — Added `firebase` and `firebase-admin` dependencies
- `.gitignore` — Added rules to exclude Firebase service account key

## Architecture Changes

### Before (localStorage)
```
User Input
    ↓
AppContext (confirmEmail)
    ↓
localStorage["nutrinus_email"] = "user@example.com"
localStorage["nutrinus_user_user@example.com"] = { ... profile ... }
    ↓
Components read from context
```

### After (Firebase)
```
User Input
    ↓
AppContext (confirmEmail)
    ↓
Firebase Auth (createUserWithEmailAndPassword)
    ↓
onAuthStateChanged listener updates state
    ↓
Firestore Document: /users/{uid}
    ↓
Components read from context
    ↓
Changes trigger Firestore writes (persist)
```

## How It Works — Step by Step

### 1. Authentication Flow

When user enters their email:

```typescript
// EmailGate.tsx
await confirmEmail() // User clicks button

// AppContext.tsx
const confirmEmail = async () => {
  try {
    // Create new account OR sign in if exists
    await createUserWithEmailAndPassword(auth, email, "auto-generated");
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      await signInWithEmailAndPassword(auth, email, "auto-generated");
    }
  }
};
```

Firebase Auth handles all the security. When auth succeeds, `onAuthStateChanged` fires automatically.

### 2. Auto Sign-In (First Page Load)

```typescript
// AppContext useEffect 1
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Automatically logged in!
      setEmail(user.email);
      setEmailConfirmed(true);

      // Load their profile from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setName(data.name);
        // ... restore other fields
      }
    }
  });

  return unsubscribe;
}, []);
```

**Key insight**: The `onAuthStateChanged` listener runs on every page load. If user is already logged in, they're automatically authenticated with no extra clicks.

### 3. Loading Food Items

```typescript
// AppContext useEffect for food items
useEffect(() => {
  const loadFoodItems = async () => {
    const foodRef = collection(db, "foodItems");
    const snapshot = await getDocs(foodRef);
    const items = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }));
    setFoodItems(items);
  };

  loadFoodItems();
}, []);
```

This runs once on app startup, fetches all food items from Firestore collection, and stores them in state.

### 4. Persisting Food Log

```typescript
// AppContext useEffect 2
useEffect(() => {
  if (!currentUser) return;

  // Debounce to avoid too many writes
  const timer = setTimeout(async () => {
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        dailyLog: { date: today, counts: loggedCounts },
        updatedAt: new Date().toISOString(),
      },
      { merge: true } // Don't overwrite other fields
    );
  }, 500);

  return () => clearTimeout(timer);
}, [loggedCounts, currentUser]);
```

Every time user adds/removes food (every 500ms max), we save to Firestore under their user document.

### 5. Streak Logic (Same as Before)

The streak logic is identical to localStorage version, but now writes to Firestore:

```typescript
await setDoc(
  doc(db, "users", currentUser.uid),
  {
    streak: { count: newCount, lastDate: today },
    updatedAt: new Date().toISOString(),
  },
  { merge: true }
);
```

## Firestore Data Structure

### `foodItems` Collection

Each document is a food item (keyed by `{name}_{canteen}` format):

```
Document ID: "chicken_rice_bowl_frontier"
{
  name: "Chicken Rice Bowl",
  canteen: "Frontier",
  stall: "Asian Fusion - Rice Bowls",
  calories: 487,
  protein: 32,
  carbs: 52,
  fat: 12,
  sodium: 8.5,
  tags: ["High Protein"]
}
```

### `users` Collection

Each document is a user (keyed by Firebase UID):

```
Document ID: "abc123xyz789" (Firebase generates this)
{
  email: "user@example.com",
  name: "John Doe",
  gender: "Male",
  age: "25",
  height: "180",
  weight: "75",
  goal: "Lose weight",
  profileCreated: true,

  // Logged food for today
  dailyLog: {
    date: "2026-06-07",
    counts: {
      "chicken_rice_bowl_frontier": 2,
      "miso_soup_technodedge": 1
    }
  },

  // User's streak
  streak: {
    count: 5,
    lastDate: "2026-06-07"
  },

  updatedAt: "2026-06-07T10:30:00Z"
}
```

## Setup Instructions

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project", name it "NutriNUS"
3. When prompted, disable Google Analytics (optional)
4. Wait for creation (~1-2 min)

### Step 2: Enable Authentication

1. Click **Authentication** → **Get started**
2. Select **Email/Password**
3. Enable it and click **Save**

### Step 3: Create Firestore Database

1. Click **Firestore Database** → **Create database**
2. Select **Production mode**
3. Choose your nearest region
4. Click **Create**

### Step 4: Set Security Rules

Copy these rules to **Firestore Database** → **Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /foodItems/{document=**} {
      allow read: if true;
    }
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

Click **Publish**

### Step 5: Get Your Credentials

1. Go to **Project Settings** (gear icon, top-left)
2. Scroll to "Your apps" section
3. You'll see a config object like:

```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "nutrinus-demo.firebaseapp.com",
  projectId: "nutrinus-demo",
  storageBucket: "nutrinus-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
}
```

Copy these values into `.env.local`:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=nutrinus-demo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nutrinus-demo
VITE_FIREBASE_STORAGE_BUCKET=nutrinus-demo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

### Step 6: Seed Food Data

```bash
export FIREBASE_PROJECT_ID=nutrinus-demo
node scripts/seed-firebase.js
```

This populates your `foodItems` collection with 10 food items.

### Step 7: Test the App

```bash
npm run dev
```

Visit `http://localhost:5174`:
1. Enter your email (any email)
2. You'll be authenticated!
3. Set up profile
4. Food items should load from Firebase
5. Log food and verify it saves
6. Sign out and sign back in — your data persists!

## Key Differences from localStorage

| Feature | localStorage | Firebase |
|---------|-------------|----------|
| Auth | Manual email storage | Firebase Auth (secure) |
| Data persistence | Stays on device only | Synced to server |
| Multi-device | ❌ No | ✅ Yes |
| Automatic sync | ❌ No | ✅ Yes |
| Real-time updates | ❌ No | ✅ Possible (future) |
| Database | Browser storage | Firestore (cloud) |
| Food items | Hardcoded in code | Database collection |

## Gotchas & Notes

1. **Passwords**: We use auto-generated passwords. In production, implement proper password-less auth (magic links or Google OAuth).

2. **Rules**: Current rules allow anyone to create an account. Add rate limiting in production.

3. **Costs**: Firebase free tier covers:
   - 50k read/write/delete operations per day
   - 1 GB storage
   - 100 concurrent connections

   Your app should be well under these limits.

4. **Offline**: App doesn't work offline yet. We could add Firebase Offline Persistence (future enhancement).

5. **Email Verification**: Not implemented yet. Users can create accounts with fake emails.

## Testing Scenarios

### Scenario 1: First-time user
1. Enter `test@example.com`
2. Firebase creates account
3. Set up profile (name, weight, height, goal)
4. Log some food
5. Check Firestore: new doc in `users/{uid}`

### Scenario 2: Returning user
1. Open app
2. Auto-logged in (no email gate needed!)
3. Profile and today's food log restored
4. Streak preserved

### Scenario 3: Multi-device login
1. On Device A: log in, log food, sign out
2. On Device B: log in with same email
3. Check: yesterday's streak visible, today's log empty (new session)

## Next Steps (Future Enhancements)

- [ ] Add Google OAuth sign-in
- [ ] Implement passwordless (magic link) auth
- [ ] Enable offline support with Firestore persistence
- [ ] Add real-time updates (listen to user's daily log)
- [ ] Implement admin panel to manage food items
- [ ] Add email notifications for milestones
- [ ] Export data as CSV

## Troubleshooting

**"Cannot find module 'firebase-admin'"**
→ Run `npm install`

**"CORS error from Firebase"**
→ Check `.env.local` credentials are correct

**"Food items not loading"**
→ Verify `foodItems` collection exists in Firestore and `seed-firebase.js` ran

**"Sign in doesn't work"**
→ Verify Email/Password auth is enabled in Firebase Console

**"Data doesn't persist after sign-out"**
→ Check Firestore rules allow writes to `/users/{uid}` path
