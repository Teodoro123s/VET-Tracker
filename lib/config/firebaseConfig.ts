import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase config - Database and Auth only (NO STORAGE)
// Use environment variables for all sensitive values so they are not
// committed to source control. If running in Expo, use `app.config.js`
// to inject these via `Constants.expoConfig.extra`.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase config - Database and Auth only (NO STORAGE)
const firebaseConfig = {
  apiKey: "AIzaSyBPYVDo0etnBXF2xVVnpwsEBeUTvBbB42o",
  authDomain: "vet-management-b322c.firebaseapp.com",
  projectId: "vet-management-b322c",
  messagingSenderId: "775446851492",
  appId: "1:775446851492:android:511fbfc253e1e385399b31",
  storageBucket: "vet-management-b322c.appspot.com" // Re-enabled Firebase storage
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);