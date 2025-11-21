import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationBell from './NotificationBell';
import { useAuth } from '../contexts/AuthContext';
// subscription display removed — no longer importing subscription context
import { Colors } from '../constants/Colors';

interface ClientHeaderProps {
  title: string;
}

export default function ClientHeader({ title }: ClientHeaderProps) {
  const { user } = useAuth();
  // Subscription info intentionally hidden from header/sidebar for simplicity

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <Text style={styles.title}>{title}</Text>
        {/* Subscription countdown removed for simplicity */}
      </View>
      {user?.email && (
        <NotificationBell 
          tenantId={user.email} 
          userEmail={user.email} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  // subscription styles removed
});