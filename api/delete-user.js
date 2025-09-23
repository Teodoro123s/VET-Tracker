// API endpoint for complete user deletion
// This runs server-side with Admin SDK privileges

const admin = require('firebase-admin');

// Initialize Admin SDK (only once)
if (!admin.apps.length) {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    console.log('Deleting user from Firebase Auth:', email);
    
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Delete from Firebase Auth
    await admin.auth().deleteUser(userRecord.uid);
    
    // Delete from Firestore (using Admin SDK)
    const tenantId = email.split('@')[0];
    await admin.firestore().collection('tenants').doc(tenantId).delete();
    
    console.log('✅ User completely deleted:', email);
    
    res.status(200).json({ 
      success: true, 
      message: `User ${email} deleted from both Auth and Database` 
    });
    
  } catch (error) {
    console.error('Deletion error:', error);
    
    if (error.code === 'auth/user-not-found') {
      // User doesn't exist in Auth, just delete from Firestore
      try {
        const tenantId = email.split('@')[0];
        await admin.firestore().collection('tenants').doc(tenantId).delete();
        res.status(200).json({ 
          success: true, 
          message: `Database record deleted (Auth user not found)` 
        });
      } catch (dbError) {
        res.status(500).json({ error: 'Failed to delete database record' });
      }
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}