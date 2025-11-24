const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = require('firebase/firestore');
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

async function fixAdminTenantId() {
  console.log('🔧 Fixing admin tenantId field...\n');

  // Find the admin user
  const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
  
  let adminDoc = null;
  let adminDocId = null;
  
  for (const tenantDoc of tenantsSnapshot.docs) {
    if (tenantDoc.data().email === 'edmo.teodoro.swu@phinmaed.com') {
      adminDoc = tenantDoc.data();
      adminDocId = tenantDoc.id;
      break;
    }
  }

  if (!adminDoc) {
    console.log('❌ Admin user not found');
    return;
  }

  console.log('📋 Current admin data:');
  console.log('   Document ID:', adminDocId);
  console.log('   TenantId field:', adminDoc.tenantId);
  console.log('   Email:', adminDoc.email);

  // Check what data exists in the correct location
  const correctTenantId = adminDocId; // Yc4HknA4jC4YFLOfMnil
  console.log('\n📊 Data in tenants/' + correctTenantId + ':');

  const customersSnapshot = await getDocs(collection(db, 'tenants', correctTenantId, 'customers'));
  console.log('   Customers:', customersSnapshot.size);

  const appointmentsSnapshot = await getDocs(collection(db, 'tenants', correctTenantId, 'appointments'));
  console.log('   Appointments:', appointmentsSnapshot.size);

  const formTemplatesSnapshot = await getDocs(collection(db, 'tenants', correctTenantId, 'formTemplates'));
  console.log('   Form templates:', formTemplatesSnapshot.size);

  const veterinariansSnapshot = await getDocs(collection(db, 'tenants', correctTenantId, 'veterinarians'));
  console.log('   Veterinarians:', veterinariansSnapshot.size);

  const petsSnapshot = await getDocs(collection(db, 'tenants', correctTenantId, 'pets'));
  console.log('   Pets:', petsSnapshot.size);

  // Update the tenantId field to point to the correct location
  console.log('\n🔄 Updating tenantId field from "' + adminDoc.tenantId + '" to "' + correctTenantId + '"...');
  
  const adminDocRef = doc(db, 'tenants', adminDocId);
  await updateDoc(adminDocRef, {
    tenantId: correctTenantId
  });

  console.log('✅ Admin tenantId field updated successfully!');
  console.log('\nNow the admin will query: tenants/' + correctTenantId + '/customers, appointments, etc.');
}

fixAdminTenantId()
  .then(() => {
    console.log('\n✨ Fix complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
