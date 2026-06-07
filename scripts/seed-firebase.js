#!/usr/bin/env node

/**
 * Seed Firebase Firestore with food items
 * Run: node scripts/seed-firebase.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || path.join(__dirname, '../serviceAccountKey.json');

if (!process.env.FIREBASE_PROJECT_ID) {
  console.error('❌ FIREBASE_PROJECT_ID not set in environment');
  console.error('Set it with: export FIREBASE_PROJECT_ID=your-project-id');
  process.exit(1);
}

// For local development, use FIREBASE_SERVICE_ACCOUNT path if available
// Otherwise, use Application Default Credentials
try {
  if (require('fs').existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
} catch (e) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

const foodItems = [
  // Frontier
  {
    name: "Chicken Rice Bowl",
    canteen: "Frontier",
    stall: "Asian Fusion - Rice Bowls",
    calories: 487,
    protein: 32,
    carbs: 52,
    fat: 12,
    sodium: 8.5,
    tags: ["High Protein"],
  },
  {
    name: "Vegetable Stir-fry",
    canteen: "Frontier",
    stall: "Asian Fusion - Rice Bowls",
    calories: 245,
    protein: 8,
    carbs: 35,
    fat: 6,
    sodium: 6.2,
    tags: ["Low Cal", "Vegetarian"],
  },
  {
    name: "Grilled Fish with Lemon",
    canteen: "Frontier",
    stall: "Fresh Seafood - Daily Catch",
    calories: 320,
    protein: 42,
    carbs: 2,
    fat: 16,
    sodium: 9.1,
    tags: ["High Protein", "Low Cal"],
  },

  // The Deck
  {
    name: "Beef Burger",
    canteen: "The Deck",
    stall: "Burger Station - Premium",
    calories: 620,
    protein: 38,
    carbs: 48,
    fat: 28,
    sodium: 12.3,
    tags: ["High Protein"],
  },
  {
    name: "Caesar Salad",
    canteen: "The Deck",
    stall: "Salad Bar - Fresh Mix",
    calories: 280,
    protein: 12,
    carbs: 18,
    fat: 18,
    sodium: 7.8,
    tags: ["Vegetarian"],
  },
  {
    name: "Falafel Wrap",
    canteen: "The Deck",
    stall: "Mediterranean - Wraps",
    calories: 445,
    protein: 14,
    carbs: 52,
    fat: 20,
    sodium: 10.2,
    tags: ["Vegetarian"],
  },

  // TechnoEdge
  {
    name: "Teriyaki Chicken",
    canteen: "TechnoEdge",
    stall: "Japanese Express",
    calories: 510,
    protein: 36,
    carbs: 58,
    fat: 11,
    sodium: 9.5,
    tags: ["High Protein"],
  },
  {
    name: "Miso Soup with Tofu",
    canteen: "TechnoEdge",
    stall: "Japanese Express",
    calories: 145,
    protein: 10,
    carbs: 12,
    fat: 4,
    sodium: 5.2,
    tags: ["Low Cal", "Vegetarian"],
  },
  {
    name: "Pad Thai Noodles",
    canteen: "TechnoEdge",
    stall: "Thai Kitchen",
    calories: 380,
    protein: 14,
    carbs: 48,
    fat: 14,
    sodium: 8.9,
    tags: [],
  },
  {
    name: "Banana",
    canteen: "Frontier",
    stall: "Juice Bar - Fresh Fruits",
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.3,
    sodium: 1.1,
    tags: ["Low Cal", "Vegetarian"],
  },
];

async function seedFoodItems() {
  try {
    console.log('🌱 Starting Firebase seed...');

    const batch = db.batch();
    let count = 0;

    for (const item of foodItems) {
      const sanitizedName = item.name.toLowerCase().replace(/\s+/g, '_');
      const sanitizedCanteen = item.canteen.toLowerCase().replace(/\s+/g, '_');
      const docId = `${sanitizedName}_${sanitizedCanteen}`;

      const docRef = db.collection('foodItems').doc(docId);
      batch.set(docRef, item);
      count++;
    }

    await batch.commit();
    console.log(`✅ Successfully seeded ${count} food items to Firestore`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedFoodItems();
