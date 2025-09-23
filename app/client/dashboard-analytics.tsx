import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import { Typography, Spacing, ButtonSizes } from '@/constants/Typography';

export default function DashboardAnalyticsScreen() {
  const router = useRouter();
  
  const [stats, setStats] = useState({
    totalTenants: 24,
    activeTenants: 18,
    totalRevenue: '₱2,847,520',
    monthlyRevenue: '₱247,890',
    expiringSoon: 5,
    newSignups: 3
  });

  return (
    <View style={styles.container}>
      <SuperAdminSidebar />
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Dashboard Analytics</Text>
          <Text style={styles.subtitle}>System Overview & Performance</Text>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Key Metrics */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{stats.totalTenants}</Text>
              <Text style={styles.metricLabel}>Total Tenants</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, styles.activeValue]}>{stats.activeTenants}</Text>
              <Text style={styles.metricLabel}>Active Tenants</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, styles.revenueValue]}>{stats.totalRevenue}</Text>
              <Text style={styles.metricLabel}>Total Revenue</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{stats.monthlyRevenue}</Text>
              <Text style={styles.metricLabel}>Monthly Revenue</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/superadmin')}>
                <Text style={styles.actionTitle}>Manage Tenants</Text>
                <Text style={styles.actionSubtitle}>View & edit tenant accounts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/billing')}>
                <Text style={styles.actionTitle}>Subscriptions</Text>
                <Text style={styles.actionSubtitle}>Monitor billing & renewals</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/transaction-history')}>
                <Text style={styles.actionTitle}>Transactions</Text>
                <Text style={styles.actionSubtitle}>Review payment history</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Alerts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Alerts</Text>
            <View style={styles.alertCard}>
              <Text style={styles.alertTitle}>Expiring Soon</Text>
              <Text style={styles.alertValue}>{stats.expiringSoon} tenants</Text>
              <Text style={styles.alertSubtitle}>Subscriptions expire within 7 days</Text>
            </View>
            <View style={styles.alertCard}>
              <Text style={styles.alertTitle}>New Signups</Text>
              <Text style={[styles.alertValue, styles.positiveValue]}>{stats.newSignups} this week</Text>
              <Text style={styles.alertSubtitle}>Recent tenant registrations</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Spacing.xxlarge,
    paddingBottom: Spacing.large,
    paddingHorizontal: Spacing.xxlarge,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerText: {
    fontSize: Typography.header,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: Spacing.tiny,
  },
  subtitle: {
    fontSize: Typography.body,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: Spacing.xxlarge,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.large,
    marginBottom: Spacing.xxlarge,
  },
  metricCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#fff',
    padding: Spacing.xxlarge,
    borderRadius: Spacing.radiusLarge,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: Spacing.small,
  },
  activeValue: {
    color: '#23C062',
  },
  revenueValue: {
    color: '#800000',
  },
  metricLabel: {
    fontSize: Typography.body,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xxlarge,
  },
  sectionTitle: {
    fontSize: Typography.title,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: Spacing.large,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: Spacing.large,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: Spacing.xlarge,
    borderRadius: Spacing.radiusLarge,
    borderLeftWidth: 4,
    borderLeftColor: '#800000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: Typography.subtitle,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: Spacing.small,
  },
  actionSubtitle: {
    fontSize: Typography.small,
    color: '#666',
  },
  alertCard: {
    backgroundColor: '#fff',
    padding: Spacing.xlarge,
    borderRadius: Spacing.radiusLarge,
    marginBottom: Spacing.medium,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertTitle: {
    fontSize: Typography.subtitle,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: Spacing.tiny,
  },
  alertValue: {
    fontSize: Typography.title,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: Spacing.small,
  },
  positiveValue: {
    color: '#23C062',
  },
  alertSubtitle: {
    fontSize: Typography.small,
    color: '#666',
  },
});