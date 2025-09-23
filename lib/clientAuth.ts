import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

// Create staff user account for clinic
export const createStaffUser = async (email: string, password: string, clinicEmail: string) => {
  try {
    // Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get tenant ID from clinic email
    const tenantId = clinicEmail.split('@')[0];
    
    // Add user to tenants collection with staff role
    await addDoc(collection(db, 'tenants'), {
      uid: user.uid,
      email: email,
      role: 'staff',
      clinicEmail: clinicEmail,
      tenantId: tenantId,
      createdAt: new Date(),
      status: 'active'
    });
    
    return {
      success: true,
      user: user,
      message: 'Staff account created successfully'
    };
  } catch (error) {
    console.error('Error creating staff user:', error);
    throw new Error(`Failed to create staff account: ${error.message}`);
  }
};

// Create clinic user account (for superadmin use)
export const createClinicUser = async (email: string, password: string, tenantId: string) => {
  try {
    // Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Add user to tenants collection with admin role
    await addDoc(collection(db, 'tenants'), {
      uid: user.uid,
      email: email,
      role: 'admin',
      tenantId: tenantId,
      clinicName: tenantId.replace(/[^a-zA-Z0-9]/g, ' '),
      createdAt: new Date(),
      status: 'active'
    });
    
    return {
      success: true,
      user: user,
      message: 'Clinic account created successfully'
    };
  } catch (error) {
    console.error('Error creating clinic user:', error);
    throw new Error(`Failed to create clinic account: ${error.message}`);
  }
};