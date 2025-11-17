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

async function createClinicAdmin() {
  const clinicEmail = 'clinic1@vet.com';
  const clinicPassword = 'Clinic1Pass!';
  const tenantId = 'clinic1';
  
  try {
    // Create clinic admin user in Firebase Auth
    const userRecord = await auth.createUser({
      email: clinicEmail,
      password: clinicPassword,
      emailVerified: true,
    });

    // Set custom claims for tenant isolation
    await auth.setCustomUserClaims(userRecord.uid, {
      tenantId,
      role: 'clinic_admin'
    });

    // Hash the password for Firestore authentication
    const { passwordHash, salt } = hashPassword(clinicPassword);
    
    // Create tenant document with hashed password
    await firestore.collection('tenants').doc(tenantId).set({
      email: clinicEmail,
      passwordHash: passwordHash,
      salt: salt,
      clinicName: 'Sample Veterinary Clinic',
      subscriptionPlan: '1 month',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      adminUid: userRecord.uid,
      role: 'admin',
      tenantId: tenantId
    });

    // Initialize tenant collections
    const tenantRef = firestore.collection('tenants').doc(tenantId);
    
    // Create sample customer
    await tenantRef.collection('customers').add({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      address: '123 Main St',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Clinic Admin created successfully!');
    console.log('📧 Email:', clinicEmail);
    console.log('🔑 Password:', clinicPassword);
    console.log('🏥 Tenant ID:', tenantId);
    console.log('🆔 UID:', userRecord.uid);
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('⚠️ Clinic admin already exists');
    } else {
      console.error('❌ Error creating clinic admin:', error);
    }
  }
  
  process.exit(0);
}

createClinicAdmin();