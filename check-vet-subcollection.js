// Check veterinarians in subcollection
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

async function checkVetData() {
  try {
    const tenantId = 'azEhpY9h2n062ll7Fsx2';
    console.log('Checking veterinarians in tenants/' + tenantId + '/veterinarians');
    
    const vetsSnapshot = await getDocs(collection(db, `tenants/${tenantId}/veterinarians`));
    console.log('Found', vetsSnapshot.size, 'veterinarians in subcollection');
    
    vetsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('\nVeterinarian:', doc.id);
      console.log('Name:', data.name);
      console.log('Email:', data.email);
      console.log('Has hasAccount field:', data.hasAccount);
    });
    
    // Also check all tenants to see which ones have veterinarian role
    console.log('\n=== Checking tenants collection for veterinarian role ===');
    const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
    let vetCount = 0;
    tenantsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.role === 'veterinarian') {
        vetCount++;
        console.log('\nFound vet in tenants:', doc.id);
        console.log('Email:', data.email);
        console.log('TenantId field:', data.tenantId);
      }
    });
    console.log('\nTotal veterinarians in tenants collection:', vetCount);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkVetData();
