// Update veterinarian in the ADMIN's tenant collection
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

async function updateAdminVet() {
  try {
    // This is the ACTUAL tenant document ID where veterinarians are stored
    const adminTenantDocId = 'edmo.teodoro.swu@phinmaed.com';
    const vetDocId = 'icslwwXM3S28gRLhGW5q';
    
    console.log('=== Updating veterinarian in admin tenant ===');
    console.log('Admin tenant doc ID:', adminTenantDocId);
    console.log('Vet doc ID:', vetDocId);
    
    // Check if it exists
    const vetDoc = await getDocs(collection(db, `tenants/${adminTenantDocId}/veterinarians`));
    
    console.log('\nFound', vetDoc.size, 'veterinarians in this tenant');
    
    vetDoc.forEach(doc => {
      console.log('- Doc ID:', doc.id);
      console.log('  Email:', doc.data().email);
      console.log('  Specialization:', doc.data().specialization);
      console.log('  Phone:', doc.data().phone);
    });
    
    // Update the specific document
    console.log('\n=== Updating veterinarian document ===');
    const updates = {
      specialization: 'General Practice',
      phone: '+63 123 456 7890',
      license: 'VET-2025-001',
      firstname: 'bb',
      surname: 'bb'
    };
    
    await updateDoc(doc(db, `tenants/${adminTenantDocId}/veterinarians`, vetDocId), updates);
    console.log('✅ Updated successfully!');
    
    // Verify
    const verifyDoc = await getDocs(collection(db, `tenants/${adminTenantDocId}/veterinarians`));
    console.log('\n=== Verification ===');
    verifyDoc.forEach(doc => {
      if (doc.id === vetDocId) {
        const data = doc.data();
        console.log('Updated vet:');
        console.log('  Specialization:', data.specialization);
        console.log('  Phone:', data.phone);
        console.log('  License:', data.license);
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateAdminVet();
