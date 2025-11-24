// Check all veterinarian documents
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
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

async function checkAllVets() {
  try {
    const tenantId = 'edmo.teodoro.swu';
    
    console.log('=== Checking all veterinarians in tenant:', tenantId, '===\n');
    
    const vetsSnapshot = await getDocs(collection(db, `tenants/${tenantId}/veterinarians`));
    
    console.log('Total veterinarians found:', vetsSnapshot.size);
    
    vetsSnapshot.forEach((doc, index) => {
      console.log(`\n--- Veterinarian ${index + 1} ---`);
      console.log('Document ID:', doc.id);
      const data = doc.data();
      console.log('Email:', data.email);
      console.log('Name:', data.name);
      console.log('Phone:', data.phone);
      console.log('Specialization:', data.specialization);
      console.log('License:', data.license);
      console.log('Full data:', JSON.stringify(data, null, 2));
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllVets();
