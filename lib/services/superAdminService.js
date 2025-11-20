import { collection, getDocs, doc, deleteDoc, query, orderBy, onSnapshot, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
export async function fetchAllTenants()  {
  try {
    const tenantsRef = collection(db, 'tenants');
    const q = query(tenantsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }
}

export function subscribeToTenants(callback) {
  const tenantsRef = collection(db, 'tenants');
  const q = query(tenantsRef, orderBy('createdAt', 'desc'));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const tenants = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))[];
    
    callback(tenants);
  }, (error) => {
    console.error('Error listening to tenants:', error);
    callback([]);
  });
  
  return unsubscribe;
}

export async function createSubscriber(subscriberData)  {
  try {
    // Create tenant record
    const tenantDocRef = await addDoc(collection(db, 'tenants'), {
      ...subscriberData,
      createdAt Date()
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
        createdAt Date(),
        tenantId: subscriberData.tenantId
      });
    }
    
    return tenantDocRef.id;
  } catch (error) {
    console.error('Error creating subscriber:', error);
    return null;
  }
}

export async function updateSubscriber(subscriberId, updateData)  {
  try {
    await updateDoc(doc(db, 'tenants', subscriberId), {
      ...updateData,
      updatedAt Date()
    });
    return true;
  } catch (error) {
    console.error('Error updating subscriber:', error);
    return false;
  }
}

export async function deleteTenant(tenantId)  {
  try {
    // Delete from Firestore Database
    await deleteDoc(doc(db, 'tenants', tenantId));
    
    // Note Auth user deletion requires Admin SDK (server-side)
    // For now, only deleting from Firestore
    console.log('Deleted from Firestore. Auth user still exists.');
    
    return true;
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return false;
  }
}