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

async function checkWebAdminTenant() {
  console.log('🔍 Checking web admin tenant setup...\n');
  
  try {
    // Check for all possible admin users
    const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
    
    console.log(`Found ${tenantsSnapshot.size} tenant documents\n`);
    
    const adminTenants = [];
    const vetTenants = [];
    
    for (const tenantDoc of tenantsSnapshot.docs) {
      const data = tenantDoc.data();
      
      if (data.role === 'admin' || data.role === 'client') {
        adminTenants.push({
          id: tenantDoc.id,
          email: data.email,
          tenantId: data.tenantId,
          clinicName: data.clinicName || data.name,
          role: data.role
        });
      } else if (data.role === 'veterinarian') {
        vetTenants.push({
          id: tenantDoc.id,
          email: data.email,
          tenantId: data.tenantId,
          role: data.role
        });
      }
    }
    
    console.log('📊 ADMIN TENANTS:');
    if (adminTenants.length === 0) {
      console.log('   ❌ No admin tenants found!\n');
    } else {
      adminTenants.forEach((tenant, index) => {
        console.log(`   ${index + 1}. Email: ${tenant.email}`);
        console.log(`      Document ID: ${tenant.id}`);
        console.log(`      TenantId field: ${tenant.tenantId}`);
        console.log(`      Clinic: ${tenant.clinicName}`);
        console.log(`      Role: ${tenant.role}`);
        
        // Check appointments for this tenant
        const checkTenantId = tenant.tenantId || tenant.id;
        console.log(`      Querying appointments at: tenants/${checkTenantId}/appointments`);
        console.log('');
      });
    }
    
    console.log('\n👨‍⚕️ VETERINARIAN TENANTS:');
    vetTenants.forEach((tenant, index) => {
      console.log(`   ${index + 1}. Email: ${tenant.email}`);
      console.log(`      Document ID: ${tenant.id}`);
      console.log(`      TenantId field: ${tenant.tenantId}`);
    });
    
    // Now check appointments for each admin tenant
    console.log('\n\n🔍 Checking appointments for admin tenants...\n');
    
    for (const tenant of adminTenants) {
      const checkTenantId = tenant.tenantId || tenant.id;
      console.log(`📂 Checking ${tenant.email} (tenantId: ${checkTenantId})`);
      
      try {
        const appointmentsRef = collection(db, 'tenants', checkTenantId, 'appointments');
        const snapshot = await getDocs(appointmentsRef);
        console.log(`   ✅ Found ${snapshot.size} appointments`);
        
        if (snapshot.size > 0) {
          console.log(`   Sample appointments:`);
          snapshot.docs.slice(0, 2).forEach((doc, i) => {
            const apt = doc.data();
            console.log(`      ${i + 1}. ${apt.customerName} - ${apt.petName} (${apt.status})`);
          });
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkWebAdminTenant();
