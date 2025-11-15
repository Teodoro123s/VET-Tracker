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
                  }
                }}
              >
                Logout
              
            
          
        
      

    
  );
}

const styles = StyleSheet.create({
  'sidebar-container': {
    width,
    height: '100%',
    paddingTop,
    paddingHorizontal: Spacing.xlarge,
    borderRightWidth,
    backgroundColor: Colors.primary,
    borderRightColor: Colors.border,
  },
  'sidebar-logo-section': {
    marginTop,
    marginBottom,
    alignItems: 'center',
  },
  'sidebar-logo': {
    width,
    height,
    resizeMode: 'contain',
    marginBottom,
  },
  'sidebar-title': {
    fontSize,
    fontWeight: 'bold',
    marginBottom,
    textAlign: 'center',
    color: Colors.text.inverse,
  },
  'sidebar-email-clickable': {
    minHeight,
    paddingHorizontal,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop,
  },
  'sidebar-email-text': {
    color: Colors.text.inverse,
    fontSize: Typography.sidebarEmail,
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
    width: '85%',
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