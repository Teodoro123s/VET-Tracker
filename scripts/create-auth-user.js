const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../api/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createAuthUser() {
  try {
    const userRecord = await admin.auth().createUser({
      uid: 'DQQeYy6BOqZ9fNDaVUaxN8HcwD42',
      email: 'edzhelteodoro@gmail.com',
      password: 'TempPass123!',
      displayName: 'Edzhel Teodoro'
    });
    
    console.log('✅ Auth user created successfully:');
    console.log('Email: edzhelteodoro@gmail.com');
    console.log('Password: TempPass123!');
    console.log('UID:', userRecord.uid);
    
  } catch (error) {
    if (error.code === 'auth/uid-already-exists') {
      console.log('✅ User already exists in Auth');
      console.log('Try logging in with: edzhelteodoro@gmail.com');
    } else {
      console.error('❌ Error creating auth user:', error);
    }
  }
  
  process.exit();
}

createAuthUser();