import { db } from './firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

// Get tenant ID from user email
export const getTenantId = (userEmail: string): string | null => {
  if (userEmail.includes('superadmin')) return null;
  // Extract tenant from email like: clinic1@vet.com -> clinic1
  const match = userEmail.match(/^([^@]+)@/);
  return match ? match[1] : null;
};

// Get tenant-aware collection reference
const getTenantCollection = (tenantId: string | null, collectionName: string) => {
  if (!tenantId) return collection(db, collectionName); // SuperAdmin access
  return collection(db, `tenants/${tenantId}/${collectionName}`);
};

// Tenant-aware CRUD operations
export const getCustomers = async (userEmail: string) => {
  const tenantId = getTenantId(userEmail);
  const querySnapshot = await getDocs(getTenantCollection(tenantId, 'customers'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addCustomer = async (userEmail: string, customerData: any) => {
  const tenantId = getTenantId(userEmail);
  const docRef = await addDoc(getTenantCollection(tenantId, 'customers'), customerData);
  return { id: docRef.id, ...customerData };
};

export const getVeterinarians = async (userEmail: string) => {
  const tenantId = getTenantId(userEmail);
  const querySnapshot = await getDocs(getTenantCollection(tenantId, 'veterinarians'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addVeterinarian = async (userEmail: string, vetData: any) => {
  const tenantId = getTenantId(userEmail);
  const docRef = await addDoc(getTenantCollection(tenantId, 'veterinarians'), vetData);
  return { id: docRef.id, ...vetData };
};

export const getAppointments = async (userEmail: string) => {
  const tenantId = getTenantId(userEmail);
  const querySnapshot = await getDocs(getTenantCollection(tenantId, 'appointments'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addAppointment = async (userEmail: string, appointmentData: any) => {
  const tenantId = getTenantId(userEmail);
  const docRef = await addDoc(getTenantCollection(tenantId, 'appointments'), appointmentData);
  return { id: docRef.id, ...appointmentData };
};

export const getMedicalRecords = async (userEmail: string) => {
  const tenantId = getTenantId(userEmail);
  const querySnapshot = await getDocs(getTenantCollection(tenantId, 'medicalRecords'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Create tenant when new clinic is added
export const createTenant = async (tenantId: string, clinicData: any) => {
  await setDoc(doc(db, 'tenants', tenantId), {
    ...clinicData,
    createdAt: new Date(),
    status: 'active'
  });
  
  // Initialize collections
  const collections = ['customers', 'veterinarians', 'appointments', 'medicalRecords'];
  for (const col of collections) {
    await setDoc(doc(db, `tenants/${tenantId}/${col}`, '_init'), { initialized: true });
  }
};