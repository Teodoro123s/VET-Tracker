import { Colors } from '@/constants/Colors';
import { Spacing, Typography } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTenant } from '@/contexts/TenantContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { unreadCount } = useNotifications();
  const { userEmail } = useTenant();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [clinicName, setClinicName] = useState('');
  
  useEffect(() => {
    const email = user?.email || userEmail || 'admin@clinic.com';
    setClinicName(email.split('@')[0]);
  }, [user, userEmail]);

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

  const handleNavigation = async (route: string | null) => {
    if (!route) return;
    console.log('Navigating to:', route);
    try {
      if (typeof window !== 'undefined') {
        window.location.href = route;
      } else {
        router.push(route as any);
      }
    } catch (error) {
      console.error(`Navigation error to ${route}:`, error);
      alert('Failed to navigate. Please try again.');
    }
  };

  return (
    <View style={styles['sidebar-container']}>
      <View style={styles['sidebar-section']}>
        <Text style={styles['sidebar-section-title']}>Main Menu</Text>
        {menuItems.slice(0, 5).map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[styles['sidebar-menu-item'], pathname === item.route && styles['sidebar-menu-item-active']]}
            onPress={() => item.name === 'Logout' ? setShowLogoutModal(true) : handleNavigation(item.route)}
          >
            <Image source={item.icon} style={[styles['sidebar-menu-icon'], pathname === item.route && styles['sidebar-menu-icon-active']]} />
            <Text style={[styles['sidebar-menu-text'], pathname === item.route && styles['sidebar-menu-text-active']]}>{item.name}</Text>
            {item.name === 'Notifications' && unreadCount > 0 && (
              <View style={styles['sidebar-notification-badge']}>
                <Text style={styles['sidebar-badge-text']}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles['sidebar-section']}>
        <Text style={styles['sidebar-section-title']}>Settings</Text>
        {menuItems.slice(6, 8).map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[styles['sidebar-menu-item'], pathname === item.route && styles['sidebar-menu-item-active']]}
            onPress={() => item.name === 'Logout' ? setShowLogoutModal(true) : handleNavigation(item.route)}
          >
            <Image source={item.icon} style={[styles['sidebar-menu-icon'], pathname === item.route && styles['sidebar-menu-icon-active']]} />
            <Text style={[styles['sidebar-menu-text'], pathname === item.route && styles['sidebar-menu-text-active']]}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
                    if (typeof window !== 'undefined') {
                      window.location.href = '/auth/admin-login';
                    } else {
                      router.replace('/auth/admin-login' as any);
                    }
                  } catch (error) {
                    console.error('Error during logout:', error);
                    // Don't navigate on logout failure
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
    width: '100%',
    height: '100%',
    paddingTop: 30,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  'sidebar-section': {
    marginBottom: 24,
  },
  'sidebar-section-title': {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  'sidebar-menu-item': {
    width: 236,
    height: 43.1,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 40,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  'sidebar-menu-item-active': {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(127, 29, 31, 0.02)',
    backgroundColor: '#7F1D1F',
    shadowColor: 'rgba(17, 31, 61, 0.06)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  'sidebar-menu-text': {
    fontSize: 14,
    marginLeft: 12,
    color: '#800000',
    fontWeight: '500',
  },
  'sidebar-menu-text-active': {
    color: '#FFFFFF',
  },
  'sidebar-menu-icon': {
    width: 20,
    height: 20,
    tintColor: '#800000',
  },
  'sidebar-menu-icon-active': {
    tintColor: '#FFFFFF',
  },
  'sidebar-notification-badge': {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  'sidebar-logout-badge': {
    backgroundColor: '#ef4444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  'sidebar-badge-text': {
    color: '#FFFFFF',
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
    width: '90%',
    maxWidth: 400,
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