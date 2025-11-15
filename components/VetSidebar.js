import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Spacing, MaroonThemeProtocol } from '@/constants/Typography';

export default function VetSidebar() {
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard', icon: require('@/assets/dashboard.png'), route: '/veterinarian/vet-mobile' },
    { name: 'Appointments', icon: require('@/assets/appointments.png'), route: '/veterinarian/vet-appointments' },
    { name: 'Customers', icon: require('@/assets/customers.png'), route: '/veterinarian/vet-customers' },
    { name: 'Calendar', icon: require('@/assets/appointments.png'), route: '/veterinarian/vet-calendar' },
    { name: 'Notifications', icon: require('@/assets/notifications.png'), route: '/veterinarian/vet-notifications' },
    { name: 'Profile', icon: require('@/assets/veterinarians.png'), route: '/veterinarian/vet-profile' },
    { name: 'Logout', icon: require('@/assets/logout.png'), route: '/shared/logout' },
  ];

  return (
    
      
        
        Veterinarian
      
      {menuItems.map((item) => (
         router.push(item.route)}
        >
          
          {item.name}
        
      ))}
    
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width,
    height: '100%',
    paddingTop,
    paddingHorizontal: Spacing.xlarge,
    borderRightWidth,
    backgroundColor: MaroonThemeProtocol.colors.veterinarian.primary,
    borderRightColor: MaroonThemeProtocol.colors.veterinarian.secondary,
    zIndex,
    position: 'relative',
  },
  logoSection: {
    marginTop,
    marginBottom,
    alignItems: 'center',
  },
  logo: {
    width,
    height,
    resizeMode: 'contain',
    marginBottom,
  },
  subtitle: {
    fontSize: Typography.small,
    marginBottom: Spacing.large,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    borderBottomWidth,
    borderBottomColor: MaroonThemeProtocol.colors.veterinarian.secondary,
  },
  menuText: {
    fontSize: Typography.sidebarItem,
    marginLeft: Spacing.large,
    color: '#FFFFFF',
  },
  icon: {
    width,
    height,
  },
});