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
    { name: 'Appointments', icon: 'list-outline', route: '/veterinarian/vet-appointments' },
    { name: 'Calendar', icon: 'calendar-outline', route: '/veterinarian/vet-calendar' },
    { name: 'Customers', icon: 'people-outline', route: '/veterinarian/vet-customers' }
  ];

  return (
    <View style={styles.container}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.menuItem}
          onPress={() => router.push(item.route as any)}
        >
          <Ionicons 
            name={item.icon as any} 
            size={26} 
            color={pathname === item.route ? '#7B2C2C' : '#9CA3AF'} 
          />
          <Text style={[styles.menuText, pathname === item.route && styles.activeText]}>
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  menuText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  activeText: {
    color: '#7B2C2C',
    fontWeight: '700',
  },
});