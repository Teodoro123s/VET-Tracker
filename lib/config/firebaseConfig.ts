import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

// Firebase config - Database and Auth only (NO STORAGE)
// Use environment variables for all sensitive values so they are not
// committed to source control. If running in Expo, use `app.config.js`
// to inject these via `Constants.expoConfig.extra`.
const extra = Constants.expoConfig?.extra || {};

// Fallback to hardcoded values from .env for local development
// These are your actual Firebase credentials from .env
const firebaseConfig = {
  apiKey: extra.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyCltkyzKYrxjuLRR6cggWRXuz7bL2vm_oo',
  authDomain: extra.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || 'vet-management-b322c.firebaseapp.com',
  projectId: extra.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'vet-management-b322c',
  messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '775446851492',
  appId: extra.FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '1:775446851492:android:511fbfc253e1e385399b31',
  storageBucket: extra.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || 'vet-management-b322c.firebasestorage.app',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);