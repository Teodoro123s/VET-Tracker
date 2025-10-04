import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Spacing } from '@/constants/Typography';

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
    <View style={styles.sidebar}>
      <View style={styles.logoSection}>
        <Image source={require('@/assets/logo.png')} style={styles.logo} />
        <Text style={styles.subtitle}>System Owner</Text>
      </View>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.menuItem}
          onPress={() => router.push(item.route)}
        >
          <Image source={item.icon} style={styles.icon} />
          <Text style={styles.menuText}>{item.name}</Text>
        </TouchableOpacity>
      ))}
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
    backgroundColor: '#800000',
    borderRightColor: '#ffffff20',
    zIndex: 9999,
    position: 'relative',
  },
  logoSection: {
    marginTop: 0,
    marginBottom: 10,
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 0,
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
    height: 40,
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
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff20',
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
});