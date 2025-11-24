import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTenant } from '@/contexts/TenantContext';
import { getVeterinarians, getAppointments } from '@/lib/services/firebaseService';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  useEffect(() => {
    loadVetData();
    loadNotificationCount();
    
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

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBackButton ? (
          <>
            <TouchableOpacity style={styles.backButton} onPress={onBackPress || (() => router.push('/veterinarian/vet-mobile'))}>
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
                <TouchableOpacity style={styles.avatar} onPress={() => router.push('/veterinarian/vet-profile')}>
                  <Ionicons name="person" size={24} color={Colors.text.inverse} />
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
            <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/veterinarian/vet-notifications')}>
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

});