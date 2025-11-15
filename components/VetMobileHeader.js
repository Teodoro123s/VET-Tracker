import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTenant } from '@/contexts/TenantContext';
import { getVeterinarians, getAppointments } from '@/lib/services/firebaseService';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';

export default function VetMobileHeader({ showBackButton = false, title, onBackPress, hideActions = false }) {
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
      
      // Count notifications appointments + due appointments + upcoming appointments
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
    
      
        {showBackButton ? (
          
             router.push('/veterinarian/vet-mobile'))}>
              
            
            {title}
          
        ) : (
          
            {title ? (
              {title}
            ) : (
              
                 router.push('/veterinarian/vet-profile')}>
                  
                
                
                  {vetData?.name || getDisplayName(userEmail)}
                  {vetData?.email || userEmail}
                
              
            )}
          
        )}
      
      {!hideActions && (
        
           router.push('/veterinarian/vet-notifications')}>
            
            {notificationCount > 0 && (
              
                {notificationCount > 99 ? '99+' }
              
            )}
          
          
            
          
        
      )}

    
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingLeft,
    paddingRight,
    paddingVertical,
    paddingTop,
    borderBottomWidth,
    borderBottomColor: Colors.border.light,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex,
  },

  backButton: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight,
  },
  headerTitle: {
    fontSize,
    fontWeight: '600',
    color: Colors.text.primary,
    flex,
  },
  avatar: {
    width,
    height,
    borderRadius,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight,
  },
  userInfo: {
    flex,
  },
  name: {
    fontSize,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  email: {
    fontSize,
    color: Colors.text.secondary,
    marginTop,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap,
  },
  notificationButton: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: Colors.card,
    borderRadius,
  },
  settingsButton: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius,
  },
  notificationBadge: {
    position: 'absolute',
    top,
    right,
    backgroundColor: Colors.status.error,
    borderRadius,
    minWidth,
    height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.text.inverse,
    fontSize,
    fontWeight: 'bold',
  },
  pageTitle: {
    fontSize,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft,
  },

});