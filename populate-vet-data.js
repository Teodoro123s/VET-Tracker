// Populate missing veterinarian subcollection data
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');
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

async function populateVetData() {
  try {
    const tenantId = 'azEhpY9h2n062ll7Fsx2';
    
    // Get all veterinarians from tenants collection
    const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
    const vets = [];
    
    tenantsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.role === 'veterinarian') {
        vets.push({ id: doc.id, ...data });
      }
    });
    
    console.log(`Found ${vets.length} veterinarians in tenants collection`);
    
    // Create veterinarian profile for Dr. ed ed (edanel.teodoro@gmail.com)
    console.log('\n=== Creating veterinarian profile ===');
    const vetData = {
      name: 'Dr. bb bb',
      email: 'edanel.teodoro@gmail.com',
      firstname: 'bb',
      surname: 'bb',
      license: 'VET-2025-001',
      specialization: 'General Practice',
      phone: '+1234567890',
      hasAccount: true,
      status: 'active',
      createdAt: new Date(),
      createdBy: 'edanel.teodoro@gmail.com'
    };
    
    const vetRef = await addDoc(collection(db, `tenants/${tenantId}/veterinarians`), vetData);
    console.log('✅ Created veterinarian profile with ID:', vetRef.id);
    console.log('Data:', vetData);
    
    // Verify it was created
    const checkSnapshot = await getDocs(collection(db, `tenants/${tenantId}/veterinarians`));
    console.log('\n=== Verification ===');
    console.log('Veterinarians in subcollection:', checkSnapshot.size);
    
    checkSnapshot.forEach(doc => {
      console.log('\nVet:', doc.id);
      console.log('Data:', doc.data());
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

populateVetData();
