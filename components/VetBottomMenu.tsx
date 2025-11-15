import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, Alert } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';

export default function VetBottomMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { name: 'Home', icon: 'home-outline', route: '/veterinarian/vet-mobile' },
    { name: 'Appointments', icon: 'calendar-outline', route: '/veterinarian/vet-appointments' },
    { name: 'Calendar', icon: 'calendar-outline', route: '/veterinarian/vet-calendar' },
    { name: 'Customers', icon: 'people-outline', route: '/veterinarian/vet-customers' },
    { name: 'Logout', icon: 'log-out-outline', route: null }
  ];

  return (
    <View style={styles.container}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.menuItem}
          onPress={() => item.name === 'Logout' ? setShowLogoutModal(true) : router.push(item.route as any)}
        >
          <Ionicons 
            name={item.icon as any} 
            size={24} 
            color={pathname === item.route ? Colors.primary : Colors.text.secondary} 
          />
          <Text style={[styles.menuText, pathname === item.route && styles.activeText]}>
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
      
      {/* Logout Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalText}>Are you sure you want to logout?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={async () => {
                  setShowLogoutModal(false);
                  await logout();
                  router.replace('/veterinarian/mobile-login');
                }}
              >
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  menuText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  activeText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelText: {
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
});