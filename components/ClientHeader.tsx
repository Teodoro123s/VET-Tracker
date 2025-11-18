import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationBell from './NotificationBell';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Colors } from '../constants/Colors';

interface ClientHeaderProps {
  title: string;
}

export default function ClientHeader({ title }: ClientHeaderProps) {
  const { user } = useAuth();
  const { hasActiveSubscription, daysRemaining, totalDaysRemaining, queuedPeriods, loading } = useSubscription();

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <Text style={styles.title}>{title}</Text>
        {user?.role === 'admin' && !loading && hasActiveSubscription && (
          <View style={styles.subscriptionBadge}>
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={daysRemaining <= 7 ? '#ef4444' : '#10b981'} 
            />
            <Text style={[
              styles.subscriptionText,
              daysRemaining <= 7 && styles.subscriptionWarning
            ]}>
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
              {queuedPeriods > 0 && ` (Total: ${totalDaysRemaining})`}
            </Text>
          </View>
        )}
        {user?.role === 'admin' && !loading && !hasActiveSubscription && (
          <View style={styles.expiredBadge}>
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.expiredText}>Subscription Expired</Text>
          </View>
        )}
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
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  subscriptionWarning: {
    color: '#ef4444',
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  expiredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
});