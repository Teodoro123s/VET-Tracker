import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NotificationBell from './NotificationBell';
import { useAuth } from '../contexts/AuthContext';

interface ClientHeaderProps {
  title: string;
}

export default function ClientHeader({ title }: ClientHeaderProps) {
  const { user } = useAuth();

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#800000',
  },
});