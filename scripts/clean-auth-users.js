const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();

async function cleanAuthUsers() {
  try {
    console.log('🧹 Cleaning Firebase Auth users...');
    
    // List all users
    const listUsersResult = await auth.listUsers();
    const users = listUsersResult.users;
    
    if (users.length === 0) {
      console.log('✅ No users to delete');
      process.exit(0);
    }
    
    console.log(`Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`- ${user.email} (${user.uid})`);
      
      // Keep the superadmin user, delete others
      if (user.email && user.email.includes('superadmin')) {
        console.log('  ⏭️ Keeping superadmin user');
      } else {
        await auth.deleteUser(user.uid);
        console.log('  ✅ Deleted');
      }
    }
    
    console.log('🎉 Auth cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error cleaning auth users:', error);
  }
  
  process.exit(0);
}

cleanAuthUsers();