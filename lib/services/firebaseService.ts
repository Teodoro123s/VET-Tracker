import { db, auth } from '../config/firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
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
    const tenantId = getTenantId(userEmail || '');
    if (!tenantId) {
      console.log('No tenant ID found for:', userEmail);
      return [];
    }
    
    const customersRef = collection(db, 'tenants', tenantId, 'customers');
    const querySnapshot = await getDocs(customersRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};

// Get customer by ID (tenant-aware)
export const getCustomerById = async (userEmail?: string, customerId?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    if (!tenantId || !customerId) {
      return null;
    }
    
    const docRef = doc(db, 'tenants', tenantId, 'customers', customerId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    return null;
  }
};

// Add a new customer (tenant-aware)
export const addCustomer = async (customerData, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    if (!tenantId) {
      throw new Error('No tenant ID found');
    }
    
    const customersRef = collection(db, 'tenants', tenantId, 'customers');
    const docRef = await addDoc(customersRef, customerData);
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
export const addAppointment = async (userEmail?: string, appointmentData?: any) => {
  try {
    const docRef = await addDoc(getTenantCollection(userEmail || '', 'appointments'), appointmentData);
    return { id: docRef.id, ...appointmentData };
  } catch (error) {
    console.error('Error adding appointment:', error);
    throw error;
  }
};

// Update an appointment (tenant-aware)
export const updateAppointment = async (userEmail, appointmentId, updateData) => {
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

// Get medical form by ID (tenant-aware)
export const getMedicalFormById = async (userEmail?: string, formId?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    if (!tenantId || !formId) {
      return null;
    }
    
    const docRef = doc(db, 'tenants', tenantId, 'medicalForms', formId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching medical form by ID:', error);
    return null;
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

// Get pet by ID (tenant-aware)
export const getPetById = async (userEmail?: string, petId?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    if (!tenantId || !petId) {
      return null;
    }
    
    const docRef = doc(db, 'tenants', tenantId, 'pets', petId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching pet by ID:', error);
    return null;
  }
};

// Update a pet (tenant-aware)
export const updatePet = async (petId, updateData, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/pets` : 'pets';
    await updateDoc(doc(db, collectionPath, petId), updateData);
  } catch (error) {
    console.error('Error updating pet:', error);
    throw error;
  }
};

// Get medical history for a specific pet (tenant-aware)
export const getMedicalHistory = async (userEmail?: string, petId?: string) => {
  try {
    const querySnapshot = await getDocs(getTenantCollection(userEmail || '', 'medicalRecords'));
    const allRecords = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return allRecords.filter(record => record.petId === petId);
  } catch (error) {
    console.error('Error fetching medical history:', error);
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
export const deleteCustomer = async (id, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/customers` : 'customers';
    await deleteDoc(doc(db, collectionPath, id));
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

// Update a customer (tenant-aware)
export const updateCustomer = async (customerId, updateData, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/customers` : 'customers';
    await updateDoc(doc(db, collectionPath, customerId), updateData);
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

// Delete customer and all their pets
export const deleteCustomerWithPets = async (customerId, userEmail?: string) => {
  try {
    // First get all pets for this customer
    const pets = await getPets(userEmail);
    const customerPets = pets.filter(pet => pet.owner === customerId);
    
    // Delete all pets
    for (const pet of customerPets) {
      await deletePet(pet.id, userEmail);
    }
    
    // Then delete the customer
    await deleteCustomer(customerId, userEmail);
  } catch (error) {
    console.error('Error deleting customer with pets:', error);
    throw error;
  }
};

export const deletePet = async (id, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/pets` : 'pets';
    await deleteDoc(doc(db, collectionPath, id));
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

export const deleteAppointment = async (userEmail, id) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/appointments` : 'appointments';
    await deleteDoc(doc(db, collectionPath, id));
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};

export const deleteMedicalRecord = async (id, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/medicalRecords` : 'medicalRecords';
    await deleteDoc(doc(db, collectionPath, id));
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

// Breed functions
export const getBreeds = async (userEmail?: string) => {
  try {
    const querySnapshot = await getDocs(getTenantCollection(userEmail || '', 'breeds'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching breeds:', error);
    return [];
  }
};

export const addBreed = async (breedData, userEmail?: string) => {
  try {
    const docRef = await addDoc(getTenantCollection(userEmail || '', 'breeds'), breedData);
    return { id: docRef.id, ...breedData };
  } catch (error) {
    console.error('Error adding breed:', error);
    throw error;
  }
};

export const deleteAnimalType = async (animalTypeId, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/animalTypes` : 'animalTypes';
    await deleteDoc(doc(db, collectionPath, animalTypeId));
  } catch (error) {
    console.error('Error deleting animal type:', error);
    throw error;
  }
};

export const deleteBreed = async (breedId, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/breeds` : 'breeds';
    await deleteDoc(doc(db, collectionPath, breedId));
  } catch (error) {
    console.error('Error deleting breed:', error);
    throw error;
  }
};

// Password Management Functions
const generateSecurePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const generateResetToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const hashPassword = async (password: string) => {
  // Simple hash for demo - use proper hashing in production
  return btoa(password);
};

const verifyPassword = async (password: string, hashedPassword: string) => {
  return btoa(password) === hashedPassword;
};

const sendPasswordEmail = async (email: string, newPassword: string) => {
  // Email service integration - placeholder for now
  console.log(`Sending password to ${email}: ${newPassword}`);
  // In production, integrate with email service like SendGrid, AWS SES, etc.
};

export const generatePassword = async (targetEmail: string, initiatorEmail: string, initiatorType: string) => {
  const newPassword = generateSecurePassword();
  const hashedPassword = await hashPassword(newPassword);
  
  if (initiatorType === 'veterinarian' && targetEmail !== initiatorEmail) {
    throw new Error('Veterinarians can only generate their own password');
  }
  
  const tenantId = getTenantId(initiatorEmail || '');
  const collectionPath = tenantId ? `tenants/${tenantId}/userCredentials` : 'userCredentials';
  
  await addDoc(collection(db, collectionPath), {
    email: targetEmail,
    pendingPassword: hashedPassword,
    pendingPasswordCreatedAt: new Date().toISOString(),
    pendingPasswordExpiresAt: new Date(Date.now() + 24*60*60*1000).toISOString(),
    passwordResetToken: generateResetToken(),
    initiatedBy: initiatorEmail,
    initiatorType: initiatorType
  });
  
  await sendPasswordEmail(targetEmail, newPassword);
  
  return { success: true, message: 'New password sent to email' };
};

export const generateOwnPassword = async (vetEmail: string) => {
  return await generatePassword(vetEmail, vetEmail, 'veterinarian');
};

export const requestPasswordReset = async (email: string, userType: string) => {
  const newPassword = generateSecurePassword();
  const hashedPassword = await hashPassword(newPassword);
  const resetToken = generateResetToken();
  
  const tenantId = getTenantId(email || '');
  const collectionPath = tenantId ? `tenants/${tenantId}/userCredentials` : 'userCredentials';
  
  await addDoc(collection(db, collectionPath), {
    email: email,
    pendingPassword: hashedPassword,
    pendingPasswordCreatedAt: new Date().toISOString(),
    pendingPasswordExpiresAt: new Date(Date.now() + 24*60*60*1000).toISOString(),
    passwordResetToken: resetToken,
    initiatedBy: email,
    initiatorType: 'self_reset'
  });
  
  await sendPasswordEmail(email, newPassword);
  
  return { success: true, message: 'Password reset email sent' };
};

export const loginWithCredentialOverlap = async (email: string, password: string) => {
  try {
    const tenantId = getTenantId(email || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/userCredentials` : 'userCredentials';
    const querySnapshot = await getDocs(collection(db, collectionPath));
    
    const userCreds = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(cred => cred.email === email)
      .sort((a, b) => new Date(b.pendingPasswordCreatedAt || 0).getTime() - new Date(a.pendingPasswordCreatedAt || 0).getTime());
    
    if (userCreds.length === 0) {
      return { success: false, error: 'User not found' };
    }
    
    const latestCred = userCreds[0];
    
    // Check current password first
    if (latestCred.currentPassword && await verifyPassword(password, latestCred.currentPassword)) {
      return { success: true, user: { email: latestCred.email } };
    }
    
    // Check pending password if exists and not expired
    if (latestCred.pendingPassword && new Date() < new Date(latestCred.pendingPasswordExpiresAt)) {
      if (await verifyPassword(password, latestCred.pendingPassword)) {
        // Activate pending password
        await updateDoc(doc(db, collectionPath, latestCred.id), {
          currentPassword: latestCred.pendingPassword,
          pendingPassword: null,
          pendingPasswordCreatedAt: null,
          pendingPasswordExpiresAt: null,
          passwordResetToken: null
        });
        return { success: true, user: { email: latestCred.email }, passwordActivated: true };
      }
    }
    
    return { success: false, error: 'Invalid credentials' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
};

// Reason options functions
export const getReasonOptions = async (userEmail?: string) => {
  try {
    const querySnapshot = await getDocs(getTenantCollection(userEmail || '', 'reasonOptions'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching reason options:', error);
    return [];
  }
};

export const addReasonOption = async (reasonData, userEmail?: string) => {
  try {
    const docRef = await addDoc(getTenantCollection(userEmail || '', 'reasonOptions'), reasonData);
    return { id: docRef.id, ...reasonData };
  } catch (error) {
    console.error('Error adding reason option:', error);
    throw error;
  }
};

export const updateReasonOption = async (reasonId, updateData, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/reasonOptions` : 'reasonOptions';
    await updateDoc(doc(db, collectionPath, reasonId), updateData);
  } catch (error) {
    console.error('Error updating reason option:', error);
    throw error;
  }
};

export const deleteReasonOption = async (reasonId, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/reasonOptions` : 'reasonOptions';
    await deleteDoc(doc(db, collectionPath, reasonId));
  } catch (error) {
    console.error('Error deleting reason option:', error);
    throw error;
  }
};