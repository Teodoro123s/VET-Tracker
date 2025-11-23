// Fix veterinarian password to plain text
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc, deleteField } = require('firebase/firestore');
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixPassword() {
  try {
    const tenantsRef = collection(db, 'tenants');
    const q = query(
      tenantsRef,
      where('email', '==', 'edanel.teodoro@gmail.com'),
      where('role', '==', 'veterinarian')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('No veterinarian found with this email');
      process.exit(0);
    }
    
    const docToUpdate = snapshot.docs[0];
    console.log('Found veterinarian, updating password...');
    
    // Update to plain text password and remove salt
    await updateDoc(doc(db, 'tenants', docToUpdate.id), {
      password: '$6S&vO0wR#qd',
      salt: deleteField(),
      updatedAt: new Date()
    });
    
    console.log('✅ Password updated to plain text: $6S&vO0wR#qd');
    console.log('✅ Salt field removed');
    console.log('\nYou can now login with these credentials on mobile.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPassword();
