import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTenant } from '@/contexts/TenantContext';
import { getVeterinarianByEmail, generateOwnPassword } from '@/lib/services/firebaseService';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/lib/services/storageService';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebaseConfig';
import ProfileImageModal from '@/components/ProfileImageModal';

export default function VetProfile() {
  const { userEmail } = useTenant();
  const router = useRouter();
  const { logout } = useAuth();
  const [vetData, setVetData] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);


  useEffect(() => {
    loadVetData();
    loadProfileImage();
  }, [userEmail]);

  const loadVetData = async () => {
    try {
      if (userEmail) {
        const vetData = await getVeterinarianByEmail(userEmail, userEmail);
        setVetData(vetData);
      }
    } catch (error) {
      console.error('Error loading veterinarian data:', error);
    }
  };

  const loadProfileImage = async () => {
    try {
      if (!userEmail) return;
      
      const userDoc = await getDoc(doc(db, 'veterinarians', userEmail));
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
    if (!previewImage) {
      Alert.alert('Error', 'No image selected');
      return;
    }
    
    if (!userEmail) {
      Alert.alert('Error', 'User email not found');
      return;
    }
    
    setUploading(true);
    
    try {
      console.log('Starting image upload process...');
      console.log('Preview image URI:', previewImage);
      
      // Check Firebase Auth
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const currentUser = auth.currentUser;
      console.log('Current Firebase user:', currentUser?.email);
      
      if (!currentUser) {
        throw new Error('User not authenticated with Firebase');
      }
      
      const response = await fetch(previewImage);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      console.log('Blob created, size:', blob.size);
      
      const imagePath = `vet-profiles/${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.jpg`;
      console.log('Upload path:', imagePath);
      
      const downloadURL = await uploadImage(blob, imagePath);
      console.log('Upload successful, URL:', downloadURL);
      
      const vetDocRef = doc(db, 'veterinarians', userEmail);
      await updateDoc(vetDocRef, { profileImage: downloadURL });
      console.log('Firestore updated successfully');
      
      setProfileImage(downloadURL);
      setPreviewImage(null);
      setShowImageModal(false);
      Alert.alert('Success', 'Profile image updated successfully!');
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', `Failed to save image: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setPreviewImage(null);
    setShowImageModal(false);
  };

  const getDisplayName = (email) => {
    if (!email) return 'User';
    return email.split('@')[0];
  };



  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <TouchableOpacity style={styles.avatar} onPress={handleImageUpload}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={30} color="#fff" />
          )}
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.profileName}>{vetData?.name || vetData?.clinicName || getDisplayName(userEmail)}</Text>
        <Text style={styles.profileEmail}>{vetData?.email || userEmail}</Text>
      </View>

      <View style={styles.profileDetails}>
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Contact & Professional Information</Text>
          {/* debug: vetData logged in console during development */}
          <View style={styles.detailRow}>
            <Ionicons name="mail" size={20} color={Colors.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{vetData?.email || userEmail || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call" size={20} color={Colors.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{vetData?.phone || vetData?.phoneNumber || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="medical" size={20} color={Colors.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Specialization</Text>
              <Text style={styles.detailValue}>{vetData?.specialization || vetData?.role || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={20} color={Colors.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>License</Text>
              <Text style={styles.detailValue}>{vetData?.license || vetData?.licenseNumber || vetData?.tenantId || 'Not provided'}</Text>
            </View>
          </View>
        </View>
        

      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => setShowLogoutModal(true)}
      >
        <Ionicons name="log-out" size={20} color="white" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalContent}>
            <Ionicons name="log-out" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
            <Text style={styles.logoutModalTitle}>Confirm Logout</Text>
            <Text style={styles.logoutModalText}>Are you sure you want to logout? You will need to login again to access the system.</Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmLogoutButton}
                onPress={async () => {
                  setShowLogoutModal(false);
                  await logout();
                  router.replace('/auth/login');
                }}
              >
                <Text style={styles.confirmLogoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Image Modal */}
      <ProfileImageModal
        visible={showImageModal}
        onClose={handleCancelUpload}
        onGalleryPress={handleGalleryUpload}
        onSave={handleSaveImage}
        previewImage={previewImage}
        uploading={uploading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    backgroundColor: Colors.primary,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: 'cover',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileDetails: {
    padding: 20,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailText: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    minWidth: 300,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  logoutModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  confirmLogoutButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  confirmLogoutButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});