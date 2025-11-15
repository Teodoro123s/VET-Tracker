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
                    <Text style={styles.metricValue}>{systemStats.systemUptime}</Text>
                    <Text style={styles.metricLabel}>System Uptime</Text>
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
    fontSize: Typography.body,
    color: '#666',
  },
});