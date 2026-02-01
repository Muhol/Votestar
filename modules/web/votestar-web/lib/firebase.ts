import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAFlUczdjyA3P0CdIVv5reyjLWEZKA1Grk",
    authDomain: "votestar-d6e54.firebaseapp.com",
    projectId: "votestar-d6e54",
    storageBucket: "votestar-d6e54.firebasestorage.app",
    messagingSenderId: "257695860210",
    appId: "1:257695860210:web:105d412bd4e5f82fbb176b",
    measurementId: "G-345J6C6ZB8"
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
const db = getFirestore(app);

// Initialize Analytics (only in browser)
let analytics;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

export { app, db, analytics };
