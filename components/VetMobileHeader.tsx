import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTenant } from '@/contexts/TenantContext';
import { getVeterinarians, getAppointments } from '@/lib/services/firebaseService';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/lib/services/storageService';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebaseConfig';
import ProfileImageModal from '@/components/ProfileImageModal';

interface VetMobileHeaderProps {
  showBackButton?: boolean;
  title?: string;
  onBackPress?: () => void;
  hideActions?: boolean;
  showSaveButton?: boolean;
  onSave?: () => void;
  isSubmitting?: boolean;
}

export default function VetMobileHeader({ showBackButton = false, title, onBackPress, hideActions = false, showSaveButton = false, onSave, isSubmitting = false }: VetMobileHeaderProps) {
  const { userEmail } = useTenant();
  const { user } = useAuth();
  const router = useRouter();

  const [vetData, setVetData] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadVetData();
    loadNotificationCount();
    loadProfileImage();
    
    // Refresh notification count periodically
    const interval = setInterval(() => {
      loadNotificationCount();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [userEmail, user]);

  const getDisplayName = (email) => {
    if (!email) return 'User';
    return email.split('@')[0];
  };

  const loadVetData = async () => {
    try {
      const currentUserEmail = user?.email || userEmail;
      if (!currentUserEmail) {
        console.log('No user email available');
        return;
      }
      
      const vets = await getVeterinarians(currentUserEmail);
      const currentVet = vets.find(vet => vet.email === currentUserEmail);
      setVetData(currentVet);
    } catch (error) {
      console.error('Error loading vet data:', error);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const currentUserEmail = user?.email || userEmail;
      if (!currentUserEmail) return;
      
      const appointments = await getAppointments(currentUserEmail);
      
      // Load read notifications from storage
      let readNotifications = new Set();
      try {
        const readData = await AsyncStorage.getItem(`readNotifications_${currentUserEmail}`);
        if (readData) {
          readNotifications = new Set(JSON.parse(readData));
        }
      } catch (error) {
        console.error('Error loading read notifications:', error);
      }
      
      // Count notifications: pending appointments + due appointments + upcoming appointments
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let count = 0;
      
      appointments.forEach(apt => {
        // Check if appointment is assigned to this vet
        if (apt.veterinarian === currentUserEmail || apt.assignedVet === currentUserEmail || apt.veterinarianEmail === currentUserEmail) {
          let notificationId = '';
          
          // Generate notification IDs similar to vet-notifications.tsx
          const aptDate = new Date(apt.dateTime || apt.appointmentDate?.seconds * 1000 || apt.date);
          
          if (apt.status === 'Pending') {
            notificationId = `pending-${apt.id}`;
          } else if (aptDate.toDateString() === today.toDateString() && apt.status !== 'Completed') {
            notificationId = `due-${apt.id}`;
          } else if (aptDate.toDateString() === tomorrow.toDateString() && apt.status !== 'Completed') {
            notificationId = `upcoming-${apt.id}`;
          } else if (apt.status === 'Completed') {
            const completedHours = (today.getTime() - aptDate.getTime()) / (1000 * 60 * 60);
            if (completedHours <= 24) {
              notificationId = `completed-${apt.id}`;
            }
          }
          
          // Only count if not read
          if (notificationId && !readNotifications.has(notificationId)) {
            count++;
          }
        }
      });
      
      // Add AI notifications and admin notice if not read
      const aiNotifications = ['ai-schedule', 'ai-records', 'ai-chatbot'];
      const adminNotice = 'admin-notice';
      
      aiNotifications.forEach(id => {
        if (!readNotifications.has(id)) {
          // Check if AI notification should be shown based on appointment count
          if (id === 'ai-schedule' && appointments.length > 3) count++;
          else if (id === 'ai-records' && appointments.filter(apt => apt.status === 'Completed' && !apt.medicalRecordAdded).length > 0) count++;
          else if (id === 'ai-chatbot' && appointments.length > 2) count++;
        }
      });
      
      if (!readNotifications.has(adminNotice)) {
        count++;
      }
      
      setNotificationCount(count);
    } catch (error) {
      console.error('Error loading notification count:', error);
      setNotificationCount(0);
    }
  };

  const loadProfileImage = async () => {
    try {
      const currentUserEmail = user?.email || userEmail;
      if (!currentUserEmail) return;
      
      const userDoc = await getDoc(doc(db, 'veterinarians', currentUserEmail));
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
    if (!previewImage) return;
    
    setUploading(true);
    
    try {
      const currentUserEmail = user?.email || userEmail;
      if (!currentUserEmail) return;
      
      const response = await fetch(previewImage);
      const blob = await response.blob();
      const imagePath = `vet-profiles/${currentUserEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.jpg`;
      
      const downloadURL = await uploadImage(blob, imagePath);
      
      const vetDocRef = doc(db, 'veterinarians', currentUserEmail);
      await updateDoc(vetDocRef, { profileImage: downloadURL });
      
      setProfileImage(downloadURL);
      setPreviewImage(null);
      setShowImageModal(false);
      Alert.alert('Success', 'Profile image updated successfully!');
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setPreviewImage(null);
    setShowImageModal(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBackButton ? (
          <>
            <TouchableOpacity style={styles.backButton} onPress={onBackPress || (() => router.push('/veterinarian/vet-mobile' as any))}>
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
          </>
        ) : (
          <>
            {title ? (
              <Text style={styles.pageTitle}>{title}</Text>
            ) : (
              <>
                <TouchableOpacity style={styles.avatar} onPress={handleImageUpload}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={24} color={Colors.text.inverse} />
                  )}
                  {uploading && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.userInfo}>
                  <Text style={styles.name}>{vetData?.name || getDisplayName(userEmail)}</Text>
                  <Text style={styles.email}>{vetData?.email || userEmail}</Text>
                </View>
              </>
            )}
          </>
        )}
      </View>
      {!hideActions && (
        <View style={styles.rightSection}>
          {showSaveButton ? (
            <TouchableOpacity 
              style={[styles.saveButton, isSubmitting && styles.disabledButton]} 
              onPress={onSave}
              disabled={isSubmitting}
            >
              <Text style={styles.saveText}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/veterinarian/vet-notifications' as any)}>
              <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{notificationCount > 99 ? '99+' : notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      <ProfileImageModal
        visible={showImageModal}
        previewImage={previewImage}
        uploading={uploading}
        onGalleryUpload={handleGalleryUpload}
        onSaveImage={handleSaveImage}
        onCancel={handleCancelUpload}
        primaryColor={Colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  email: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: Colors.card,
    borderRadius: 20,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.status.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 16,
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

});