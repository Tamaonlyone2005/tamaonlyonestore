
import { initializeApp } from "firebase/app";
import { getFirestore, Firestore, initializeFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC_h2ku3rGBvTsqcyJWflYwK2gFuDrJqXs",
  authDomain: "mystore-ed400.firebaseapp.com",
  projectId: "mystore-ed400",
  storageBucket: "mystore-ed400.firebasestorage.app",
  messagingSenderId: "185035095690",
  appId: "1:185035095690:web:875f54600c0d3a58f5b773",
  measurementId: "G-GD4TR6J54E"
};

let app;
let db: Firestore | null = null;
let analytics;
let auth;
let googleProvider;
let initializationSuccessful = false;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  
  // Use initializeFirestore with experimentalForceLongPolling to avoid connection timeouts
  // and 'client is offline' errors in restrictive network environments.
  db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
  });
  
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  
  // Initialize Analytics (optional, handled safely)
  if (typeof window !== 'undefined') {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn("Analytics failed to load (Analytics is optional):", e);
      }
  }

  initializationSuccessful = true;
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization failed (Offline Mode Active):", error);
  db = null;
  initializationSuccessful = false;
}

export { db, auth, googleProvider, initializationSuccessful, app, analytics };
