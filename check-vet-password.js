// Use Firebase web SDK instead
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');
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

async function checkPassword() {
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
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('Found veterinarian:');
      console.log('Email:', data.email);
      console.log('Password stored:', JSON.stringify(data.password));
      console.log('Password from email:', JSON.stringify('$6S&vO0wR#qd'));
      console.log('Match:', data.password === '$6S&vO0wR#qd');
      console.log('Character codes in stored password:', data.password.split('').map(c => c.charCodeAt(0)));
      console.log('Character codes in email password:', '$6S&vO0wR#qd'.split('').map(c => c.charCodeAt(0)));
      console.log('\nAll fields:', Object.keys(data));
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPassword();
