# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name it "NutriNUS"
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Get started**
2. Click **Email/Password**
3. Enable "Email/Password" and click **Save**

## 3. Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Start in **Production mode**
3. Choose your nearest region
4. Click **Create**

## 4. Set Firestore Security Rules

Go to **Firestore Database** → **Rules** and replace with:

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

## 5. Get Your Credentials

1. Go to **Project Settings** (gear icon)
2. Copy the config values from "Your apps" section
3. Paste them into `.env.local`:

```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

## 6. Seed Food Data

Run the seed script:

```bash
node scripts/seed-firebase.js
```

This will populate your Firestore with food items.

## Firestore Schema

### Collection: `foodItems`
Each document represents a food item:

```
{
  id: "banana_frontier_1",
  name: "Banana",
  canteen: "Frontier",
  stall: "Juice Bar - Fresh Fruits",
  calories: 105,
  protein: 1.3,
  carbs: 27,
  fat: 0.3,
  sodium: 1.1,
  tags: ["Low Cal", "Vegetarian"]
}
```

### Collection: `users`
Each document represents a user (keyed by their Firebase UID):

```
{
  email: "user@example.com",
  name: "John Doe",
  gender: "Male",
  age: "25",
  height: "180",
  weight: "75",
  goal: "Lose weight",
  profileCreated: true,
  streak: {
    count: 5,
    lastDate: "2026-06-07"
  },
  dailyLog: {
    date: "2026-06-07",
    counts: {
      "banana_frontier_1": 2,
      "rice_bowl_thedeckk_1": 1
    }
  },
  updatedAt: "2026-06-07T10:30:00Z"
}
```

## Testing

1. `npm run dev`
2. Enter any email to create account
3. Set up profile
4. Food items should load from Firestore
5. Log food and sign out/in to verify persistence
