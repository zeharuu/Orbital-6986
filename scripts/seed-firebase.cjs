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

// Turn "TechnoEdge" + "Stall 1 - Western" + "Black Pepper Chicken Chop"
// into "technoedge_stall_1_western_black_pepper_chicken_chop"
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// Turn a row [name, calories, protein, fat, carbs] into a full food item,
// tagging it based on simple nutrition thresholds.
function buildItems(canteen, stall, rows, { vegetarian = false } = {}) {
  return rows.map(([name, calories, protein, fat, carbs]) => {
    const tags = [];
    if (protein >= 25) tags.push('High Protein');
    if (calories <= 320) tags.push('Low Cal');
    if (vegetarian) tags.push('Vegetarian');
    return { name, canteen, stall, calories, protein, carbs, fat, tags };
  });
}

// TechnoEdge Stall 1 - Western (Oon Kok Wee)
const westernItems = buildItems('TechnoEdge', 'Stall 1 - Western', [
  ['Black Pepper Chicken Chop', 775, 42.4, 51.7, 31.6],
  ['Chicken Cutlet', 966, 47.8, 60.1, 54.9],
  ['Grilled Dory Fish', 530, 45.1, 21.3, 37.2],
  ['Fish & Chip', 838, 46.4, 49.1, 50.7],
  ['Black Pepper Ribeye Steak', 807, 44.9, 45.6, 53.2],
  ['Combo Set 1: Ribeye Steak & Grilled Chicken', 831, 43.2, 48.7, 52.5],
  ['Combo Set 2: Ribeye Steak & Grilled Fish', 680, 41.3, 33.2, 52.4],
  ['Combo Set 3: Ribeye Steak & Grilled Salmon', 776, 42.4, 43.6, 52.3],
  ['Combo Set 4: Grilled Chicken Chop & Grilled Salmon', 846, 43.7, 50.8, 51.1],
  ['Combo Set 5: Grilled Chicken Chop & Grilled Dory Fish', 750, 42.7, 40.3, 51.3],
  ['Arrabiata', 295, 10.3, 5.1, 50.0],
  ['Pomodoro', 341, 13.9, 2.7, 69.0],
  ['Creamy Chicken Spaghetti (Small)', 755, 31.6, 54.3, 34.1],
  ['Creamy Chicken Spaghetti (Normal)', 822, 34.0, 54.7, 47.2],
  ['Creamy Chicken Spaghetti (Upsize)', 901, 36.9, 55.2, 62.7],
  ['Creamy Chicken Ham & Mushroom Spaghetti (Small)', 571, 19.2, 38.2, 37.8],
  ['Creamy Chicken Ham & Mushroom Spaghetti (Normal)', 638, 21.7, 38.6, 50.9],
  ['Creamy Chicken Ham & Mushroom Spaghetti (Upsize)', 717, 24.6, 39.0, 66.4],
  ['Prawns & Mushroom Spaghetti (Small)', 557, 20.5, 36.5, 36.9],
  ['Prawns & Mushroom Spaghetti (Normal)', 624, 23.0, 36.9, 50.0],
  ['Prawns & Mushroom Spaghetti (Upsize)', 703, 25.9, 37.3, 65.4],
  ['Hot Chicken Spaghetti (Small)', 298, 16.6, 8.6, 36.9],
  ['Hot Chicken Spaghetti (Normal)', 365, 19.1, 9.0, 50.0],
  ['Hot Chicken Spaghetti (Upsize)', 444, 22.0, 9.4, 65.5],
  ['Creamy Sausage & Mushroom Spaghetti (Small)', 688, 28.8, 46.7, 37.6],
  ['Creamy Sausage & Mushroom Spaghetti (Normal)', 755, 31.3, 47.0, 50.7],
  ['Creamy Sausage & Mushroom Spaghetti (Upsize)', 834, 34.2, 47.5, 66.1],
  ['Alfredo (Small)', 651, 28.9, 42.8, 37.8],
  ['Alfredo (Normal)', 718, 31.3, 43.2, 50.9],
  ['Alfredo (Upsize)', 797, 34.2, 43.7, 66.4],
  ['Chicken Patty Spaghetti', 530, 29.3, 19.1, 58.4],
  ['Chicken Cheese Ball Spaghetti', 501, 24.3, 16.7, 61.7],
  ['Salmon e Funghi Spaghetti (Small)', 715, 31.2, 49.4, 36.9],
  ['Salmon e Funghi Spaghetti (Normal)', 782, 33.7, 49.7, 50.0],
  ['Salmon e Funghi Spaghetti (Upsize)', 861, 36.6, 50.2, 65.4],
  ['Seafood Marinara (Small)', 373, 36.1, 7.8, 37.9],
  ['Seafood Marinara (Normal)', 440, 38.5, 8.1, 51.0],
  ['Seafood Marinara (Upsize)', 519, 41.4, 8.6, 66.5],
  ['Creamy Fish Pasta (Small)', 616, 32.1, 39.0, 34.1],
  ['Creamy Fish Pasta (Normal)', 683, 34.6, 39.4, 47.2],
  ['Creamy Fish Pasta (Upsize)', 762, 37.5, 39.8, 62.7],
  ['Baked Beans, Fries & Sausage', 359, 16.8, 22.0, 21.7],
  ['Baked Beans, Mashed Potato & Sausage', 447, 18.6, 24.6, 35.6],
  // Sides
  ['Mashed Potato', 89, 1.9, 2.5, 13.8],
  ['Sunny Side Up', 102, 7.0, 8.0, 0.5],
  ['French Fries', 164, 1.3, 11.6, 13.5],
  ['Hot Dog', 153, 13.4, 10.3, 0.7],
  ['Spaghetti', 157, 5.8, 0.9, 30.8],
  ['Tasty Rice', 210, 4.2, 0.8, 46.7],
  ['Chicken Ham', 36, 3.8, 1.9, 1.0],
  ['Coleslaw', 68, 0.7, 4.7, 4.9],
]);

// TechnoEdge Stall 2 - Nasi Padang (Hosnul Hotimah)
const nasiPadangItems = buildItems('TechnoEdge', 'Stall 2 - Nasi Padang', [
  ['Mee Rebus', 372, 19.8, 15.3, 37.6],
  ['Mee Siam', 317, 15.5, 13.0, 33.8],
  ['Mee Soto', 557, 21.6, 36.1, 37.1],
  ['Mee Bandung', 407, 33.2, 8.6, 46.8],
  ['Lontong', 1187, 33.9, 33.7, 184.7],
  ['Mee Goreng', 324, 14.6, 14.4, 32.8],
  ['Fried Kway Teow', 414, 31.6, 14.3, 39.6],
  ['Fried Bee Hoon', 356, 30.4, 12.7, 29.0],
  ['Mee Hong Kong', 291, 15.6, 8.7, 36.1],
  ['Nasi Goreng Pattaya', 620, 27.4, 29.7, 60.5],
  ['Chicken Briyani', 866, 40.6, 47.2, 68.5],
  ['Nasi Lemak Set 1 (Chicken Wing + Egg)', 1204, 35.4, 56.2, 140.0],
  ['Nasi Lemak Set 2 (Fish Fillet + Hotdog + Ikan Bilis)', 1211, 48.5, 50.2, 141.2],
  ['Curry Puff (Potato)', 425, 5.6, 31.2, 29.2],
  ['Curry Puff (Sardine)', 461, 11.4, 35.7, 22.2],
  ['Curry Puff (Chicken)', 409, 8.4, 30.6, 23.4],
  ['Spring Roll', 212, 2.5, 17.2, 10.6],
  ['Samosa', 156, 2.9, 11.2, 9.3],
  ['Tahu Goreng', 305, 11.7, 22.1, 15.6],
  ['Malay Cake (Ma Lai Go)', 214, 4.9, 6.2, 35.0],
  ['Kuih Lopes', 480, 5.0, 25.0, 54.5],
  ['Kuih Ongol Ubi (Ubi Kayu)', 279, 2.2, 17.7, 26.5],
  ['Fried Chicken Wing', 348, 15.1, 29.8, 4.9],
  ['Stir-Fried Beansprouts', 25, 1.6, 1.5, 1.0],
  ['Kangkung Belacan', 39, 1.3, 3.0, 1.4],
  ['Braised Egg and Chicken', 209, 31.1, 7.8, 3.5],
  ['Beef Rendang', 260, 18.2, 18.1, 6.5],
  ['Gulai Ayam (Chicken Curry)', 265, 23.8, 16.8, 5.4],
  ['Sayur Lodeh (Vegetable Curry)', 141, 5.7, 8.8, 10.2],
  ['Cuttlefish (Sambal Tumis Sotong)', 59, 6.9, 1.3, 4.5],
  ['Mutton Rendang', 268, 17.1, 19.9, 6.5],
  ['Kebaru Timun (Spicy Cucumber Salad)', 511, 2.2, 50.3, 12.4],
  ['Sambal Goreng Tempeh (Fried Spicy Tempeh)', 776, 6.8, 76.7, 15.7],
  ['Chicken Porridge', 216, 13.1, 6.5, 26.1],
  ['Ayam Merah', 159, 16.4, 4.7, 6.5],
  ['Black Pepper Chicken', 128, 11.1, 5.2, 9.3],
  ['Sambal Goreng', 73, 4.3, 4.3, 4.9],
  ['Nasi Goreng', 544, 11.6, 13.8, 91.4],
  ['Assam Pedas', 86, 12.3, 3.2, 1.7],
  ['Sotong', 83, 8.6, 2.8, 5.0],
  ['Chicken Rendang', 238, 22.6, 12.8, 7.2],
  ['Fish Cutlet', 138, 7.0, 8.5, 8.0],
  ['Chicken Ngoyang', 649, 20.3, 43.1, 45.0],
  ['Rissoles', 226, 6.0, 12.9, 20.8],
  // Sides
  ['Ikan Bilis', 161, 22.0, 8.0, 0.4],
  ['Sunnyside Up', 102, 7.0, 8.0, 0.5],
  ['Fried Fish Fillet', 168, 9.1, 12.5, 3.9],
  ['Hotdog', 128, 4.2, 11.2, 2.2],
  ['Seaweed Chicken', 80, 3.8, 6.1, 2.5],
  ['Salted Duck Egg', 64, 4.3, 4.3, 2.1],
  ['Fried Fish Cake', 117, 7.6, 8.0, 3.5],
  ['Fried Chicken Nugget', 87, 2.7, 6.8, 3.2],
  ['Fried Hashbrown', 130, 1.2, 9.4, 9.8],
  ['Ikan Selar Kuning Goreng (Fried Yellowtail Scad)', 227, 20.5, 16.1, 0.0],
  ['Ikan Tenggiri Batang Goreng (Fried Spanish Mackerel / Batang Fish)', 230, 19.2, 17.1, 0.0],
  ['White Rice', 260, 5.2, 0.9, 57.7],
  ['Hard-Boiled Egg', 82, 7.2, 5.9, 0.2],
]);

// TechnoEdge Stall 3 - Vegetarian (Soh Hoe Ann)
const vegetarianItems = buildItems('TechnoEdge', 'Stall 3 - Vegetarian', [
  ['Stir Fried Broccoli', 23, 2.6, 0.4, 2.4],
  ['Stir Fried Beansprouts', 20, 1.7, 0.7, 1.6],
  ['Stir Fried Bittergourd', 15, 0.5, 0.5, 2.1],
  ['Stir Fried Cabbage', 24, 1.3, 0.7, 3.2],
  ['Stir Fried Lotus Root', 37, 1.0, 0.5, 7.1],
  ['Stir Fried Seaweed', 45, 2.3, 1.3, 7.2],
  ['Stir Fried Tau Kwa', 71, 7.0, 3.9, 2.6],
  ['Stir Fried Golden Needle Vegetable', 42, 0.9, 2.3, 4.4],
  ['Stir Fried King Oyster Mushroom', 54, 3.1, 1.9, 5.0],
  ['Stir Fried Chinese Yam', 68, 1.5, 1.5, 10.8],
  ['Stir Fried Brinjal', 29, 1.4, 0.4, 5.0],
  ['Stir Fried Long Bean', 25, 1.4, 0.6, 3.5],
  ['Stir Fried Green Amaranth', 19, 1.5, 0.6, 2.8],
  ['Stir Fried Mushroom Mock Meat', 124, 9.5, 5.4, 9.1],
  ['Stir Fried Tau Gee Tang Hoon', 85, 4.0, 3.0, 10.2],
  ['Stir Fried Potato Fries', 110, 1.5, 4.0, 16.2],
  ['Chilli Mock Meat Bits', 96, 6.5, 3.5, 9.2],
  ['Sweet & Sour Mock Meat', 289, 13.9, 19.2, 15.1],
  ['Stewed Mock Fish Balls', 96, 0.8, 5.0, 12.1],
  ['Deep Fried Vegetable Fritter', 230, 5.2, 10.7, 28.1],
  ['Fried Noodle', 472, 10.6, 17.3, 68.4],
  ['Fried Kway Teow', 351, 4.4, 4.4, 73.2],
  ['Fried Rice', 258, 4.9, 2.3, 54.5],
  ['Fried Bee Hoon', 258, 4.0, 3.5, 52.6],
  // Sides
  ['Boiled Chickpea', 95, 5.0, 1.6, 11.2],
  ['Boiled Pumpkin', 43, 0.6, 0.1, 9.9],
  ['Boiled Sweet Corn', 41, 1.4, 0.7, 7.6],
  ['Mock Char Siew', 99, 13.3, 1.4, 8.6],
  ['Deep Fried Egg', 114, 5.1, 10.2, 0.4],
  ['Deep Fried Spring Roll', 174, 3.7, 9.3, 19.1],
  ['Deep Fried Mock Chicken Drumstick', 393, 16.7, 30.6, 12.8],
  ['Deep Fried Mock Roast Duck', 300, 10.3, 27.3, 3.1],
  ['Deep Fried Mock Chicken Bites', 180, 7.3, 14.6, 3.9],
  ['Deep Fried Mock Goose', 115, 7.2, 7.2, 5.1],
  ['White Rice', 351, 7.1, 0.5, 79.5],
  ['Brown Rice', 276, 5.8, 1.3, 59.9],
], { vegetarian: true });

// TechnoEdge Stall 4 - Mala Xiang Guo (Pili Hong Pte Ltd)
const malaItems = buildItems('TechnoEdge', 'Stall 4 - Mala Xiang Guo', [
  ['Mala Sauce (Non-Spicy Base)', 46, 1.7, 0.1, 9.7],
  ['Mala Sauce (Slightly Spicy Base)', 95, 0.3, 10.1, 1.0],
  ['Mala Sauce (Spicy Base)', 191, 0.6, 20.2, 2.0],
  ['Mala Sauce (Very Spicy Base)', 257, 0.6, 27.7, 2.0],
  ['Soup Base', 2, 0.1, 0.0, 0.3],
  ['Steamed Chicken Dumpling (8 Pieces)', 235, 17.5, 3.3, 30.1],
  ['Steamed Chicken Dumpling (12 Pieces)', 357, 26.8, 5.1, 45.3],
  ['Fried Chicken Dumpling (8 Pieces)', 488, 17.5, 32.0, 30.1],
  ['Fried Chicken Dumpling (12 Pieces)', 746, 26.8, 49.1, 45.3],
  ['Chicken Dumpling in Soup (8 Pieces)', 237, 17.6, 3.4, 30.4],
  ['Chicken Dumpling in Soup (12 Pieces)', 359, 27.0, 5.2, 45.7],
  // Sides
  ['Beancurd Skin (Fried)', 76, 4.4, 5.5, 0.3],
  ['Beancurd Skin (Non-Fried)', 77, 8.2, 2.9, 0.5],
  ['Black Fungus', 19, 1.3, 0.2, 3.0],
  ['Enoki Mushroom', 13, 0.9, 0.1, 1.8],
  ['Kelp', 27, 1.8, 0.4, 5.2],
  ['Lotus Root', 51, 1.2, 0.1, 12.3],
  ['Tau Kwa', 50, 5.0, 2.3, 2.3],
  ['Thick Beehoon', 326, 5.3, 0.5, 75.1],
  ['Peanut', 210, 7.4, 18.6, 2.7],
  ['White Radish', 12, 0.6, 0.1, 2.2],
  ['Bermuda Triangle Tofu (Taupok)', 144, 10.2, 10.4, 2.3],
  ['Cheese Tofu', 122, 6.4, 9.1, 3.7],
  ['Chicken Hotdog', 95, 5.5, 7.0, 2.4],
  ['Chickuwa', 42, 5.5, 0.5, 3.2],
  ['Crab Ball', 64, 5.8, 2.0, 5.8],
  ['Crab Claw', 100, 3.8, 4.3, 11.6],
  ['Crabstick', 11, 1.2, 0.0, 0.6],
  ['Cuttlefish', 21, 4.4, 0.2, 0.2],
  ['Cuttlefish Ball', 135, 8.5, 7.1, 9.4],
  ['Fish Tau Foo', 99, 4.8, 5.8, 7.0],
  ['Fish Ball (Fried)', 141, 10.5, 9.8, 2.8],
  ['Mini Sausage', 107, 4.5, 8.3, 3.9],
  ['Luncheon Meat', 210, 6.2, 19.3, 2.8],
  ['Mini Fish Ball', 47, 6.9, 1.3, 1.8],
  ['Mushroom Ball', 46, 5.8, 0.5, 3.9],
  ['Quail Egg', 48, 4.0, 3.4, 0.1],
  ['Saito Fish Cake', 82, 12.1, 3.0, 1.9],
  ['Seaweed Chicken', 156, 7.5, 12.0, 4.9],
  ['Taiwan Sausage', 170, 7.2, 13.0, 6.2],
  ['Instant Noodle', 349, 8.1, 11.7, 52.9],
  ['Potato Starch Noodle', 437, 0.0, 0.0, 108.1],
  ['Taugay', 11, 1.5, 0.1, 0.8],
  ['Brinjal', 12, 0.7, 0.0, 2.3],
  ['Broccoli', 9, 1.3, 0.0, 0.9],
  ['Cabbage', 15, 1.4, 0.3, 2.8],
  ['Cauliflower', 20, 2.0, 0.0, 3.0],
  ['Cucumber', 9, 0.3, 0.0, 1.9],
  ['Kang Kong', 8, 1.1, 0.1, 0.4],
  ["Lady's Finger", 11, 0.6, 0.0, 2.1],
  ['Potato', 45, 1.5, 0.1, 8.6],
  ['Tomato', 16, 1.0, 0.1, 2.6],
  ['Wintermelon', 31, 0.3, 2.4, 1.7],
  ['Xiao Bai Cai', 7, 0.8, 0.1, 0.6],
  ['King Oyster Mushroom', 13, 1.3, 0.2, 1.4],
  ['Shitake Mushroom', 16, 1.0, 0.2, 2.0],
  ['Beef Slice', 109, 11.8, 6.9, 0.0],
  ['Chicken Gizzard', 45, 8.5, 1.0, 0.0],
  ['Fish Slice', 57, 12.8, 0.5, 0.1],
  ['Prawn', 34, 7.8, 0.2, 0.0],
  ['Sotong Ring', 51, 8.6, 0.8, 1.7],
  ['White Rice', 237, 4.7, 0.8, 52.6],
  ['Coriander', 0, 0.0, 0.0, 0.0],
  ['Sliced Chicken Leg', 28, 4.4, 1.2, 0.0],
]);

// TechnoEdge Stall 5 - Indian Cooked Food (Saravanan)
const indianItems = buildItems('TechnoEdge', 'Stall 5 - Indian', [
  ['Plain Prata', 262, 7.1, 9.9, 33.5],
  ['Egg Prata', 345, 14.0, 15.9, 34.0],
  ['Cheese Prata', 313, 8.2, 14.1, 36.0],
  ['Egg & Onion Prata', 352, 14.4, 15.9, 35.0],
  ['Combo Prata', 402, 15.4, 20.0, 37.4],
  ['Plain Thosai', 335, 9.9, 12.3, 43.6],
  ['Egg Thosai', 418, 16.8, 18.2, 44.1],
  ['Cheese Thosai', 386, 10.9, 16.4, 46.1],
  ['Egg & Onion Thosai', 424, 17.2, 18.2, 45.1],
  ['Combo Thosai', 475, 18.2, 22.4, 47.5],
  ['Masala Thosai', 388, 11.1, 14.3, 50.4],
  ['Onion Vegetable Utappam', 546, 10.6, 34.3, 45.7],
  ['Briyani Rice', 268, 5.3, 2.6, 55.9],
  ['Tomato Rice', 262, 5.3, 2.5, 54.6],
  ['Nasi Goreng', 627, 21.1, 15.2, 100.9],
  ['Mee Goreng', 545, 18.5, 24.8, 61.1],
  ['Fried Chicken Drumstick', 397, 20.6, 29.5, 12.1],
  ['Curry Chicken Drumstick', 186, 18.9, 10.9, 2.2],
  ['Boneless Butter Chicken', 131, 20.5, 3.9, 3.0],
  ['Boneless Ginger Chicken', 131, 21.1, 3.6, 2.8],
  ['Black Pepper Chicken', 141, 22.2, 3.8, 3.6],
  ['Chilli Chicken', 324, 22.0, 25.7, 1.2],
  ['Mutton', 191, 19.5, 12.1, 1.3],
  ['Dory Fish', 105, 19.1, 2.2, 1.9],
  ['Fried Fish Pieces', 138, 9.7, 8.8, 4.8],
  ['Fried Dory Steak', 165, 12.9, 11.5, 2.2],
  ['Prawn', 110, 16.6, 3.5, 2.6],
  ['Sotong', 104, 11.4, 3.8, 4.4],
  ['Egg with Onion', 142, 7.5, 10.8, 3.3],
  ['Tofu', 83, 5.1, 5.4, 3.8],
  ['Chickpeas', 174, 7.5, 5.8, 17.6],
  ['Long Bean', 53, 2.3, 2.5, 4.7],
  ['Spinach', 125, 6.2, 8.1, 6.4],
  ['Broccoli & Cauliflower', 83, 3.8, 4.7, 6.5],
  ['Bittergourd', 72, 1.9, 3.9, 6.9],
  ['Chicken Masala', 104, 16.6, 3.1, 1.8],
  // Sides
  ['Yoghurt', 138, 7.7, 7.4, 10.1],
  ['Pappadum', 48, 0.9, 3.3, 3.6],
  ['White Rice', 256, 5.1, 0.9, 56.9],
  ['Brown Rice', 233, 6.0, 1.4, 49.3],
]);

const foodItems = [...westernItems, ...nasiPadangItems, ...vegetarianItems, ...malaItems, ...indianItems];

async function seedFoodItems() {
  try {
    console.log('🌱 Starting Firebase seed...');

    const batch = db.batch();
    let count = 0;

    for (const item of foodItems) {
      const docId = `${slugify(item.canteen)}_${slugify(item.stall)}_${slugify(item.name)}`;
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
