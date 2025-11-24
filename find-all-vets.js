// Search ALL tenants for veterinarian with this email
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
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

async function findAllVets() {
  try {
    console.log('=== Searching ALL tenants for veterinarians ===\n');
    
    const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
    
    console.log('Total tenant documents:', tenantsSnapshot.size);
    
    for (const tenantDoc of tenantsSnapshot.docs) {
      try {
        const vetsSnapshot = await getDocs(collection(db, `tenants/${tenantDoc.id}/veterinarians`));
        
        if (vetsSnapshot.size > 0) {
          console.log(`\n📁 Tenant: ${tenantDoc.id}`);
          console.log(`   Tenant data:`, {
            email: tenantDoc.data().email,
            tenantId: tenantDoc.data().tenantId,
            role: tenantDoc.data().role
          });
          console.log(`   Veterinarians: ${vetsSnapshot.size}`);
          
          vetsSnapshot.forEach(vetDoc => {
            const data = vetDoc.data();
            console.log(`   - ${vetDoc.id}`);
            console.log(`     Email: ${data.email}`);
            console.log(`     Name: ${data.name}`);
            console.log(`     Specialization: ${data.specialization}`);
            console.log(`     Phone: ${data.phone}`);
          });
        }
      } catch (error) {
        // Skip tenants without veterinarians collection
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findAllVets();
