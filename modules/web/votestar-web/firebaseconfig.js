// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFlUczdjyA3P0CdIVv5reyjLWEZKA1Grk",
  authDomain: "votestar-d6e54.firebaseapp.com",
  projectId: "votestar-d6e54",
  storageBucket: "votestar-d6e54.firebasestorage.app",
  messagingSenderId: "257695860210",
  appId: "1:257695860210:web:105d412bd4e5f82fbb176b",
  measurementId: "G-345J6C6ZB8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export {app, analytics};