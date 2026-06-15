import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSp7zgjEn6VMaCXlw3QpkSgi94tq51S3E",
  authDomain: "orbital-6986.firebaseapp.com",
  projectId: "orbital-6986",
  storageBucket: "orbital-6986.firebasestorage.app",
  messagingSenderId: "187634703170",
  appId: "1:187634703170:web:a66f5833bc5c5153af06db",
  measurementId: "G-LCS4Q2WFJL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Use emulators only when explicitly enabled for local testing.
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch (e) {
    // Emulator already connected
  }
}
