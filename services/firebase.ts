// Use compatibility imports for Firebase v10 compat mode
import firebase from "firebase/compat/app";
import "firebase/compat/database";

/**
 * FORMS PRO FIREBASE CONFIGURATION
 * 
 * HOW TO FIX PERMISSION ERRORS:
 * ----------------------------
 * This app uses a custom PIN/Password system (not Firebase Auth).
 * To allow syncing, use these "Public" rules in your Firebase Console:
 * 
 * {
 *   "rules": {
 *     ".read": true,
 *     ".write": true,
 *     "users": { ".indexOn": ["email"] },
 *     "forms": { ".indexOn": ["ownerUid"] }
 *   }
 * }
 * 
 * Why? If you use "auth != null", Firebase blocks the app because
 * the app never calls firebase.auth().signIn().
 */

const firebaseConfig = {
  apiKey: "AIzaSyDaigkKKNJvu9d0w42O7mjecaZF_sM4Xf8",
  authDomain: "forms-2a990.firebaseapp.com",
  databaseURL: "https://forms-2a990-default-rtdb.firebaseio.com",
  projectId: "forms-2a990",
  storageBucket: "forms-2a990.firebasestorage.app",
  messagingSenderId: "1074426712558",
  appId: "1:1074426712558:web:09d832fcda729f2b12feff",
  measurementId: "G-L85MWVWH0L"
};

const app = firebase.apps.length === 0 ? firebase.initializeApp(firebaseConfig) : firebase.app();

export const db = app.database();