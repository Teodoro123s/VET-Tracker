import { collection, getDocs, doc, deleteDoc, query, orderBy, onSnapshot, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface Subscriber {
  id: string;
  email: string;
  clinicName: string;
  subscriptionPlan: string;
  status: string;
  createdAt: any;
  adminUid: string;
}

export async function fetchAllTenants(): Promise<Subscriber[]> {
  try {
    const tenantsRef = collection(db, 'tenants');
    const q = query(tenantsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subscriber[];
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }
}

export function subscribeToTenants(callback: (tenants: Subscriber[]) => void): () => void {
  const tenantsRef = collection(db, 'tenants');
  const q = query(tenantsRef, orderBy('createdAt', 'desc'));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const tenants = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subscriber[];
    
    callback(tenants);
  }, (error) => {
    console.error('Error listening to tenants:', error);
    callback([]);
  });
  
  return unsubscribe;
}

export async function createSubscriber(subscriberData: Partial<Subscriber>): Promise<string | null> {
  try {
    // Create tenant record
    const tenantDocRef = await addDoc(collection(db, 'tenants'), {
      ...subscriberData,
      createdAt: new Date()
    });
    
    // Also create veterinarian record in the tenant's veterinarians collection
    if (subscriberData.role === 'veterinarian' && subscriberData.tenantId) {
      await addDoc(collection(db, `tenants/${subscriberData.tenantId}/veterinarians`), {
        name: subscriberData.clinicName || 'Dr. ' + subscriberData.email?.split('@')[0],
        email: subscriberData.email,
        phone: 'Not provided',
        specialization: 'General Practice',
        license: tenantDocRef.id,
        role: subscriberData.role,
        status: subscriberData.status,
        createdAt: new Date(),
        tenantId: subscriberData.tenantId
      });
    }
    
    return tenantDocRef.id;
  } catch (error) {
    console.error('Error creating subscriber:', error);
    return null;
  }
}

export async function updateSubscriber(subscriberId: string, updateData: Partial<Subscriber>): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'tenants', subscriberId), {
      ...updateData,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error updating subscriber:', error);
    return false;
  }
}

export async function deleteTenant(tenantId: string): Promise<boolean> {
  try {
    // Delete from Firestore Database
    await deleteDoc(doc(db, 'tenants', tenantId));
    
    // Note: Firebase Auth user deletion requires Admin SDK (server-side)
    // For now, only deleting from Firestore
    console.log('Deleted from Firestore. Auth user still exists.');
    
    return true;
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return false;
  }
}