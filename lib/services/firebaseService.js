import { db, auth } from '../config/firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// Helper function to get admin email for veterinarians/staff
const getAdminEmailForUser = async (userEmail) => {
  try {
    // Check if user is veterinarian/staff by looking up in tenants collection
    const userQuery = query(collection(db, 'tenants'), where('email', '==', userEmail));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      
      // If user is veterinarian/staff, find their admin
      if (userData.role === 'veterinarian' || userData.role === 'staff') {
        const tenantId = userData.tenantId;
        
        // Find admin with this tenant ID
        const adminQuery = query(collection(db, 'tenants'), 
          where('tenantId', '==', tenantId),
          where('role', '==', 'admin')
        );
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          return adminSnapshot.docs[0].data().email;
        }
      }
    }
    
    // If not vet/staff or no admin found, return original email
    return userEmail;
  } catch (error) {
    console.error('Error getting admin email:', error);
    return userEmail;
  }
};

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

// Get veterinarian by email (tenant-aware)
export const getVeterinarianByEmail = async (userEmail, vetEmail) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail || '', 'veterinarians');
    const querySnapshot = await getDocs(tenantCollection);
    const veterinarians = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return veterinarians.find(vet => vet.email === vetEmail);
  } catch (error) {
    console.error('Error fetching veterinarian by email:', error);
    return null;
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

// Update veterinarian (tenant-aware)
export const updateVeterinarian = async (vetId, updateData, userEmail) => {
  try {
    const tenantId = await getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/veterinarians` : 'veterinarians';
    await updateDoc(doc(db, collectionPath, vetId), updateData);
  } catch (error) {
    console.error('Error updating veterinarian:', error);
    throw error;
  }
};

// Delete veterinarian (tenant-aware)
export const deleteVeterinarian = async (vetId, userEmail) => {
  try {
    const tenantId = await getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/veterinarians` : 'veterinarians';
    await deleteDoc(doc(db, collectionPath, vetId));
  } catch (error) {
    console.error('Error deleting veterinarian:', error);
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
    
    // Filter appointments for the specific veterinarian - check all possible field names
    const vetAppointments = allAppointments.filter(appointment => 
      appointment.veterinarian === vetEmail || 
      appointment.veterinarianEmail === vetEmail ||
      appointment.assignedVet === vetEmail ||
      appointment.vetEmail === vetEmail ||
      appointment.staff === vetEmail ||
      appointment.assignedTo === vetEmail ||
      appointment.doctorEmail === vetEmail
    );
    
    console.log('=== VETERINARIAN APPOINTMENTS ===');
    console.log('Total appointments in system:', allAppointments.length);
    console.log('Veterinarian email:', vetEmail);
    console.log('Filtered appointments for vet:', vetAppointments.length);
    if (vetAppointments.length > 0) {
      console.log('Sample appointment fields:', Object.keys(vetAppointments[0]));
    }
    
    return vetAppointments;
  } catch (error) {
    console.error('Error fetching veterinarian appointments:', error);
    return [];
  }
};

// Add appointment (tenant-aware)
export const addAppointment = async (appointmentData, userEmail) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail || '', 'appointments');
    const docRef = await addDoc(tenantCollection, appointmentData);
    return { id: docRef.id, ...appointmentData };
  } catch (error) {
    console.error('Error adding appointment:', error);
    throw error;
  }
};

// Update appointment (tenant-aware)
export const updateAppointment = async (userEmail, appointmentId, updateData) => {
  try {
    const tenantId = await getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/appointments` : 'appointments';
    await updateDoc(doc(db, collectionPath, appointmentId), updateData);
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

// Delete appointment (tenant-aware)
export const deleteAppointment = async (userEmail, appointmentId) => {
  try {
    const tenantId = await getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/appointments` : 'appointments';
    await deleteDoc(doc(db, collectionPath, appointmentId));
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
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

// Medical Records Functions
export const getMedicalRecords = async (userEmail) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail || '', 'medicalRecords');
    const querySnapshot = await getDocs(tenantCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching medical records:', error);
    return [];
  }
};

export const addMedicalRecord = async (recordData, userEmail) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail || '', 'medicalRecords');
    const docRef = await addDoc(tenantCollection, recordData);
    return { id: docRef.id, ...recordData };
  } catch (error) {
    console.error('Error adding medical record:', error);
    throw error;
  }
};

export const getMedicalRecordById = async (userEmail, recordId) => {
  try {
    const tenantId = await getTenantId(userEmail || '');
    const docPath = tenantId ? `tenants/${tenantId}/medicalRecords/${recordId}` : `medicalRecords/${recordId}`;
    const docSnap = await getDoc(doc(db, docPath));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching medical record:', error);
    return null;
  }
};

export const deleteMedicalRecord = async (recordId, userEmail) => {
  try {
    const tenantId = await getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/medicalRecords` : 'medicalRecords';
    await deleteDoc(doc(db, collectionPath, recordId));
  } catch (error) {
    console.error('Error deleting medical record:', error);
    throw error;
  }
};

// Form Functions
export const getMedicalForms = async (userEmail) => {
  try {
    // Get admin email for veterinarians/staff
    const adminEmail = await getAdminEmailForUser(userEmail);
    const tenantCollection = await getTenantCollection(adminEmail, 'medicalForms');
    const querySnapshot = await getDocs(tenantCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching medical forms:', error);
    return [];
  }
};

export const getMedicalCategories = async (userEmail) => {
  try {
    // Get admin email for veterinarians/staff
    const adminEmail = await getAdminEmailForUser(userEmail);
    const tenantCollection = await getTenantCollection(adminEmail, 'medicalCategories');
    const querySnapshot = await getDocs(tenantCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching medical categories:', error);
    return [];
  }
};

export const getFormFields = async (formTemplate, userEmail) => {
  try {
    console.log('=== GET FORM FIELDS ===');
    console.log('Form template:', formTemplate);
    console.log('User email:', userEmail);
    
    // Get admin email for veterinarians/staff
    const adminEmail = await getAdminEmailForUser(userEmail);
    console.log('Using admin email:', adminEmail);
    
    const tenantCollection = await getTenantCollection(adminEmail, 'formFields');
    const querySnapshot = await getDocs(tenantCollection);
    const allFields = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const filteredFields = allFields.filter(field => field.formTemplate === formTemplate);
    
    console.log('Total fields found:', allFields.length);
    console.log('Filtered fields for template:', filteredFields.length);
    
    return filteredFields;
  } catch (error) {
    console.error('Error fetching form fields:', error);
    return [];
  }
};

// Pets Functions
export const getPets = async (userEmail) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail || '', 'pets');
    const querySnapshot = await getDocs(tenantCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching pets:', error);
    return [];
  }
};