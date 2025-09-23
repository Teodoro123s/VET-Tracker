import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json';

// Initialize Admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
  });
}

export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();

// Enhanced user creation with custom claims
export async function createTenantUser(email: string, password: string, tenantId: string) {
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: true,
    });

    // Set custom claims for tenant isolation
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      tenantId,
      role: 'clinic_admin'
    });

    return userRecord;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}