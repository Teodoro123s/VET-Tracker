const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../api/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createTestUser() {
  try {
    const userRecord = await admin.auth().createUser({
      email: 'test@clinic.com',
      password: 'TestPass123!',
      displayName: 'Test User'
    });
    
    console.log('✅ Test user created successfully:');
    console.log('Email: test@clinic.com');
    console.log('Password: TestPass123!');
    console.log('UID:', userRecord.uid);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
  
  process.exit();
}

createTestUser();