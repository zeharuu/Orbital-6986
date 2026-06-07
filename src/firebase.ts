import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoPleaseUpdateWithRealKey",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nutrinus-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nutrinus-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nutrinus-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Use emulators in development (optional, for local testing)
if (import.meta.env.DEV && !window.location.hostname.includes("firebase")) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch (e) {
    // Emulator already connected
  }
}
