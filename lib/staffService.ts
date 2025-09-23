import { db } from './firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

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

// Staff permissions for receptionist role
export const RECEPTIONIST_PERMISSIONS = {
  appointments: { create: true, read: true, update: true, delete: false },
  customers: { create: true, read: true, update: true, delete: false },
  pets: { create: true, read: true, update: true, delete: false },
  veterinarians: { create: false, read: true, update: false, delete: false },
  medicalRecords: { create: false, read: true, update: false, delete: false },
  staff: { create: false, read: false, update: false, delete: false },
  settings: { create: false, read: false, update: false, delete: false }
};

// Check if user has permission for specific action
export const hasPermission = (staffData: any, module: string, action: string): boolean => {
  if (!staffData?.permissions) return false;
  return staffData.permissions[module]?.[action] || false;
};

// Get staff member by email
export const getStaffByEmail = async (email: string, userEmail?: string) => {
  try {
    const staffCollection = getTenantCollection(userEmail || '', 'staff');
    const q = query(staffCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error fetching staff by email:', error);
    return null;
  }
};

// Check if user is staff member
export const isStaffMember = async (email: string, userEmail?: string): Promise<boolean> => {
  const staff = await getStaffByEmail(email, userEmail);
  return staff !== null;
};

// Get staff dashboard data
export const getStaffDashboardData = async (staffEmail: string, userEmail?: string) => {
  try {
    const staff = await getStaffByEmail(staffEmail, userEmail);
    if (!staff) throw new Error('Staff member not found');

    // Get today's appointments if staff has permission
    let todayAppointments = [];
    if (hasPermission(staff, 'appointments', 'read')) {
      const appointmentsCollection = getTenantCollection(userEmail || '', 'appointments');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const appointmentsSnapshot = await getDocs(appointmentsCollection);
      todayAppointments = appointmentsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= today && aptDate < tomorrow;
        });
    }

    // Get customer count if staff has permission
    let customerCount = 0;
    if (hasPermission(staff, 'customers', 'read')) {
      const customersCollection = getTenantCollection(userEmail || '', 'customers');
      const customersSnapshot = await getDocs(customersCollection);
      customerCount = customersSnapshot.size;
    }

    return {
      staff,
      todayAppointments,
      customerCount,
      permissions: staff.permissions
    };
  } catch (error) {
    console.error('Error fetching staff dashboard data:', error);
    throw error;
  }
};

// Update staff permissions
export const updateStaffPermissions = async (staffId: string, permissions: any, userEmail?: string) => {
  try {
    const tenantId = getTenantId(userEmail || '');
    const collectionPath = tenantId ? `tenants/${tenantId}/staff` : 'staff';
    await updateDoc(doc(db, collectionPath, staffId), { permissions });
  } catch (error) {
    console.error('Error updating staff permissions:', error);
    throw error;
  }
};

// Log staff activity
export const logStaffActivity = async (staffEmail: string, action: string, details: any, userEmail?: string) => {
  try {
    const activityData = {
      staffEmail,
      action,
      details,
      timestamp: new Date(),
      tenantId: getTenantId(userEmail || '')
    };
    
    const activitiesCollection = getTenantCollection(userEmail || '', 'staffActivities');
    await addDoc(activitiesCollection, activityData);
  } catch (error) {
    console.error('Error logging staff activity:', error);
  }
};

// Get staff activities
export const getStaffActivities = async (staffEmail?: string, userEmail?: string) => {
  try {
    const activitiesCollection = getTenantCollection(userEmail || '', 'staffActivities');
    let q = activitiesCollection;
    
    if (staffEmail) {
      q = query(activitiesCollection, where('staffEmail', '==', staffEmail));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
  } catch (error) {
    console.error('Error fetching staff activities:', error);
    return [];
  }
};