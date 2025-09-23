import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function VetBottomMenu() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { name: 'Home', icon: 'home-outline', route: '/veterinarian/vet-appointments' },
    { name: 'Appointments', icon: 'calendar-outline', route: '/veterinarian/vet-appointments' },
    { name: 'Search', icon: 'search-outline', route: '/client/customers' },
    { name: 'Customers', icon: 'people-outline', route: '/client/customers' },
    { name: 'Calendar', icon: 'calendar-outline', route: '/veterinarian/vet-calendar' }
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
            size={24} 
            color={pathname === item.route ? '#2c5aa0' : '#666'} 
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
    borderTopColor: '#e0e0e0',
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
    color: '#666',
    marginTop: 2,
  },
  activeText: {
    color: '#2c5aa0',
    fontWeight: '600',
  },
});