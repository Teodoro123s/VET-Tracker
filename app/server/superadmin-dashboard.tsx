import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import { Typography, Spacing } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getSystemStats, getClinicGrowthData, getSubscriptionData } from '@/lib/services/firebaseService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/config/firebaseConfig';

export default function SuperAdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [systemStats, setSystemStats] = useState({
    totalClinics: 0,
    activeSubscriptions: 0,
    pendingRenewals: 0,
    systemUptime: '99.8%',
    averageClinicSize: 0
  });


  const [chartFilters, setChartFilters] = useState({
    clinics: 'month',
    subscriptions: 'month'
  });

  const [chartData, setChartData] = useState({
    clinics: [],
    subscriptions: []
  });

  useEffect(() => {
    loadSystemData();
  }, []);

  useEffect(() => {
    loadChartData();
  }, [chartFilters]);

  const loadSystemData = async () => {
    try {
      // Fetch real data from Firebase
      const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
      
      const tenants = tenantsSnapshot.docs.map(doc => doc.data());
      const activeSubscriptions = tenants.filter(t => t.subscriptionStatus === 'active').length;
      
      setSystemStats({
        totalClinics: tenants.length,
        activeSubscriptions,
        pendingRenewals: tenants.filter(t => t.subscriptionStatus === 'pending').length,
        systemUptime: '99.8%',
        averageClinicSize: tenants.length
      });
    } catch (error) {
      console.error('Error loading system data:', error);
      // Fallback to empty data
      setSystemStats({
        totalClinics: 0,
        activeSubscriptions: 0,
        pendingRenewals: 0,
        systemUptime: '99.8%',
        averageClinicSize: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const [clinicsData, subscriptionData] = await Promise.all([
        getClinicGrowthData(chartFilters.clinics),
        getSubscriptionData()
      ]);
      
      setChartData({
        clinics: clinicsData,
        subscriptions: subscriptionData
      });
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const getChartOptions = (type, filter) => {
    const baseOptions = {
      chart: { 
        toolbar: { show: false },
        animations: { enabled: true, easing: 'easeinout', speed: 800 }
      },
      dataLabels: { enabled: true },
      legend: { show: true, position: 'bottom' },
      tooltip: { enabled: true, theme: 'light' }
    };

    switch(type) {

      case 'clinics':
        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: 'line' },
          xaxis: { 
            categories: filter === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : 
                       filter === 'month' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] : 
                       ['Q1', 'Q2', 'Q3', 'Q4']
          },
          colors: ['#10b981'],
          stroke: { curve: 'smooth', width: 3 },
          markers: { size: 6 },
          grid: { show: true, borderColor: '#e2e8f0' }
        };
      case 'subscriptions':
        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: 'bar' },
          xaxis: { categories: ['Active', 'Pending', 'Expired', 'Trial'] },
          colors: ['#3b82f6'],
          plotOptions: {
            bar: {
              borderRadius: 4,
              horizontal: false,
              columnWidth: '60%'
            }
          },
          grid: { show: true, borderColor: '#e2e8f0' }
        };
      default:
        return baseOptions;
    }
  };

  const getChartData = (type, filter) => {
    switch(type) {

      case 'clinics':
        return chartData.clinics.length > 0 ? chartData.clinics : 
               (filter === 'week' ? [0,0,0,0,0,0,0] : [0,0,0,0]);
      case 'subscriptions':
        return chartData.subscriptions.length > 0 ? chartData.subscriptions : [0,0,0,0];
      default:
        return [0];
    }
  };



  return (
    <View style={styles.container}>
      <SuperAdminSidebar />
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>SuperAdmin Dashboard</Text>
          <View style={styles.headerActions}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={14} color="#999" />
              <Text style={styles.searchInput}>Search system...</Text>
            </View>
          </View>
        </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading system data...</Text>
            </View>
          ) : (
            <>




              {/* Quick Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                  <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/server/subscriptions')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="business-outline" size={24} color="#3B82F6" />
                    </View>
                    <Text style={styles.actionTitle}>Manage Clinics</Text>
                    <Text style={styles.actionSubtitle}>View all clinics</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/server/subscriptions')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                      <Ionicons name="card-outline" size={24} color="#22C55E" />
                    </View>
                    <Text style={styles.actionTitle}>Subscriptions</Text>
                    <Text style={styles.actionSubtitle}>Manage billing</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/server/transaction-history')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="receipt-outline" size={24} color="#F59E0B" />
                    </View>
                    <Text style={styles.actionTitle}>Transactions</Text>
                    <Text style={styles.actionSubtitle}>View history</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/server/notifications')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
                      <Ionicons name="notifications-outline" size={24} color="#8B5CF6" />
                    </View>
                    <Text style={styles.actionTitle}>Notifications</Text>
                    <Text style={styles.actionSubtitle}>System alerts</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* System Metrics */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>System Metrics</Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Ionicons name="business" size={32} color="#3B82F6" style={{ marginBottom: 8 }} />
                    <Text style={styles.metricValue}>{systemStats.totalClinics}</Text>
                    <Text style={styles.metricLabel}>Total Clinics</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Ionicons name="checkmark-circle" size={32} color="#22C55E" style={{ marginBottom: 8 }} />
                    <Text style={[styles.metricValue, styles.activeValue]}>{systemStats.activeSubscriptions}</Text>
                    <Text style={styles.metricLabel}>Active Subscriptions</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Ionicons name="alert-circle" size={32} color="#F59E0B" style={{ marginBottom: 8 }} />
                    <Text style={styles.metricValue}>{systemStats.pendingRenewals}</Text>
                    <Text style={styles.metricLabel}>Pending Renewals</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Ionicons name="pulse" size={32} color="#10B981" style={{ marginBottom: 8 }} />
                    <Text style={styles.metricValue}>{systemStats.systemUptime}</Text>
                    <Text style={styles.metricLabel}>System Uptime</Text>
                  </View>
                </View>
              </View>

              {/* System Status */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>System Status</Text>
                <View style={styles.statusCard}>
                  <View style={styles.statusItem}>
                    <View style={styles.statusIndicator}>
                      <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
                      <Text style={styles.statusLabel}>API Server</Text>
                    </View>
                    <Text style={styles.statusValue}>Running</Text>
                  </View>
                  <View style={styles.statusItem}>
                    <View style={styles.statusIndicator}>
                      <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
                      <Text style={styles.statusLabel}>Database</Text>
                    </View>
                    <Text style={styles.statusValue}>Connected</Text>
                  </View>
                  <View style={styles.statusItem}>
                    <View style={styles.statusIndicator}>
                      <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
                      <Text style={styles.statusLabel}>Authentication</Text>
                    </View>
                    <Text style={styles.statusValue}>Active</Text>
                  </View>
                  <View style={styles.statusItem}>
                    <View style={styles.statusIndicator}>
                      <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                      <Text style={styles.statusLabel}>Storage</Text>
                    </View>
                    <Text style={styles.statusValue}>75% Used</Text>
                  </View>
                </View>
              </View>




            </>
          )}
      </ScrollView>
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
  },
  header: {
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#800000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    width: 150,
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
  content: {
    flex: 1,
    padding: Spacing.xxlarge,
  },
  section: {
    marginBottom: Spacing.xxlarge,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: Typography.title,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: Spacing.large,
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


  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  actionCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingText: {
    fontSize: Typography.body,
    color: '#666',
  },
});