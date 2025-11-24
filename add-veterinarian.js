require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');

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

async function addVeterinarian() {
  try {
    console.log('🔍 Finding tenant for edmo.teodoro.swu@phinmaed.com...');

    const tenantsRef = collection(db, 'tenants');
    const q = query(tenantsRef, where('email', '==', 'edmo.teodoro.swu@phinmaed.com'));
    const tenantSnapshot = await getDocs(q);

    if (tenantSnapshot.empty) {
      console.log('❌ No tenant found for admin email');
      return;
    }

    const tenantDoc = tenantSnapshot.docs[0];
    const tenantId = tenantDoc.id;
    console.log('✅ Found tenant ID:', tenantId);

    // Add veterinarian
    console.log('👨‍⚕️ Adding veterinarian...');
    const veterinariansRef = collection(db, `tenants/${tenantId}/veterinarians`);

    const veterinarianData = {
      name: 'Dr. Edzhel Teodoro',
      email: 'edzhel.teodoro25@gmail.com',
      license: 'DVM-2024-001',
      specialization: 'General Practice',
      phone: '+63 912 345 6789',
      experience: '5 years',
      createdAt: new Date()
    };

    const docRef = await addDoc(veterinariansRef, veterinarianData);
    console.log('✅ Added veterinarian:', veterinarianData.name);
    console.log('📄 Document ID:', docRef.id);

  } catch (error) {
    console.error('❌ Error adding veterinarian:', error);
  }
}

addVeterinarian();