import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const getVeterinarians = async () => {
  try {
    // Fetch from tenant-based path
    const tenantEmail = 'edanel.teodoro@gmail.com'; // Use logged in user's tenant
    const vetsCollection = collection(db, 'tenants', tenantEmail, 'veterinarians');
    const snapshot = await getDocs(vetsCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching veterinarians:', error);
    return [];
  }
};

export const getVeterinarianByEmail = async (email: string) => {
  try {
    // First get all tenants
    const tenantsCollection = collection(db, 'tenants');
    const tenantsSnapshot = await getDocs(tenantsCollection);
    
    // Search through each tenant's veterinarians
    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      const vetsCollection = collection(db, 'tenants', tenantId, 'veterinarians');
      const q = query(vetsCollection, where('email', '==', email));
      const vetsSnapshot = await getDocs(q);
      
      if (!vetsSnapshot.empty) {
        const vetDoc = vetsSnapshot.docs[0];
        return {
          id: vetDoc.id,
          tenantId: tenantId,
          ...vetDoc.data()
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching veterinarian by email:', error);
    return null;
  }
};