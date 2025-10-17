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
    <View style={styles.sidebar}>
      <View style={styles.logoSection}>
        <Image source={require('@/assets/web-logo.png')} style={styles.logo} />
        <Text style={styles.subtitle}>Veterinarian</Text>
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
    backgroundColor: MaroonThemeProtocol.colors.veterinarian.primary,
    borderRightColor: MaroonThemeProtocol.colors.veterinarian.secondary,
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
    borderBottomWidth: 1,
    borderBottomColor: MaroonThemeProtocol.colors.veterinarian.secondary,
  },
  menuText: {
    fontSize: Typography.sidebarItem,
    marginLeft: Spacing.large,
    color: '#FFFFFF',
  },
  icon: {
    width: 20,
    height: 20,
  },
});