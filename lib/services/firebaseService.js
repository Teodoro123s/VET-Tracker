import { db, auth } from '../config/firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// Get tenant ID from user email by looking up in tenants collection
const getTenantId = async (userEmail) => {
  console.log('=== GET TENANT ID ===');
  console.log('Input userEmail:', userEmail);
  
  if (userEmail?.includes('superadmin')) {
    console.log('Superadmin detected, returning null');
    return null;
  }
  
  if (!userEmail) {
    console.log('No userEmail provided');
    return null;
  }
  
  try {
    // First check if user is directly a tenant
    const q = query(collection(db, 'tenants'), where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      const tenantId = userData.tenantId || userData.id || userEmail.split('@')[0];
      console.log('Found tenant ID from direct lookup:', tenantId);
      return tenantId;
    }
    
    // For admin users, always return email prefix as tenant ID
    const emailPrefix = userEmail.split('@')[0];
    console.log('Using email prefix as tenant ID:', emailPrefix);
    return emailPrefix;
  } catch (error) {
    console.error('Error getting tenant ID:', error);
    // Fallback to email prefix
    return userEmail.split('@')[0];
  }
};

// Get tenant-aware collection
const getTenantCollection = async (userEmail, collectionName) => {
  if (!userEmail) {
    throw new Error('User email is required for tenant operations');
  }
  
  const tenantId = await getTenantId(userEmail);
  if (!tenantId) {
    throw new Error('No tenant ID found for user');
  }
  
  return collection(db, `tenants/${tenantId}/${collectionName}`);
};

// Get all customers (tenant-aware)
export const getCustomers = async (userEmail) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail || '', 'customers');
    const querySnapshot = await getDocs(tenantCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};

// Add a new customer (tenant-aware)
export const addCustomer = async (customerData, userEmail) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail || '', 'customers');
    const docRef = await addDoc(tenantCollection, customerData);
    return { id: docRef.id, ...customerData };
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
};

// Update a customer (tenant-aware)
export const updateCustomer = async (customerId, updateData, userEmail) => {
  try {
    const tenantId = await getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/customers` : 'customers';
    await updateDoc(doc(db, collectionPath, customerId), updateData);
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

// Delete customer
export const deleteCustomer = async (id, userEmail) => {
  try {
    const tenantId = await getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/customers` : 'customers';
    await deleteDoc(doc(db, collectionPath, id));
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

// Get all veterinarians (tenant-aware)
export const getVeterinarians = async (userEmail) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail || '', 'veterinarians');
    const querySnapshot = await getDocs(tenantCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching veterinarians:', error);
    return [];
  }
};

// Add a new veterinarian (tenant-aware)
export const addVeterinarian = async (vetData, userEmail) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail || '', 'veterinarians');
    const docRef = await addDoc(tenantCollection, vetData);
    return { id: docRef.id, ...vetData };
  } catch (error) {
    console.error('Error adding veterinarian:', error);
    throw error;
  }
};

// Get all appointments (tenant-aware)
export const getAppointments = async (userEmail) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail || '', 'appointments');
    const querySnapshot = await getDocs(tenantCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
};

// Get appointments for specific veterinarian
export const getVeterinarianAppointments = async (userEmail, vetEmail) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail || '', 'appointments');
    const querySnapshot = await getDocs(tenantCollection);
    const allAppointments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter appointments for the specific veterinarian
    const vetAppointments = allAppointments.filter(appointment => 
      appointment.veterinarianEmail === vetEmail || 
      appointment.assignedVet === vetEmail ||
      appointment.vetEmail === vetEmail
    );
    
    console.log('All appointments:', allAppointments.length);
    console.log('Vet appointments for', vetEmail, ':', vetAppointments.length);
    
    return vetAppointments;
  } catch (error) {
    console.error('Error fetching veterinarian appointments:', error);
    return [];
  }
};

// Authentication functions
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Check if user is superadmin
export const isSuperAdmin = (userEmail) => {
  return userEmail?.includes('superadmin') || false;
};

// Check if user is staff
export const isStaff = (userEmail) => {
  return userEmail?.includes('staff') || false;
};

// Check if user is admin (clinic admin)
export const isAdmin = (userEmail) => {
  return !isSuperAdmin(userEmail) && !isStaff(userEmail);
};

// Get user role
export const getUserRole = (userEmail) => {
  if (isSuperAdmin(userEmail)) return 'superadmin';
  if (isStaff(userEmail)) return 'staff';
  return 'admin';
};