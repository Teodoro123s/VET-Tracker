const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
const CryptoJS = require('crypto-js');

// Password hashing functions
function generateSalt() {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);
}

function hashPassword(password, salt) {
  const userSalt = salt || generateSalt();
  const passwordHash = CryptoJS.SHA256(password + userSalt).toString();
  return { passwordHash, salt: userSalt };
}

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();
const firestore = admin.firestore();

async function setupSuperadmin() {
  const superadminEmail = 'edzhelteodoro@gmail.com';
  const superadminPassword = 'superadmin123'; // Change this to your desired password
  
  try {
    // Hash the password
    const { passwordHash, salt } = hashPassword(superadminPassword);
    
    // Create or update superadmin in users collection
    await firestore.collection('users').doc('superadmin').set({
      email: superadminEmail,
      passwordHash: passwordHash,
      salt: salt,
      displayName: 'Edzhel Teodoro',
      role: 'superadmin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Superadmin created successfully!');
    console.log('📧 Email:', superadminEmail);
    console.log('🔑 Password:', superadminPassword);
    console.log('🔐 Password Hash:', passwordHash);
    console.log('🧂 Salt:', salt);
    
  } catch (error) {
    console.error('❌ Error creating superadmin:', error);
  }
  
  process.exit(0);
}

setupSuperadmin();