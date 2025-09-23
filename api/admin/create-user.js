const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  const serviceAccount = require('../../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, tenantId } = req.body;

  try {
    // Create user with Firebase Admin
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: true,
    });

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      tenantId,
      role: 'clinic_admin'
    });

    // Create tenant document
    await admin.firestore().collection('tenants').doc(tenantId).set({
      email,
      clinicName: 'To be set by admin',
      subscriptionPlan: '1 month',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      adminUid: userRecord.uid
    });

    res.status(200).json({ 
      success: true, 
      uid: userRecord.uid,
      message: 'User created successfully' 
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}