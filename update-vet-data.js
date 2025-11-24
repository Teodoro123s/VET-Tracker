// Update existing veterinarian with correct data
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
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

async function updateVetData() {
  try {
    const tenantId = 'edmo.teodoro.swu';
    const vetEmail = 'edanel.teodoro@gmail.com';
    
    console.log('=== Searching for veterinarian ===');
    console.log('Tenant ID:', tenantId);
    console.log('Email:', vetEmail);
    
    // Find the veterinarian document
    const vetsSnapshot = await getDocs(collection(db, `tenants/${tenantId}/veterinarians`));
    
    let vetDoc = null;
    vetsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.email === vetEmail) {
        vetDoc = { id: doc.id, ...data };
      }
    });
    
    if (!vetDoc) {
      console.log('❌ Veterinarian not found!');
      process.exit(1);
    }
    
    console.log('\n✅ Found veterinarian:', vetDoc.id);
    console.log('Current data:', vetDoc);
    
    // Update with correct values
    const updates = {
      license: 'VET-2025-001',
      specialization: 'General Practice',
      phone: '+63 123 456 7890',
      licenseImageUrl: '',
      firstname: 'bb',
      surname: 'bb'
    };
    
    console.log('\n=== Updating veterinarian ===');
    console.log('Updates:', updates);
    
    await updateDoc(doc(db, `tenants/${tenantId}/veterinarians`, vetDoc.id), updates);
    
    console.log('✅ Veterinarian updated successfully!');
    
    // Verify the update
    const verifySnapshot = await getDocs(collection(db, `tenants/${tenantId}/veterinarians`));
    verifySnapshot.forEach(doc => {
      if (doc.data().email === vetEmail) {
        console.log('\n=== Verification ===');
        console.log('Updated data:', doc.data());
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateVetData();
