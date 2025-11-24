const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');
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

async function getTenantId(userEmail) {
  if (!userEmail) {
    console.log('❌ No email provided');
    return null;
  }
  
  console.log(`🔍 Looking up tenantId for email: ${userEmail}`);
  
  try {
    // Query tenants collection for the user's email
    const tenantsRef = collection(db, 'tenants');
    const q = query(tenantsRef, where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No tenant document found with this email');
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const userData = doc.data();
    
    console.log('\n📄 Found tenant document:');
    console.log(`   Document ID: ${doc.id}`);
    console.log(`   tenantId field: ${userData.tenantId || 'N/A'}`);
    console.log(`   email: ${userData.email}`);
    console.log(`   role: ${userData.role}`);
    console.log(`   clinicName: ${userData.clinicName || userData.name}`);
    
    // Return tenantId field OR document ID
    const tenantId = userData.tenantId || doc.id;
    console.log(`\n✅ getTenantId() will return: ${tenantId}`);
    
    // Show where customers would be queried
    const customerPath = `tenants/${tenantId}/customers`;
    console.log(`\n📂 Customer query path: ${customerPath}`);
    
    // Check if customers exist at this path
    const customersRef = collection(db, 'tenants', tenantId, 'customers');
    const customersSnapshot = await getDocs(customersRef);
    console.log(`   Customers found: ${customersSnapshot.size}`);
    
    if (customersSnapshot.size > 0) {
      console.log(`   ✅ Customer data is accessible at this path`);
      customersSnapshot.docs.forEach((customerDoc, index) => {
        const customer = customerDoc.data();
        console.log(`      ${index + 1}. ${customer.firstname} ${customer.surname} (${customer.email})`);
      });
    } else {
      console.log(`   ❌ NO CUSTOMERS at this path`);
      console.log(`\n   🔍 Checking if customers exist elsewhere...`);
      
      // Check the document ID path instead
      const altPath = `tenants/${doc.id}/customers`;
      const altCustomersRef = collection(db, 'tenants', doc.id, 'customers');
      const altCustomersSnapshot = await getDocs(altCustomersRef);
      if (altCustomersSnapshot.size > 0) {
        console.log(`   ⚠️ Found ${altCustomersSnapshot.size} customers at: ${altPath}`);
        console.log(`   💡 This is the WRONG path! tenantId field does not match document ID`);
      }
    }
    
    return tenantId;
    
  } catch (error) {
    console.error('Error getting tenant ID:', error);
    return null;
  }
}

// Test with the veterinarian email
getTenantId('edanel.teodoro@gmail.com');
