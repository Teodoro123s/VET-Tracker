import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { storage, db } from '../lib/config/firebaseConfig';
import { useAuth } from './AuthContext';
import { useTenant } from './TenantContext';

interface AdminProfileContextType {
  adminEmail: string;
  adminRole: string;
  profileImage: string | null;
  uploading: boolean;
  showImageModal: boolean;
  previewImage: string | null;
  setProfileImage: (image: string | null) => void;
  setUploading: (uploading: boolean) => void;
  setShowImageModal: (show: boolean) => void;
  setPreviewImage: (image: string | null) => void;
  handleImageUpload: () => void;
  handleGalleryUpload: () => void;
  handleSaveImage: () => void;
  handleCancelUpload: () => void;
}

const AdminProfileContext = createContext<AdminProfileContextType | undefined>(undefined);

export const AdminProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { userEmail } = useTenant();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const adminEmail = user?.email || userEmail || 'admin@clinic.com';
  const adminRole = user?.role || 'Administrator';

  useEffect(() => {
    if (adminEmail && !profileImage) {
      loadProfileImage();
    }
  }, [adminEmail]);

  const loadProfileImage = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', adminEmail));
      if (userDoc.exists() && userDoc.data().profileImage) {
        setProfileImage(userDoc.data().profileImage);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  const handleImageUpload = () => {
    setShowImageModal(true);
  };

  const handleCameraUpload = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take a photo.');
        return;
      }

      setShowImageModal(false);
      setUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        Alert.alert('Success', 'Profile image updated successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant gallery permissions to select an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPreviewImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleSaveImage = async () => {
    if (!previewImage) return;
    
    setUploading(true);
    
    try {
      const response = await fetch(previewImage);
      const blob = await response.blob();
      const imageRef = ref(storage, `profile-images/${adminEmail}`);
      
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      
      const userDocRef = doc(db, 'users', adminEmail);
      await setDoc(userDocRef, { 
        email: adminEmail,
        role: adminRole,
        profileImage: downloadURL 
      }, { merge: true });
      
      // Update state with the final URL to sync across all admin pages
      setProfileImage(downloadURL);
      setPreviewImage(null);
      setShowImageModal(false);
      Alert.alert('Success', 'Profile image updated successfully!');
      
      console.log('Image saved and synced across all admin pages');
    } catch (error) {
      console.error('Failed to save image:', error);
      Alert.alert('Error', 'Failed to save profile image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setPreviewImage(null);
    setShowImageModal(false);
  };

  const value = {
    adminEmail,
    adminRole,
    profileImage,
    uploading,
    showImageModal,
    previewImage,
    setProfileImage,
    setUploading,
    setShowImageModal,
    setPreviewImage,
    handleImageUpload,
    handleGalleryUpload,
    handleSaveImage,
    handleCancelUpload,
  };

  return (
    <AdminProfileContext.Provider value={value}>
      {children}
    </AdminProfileContext.Provider>
  );
};

export const useAdminProfile = () => {
  const context = useContext(AdminProfileContext);
  if (context === undefined) {
    throw new Error('useAdminProfile must be used within an AdminProfileProvider');
  }
  return context;
};