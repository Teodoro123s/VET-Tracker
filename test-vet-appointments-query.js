const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
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

async function testVetAppointmentQuery() {
  console.log('🔍 Testing veterinarian appointment query...\n');
  
  const tenantId = 'Yc4HknA4jC4YFLOfMnil';
  const vetEmail = 'edanel.teodoro@gmail.com';
  
  try {
    console.log(`Tenant ID: ${tenantId}`);
    console.log(`Vet Email: ${vetEmail}`);
    console.log(`Query path: tenants/${tenantId}/appointments`);
    console.log(`Filter: veterinarian == ${vetEmail}\n`);
    
    // Test 1: Get all appointments (no filter)
    const allAppointmentsRef = collection(db, 'tenants', tenantId, 'appointments');
    const allSnapshot = await getDocs(allAppointmentsRef);
    console.log(`📊 Total appointments in tenant: ${allSnapshot.size}`);
    
    // Test 2: Get only vet's appointments (with filter)
    const vetAppointmentsQuery = query(
      collection(db, 'tenants', tenantId, 'appointments'),
      where('veterinarian', '==', vetEmail)
    );
    const vetSnapshot = await getDocs(vetAppointmentsQuery);
    console.log(`👨‍⚕️ Appointments assigned to ${vetEmail}: ${vetSnapshot.size}\n`);
    
    if (vetSnapshot.size > 0) {
      console.log('✅ APPOINTMENTS FOUND! Sample:');
      vetSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const apt = doc.data();
        console.log(`   ${index + 1}. ${apt.customerName} - ${apt.petName}`);
        console.log(`      Status: ${apt.status}`);
        console.log(`      Vet: ${apt.veterinarian}`);
      });
    } else {
      console.log('❌ NO APPOINTMENTS FOUND!');
      console.log('\nChecking appointment details:');
      allSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const apt = doc.data();
        console.log(`   ${index + 1}. ${apt.customerName} - ${apt.petName}`);
        console.log(`      Vet field: "${apt.veterinarian}"`);
        console.log(`      Vet field type: ${typeof apt.veterinarian}`);
        console.log(`      Match: ${apt.veterinarian === vetEmail}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testVetAppointmentQuery();
