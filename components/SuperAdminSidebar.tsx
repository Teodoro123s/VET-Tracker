import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function SuperAdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: require('@/assets/dashboard.png'), route: '/server/superadmin-dashboard' },
    { name: 'Tenants', icon: require('@/assets/customers.png'), route: '/server/superadmin' },
    { name: 'Subscriptions', icon: require('@/assets/notifications.png'), route: '/server/subscriptions' },
    { name: 'Subscription Periods', icon: require('@/assets/appointments.png'), route: '/server/subscription-periods' },
    { name: 'Transaction History', icon: require('@/assets/medical-forms.png'), route: '/server/transaction-history' },
    { name: 'Settings', icon: require('@/assets/settings.png'), route: '/server/settings' },
    { name: 'Logout', icon: require('@/assets/logout.png'), route: null },
  ];

  return (
    <View style={styles['sidebar-container']}>
      <View style={styles['sidebar-section']}>
        <Text style={styles['sidebar-section-title']}>System Management</Text>
        {menuItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.route;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles['sidebar-menu-item'], isActive && styles['sidebar-menu-item-active']]}
              onPress={() => item.name === 'Logout' ? setShowLogoutModal(true) : router.push(item.route as any)}
            >
              <Image source={item.icon} style={[styles['sidebar-menu-icon'], isActive && styles['sidebar-menu-icon-active']]} />
              <Text style={[styles['sidebar-menu-text'], isActive && styles['sidebar-menu-text-active']]}>{item.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <View style={styles['sidebar-section']}>
        <Text style={styles['sidebar-section-title']}>Settings</Text>
        {menuItems.slice(5, 7).map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles['sidebar-menu-item']}
            onPress={() => item.name === 'Logout' ? setShowLogoutModal(true) : router.push(item.route as any)}
          >
            <Image source={item.icon} style={styles['sidebar-menu-icon']} />
            <Text style={styles['sidebar-menu-text']}>{item.name}</Text>
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
    width: '100%',
    height: '100%',
    paddingTop: 30,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFF',
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
    paddingHorizontal: 30,
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