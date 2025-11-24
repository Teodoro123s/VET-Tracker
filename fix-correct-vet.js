// Update the correct veterinarian document
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');
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

async function fixVet() {
  try {
    const tenantId = 'Yc4HknA4jC4YFLOfMnil';
    const vetId = 'icslwwXM3S28gRLhGW5q';
    
    console.log('Updating veterinarian:');
    console.log('Path: tenants/' + tenantId + '/veterinarians/' + vetId);
    
    const updates = {
      specialization: 'General Practice',
      phone: '+63 123 456 7890',
      license: 'VET-2025-001'
    };
    
    await updateDoc(doc(db, `tenants/${tenantId}/veterinarians`, vetId), updates);
    
    console.log('✅ Updated successfully!');
    console.log('New values:');
    console.log('  Specialization: General Practice');
    console.log('  Phone: +63 123 456 7890');
    console.log('  License: VET-2025-001');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixVet();
