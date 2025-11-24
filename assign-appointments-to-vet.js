const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');
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

async function assignAppointmentsToVet() {
  console.log('🔧 Assigning appointments to veterinarian...\n');
  
  const tenantId = 'Yc4HknA4jC4YFLOfMnil'; // The tenant with appointments
  const vetEmail = 'edanel.teodoro@gmail.com';
  const vetName = 'Dr. Edanel Teodoro'; // You can adjust this
  
  try {
    const appointmentsRef = collection(db, 'tenants', tenantId, 'appointments');
    const appointmentsSnapshot = await getDocs(appointmentsRef);
    
    console.log(`Found ${appointmentsSnapshot.size} appointments to update\n`);
    
    let updated = 0;
    for (const appointmentDoc of appointmentsSnapshot.docs) {
      const appointment = appointmentDoc.data();
      
      // Only update if veterinarian field is missing or N/A
      if (!appointment.veterinarian || appointment.veterinarian === 'N/A' || appointment.veterinarian === '') {
        const appointmentRef = doc(db, 'tenants', tenantId, 'appointments', appointmentDoc.id);
        
        await updateDoc(appointmentRef, {
          veterinarian: vetEmail,
          veterinarianName: vetName
        });
        
        console.log(`✅ Updated appointment ${appointmentDoc.id} (${appointment.customerName} - ${appointment.petName})`);
        updated++;
      } else {
        console.log(`⏭️ Skipped appointment ${appointmentDoc.id} (already assigned to ${appointment.veterinarian})`);
      }
    }
    
    console.log(`\n✅ Successfully assigned ${updated} appointments to ${vetEmail}`);
    console.log(`\nNow the mobile calendar and appointments should display these ${updated} appointments!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

assignAppointmentsToVet();
