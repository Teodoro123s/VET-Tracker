import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NotificationBell from './NotificationBell';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
export default function ClientHeader({ title }) {
  const { user } = useAuth();

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {user?.email && (
        <NotificationBell userEmail={user.email} />
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
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});