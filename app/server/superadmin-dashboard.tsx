import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import { Typography, Spacing } from '@/constants/Typography';

export default function SuperAdminDashboardScreen() {
  const router = useRouter();
  
  const [systemStats, setSystemStats] = useState({
    totalClinics: 47,
    activeSubscriptions: 42,
    monthlyRevenue: '₱3,247,890',
    yearlyRevenue: '₱38,974,680',
    pendingRenewals: 8,
    systemUptime: '99.8%',
    totalTransactions: 1247,
    averageClinicSize: 12
  });

  return (
    <View style={styles.container}>
      <SuperAdminSidebar />
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.headerText}>SuperAdmin Dashboard</Text>
          <Text style={styles.subtitle}>System-wide Analytics & Control</Text>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Revenue Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenue Overview</Text>
            <View style={styles.revenueGrid}>
              <View style={styles.revenueCard}>
                <Text style={styles.revenueValue}>{systemStats.monthlyRevenue}</Text>
                <Text style={styles.revenueLabel}>Monthly Revenue</Text>
                <Text style={styles.revenueGrowth}>+12.5% from last month</Text>
              </View>
              <View style={styles.revenueCard}>
                <Text style={styles.revenueValue}>{systemStats.yearlyRevenue}</Text>
                <Text style={styles.revenueLabel}>Yearly Revenue</Text>
                <Text style={styles.revenueGrowth}>+28.3% from last year</Text>
              </View>
            </View>
          </View>

          {/* System Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{systemStats.totalClinics}</Text>
                <Text style={styles.metricLabel}>Total Clinics</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={[styles.metricValue, styles.activeValue]}>{systemStats.activeSubscriptions}</Text>
                <Text style={styles.metricLabel}>Active Subscriptions</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{systemStats.totalTransactions}</Text>
                <Text style={styles.metricLabel}>Total Transactions</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{systemStats.systemUptime}</Text>
                <Text style={styles.metricLabel}>System Uptime</Text>
              </View>
            </View>
          </View>

          {/* Management Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Management</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.managementCard} onPress={() => router.push('/superadmin')}>
                <Text style={styles.managementTitle}>Tenant Management</Text>
                <Text style={styles.managementCount}>{systemStats.totalClinics} clinics</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.managementCard} onPress={() => router.push('/billing')}>
                <Text style={styles.managementTitle}>Billing & Subscriptions</Text>
                <Text style={styles.managementCount}>{systemStats.activeSubscriptions} active</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.managementCard} onPress={() => router.push('/transaction-history')}>
                <Text style={styles.managementTitle}>Financial Reports</Text>
                <Text style={styles.managementCount}>{systemStats.totalTransactions} transactions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* System Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Status</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Pending Renewals</Text>
                <Text style={[styles.statusValue, styles.warningValue]}>{systemStats.pendingRenewals}</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Average Clinic Size</Text>
                <Text style={styles.statusValue}>{systemStats.averageClinicSize} users</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>System Health</Text>
                <Text style={[styles.statusValue, styles.healthyValue]}>Excellent</Text>
              </View>
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
  section: {
    marginBottom: Spacing.xxlarge,
  },
  sectionTitle: {
    fontSize: Typography.title,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: Spacing.large,
  },
  revenueGrid: {
    flexDirection: 'row',
    gap: Spacing.large,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: '#800000',
    padding: Spacing.xxlarge,
    borderRadius: Spacing.radiusLarge,
    alignItems: 'center',
  },
  revenueValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: Spacing.small,
  },
  revenueLabel: {
    fontSize: Typography.body,
    color: '#fff',
    marginBottom: Spacing.tiny,
  },
  revenueGrowth: {
    fontSize: Typography.small,
    color: '#ffcccc',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.large,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#fff',
    padding: Spacing.xlarge,
    borderRadius: Spacing.radiusLarge,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: Spacing.small,
  },
  activeValue: {
    color: '#23C062',
  },
  metricLabel: {
    fontSize: Typography.small,
    color: '#666',
    textAlign: 'center',
  },
  actionGrid: {
    gap: Spacing.medium,
  },
  managementCard: {
    backgroundColor: '#fff',
    padding: Spacing.xlarge,
    borderRadius: Spacing.radiusLarge,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#800000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  managementTitle: {
    fontSize: Typography.subtitle,
    fontWeight: 'bold',
    color: '#333',
  },
  managementCount: {
    fontSize: Typography.body,
    color: '#800000',
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: Spacing.xlarge,
    borderRadius: Spacing.radiusLarge,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: Typography.body,
    color: '#666',
  },
  statusValue: {
    fontSize: Typography.body,
    fontWeight: 'bold',
    color: '#333',
  },
  warningValue: {
    color: '#FFA500',
  },
  healthyValue: {
    color: '#23C062',
  },
});