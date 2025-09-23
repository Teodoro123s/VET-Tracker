import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBPYVDo0etnBXF2xVVnpwsEBeUTvBbB42o",
  authDomain: "vet-management-b322c.firebaseapp.com",
  projectId: "vet-management-b322c",
  storageBucket: "vet-management-b322c.firebasestorage.app",
  messagingSenderId: "775446851492",
  appId: "1:775446851492:android:511fbfc253e1e385399b31"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);