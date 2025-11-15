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
    
      {menuItems.map((item) => (
         router.push(item.route)}
         >
           
          
            {item.name}
          
        
      ))}
    
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth,
    borderTopColor: Colors.border.light,
    paddingVertical,
    paddingHorizontal,
    paddingBottom,
  },
  menuItem: {
    flex,
    alignItems: 'center',
    paddingVertical,
  },
  menuText: {
    fontSize,
    color: Colors.text.secondary,
    marginTop,
  },
  activeText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});