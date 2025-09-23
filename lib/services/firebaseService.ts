import { db, auth } from '../config/firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// Get tenant ID from user email
const getTenantId = (userEmail: string): string | null => {
  if (userEmail?.includes('superadmin')) return null;
  const match = userEmail?.match(/^([^@]+)@/);
  return match ? match[1] : null;
};

// Get tenant-aware collection
const getTenantCollection = (userEmail: string | null, collectionName: string) => {
  const tenantId = getTenantId(userEmail || '');
  if (!tenantId) return collection(db, collectionName);
  return collection(db, `tenants/${tenantId}/${collectionName}`);
};

// Get all subscribers (SuperAdmin only)
export const getSubscribers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'subscribers'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return [];
  }
};

// Get all veterinarians (tenant-aware)
export const getVeterinarians = async (userEmail?: string) => {
  try {
    const querySnapshot = await getDocs(getTenantCollection(userEmail || '', 'veterinarians'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching veterinarians:', error);
    return [];
  }
};

// Add a new veterinarian (tenant-aware)
export const addVeterinarian = async (vetData, userEmail?: string) => {
  try {
    const docRef = await addDoc(getTenantCollection(userEmail || '', 'veterinarians'), vetData);
    return { id: docRef.id, ...vetData };
  } catch (error) {
    console.error('Error adding veterinarian:', error);
    throw error;
  }
};

// Update a veterinarian (tenant-aware)
export const updateVeterinarian = async (vetId, updateData, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/veterinarians` : 'veterinarians';
    await updateDoc(doc(db, collectionPath, vetId), updateData);
  } catch (error) {
    console.error('Error updating veterinarian:', error);
    throw error;
  }
};

// Get all customers (tenant-aware)
export const getCustomers = async (userEmail?: string) => {
  try {
    const querySnapshot = await getDocs(getTenantCollection(userEmail || '', 'customers'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};

// Add a new customer (tenant-aware)
export const addCustomer = async (customerData, userEmail?: string) => {
  try {
    const docRef = await addDoc(getTenantCollection(userEmail || '', 'customers'), customerData);
    return { id: docRef.id, ...customerData };
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
};

// Get all pets (tenant-aware)
export const getPets = async (userEmail) => {
  try {
    const querySnapshot = await getDocs(getTenantCollection(userEmail || '', 'pets'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching pets:', error);
    return [];
  }
};

// Add a new pet (tenant-aware)
export const addPet = async (petData, userEmail) => {
  try {
    const docRef = await addDoc(getTenantCollection(userEmail || '', 'pets'), petData);
    return { id: docRef.id, ...petData };
  } catch (error) {
    console.error('Error adding pet:', error);
    throw error;
  }
};

// Get all appointments (tenant-aware)
export const getAppointments = async (userEmail?: string) => {
  try {
    const querySnapshot = await getDocs(getTenantCollection(userEmail || '', 'appointments'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
};

// Add a new appointment (tenant-aware)
export const addAppointment = async (appointmentData, userEmail?: string) => {
  try {
    const docRef = await addDoc(getTenantCollection(userEmail || '', 'appointments'), appointmentData);
    return { id: docRef.id, ...appointmentData };
  } catch (error) {
    console.error('Error adding appointment:', error);
    throw error;
  }
};

// Update an appointment (tenant-aware)
export const updateAppointment = async (appointmentId, updateData, userEmail) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/appointments` : 'appointments';
    await updateDoc(doc(db, collectionPath, appointmentId), updateData);
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

// Get all transactions
export const getTransactions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'transactions'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

// Get all medical forms (tenant-aware)
export const getMedicalForms = async (userEmail?: string) => {
  try {
    const querySnapshot = await getDocs(getTenantCollection(userEmail || '', 'medicalForms'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching medical forms:', error);
    return [];
  }
};

// Get all medical records (tenant-aware)
export const getMedicalRecords = async (userEmail?: string) => {
  try {
    const querySnapshot = await getDocs(getTenantCollection(userEmail || '', 'medicalRecords'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching medical records:', error);
    return [];
  }
};

// Add a new medical record (tenant-aware)
export const addMedicalRecord = async (recordData, userEmail?: string) => {
  try {
    const docRef = await addDoc(getTenantCollection(userEmail || '', 'medicalRecords'), recordData);
    return { id: docRef.id, ...recordData };
  } catch (error) {
    console.error('Error adding medical record:', error);
    throw error;
  }
};

// Create tenant for new clinic
export const createTenant = async (tenantId: string, clinicData: any) => {
  try {
    await addDoc(collection(db, 'tenants'), {
      id: tenantId,
      ...clinicData,
      createdAt: new Date()
    });
    
    // Initialize tenant collections
    const collections = ['customers', 'veterinarians', 'appointments', 'medicalRecords'];
    for (const col of collections) {
      await addDoc(collection(db, `tenants/${tenantId}/${col}`), { _init: true });
    }
  } catch (error) {
    console.error('Error creating tenant:', error);
    throw error;
  }
};

// Delete functions
export const deleteCustomer = async (id) => {
  try {
    await deleteDoc(doc(db, 'customers', id));
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

// Delete customer and all their pets
export const deleteCustomerWithPets = async (customerId) => {
  try {
    // First get all pets for this customer
    const pets = await getPets();
    const customerPets = pets.filter(pet => pet.owner === customerId);
    
    // Delete all pets
    for (const pet of customerPets) {
      await deletePet(pet.id);
    }
    
    // Then delete the customer
    await deleteCustomer(customerId);
  } catch (error) {
    console.error('Error deleting customer with pets:', error);
    throw error;
  }
};

export const deletePet = async (id) => {
  try {
    await deleteDoc(doc(db, 'pets', id));
  } catch (error) {
    console.error('Error deleting pet:', error);
    throw error;
  }
};

export const deleteVeterinarian = async (id, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/veterinarians` : 'veterinarians';
    await deleteDoc(doc(db, collectionPath, id));
  } catch (error) {
    console.error('Error deleting veterinarian:', error);
    throw error;
  }
};

export const deleteAppointment = async (id, userEmail) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/appointments` : 'appointments';
    await deleteDoc(doc(db, collectionPath, id));
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};

export const deleteMedicalRecord = async (id) => {
  try {
    await deleteDoc(doc(db, 'medicalRecords', id));
  } catch (error) {
    console.error('Error deleting medical record:', error);
    throw error;
  }
};

export const deleteMedicalCategory = async (id, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/medicalCategories` : 'medicalCategories';
    await deleteDoc(doc(db, collectionPath, id));
  } catch (error) {
    console.error('Error deleting medical category:', error);
    throw error;
  }
};

export const deleteMedicalForm = async (id, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/medicalForms` : 'medicalForms';
    await deleteDoc(doc(db, collectionPath, id));
  } catch (error) {
    console.error('Error deleting medical form:', error);
    throw error;
  }
};

// Get all medical categories (tenant-aware)
export const getMedicalCategories = async (userEmail?: string) => {
  try {
    const querySnapshot = await getDocs(getTenantCollection(userEmail || '', 'medicalCategories'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching medical categories:', error);
    return [];
  }
};

// Add a new medical form (tenant-aware)
export const addMedicalForm = async (formData, userEmail?: string) => {
  try {
    const docRef = await addDoc(getTenantCollection(userEmail || '', 'medicalForms'), formData);
    return { id: docRef.id, ...formData };
  } catch (error) {
    console.error('Error adding medical form:', error);
    throw error;
  }
};

// Add a new medical category (tenant-aware)
export const addMedicalCategory = async (categoryData, userEmail?: string) => {
  try {
    const docRef = await addDoc(getTenantCollection(userEmail || '', 'medicalCategories'), categoryData);
    return { id: docRef.id, ...categoryData };
  } catch (error) {
    console.error('Error adding medical category:', error);
    throw error;
  }
};

// Get form fields for a specific form (tenant-aware)
export const getFormFields = async (formName, userEmail) => {
  try {
    const querySnapshot = await getDocs(getTenantCollection(userEmail || '', 'formFields'));
    const fields = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(field => field.formName === formName);
    return fields;
  } catch (error) {
    console.error('Error fetching form fields:', error);
    return [];
  }
};

// Add a new form field (tenant-aware)
export const addFormField = async (fieldData, userEmail?: string) => {
  try {
    const docRef = await addDoc(getTenantCollection(userEmail || '', 'formFields'), fieldData);
    return { id: docRef.id, ...fieldData };
  } catch (error) {
    console.error('Error adding form field:', error);
    throw error;
  }
};

// Update medical form with field count (tenant-aware)
export const updateMedicalForm = async (formId, updateData, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/medicalForms` : 'medicalForms';
    await updateDoc(doc(db, collectionPath, formId), updateData);
  } catch (error) {
    console.error('Error updating medical form:', error);
    throw error;
  }
};

// Delete a form field (tenant-aware)
export const deleteFormField = async (fieldId, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/formFields` : 'formFields';
    await deleteDoc(doc(db, collectionPath, fieldId));
  } catch (error) {
    console.error('Error deleting form field:', error);
    throw error;
  }
};

// Update a form field (tenant-aware)
export const updateFormField = async (fieldId, fieldData, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/formFields` : 'formFields';
    await updateDoc(doc(db, collectionPath, fieldId), fieldData);
  } catch (error) {
    console.error('Error updating form field:', error);
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

// Check if user is SuperAdmin
export const isSuperAdmin = (userEmail?: string) => {
  return userEmail?.includes('superadmin') || false;
};

// Check if user is Staff
export const isStaff = (userEmail?: string) => {
  return userEmail?.includes('staff') || false;
};

// Check if user is Admin (clinic admin)
export const isAdmin = (userEmail?: string) => {
  return !isSuperAdmin(userEmail) && !isStaff(userEmail);
};

// Get user role
export const getUserRole = (userEmail?: string) => {
  if (isSuperAdmin(userEmail)) return 'superadmin';
  if (isStaff(userEmail)) return 'staff';
  return 'admin';
};

// Staff management functions
export const getStaff = async (userEmail?: string) => {
  try {
    const querySnapshot = await getDocs(getTenantCollection(userEmail || '', 'staff'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching staff:', error);
    return [];
  }
};

export const addStaff = async (staffData, userEmail?: string) => {
  try {
    const docRef = await addDoc(getTenantCollection(userEmail || '', 'staff'), staffData);
    return { id: docRef.id, ...staffData };
  } catch (error) {
    console.error('Error adding staff:', error);
    throw error;
  }
};

export const updateStaff = async (staffId, updateData, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/staff` : 'staff';
    await updateDoc(doc(db, collectionPath, staffId), updateData);
  } catch (error) {
    console.error('Error updating staff:', error);
    throw error;
  }
};

export const deleteStaff = async (staffId, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/staff` : 'staff';
    await deleteDoc(doc(db, collectionPath, staffId));
  } catch (error) {
    console.error('Error deleting staff:', error);
    throw error;
  }
};

// Animal type functions
export const getAnimalTypes = async (userEmail?: string) => {
  try {
    const querySnapshot = await getDocs(getTenantCollection(userEmail || '', 'animalTypes'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching animal types:', error);
    return [];
  }
};

export const addAnimalType = async (animalTypeData, userEmail?: string) => {
  try {
    const docRef = await addDoc(getTenantCollection(userEmail || '', 'animalTypes'), animalTypeData);
    return { id: docRef.id, ...animalTypeData };
  } catch (error) {
    console.error('Error adding animal type:', error);
    throw error;
  }
};

export const updateAnimalType = async (animalTypeId, updateData, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/animalTypes` : 'animalTypes';
    await updateDoc(doc(db, collectionPath, animalTypeId), updateData);
  } catch (error) {
    console.error('Error updating animal type:', error);
    throw error;
  }
};