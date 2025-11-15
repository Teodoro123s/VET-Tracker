import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Spacing, MaroonThemeProtocol } from '@/constants/Typography';

export default function SuperAdminSidebar() {
  const router = useRouter();
  const [ownerEmail] = useState('owner@vetclinic.com');

  const menuItems = [
    { name: 'Dashboard', icon: require('@/assets/dashboard.png'), route: '/server/superadmin-dashboard' },
    { name: 'Tenants', icon: require('@/assets/customers.png'), route: '/server/superadmin' },
    { name: 'Subscriptions', icon: require('@/assets/notifications.png'), route: '/server/subscriptions' },
    { name: 'Subscription Periods', icon: require('@/assets/appointments.png'), route: '/server/subscription-periods' },
    { name: 'Transaction History', icon: require('@/assets/dashboard.png'), route: '/server/transaction-history' },
    { name: 'Logout', icon: require('@/assets/logout.png'), route: '/shared/logout' },
  ];

  return (
    
      
        
        System Owner
      
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
    backgroundColor: '#800020',
    borderRightColor: '#A0002A',
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
  title: {
    fontSize: Typography.sidebarTitle,
    fontWeight: 'bold',
    marginBottom: Spacing.gapTiny,
    textAlign: 'center',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: Typography.small,
    marginBottom: Spacing.large,
    textAlign: 'center',
    color: '#BDC3C7',
  },
  emailContainer: {
    height,
    paddingHorizontal: Spacing.medium,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderBottomWidth,
    borderBottomColor: '#A0002A',
  },
  menuText: {
    fontSize: Typography.sidebarItem,
    marginLeft: Spacing.large,
    color: '#ffffff',
  },
  icon: {
    width,
    height,
  },
});