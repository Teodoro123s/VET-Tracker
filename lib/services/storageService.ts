import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebaseConfig';

/**
 * Upload an image to Firebase Storage
 * @param file - The file to upload (File object from web or URI on mobile)
 * @param path - The storage path (e.g., 'licenses/veterinarian-123.jpg')
 * @returns The download URL of the uploaded image
 */
export async function uploadImage(file: File | Blob, path: string): Promise<string> {
  try {
    console.log('Uploading image to:', path);
    
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    
    console.log('Image uploaded successfully:', snapshot.metadata.fullPath);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Upload a veterinarian license image
 * @param file - The license image file
 * @param vetEmail - The veterinarian's email (used in filename)
 * @returns The download URL
 */
export async function uploadVetLicense(file: File | Blob, vetEmail: string): Promise<string> {
  const timestamp = Date.now();
  const sanitizedEmail = vetEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const path = `licenses/${sanitizedEmail}_${timestamp}.jpg`;
  
  return uploadImage(file, path);
}
