import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTenant } from '@/contexts/TenantContext';
import { getVeterinarians, getAppointments } from '@/lib/services/firebaseService';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';

interface VetMobileHeaderProps {
  showBackButton?: boolean;
  title?: string;
  onBackPress?: () => void;
  hideActions?: boolean;
}

export default function VetMobileHeader({ showBackButton = false, title, onBackPress, hideActions = false }: VetMobileHeaderProps) {
  const { userEmail } = useTenant();
  const { user } = useAuth();
  const router = useRouter();

  const [vetData, setVetData] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    loadVetData();
    loadNotificationCount();
  }, [userEmail, user]);

  const getDisplayName = (email) => {
    if (!email) return 'User';
    return email.split('@')[0];
  };

  const loadVetData = async () => {
    try {
      const vets = await getVeterinarians(userEmail);
      const currentVet = vets.find(vet => vet.email === userEmail);
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
      
      // Count notifications: pending appointments + due appointments + upcoming appointments
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let count = 0;
      
      appointments.forEach(apt => {
        // Check if appointment is assigned to this vet
        if (apt.veterinarian === currentUserEmail || apt.assignedVet === currentUserEmail || apt.veterinarianEmail === currentUserEmail) {
          // Pending appointments
          if (apt.status === 'Pending') {
            count++;
          }
          
          // Due appointments (today)
          const aptDate = new Date(apt.dateTime || apt.appointmentDate?.seconds * 1000 || apt.date);
          if (aptDate.toDateString() === today.toDateString() && apt.status !== 'Completed') {
            count++;
          }
          
          // Upcoming appointments (tomorrow)
          if (aptDate.toDateString() === tomorrow.toDateString() && apt.status !== 'Completed') {
            count++;
          }
        }
      });
      
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
            <TouchableOpacity style={styles.backButton} onPress={() => router.push('/veterinarian/vet-mobile')}>
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
          </>
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
      </View>
      {!hideActions && (
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/veterinarian/vet-notifications')}>
            <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{notificationCount > 99 ? '99+' : notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="ellipsis-vertical" size={24} color={Colors.primary} />
          </TouchableOpacity>
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

});