import { db } from '../config/firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

// Get tenant ID from user email
const getTenantId = async (userEmail: string): Promise<string | null> => {
  if (userEmail?.includes('superadmin')) {
    return null;
  }
  
  try {
    const q = query(collection(db, 'tenants'), where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      return userData.tenantId || userData.id || null;
    }
    
    const allTenants = await getDocs(collection(db, 'tenants'));
    for (const tenantDoc of allTenants.docs) {
      const tenantData = tenantDoc.data();
      if (tenantData.createdBy === userEmail || tenantData.email === userEmail) {
        return tenantData.tenantId || tenantData.id || null;
      }
    }
    
    return userEmail.split('@')[0];
  } catch (error) {
    console.error('Error getting tenant ID:', error);
    return null;
  }
};

// Get tenant-aware collection
const getTenantCollection = async (userEmail: string, collectionName: string) => {
  if (!userEmail) {
    throw new Error('User email is required for tenant operations');
  }
  
  const tenantId = await getTenantId(userEmail);
  if (!tenantId) {
    throw new Error('No tenant ID found for user');
  }
  
  return collection(db, `tenants/${tenantId}/${collectionName}`);
};

// Species (Animal Types) Functions
export const getSpecies = async (userEmail: string) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail, 'animalTypes');
    const querySnapshot = await getDocs(tenantCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching species:', error);
    return [];
  }
};

export const addSpecies = async (speciesData: any, userEmail: string) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail, 'animalTypes');
    const docRef = await addDoc(tenantCollection, {
      name: speciesData.name,
      createdAt: new Date().toISOString(),
      createdBy: userEmail
    });
    return { id: docRef.id, name: speciesData.name };
  } catch (error) {
    console.error('Error adding species:', error);
    throw error;
  }
};

export const updateSpecies = async (speciesId: string, updateData: any, userEmail: string) => {
  try {
    const tenantId = await getTenantId(userEmail);
    const collectionPath = tenantId ? `tenants/${tenantId}/animalTypes` : 'animalTypes';
    await updateDoc(doc(db, collectionPath, speciesId), {
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail
    });
  } catch (error) {
    console.error('Error updating species:', error);
    throw error;
  }
};

export const deleteSpecies = async (speciesId: string, userEmail: string) => {
  try {
    const tenantId = await getTenantId(userEmail);
    const collectionPath = tenantId ? `tenants/${tenantId}/animalTypes` : 'animalTypes';
    await deleteDoc(doc(db, collectionPath, speciesId));
  } catch (error) {
    console.error('Error deleting species:', error);
    throw error;
  }
};

// Breeds Functions
export const getBreeds = async (userEmail: string) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail, 'breeds');
    const querySnapshot = await getDocs(tenantCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching breeds:', error);
    return [];
  }
};

export const getBreedsBySpecies = async (userEmail: string, speciesId: string) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail, 'breeds');
    const q = query(tenantCollection, where('speciesId', '==', speciesId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching breeds by species:', error);
    return [];
  }
};

export const addBreed = async (breedData: any, userEmail: string) => {
  try {
    const tenantCollection = await getTenantCollection(userEmail, 'breeds');
    const docRef = await addDoc(tenantCollection, {
      name: breedData.name,
      speciesId: breedData.speciesId,
      createdAt: new Date().toISOString(),
      createdBy: userEmail
    });
    return { id: docRef.id, name: breedData.name, speciesId: breedData.speciesId };
  } catch (error) {
    console.error('Error adding breed:', error);
    throw error;
  }
};

export const updateBreed = async (breedId: string, updateData: any, userEmail: string) => {
  try {
    const tenantId = await getTenantId(userEmail);
    const collectionPath = tenantId ? `tenants/${tenantId}/breeds` : 'breeds';
    await updateDoc(doc(db, collectionPath, breedId), {
      ...updateData,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail
    });
  } catch (error) {
    console.error('Error updating breed:', error);
    throw error;
  }
};

export const deleteBreed = async (breedId: string, userEmail: string) => {
  try {
    const tenantId = await getTenantId(userEmail);
    const collectionPath = tenantId ? `tenants/${tenantId}/breeds` : 'breeds';
    await deleteDoc(doc(db, collectionPath, breedId));
  } catch (error) {
    console.error('Error deleting breed:', error);
    throw error;
  }
};

// Utility function to get species and breeds for dropdowns
export const getSpeciesWithBreeds = async (userEmail: string) => {
  try {
    const [speciesData, breedsData] = await Promise.all([
      getSpecies(userEmail),
      getBreeds(userEmail)
    ]);

    const speciesWithBreeds = speciesData.map(species => ({
      ...species,
      breeds: breedsData.filter(breed => breed.speciesId === species.id)
    }));

    return speciesWithBreeds;
  } catch (error) {
    console.error('Error fetching species with breeds:', error);
    return [];
  }
};

// Check if user can manage species/breeds (admin or veterinarian)
export const canManageSpeciesBreeds = (userEmail: string): boolean => {
  // Allow both admins and veterinarians to manage species/breeds
  return !userEmail?.includes('superadmin');
};