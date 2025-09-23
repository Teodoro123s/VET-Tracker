import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTenant } from '@/contexts/TenantContext';
import { Typography, Spacing } from '@/constants/Typography';
import { getStaffByEmail, hasPermission } from '@/lib/staffService';

export default function StaffSidebar() {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { userEmail } = useTenant();
  const [staffData, setStaffData] = useState(null);
  
  const username = userEmail ? userEmail.split('@')[0] : 'staff';

  useEffect(() => {
    loadStaffData();
  }, [userEmail]);

  const loadStaffData = async () => {
    if (userEmail) {
      try {
        const staff = await getStaffByEmail(userEmail, userEmail);
        setStaffData(staff);
      } catch (error) {
        console.error('Error loading staff data:', error);
      }
    }
  };

  const allMenuItems = [
    { 
      name: 'Dashboard', 
      icon: require('@/assets/dashboard.png'), 
      route: '/staff-dashboard',
      permission: null
    },
    { 
      name: 'Appointments', 
      icon: require('@/assets/appointments.png'), 
      route: '/appointments',
      permission: { module: 'appointments', action: 'read' }
    },
    { 
      name: 'Customers', 
      icon: require('@/assets/customers.png'), 
      route: '/customers',
      permission: { module: 'customers', action: 'read' }
    },
    { 
      name: 'Veterinarians', 
      icon: require('@/assets/veterinarians.png'), 
      route: '/veterinarians',
      permission: { module: 'veterinarians', action: 'read' }
    },
    { 
      name: 'Medical Records', 
      icon: require('@/assets/medical-forms.png'), 
      route: '/records',
      permission: { module: 'medicalRecords', action: 'read' }
    },
    { 
      name: 'Notifications', 
      icon: require('@/assets/notifications.png'), 
      route: '/notifications',
      permission: null
    },
    { 
      name: 'Settings', 
      icon: require('@/assets/settings.png'), 
      route: '/settings',
      permission: null
    },
    { 
      name: 'Logout', 
      icon: require('@/assets/logout.png'), 
      route: '/logout',
      permission: null
    },
  ];

  // Filter menu items based on staff permissions
  const menuItems = allMenuItems.filter(item => {
    if (!item.permission) return true; // Always show items without permission requirements
    if (!staffData) return false; // Hide permission-based items if staff data not loaded
    
    return hasPermission(staffData, item.permission.module, item.permission.action);
  });

  return (
    <View style={styles['sidebar-container']}>
      <View style={styles['sidebar-logo-section']}>
        <Image source={require('@/assets/Group 20.png')} style={styles['sidebar-logo']} />
        <TouchableOpacity 
          style={styles['sidebar-email-clickable']}
          onPress={() => router.push('/staff-profile')}
        >
          <Text style={styles['sidebar-email-text']}>{username}</Text>
          <Text style={styles['sidebar-role-text']}>Receptionist</Text>
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

      {staffData && (
        <View style={styles['sidebar-permissions']}>
          <Text style={styles['permissions-title']}>Your Access</Text>
          <View style={styles['permissions-list']}>
            {Object.entries(staffData.permissions || {}).map(([module, perms]: [string, any]) => {
              const hasAnyPermission = Object.values(perms).some(p => p);
              if (!hasAnyPermission) return null;
              
              return (
                <Text key={module} style={styles['permission-item']}>
                  • {module.charAt(0).toUpperCase() + module.slice(1)}
                </Text>
              );
            })}
          </View>
        </View>
      )}
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
    backgroundColor: '#800000',
    borderRightColor: '#ffffff20',
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
  'sidebar-email-clickable': {
    minHeight: 24,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
  },
  'sidebar-email-text': {
    color: '#ffffff',
    fontSize: Typography.sidebarEmail,
    fontWeight: 'bold',
  },
  'sidebar-role-text': {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  'sidebar-menu-item': {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff20',
  },
  'sidebar-menu-text': {
    fontSize: Typography.sidebarItem,
    marginLeft: Spacing.large,
    color: '#ffffff',
  },
  'sidebar-menu-icon': {
    width: 20,
    height: 20,
  },
  'sidebar-notification-badge': {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  'sidebar-badge-text': {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  'sidebar-permissions': {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ffffff20',
  },
  'permissions-title': {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  'permissions-list': {
    gap: 4,
  },
  'permission-item': {
    color: '#ffffff',
    fontSize: 10,
    opacity: 0.8,
  },
});