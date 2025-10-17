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
    { name: 'Logout', icon: require('@/assets/logout.png'), route: null },
  ];

  return (
    <View style={styles['sidebar-container']}>
      <View style={styles['sidebar-logo-section']}>
        <Image source={require('@/assets/web-logo.png')} style={styles['sidebar-logo']} />
        <TouchableOpacity 
          style={styles['sidebar-email-clickable']}
          onPress={() => router.push('/client/admin-details')}
        >
          <Text style={styles['sidebar-email-text']}>{username}</Text>
        </TouchableOpacity>
      </View>
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
}

const styles = StyleSheet.create({
  'sidebar-container': {
    width: 250,
    height: '100%',
    paddingTop: 10,
    paddingHorizontal: Spacing.xlarge,
    borderRightWidth: 1,
    backgroundColor: Colors.primary,
    borderRightColor: Colors.border,
  },
  'sidebar-logo-section': {
    marginTop: 0,
    marginBottom: 25,
    alignItems: 'center',
  },
  'sidebar-logo': {
    width: 140,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 0,
  },
  'sidebar-title': {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: Colors.text.inverse,
  },
  'sidebar-email-clickable': {
    minHeight: 24,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  'sidebar-menu-text': {
    fontSize: Typography.sidebarItem,
    marginLeft: Spacing.large,
    color: Colors.text.inverse,
  },
  'sidebar-menu-icon': {
    width: 20,
    height: 20,
  },
  'sidebar-notification-badge': {
    backgroundColor: Colors.status.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  'sidebar-badge-text': {
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  logoutModalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmLogoutButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmLogoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});