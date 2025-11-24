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

async function fixVetTenantId() {
  console.log('🔧 Fixing veterinarian tenantId field...\n');
  
  try {
    // The veterinarian login record
    const vetLoginDocId = 'azEhpY9h2n062ll7Fsx2';
    
    // The ACTUAL admin tenant where customers and vet profile exist
    const actualTenantId = 'Yc4HknA4jC4YFLOfMnil';
    
    console.log(`Updating tenant document: ${vetLoginDocId}`);
    console.log(`Setting tenantId field to: ${actualTenantId}`);
    console.log(`\nThis will make getTenantId() return the correct tenant ID`);
    console.log(`where customers, vet profile, and other data are stored.\n`);
    
    const vetDocRef = doc(db, 'tenants', vetLoginDocId);
    
    await updateDoc(vetDocRef, {
      tenantId: actualTenantId
    });
    
    console.log('✅ Successfully updated!');
    console.log(`\nNow when veterinarian logs in with edanel.teodoro@gmail.com:`);
    console.log(`- getTenantId() will return: ${actualTenantId}`);
    console.log(`- Customer query path: tenants/${actualTenantId}/customers`);
    console.log(`- This path has 5 customers ✅`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixVetTenantId();
