const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();
const firestore = admin.firestore();

async function revertToClinicAdmin() {
  const email = 'edmo.teodoro.swu@phinmaed.com';
  const tenantId = 'edmo.teodoro.swu';
  
  try {
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // Set clinic admin custom claims (remove superadmin)
    await auth.setCustomUserClaims(userRecord.uid, {
      tenantId,
      role: 'clinic_admin'
    });

    // Remove from superadmins collection
    try {
      await firestore.collection('superadmins').doc(userRecord.uid).delete();
    } catch (e) {
      // Document might not exist, that's ok
    }

    // Ensure tenant document exists
    await firestore.collection('tenants').doc(tenantId).set({
      email,
      clinicName: 'Edmo Veterinary Clinic',
      subscriptionPlan: '1 month',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      adminUid: userRecord.uid
    }, { merge });

    console.log('✅ Account reverted to Clinic Admin successfully!');
    console.log('📧 Email:', email);
    console.log('🆔 UID:', userRecord.uid);
    console.log('🏥 Tenant ID:', tenantId);
    console.log('🔑 Role Admin (Client-side access)');
    
  } catch (error) {
    console.error('❌ Error reverting account:', error);
  }
  
  process.exit(0);
}

revertToClinicAdmin();