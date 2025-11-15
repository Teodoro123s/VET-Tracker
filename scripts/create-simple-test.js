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

async function createSimpleTest() {
  const email = 'test@example.com';
  const password = 'Test123!';
  const tenantId = 'test-example';
  
  try {
    // Delete if exists first
    try {
      const existingUser = await auth.getUserByEmail(email);
      await auth.deleteUser(existingUser.uid);
      console.log('🗑️ Deleted existing user');
    } catch (e) {
      // User doesn't exist, that's fine
    }
    
    // Create fresh user
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified,
    });

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      tenantId,
      role: 'clinic_admin'
    });

    // Create tenant document
    await firestore.collection('tenants').doc(tenantId).set({
      email,
      clinicName: 'Test Clinic',
      subscriptionPlan: '1 month',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      adminUid: userRecord.uid
    });

    console.log('✅ Simple test account created!');
    console.log('');
    console.log('🧪 TEST THESE EXACT CREDENTIALS:');
    console.log('Email: test@example.com');
    console.log('Password: Test123!');
    console.log('');
    console.log('🆔 UID:', userRecord.uid);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

createSimpleTest();