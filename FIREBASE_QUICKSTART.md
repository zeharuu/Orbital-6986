# Firebase Quick Start Checklist

## ✅ What's Done

- [x] Firebase SDK installed
- [x] `src/firebase.ts` created with Firebase config
- [x] `src/context/AppContext.tsx` updated to use Firebase Auth + Firestore
- [x] `src/routes/EmailGate.tsx` updated with async auth
- [x] `src/routes/Search.tsx` updated to load food items from Firestore
- [x] `.env.local` template created
- [x] Security rules provided
- [x] Seed script ready
- [x] Documentation complete

## 🚀 What You Need to Do

### 1. Create Firebase Project (5 min)
- [ ] Go to https://console.firebase.google.com
- [ ] Create project "NutriNUS"
- [ ] Enable Email/Password auth
- [ ] Create Firestore database (Production mode)
- [ ] Apply security rules from FIREBASE_SETUP.md

### 2. Get Credentials (2 min)
- [ ] Copy Firebase config from Project Settings
- [ ] Paste into `.env.local`

### 3. Seed Food Data (1 min)
```bash
export FIREBASE_PROJECT_ID=your-project-id
node scripts/seed-firebase.js
```

### 4. Test (5 min)
```bash
npm run dev
```
- [ ] Enter any email → should auto-sign up
- [ ] Set profile → name, gender, age, height, weight, goal
- [ ] Search page → food items should load from Firestore
- [ ] Add food → should save to Firestore
- [ ] Sign out → should clear state
- [ ] Sign back in → profile and yesterday's streak should restore

## 📝 Architecture at a Glance

```
EmailGate
  ↓ (user enters email)
Firebase Auth (createUserWithEmailAndPassword)
  ↓ (onAuthStateChanged triggers)
AppContext (loads profile from Firestore)
  ↓
Search page (displays foodItems from state)
  ↓ (user adds food)
loggedCounts state changes
  ↓ (triggers useEffect)
Firestore /users/{uid}/dailyLog (persists)
  ↓
User signs out/in
  ↓ (onAuthStateChanged triggers again)
Profile + dailyLog restored from Firestore
```

## 🔑 Key Type Changes

Old (localStorage):
```typescript
addFood: (id: number) => void
loggedCounts: Record<number, number>
```

New (Firebase):
```typescript
addFood: (id: string) => void
loggedCounts: Record<string, number>
foodItems: FoodItem[] (loaded from Firestore)
```

## 📂 Firestore Collections You'll Have

1. **foodItems** — 10 pre-seeded food items (read-only to users)
2. **users** — User profiles, food logs, streaks (each user owns their doc)

## 🔐 Security Model

- Anyone can read foodItems
- Users can only read/write their own `/users/{uid}` document
- Firebase Auth handles email verification at server

## 💡 What's Better About Firebase

| | localStorage | Firebase |
|---|---|---|
| Cross-device | ❌ | ✅ |
| Server backup | ❌ | ✅ |
| Real-time sync | ❌ | ✅ |
| Multi-user | ❌ | ✅ |
| Enterprise-ready | ❌ | ✅ |

## 🆘 If Something Goes Wrong

1. **"Module not found: firebase"** → `npm install`
2. **"Cannot read env vars"** → Restart dev server after `.env.local` changes
3. **"Food items not loading"** → Run seed script, check Firestore has data
4. **"Sign in fails"** → Email/Password auth might not be enabled in Firebase Console
5. **"Data doesn't save"** → Check Firestore security rules are correct

## 📞 Need Help?

- Check FIREBASE_SETUP.md for detailed setup
- Check FIREBASE_INTEGRATION.md for architecture details
- Check Firebase docs: https://firebase.google.com/docs/firestore
