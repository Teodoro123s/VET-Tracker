import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import { Typography, Spacing } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getSystemStats, getRevenueData, getClinicGrowthData, getSubscriptionData } from '@/lib/services/firebaseService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/config/firebaseConfig';

export default function SuperAdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [systemStats, setSystemStats] = useState({
    totalClinics: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    pendingRenewals: 0,
    systemUptime: '99.8%',
    totalTransactions: 0,
    averageClinicSize: 0
  });


  const [chartFilters, setChartFilters] = useState({
    revenue: 'month',
    clinics: 'month',
    subscriptions: 'month'
  });

  const [chartData, setChartData] = useState({
    revenue: [],
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
      const [tenantsSnapshot, transactionsSnapshot] = await Promise.all([
        getDocs(collection(db, 'tenants')),
        getDocs(collection(db, 'transactions'))
      ]);
      
      const tenants = tenantsSnapshot.docs.map(doc => doc.data());
      const transactions = transactionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          amount: parseFloat(data.amount?.toString().replace(/[^0-9.-]+/g, '') || '0'),
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
      
      const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
      const monthlyRevenue = totalRevenue / 12;
      const activeSubscriptions = tenants.filter(t => t.subscriptionStatus === 'active').length;
      
      setSystemStats({
        totalClinics: tenants.length,
        activeSubscriptions,
        monthlyRevenue,
        yearlyRevenue: totalRevenue,
        pendingRenewals: tenants.filter(t => t.subscriptionStatus === 'pending').length,
        systemUptime: '99.8%',
        totalTransactions: transactions.length,
        averageClinicSize: tenants.length > 0 ? Math.round(transactions.length / tenants.length) : 0
      });
    } catch (error) {
      console.error('Error loading system data:', error);
      // Fallback to empty data
      setSystemStats({
        totalClinics: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        yearlyRevenue: 0,
        pendingRenewals: 0,
        systemUptime: '99.8%',
        totalTransactions: 0,
        averageClinicSize: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const [revenueData, clinicsData, subscriptionData] = await Promise.all([
        getRevenueData(chartFilters.revenue),
        getClinicGrowthData(chartFilters.clinics),
        getSubscriptionData()
      ]);
      
      setChartData({
        revenue: revenueData,
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
      case 'revenue':
        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: 'area' },
          xaxis: { 
            categories: filter === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : 
                       filter === 'month' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] : 
                       ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          },
          colors: ['#800000'],
          fill: { 
            type: 'gradient',
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0.7,
              opacityTo: 0.3
            }
          },
          stroke: { curve: 'smooth', width: 3 },
          grid: { show: true, borderColor: '#e2e8f0' }
        };
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
      case 'revenue':
        return chartData.revenue.length > 0 ? chartData.revenue : 
               (filter === 'week' ? [0,0,0,0,0,0,0] : filter === 'month' ? [0,0,0,0] : [0,0,0,0,0,0,0,0,0,0,0,0]);
      case 'clinics':
        return chartData.clinics.length > 0 ? chartData.clinics : 
               (filter === 'week' ? [0,0,0,0,0,0,0] : [0,0,0,0]);
      case 'subscriptions':
        return chartData.subscriptions.length > 0 ? chartData.subscriptions : [0,0,0,0];
      default:
        return [0];
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
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
              {/* Revenue Overview */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Revenue Overview</Text>
                <View style={styles.revenueGrid}>
                  <View style={styles.revenueCard}>
                    <Text style={styles.revenueValue}>{formatCurrency(systemStats.monthlyRevenue)}</Text>
                    <Text style={styles.revenueLabel}>Monthly Revenue</Text>
                    <Text style={styles.revenueGrowth}>+12.5% from last month</Text>
                  </View>
                  <View style={styles.revenueCard}>
                    <Text style={styles.revenueValue}>{formatCurrency(systemStats.yearlyRevenue)}</Text>
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

              {/* Financial Reports */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Financial Reports</Text>
                <TouchableOpacity style={styles.financialCard} onPress={() => router.push('/server/financial-analytics')}>
                  <View style={styles.financialIcon}>
                    <Ionicons name="analytics" size={32} color="#ffffff" />
                  </View>
                  <View style={styles.financialContent}>
                    <Text style={styles.financialTitle}>Transaction Analytics</Text>
                    <Text style={styles.financialSubtitle}>View detailed financial reports and transaction history</Text>
                    <Text style={styles.financialCount}>{systemStats.totalTransactions} total transactions</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#800000" />
                </TouchableOpacity>
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
  financialCard: {
    backgroundColor: '#fff',
    padding: Spacing.xlarge,
    borderRadius: Spacing.radiusLarge,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  financialIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#800000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.large,
  },
  financialContent: {
    flex: 1,
  },
  financialTitle: {
    fontSize: Typography.subtitle,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  financialSubtitle: {
    fontSize: Typography.small,
    color: '#666',
    marginBottom: 8,
  },
  financialCount: {
    fontSize: Typography.body,
    color: '#800000',
    fontWeight: 'bold',
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