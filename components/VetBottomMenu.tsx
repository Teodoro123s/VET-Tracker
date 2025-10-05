import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function VetBottomMenu() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { name: 'Home', icon: 'home-outline', route: '/veterinarian/vet-mobile' },
    { name: 'Appointments', icon: 'calendar-outline', route: '/veterinarian/vet-appointments' },
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
            size={24} 
            color={pathname === item.route ? Colors.primary : Colors.text.secondary} 
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
});