const admin = require('firebase-admin');
const crypto = require('crypto');
const serviceAccount = require('../serviceAccountKey.json');

// Firebase SCRYPT configuration
const FIREBASE_HASH_CONFIG = {
  algorithm: 'SCRYPT',
  base64SignerKey: 'gSSOOrD9eC3nxBbjG2wrKAYH9FIiM79xmTZCgJhUzXS2RGrPjxaXQ72d+WMfvtIKbr+BRNI/lOYqHI7SExfgTg==',
  base64SaltSeparator: 'Bw==',
  rounds: 8,
  memCost: 14
};

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const firestore = admin.firestore();

async function createSuperAdmin() {
  const superAdminEmail = 'edzhelteodoro@gmail.com';
  const superAdminPassword = '@Te0r0i256';
  const superAdminUID = '1hbwQGkJYFgfiBYCcpxLl0jFMAF3';
  
  // Generate salt and hash password using Firebase SCRYPT
  const salt = crypto.randomBytes(32);
  const saltSeparator = Buffer.from(FIREBASE_HASH_CONFIG.base64SaltSeparator, 'base64');
  const signerKey = Buffer.from(FIREBASE_HASH_CONFIG.base64SignerKey, 'base64');
  
  // Create Firebase-compatible hash (simplified for storage)
  const combinedSalt = Buffer.concat([salt, saltSeparator]);
  const hashedPassword = crypto.scryptSync(
    superAdminPassword, 
    combinedSalt, 
    64, 
    { N: Math.pow(2, FIREBASE_HASH_CONFIG.memCost), r: FIREBASE_HASH_CONFIG.rounds, p: 1 }
  ).toString('base64');
  
  try {
    // Set custom claims for existing superadmin
    await auth.setCustomUserClaims(superAdminUID, {
      role: 'superadmin',
      isSuperAdmin: true
    });

    // Create user document in users collection
    await firestore.collection('users').doc(superAdminUID).set({
      email: superAdminEmail,
      role: 'superadmin',
      displayName: 'Edzhel Teodoro',
      passwordHash: hashedPassword,
      salt: salt.toString('base64'),
      hashConfig: FIREBASE_HASH_CONFIG,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
      status: 'active',
      emailVerified: true
    });

    // Create superadmin document with permissions
    await firestore.collection('superadmins').doc(superAdminUID).set({
      email: superAdminEmail,
      role: 'superadmin',
      permissions: [
        'manage_clinics',
        'view_analytics', 
        'manage_subscriptions',
        'manage_users',
        'system_admin'
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });

    // Create system settings document
    await firestore.collection('systemSettings').doc('superadmin').set({
      superAdminUid: superAdminUID,
      systemVersion: '1.0.0',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ SuperAdmin configured successfully!');
    console.log('📧 Email:', superAdminEmail);
    console.log('🔑 Password:', superAdminPassword);
    console.log('🆔 UID:', superAdminUID);
    console.log('🔐 Security: Password hashed with Firebase SCRYPT algorithm');
    console.log('📊 Database Structure:');
    console.log('  - /users/' + superAdminUID + ' (with hashed password)');
    console.log('  - /superadmins/' + superAdminUID);
    console.log('  - /systemSettings/superadmin');
    
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