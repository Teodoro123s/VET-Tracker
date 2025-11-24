const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query } = require('firebase/firestore');
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

async function findAllCustomers() {
  console.log('🔍 Searching for all customers across all tenants...\n');
  
  try {
    // Get all tenants
    const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
    console.log(`Found ${tenantsSnapshot.size} tenant(s)\n`);
    
    let totalCustomers = 0;
    
    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      
      console.log(`\n📂 Tenant: ${tenantId}`);
      console.log(`   TenantId field: ${tenantData.tenantId || 'N/A'}`);
      console.log(`   Clinic name: ${tenantData.clinicName || tenantData.name || 'N/A'}`);
      
      // Check customers subcollection
      try {
        const customersRef = collection(db, 'tenants', tenantId, 'customers');
        const customersSnapshot = await getDocs(customersRef);
        
        if (customersSnapshot.size > 0) {
          console.log(`   ✅ Found ${customersSnapshot.size} customer(s):`);
          totalCustomers += customersSnapshot.size;
          
          customersSnapshot.docs.forEach((customerDoc, index) => {
            const customer = customerDoc.data();
            console.log(`      ${index + 1}. ID=${customerDoc.id}`);
            console.log(`         Name=${customer.firstname || ''} ${customer.surname || ''} (${customer.name || 'N/A'})`);
            console.log(`         Email=${customer.email || 'N/A'}`);
            console.log(`         Phone=${customer.phone || 'N/A'}`);
            console.log(`         Pets=${customer.pets || 0}`);
          });
        } else {
          console.log(`   ❌ No customers found`);
        }
      } catch (error) {
        console.log(`   ⚠️ Error reading customers: ${error.message}`);
      }
    }
    
    console.log(`\n\n📊 SUMMARY: Found ${totalCustomers} total customer(s) across all tenants`);
    
    if (totalCustomers === 0) {
      console.log('\n⚠️ NO CUSTOMERS FOUND IN DATABASE');
      console.log('💡 You need to create sample customers for testing');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

findAllCustomers();
