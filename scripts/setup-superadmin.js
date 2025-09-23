const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const firestore = admin.firestore();

async function createSuperAdmin() {
  const superAdminEmail = 'superadmin@vet.com';
  const superAdminPassword = 'SuperAdmin2024!';
  
  try {
    // Create superadmin user
    const userRecord = await auth.createUser({
      email: superAdminEmail,
      password: superAdminPassword,
      emailVerified: true,
    });

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'superadmin',
      isSuperAdmin: true
    });

    // Create superadmin document
    await firestore.collection('superadmins').doc(userRecord.uid).set({
      email: superAdminEmail,
      role: 'superadmin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });

    console.log('✅ SuperAdmin created successfully!');
    console.log('📧 Email:', superAdminEmail);
    console.log('🔑 Password:', superAdminPassword);
    console.log('🆔 UID:', userRecord.uid);
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('⚠️ SuperAdmin already exists');
    } else {
      console.error('❌ Error creating superadmin:', error);
    }
  }
  
  process.exit(0);
}

createSuperAdmin();