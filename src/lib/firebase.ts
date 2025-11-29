
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "student-assignment-b0664.firebaseapp.com",
  projectId: "student-assignment-b0664",
  storageBucket: "student-assignment-b0664.appspot.com",
  messagingSenderId: "929698649262",
  appId: "1:929698649262:web:a4576677bc304cc5d1893f",
  measurementId: "G-X22MBKL6H4"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics on the client side only
let analytics;
if (typeof window !== 'undefined') {
    isSupported().then(yes => {
        if (yes) {
            analytics = getAnalytics(app);
        }
    });
}


export { app, auth, db, storage, analytics };
