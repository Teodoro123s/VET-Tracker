require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

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

async function analyzeDatabase() {
  try {
    console.log('🔍 Analyzing Firebase Database Structure\n');

    // Check tenant information
    console.log('=== TENANT INFORMATION ===');
    const tenantRef = doc(db, 'tenants', 'azEhpY9h2n062ll7Fsx2');
    const tenantSnap = await getDoc(tenantRef);

    if (tenantSnap.exists()) {
      const tenantData = tenantSnap.data();
      console.log('✅ Tenant found:', tenantSnap.id);
      console.log('📋 Clinic Name:', tenantData.clinicName);
      console.log('📧 Email:', tenantData.email);
      console.log('🔑 Role:', tenantData.role);
      console.log('📊 Status:', tenantData.status);
      console.log('🏢 Tenant ID:', tenantData.tenantId);
      console.log('📅 Created:', tenantData.createdAt?.toDate?.()?.toLocaleString() || 'N/A');
      console.log('🔄 Last Update:', tenantData.lastStatusUpdate?.toDate?.()?.toLocaleString() || 'N/A');
    } else {
      console.log('❌ Tenant document not found');
    }

    console.log('\n=== COLLECTIONS ANALYSIS ===');

    const collections = [
      'appointments', 'customers', 'formFields', 'medicalForms',
      'medicalRecords', 'pets', 'reasonOptions', 'veterinarians'
    ];

    for (const collectionName of collections) {
      try {
        const collectionRef = collection(db, `tenants/Yc4HknA4jC4YFLOfMnil/${collectionName}`);
        const snapshot = await getDocs(collectionRef);
        console.log(`📁 ${collectionName}: ${snapshot.size} documents`);

        if (snapshot.size > 0 && collectionName === 'customers') {
          console.log('   Customer IDs:');
          snapshot.docs.forEach(doc => {
            console.log(`   - ${doc.id}`);
          });
        }
      } catch (error) {
        console.log(`❌ Error accessing ${collectionName}:`, error.message);
      }
    }

    // Check specific customer documents
    console.log('\n=== CUSTOMER DETAILS ===');
    const customerIds = [
      '5qXkUZPuPqfj72T6XvAi',
      'JwbBqHpsrq5BOt263Q3g',
      'OjqrXHc1PDhcnmQm3ofz',
      'Pcn4eJl0ux6s0acIGNPq',
      'Qp6s0F0okmexZpYflRbk'
    ];

    for (const customerId of customerIds) {
      try {
        const customerRef = doc(db, 'tenants/Yc4HknA4jC4YFLOfMnil/customers', customerId);
        const customerSnap = await getDoc(customerRef);

        if (customerSnap.exists()) {
          const customerData = customerSnap.data();
          console.log(`✅ Customer ${customerId}: ${customerData.firstname} ${customerData.surname}`);
        } else {
          console.log(`❌ Customer ${customerId}: Not found`);
        }
      } catch (error) {
        console.log(`❌ Error fetching customer ${customerId}:`, error.message);
      }
    }

    console.log('\n🎉 Database analysis complete!');

  } catch (error) {
    console.error('❌ Error analyzing database:', error);
  }
}

analyzeDatabase();