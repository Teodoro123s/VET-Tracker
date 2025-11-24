// Delete ALL veterinarian documents and recreate with correct data
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } = require('firebase/firestore');
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

async function resetVetData() {
  try {
    const tenantId = 'edmo.teodoro.swu';
    
    console.log('=== Step 1: Delete all existing veterinarians ===');
    const vetsSnapshot = await getDocs(collection(db, `tenants/${tenantId}/veterinarians`));
    
    console.log('Found', vetsSnapshot.size, 'veterinarian documents to delete');
    
    for (const vetDoc of vetsSnapshot.docs) {
      console.log('Deleting:', vetDoc.id, vetDoc.data().email);
      await deleteDoc(doc(db, `tenants/${tenantId}/veterinarians`, vetDoc.id));
    }
    
    console.log('\n=== Step 2: Create fresh veterinarian document ===');
    const vetData = {
      name: 'Dr. bb bb',
      firstname: 'bb',
      surname: 'bb',
      email: 'edanel.teodoro@gmail.com',
      license: 'VET-2025-001',
      licenseImageUrl: '',
      specialization: 'General Practice',
      phone: '+63 123 456 7890',
      role: 'veterinarian',
      hasAccount: true,
      status: 'active',
      createdAt: new Date(),
      createdBy: 'edmo.teodoro.swu@phinmaed.com'
    };
    
    const newVetRef = await addDoc(collection(db, `tenants/${tenantId}/veterinarians`), vetData);
    console.log('✅ Created new veterinarian with ID:', newVetRef.id);
    console.log('Data:', vetData);
    
    console.log('\n=== Step 3: Verify ===');
    const verifySnapshot = await getDocs(collection(db, `tenants/${tenantId}/veterinarians`));
    console.log('Total veterinarians now:', verifySnapshot.size);
    
    verifySnapshot.forEach(doc => {
      const data = doc.data();
      console.log('\nDoc ID:', doc.id);
      console.log('Email:', data.email);
      console.log('Name:', data.name);
      console.log('Specialization:', data.specialization);
      console.log('Phone:', data.phone);
      console.log('License:', data.license);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetVetData();
