const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Check for service account key
const serviceAccountPath = path.join(__dirname, '../api/serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service Account Key not found!');
  console.log('\n📝 To fix this:');
  console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save the file as "serviceAccountKey.json" in the api/ folder');
  console.log('4. Run this script again');
  console.log('\n💡 Alternative Firebase Console to reset password manually:');
  console.log('1. Go to Firebase Console > Authentication > Users');
  console.log('2. Find user: edzhelteodoro@gmail.com');
  console.log('3. Click the user and select "Reset Password"');
  console.log('4. Set new password: VetCare2024!');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require('../api/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function resetPassword() {
  const newPassword = 'VetCare2024!';
  const userEmail = 'edzhel.teodoro25@gmail.com';
  const userId = '3xWbSr1Dgdek4UzJNQI1I2mUS7N2';
  
  try {
    // First, verify the user exists
    const userRecord = await admin.auth().getUser(userId);
    console.log('👤 Found user:', userRecord.email);
    
    // Update the password
    await admin.auth().updateUser(userId, {
      password,
      emailVerified // Ensure email is verified
    });
    
    console.log('✅ Password reset successfully!');
    console.log('Email:', userEmail);
    console.log('New Password:', newPassword);
    console.log('\n💡 User can now login with the new password.');
    console.log('⚠️  Make sure to update any stored passwords in your system.');
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('🔍 Try listing all users to find the correct UID:');
      try {
        const listUsersResult = await admin.auth().listUsers(10);
        listUsersResult.users.forEach((user) => {
          console.log(`- ${user.email}: ${user.uid}`);
        });
      } catch (listError) {
        console.error('Error listing users:', listError);
      }
    }
  }
  
  process.exit();
}

resetPassword();