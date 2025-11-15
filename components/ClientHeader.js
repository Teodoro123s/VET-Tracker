import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NotificationBell from './NotificationBell';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
export default function ClientHeader({ title }) {
  const { user } = useAuth();

  return (
    
      {title}
      {user?.email && (
        
      )}
    
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal,
    paddingVertical,
    backgroundColor: Colors.surface,
    borderBottomWidth,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});