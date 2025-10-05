import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTenant } from '@/contexts/TenantContext';
import { Typography, Spacing, MaroonThemeProtocol } from '@/constants/Typography';

export default function Sidebar() {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { userEmail } = useTenant();
  
  const username = userEmail ? userEmail.split('@')[0] : 'admin';

  const menuItems = [
    { name: 'Dashboard', icon: require('@/assets/dashboard.png'), route: '/client/dashboard' },
    { name: 'Appointments', icon: require('@/assets/appointments.png'), route: '/client/appointments' },
    { name: 'Customers', icon: require('@/assets/customers.png'), route: '/client/customers' },
    { name: 'Personnel', icon: require('@/assets/veterinarians.png'), route: '/client/veterinarians' },
    { name: 'Medical Records', icon: require('@/assets/medical-forms.png'), route: '/client/records' },
    { name: 'Notifications', icon: require('@/assets/notifications.png'), route: '/client/notifications' },
    { name: 'Settings', icon: require('@/assets/settings.png'), route: '/client/settings' },
    { name: 'Logout', icon: require('@/assets/logout.png'), route: '/shared/logout' },
  ];

  return (
    <View style={styles['sidebar-container']}>
      <View style={styles['sidebar-logo-section']}>
        <Image source={require('@/assets/logo.png')} style={styles['sidebar-logo']} />
        <TouchableOpacity 
          style={styles['sidebar-email-clickable']}
          onPress={() => router.push('/client/admin-details')}
        >
          <Text style={styles['sidebar-email-text']}>{username}</Text>
        </TouchableOpacity>
      </View>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles['sidebar-menu-item']}
          onPress={() => router.push(item.route)}
        >
          <Image source={item.icon} style={styles['sidebar-menu-icon']} />
          <Text style={styles['sidebar-menu-text']}>{item.name}</Text>
          {item.name === 'Notifications' && unreadCount > 0 && (
            <View style={styles['sidebar-notification-badge']}>
              <Text style={styles['sidebar-badge-text']}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

    </View>
  );
}

const styles = StyleSheet.create({
  'sidebar-container': {
    width: 250,
    height: '100%',
    paddingTop: 10,
    paddingHorizontal: Spacing.xlarge,
    borderRightWidth: 1,
    backgroundColor: MaroonThemeProtocol.colors.client.primary,
    borderRightColor: MaroonThemeProtocol.colors.client.secondary,
  },
  'sidebar-logo-section': {
    marginTop: 0,
    marginBottom: 25,
    alignItems: 'center',
  },
  'sidebar-logo': {
    width: 140,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 0,
  },
  'sidebar-title': {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: Colors.text.inverse,
  },
  'sidebar-email-clickable': {
    minHeight: 24,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
  },
  'sidebar-email-text': {
    color: Colors.text.inverse,
    fontSize: Typography.sidebarEmail,
  },
  'sidebar-menu-item': {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: MaroonThemeProtocol.colors.client.secondary,
  },
  'sidebar-menu-text': {
    fontSize: Typography.sidebarItem,
    marginLeft: Spacing.large,
    color: Colors.text.inverse,
  },
  'sidebar-menu-icon': {
    width: 20,
    height: 20,
  },
  'sidebar-notification-badge': {
    backgroundColor: Colors.status.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  'sidebar-badge-text': {
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: 'bold',
  },
});