import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Typography, Spacing } from '@/constants/Typography';

export default function SuperAdminSidebar() {
  const router = useRouter();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const username = 'superadmin';

  const menuItems = [
    { name: 'Dashboard', icon: require('@/assets/dashboard.png'), route: '/server/superadmin-dashboard' },
    { name: 'Tenants', icon: require('@/assets/customers.png'), route: '/server/superadmin' },
    { name: 'Subscriptions', icon: require('@/assets/notifications.png'), route: '/server/subscriptions' },
    { name: 'Subscription Periods', icon: require('@/assets/appointments.png'), route: '/server/subscription-periods' },
    { name: 'Logout', icon: require('@/assets/logout.png'), route: null },
  ];

  return (
    <View style={styles.sidebar}>
      <View style={styles.logoSection}>
        <Image source={require('@/assets/web-logo.png')} style={styles.logo} />
        <TouchableOpacity 
          style={styles.emailClickable}
          onPress={() => router.push('/server/superadmin')}
        >
          <Text style={styles.emailText}>{username}</Text>
        </TouchableOpacity>
      </View>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.menuItem}
          onPress={() => item.name === 'Logout' ? setShowLogoutModal(true) : router.push(item.route)}
        >
          <Image source={item.icon} style={styles.icon} />
          <Text style={styles.menuText}>{item.name}</Text>
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
  sidebar: {
    width: 250,
    height: '100%',
    paddingTop: 10,
    paddingHorizontal: Spacing.xlarge,
    borderRightWidth: 1,
    backgroundColor: '#800020',
    borderRightColor: '#A0002A',
  },
  logoSection: {
    marginTop: 0,
    marginBottom: 25,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#BDC3C7',
    textAlign: 'center',
  },
  emailClickable: {
    minHeight: 24,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
  },
  emailText: {
    color: '#ffffff',
    fontSize: Typography.sidebarEmail,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: '#A0002A',
  },
  menuText: {
    fontSize: Typography.sidebarItem,
    marginLeft: Spacing.large,
    color: '#ffffff',
  },
  icon: {
    width: 20,
    height: 20,
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