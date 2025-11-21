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