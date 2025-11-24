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

async function checkAppointments() {
  console.log('🔍 Checking for appointments in all tenants...\n');
  
  try {
    const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
    console.log(`Found ${tenantsSnapshot.size} tenant(s)\n`);
    
    let totalAppointments = 0;
    const vetEmail = 'edanel.teodoro@gmail.com';
    
    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      
      console.log(`\n📂 Tenant: ${tenantId}`);
      console.log(`   TenantId field: ${tenantData.tenantId || 'N/A'}`);
      console.log(`   Clinic name: ${tenantData.clinicName || tenantData.name || 'N/A'}`);
      
      try {
        const appointmentsRef = collection(db, 'tenants', tenantId, 'appointments');
        const appointmentsSnapshot = await getDocs(appointmentsRef);
        
        if (appointmentsSnapshot.size > 0) {
          console.log(`   ✅ Found ${appointmentsSnapshot.size} appointment(s):`);
          totalAppointments += appointmentsSnapshot.size;
          
          appointmentsSnapshot.docs.forEach((appointmentDoc, index) => {
            const appointment = appointmentDoc.data();
            console.log(`      ${index + 1}. ID=${appointmentDoc.id}`);
            console.log(`         Customer: ${appointment.customerName || 'N/A'}`);
            console.log(`         Pet: ${appointment.petName || 'N/A'}`);
            console.log(`         Veterinarian: ${appointment.veterinarian || 'N/A'}`);
            console.log(`         Status: ${appointment.status || 'N/A'}`);
            console.log(`         Date: ${appointment.appointmentDate ? new Date(appointment.appointmentDate.seconds * 1000).toLocaleString() : 'N/A'}`);
          });
          
          // Check how many are assigned to the vet
          const vetAppointments = appointmentsSnapshot.docs.filter(doc => 
            doc.data().veterinarian === vetEmail
          );
          console.log(`   👨‍⚕️ Appointments for ${vetEmail}: ${vetAppointments.length}`);
        } else {
          console.log(`   ❌ No appointments found`);
        }
      } catch (error) {
        console.log(`   ⚠️ Error reading appointments: ${error.message}`);
      }
    }
    
    console.log(`\n\n📊 SUMMARY: Found ${totalAppointments} total appointment(s) across all tenants`);
    
    if (totalAppointments === 0) {
      console.log('\n⚠️ NO APPOINTMENTS FOUND IN DATABASE');
      console.log('💡 You need to create sample appointments for testing');
      console.log('   The mobile app needs appointments data to display in calendar/appointments screens');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAppointments();
