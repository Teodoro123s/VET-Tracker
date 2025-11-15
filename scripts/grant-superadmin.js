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

async function grantSuperAdminAccess() {
  const email = 'edmo.teodoro.swu@phinmaed.com';
  
  try {
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    
    // Set superadmin custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'superadmin',
      isSuperAdmin,
      tenantId // Remove tenant restriction
    });

    // Create superadmin document
    await firestore.collection('superadmins').doc(userRecord.uid).set({
      email,
      role: 'superadmin',
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });

    console.log('✅ SuperAdmin access granted successfully!');
    console.log('📧 Email:', email);
    console.log('🆔 UID:', userRecord.uid);
    console.log('🔑 Role: SuperAdmin');
    
  } catch (error) {
    console.error('❌ Error granting superadmin access:', error);
  }
  
  process.exit(0);
}

grantSuperAdminAccess();