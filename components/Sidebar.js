import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTenant } from '@/contexts/TenantContext';
import { Typography, Spacing } from '@/constants/Typography';

export default function Sidebar() {
  const router = useRouter();
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { userEmail } = useTenant();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const username = userEmail ? userEmail.split('@')[0] : 'admin';

  const menuItems = [
    { name: 'Dashboard', icon: require('@/assets/dashboard.png'), route: '/client/dashboard' },
    { name: 'Appointments', icon: require('@/assets/appointments.png'), route: '/client/appointments' },
    { name: 'Customers', icon: require('@/assets/customers.png'), route: '/client/customers' },
    { name: 'Personnel', icon: require('@/assets/veterinarians.png'), route: '/client/veterinarians' },
    { name: 'Medical Records', icon: require('@/assets/medical-forms.png'), route: '/client/records' },
    { name: 'Notifications', icon: require('@/assets/notifications.png'), route: '/client/notifications' },
    { name: 'Settings', icon: require('@/assets/settings.png'), route: '/client/settings' },
    { name: 'Logout', icon: require('@/assets/logout.png'), route},
  ];

  return (
    
      
        
         router.push('/client/admin-details')}
        >
          {username}
        
      
      {menuItems.map((item) => (
         item.name === 'Logout' ? setShowLogoutModal(true) : router.push(item.route)}
        >
          
          {item.name}
          {item.name === 'Notifications' && unreadCount > 0 && (
            
              {unreadCount > 99 ? '99+' }
            
          )}
        
      ))}

      {/* Logout Confirmation Modal */}
       setShowLogoutModal(false)}
      >
        
          
            
            Confirm Logout
            Are you sure you want to logout? You will need to login again to access the system.
            
               setShowLogoutModal(false)}
              >
                Cancel
              
               {
                  setShowLogoutModal(false);
                  try {
                    await logout();
                    router.replace('/auth/admin-login');
                  } catch (error) {
                    console.error('Error during logout:', error);
                    router.replace('/auth/admin-login');
                  return (
                    <View style={styles['sidebar-container']}>
                      <TouchableOpacity style={styles['sidebar-email-clickable']} onPress={() => router.push('/client/admin-details')}>
                        <Text style={styles['sidebar-email-text']}>{username}</Text>
                      </TouchableOpacity>
                      {menuItems.map((item) => (
                        <TouchableOpacity
                          key={item.name}
                          style={styles['sidebar-menu-item']}
                          onPress={() => item.name === 'Logout' ? setShowLogoutModal(true) : router.push(item.route)}
                        >
                          <Image source={item.icon} style={styles['sidebar-menu-icon']} />
                          <Text style={styles['sidebar-menu-text']}>{item.name}</Text>
                          {item.name === 'Notifications' && unreadCount > 0 && (
                            <View style={styles['sidebar-notification-badge']}>
                              <Text style={styles['sidebar-badge-text']}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}

                      {/* Logout Confirmation Modal */}
                      <Modal
                        visible={showLogoutModal}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowLogoutModal(false)}
                      >
                        <View style={styles.modalOverlay}>
                          <View style={[styles.logoutModalContent, { width: '90%', maxWidth: 400 }]}> 
                            <Text style={styles.logoutModalTitle}>Confirm Logout</Text>
                            <Text style={styles.logoutModalText}>
                              Are you sure you want to logout? You will need to login again to access the system.
                            </Text>
                            <View style={styles.logoutModalButtons}>
                              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowLogoutModal(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.confirmLogoutButton}
                                onPress={async () => {
                                  setShowLogoutModal(false);
                                  try {
                                    await logout();
                                    router.replace('/auth/admin-login');
                                  } catch (error) {
                                    console.error('Error during logout:', error);
                                    router.replace('/auth/admin-login');
                                  }
                                }}
                              >
                                <Text style={styles.confirmLogoutButtonText}>Logout</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </Modal>
                    </View>
                  );
  },
  'sidebar-menu-item': {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    borderBottomWidth,
    borderBottomColor: Colors.border,
  },
  'sidebar-menu-text': {
    fontSize: Typography.sidebarItem,
    marginLeft: Spacing.large,
    color: Colors.text.inverse,
  },
  'sidebar-menu-icon': {
    width,
    height,
  },
  'sidebar-notification-badge': {
    backgroundColor: Colors.status.error,
    borderRadius,
    minWidth,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  'sidebar-badge-text': {
    color: Colors.text.inverse,
    fontSize,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    backgroundColor: '#fff',
    borderRadius,
    padding,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth,
    borderColor: '#f0f0f0',
  },
  logoutModalTitle: {
    fontSize,
    fontWeight: 'bold',
    color: '#333',
    marginBottom,
  },
  logoutModalText: {
    fontSize,
    color: '#666',
    textAlign: 'center',
    marginBottom,
    lineHeight,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap,
    width: '100%',
  },
  cancelButton: {
    flex,
    backgroundColor: '#f0f0f0',
    padding,
    borderRadius,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize,
    fontWeight: '500',
  },
  confirmLogoutButton: {
    flex,
    backgroundColor: '#ef4444',
    padding,
    borderRadius,
    alignItems: 'center',
  },
  confirmLogoutButtonText: {
    color: 'white',
    fontSize,
    fontWeight: 'bold',
  },
});