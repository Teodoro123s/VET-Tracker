import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import { Typography, Spacing } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getSystemStats, getRevenueData, getClinicGrowthData, getSubscriptionData } from '@/lib/services/firebaseService';

export default function SuperAdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [systemStats, setSystemStats] = useState({
    totalClinics: 0,
    activeSubscriptions: 0,
    monthlyRevenue: '₱0',
    yearlyRevenue: '₱0',
    pendingRenewals: 0,
    systemUptime: '99.8%',
    totalTransactions: 0,
    averageClinicSize: 0
  });

  const [Chart, setChart] = useState(null);
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
    if (Platform.OS === 'web') {
      import('react-apexcharts').then((module) => {
        setChart(() => module.default);
      }).catch((error) => {
        console.warn('Charts not available:', error);
      });
    }
    loadSystemData();
  }, []);

  useEffect(() => {
    loadChartData();
  }, [chartFilters]);

  const loadSystemData = async () => {
    try {
      const stats = await getSystemStats();
      setSystemStats(stats);
    } catch (error) {
      console.error('Error loading system data:', error);
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

  return (
    <View style={styles.container}>
      <SuperAdminSidebar />
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.headerText}>SuperAdmin Dashboard</Text>
          <Text style={styles.subtitle}>System-wide Analytics & Control</Text>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

              {/* Analytics Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Analytics Dashboard</Text>
                <View style={styles.analyticsGridTwoColumn}>
                  {/* Left Column */}
                  <View style={styles.analyticsColumn}>
                    {/* Revenue Trends */}
                    <View style={styles.analyticsCard}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Revenue Trends</Text>
                        <TouchableOpacity style={styles.chartFilter} onPress={() => {
                          const filters = ['week', 'month', 'year'];
                          const currentIndex = filters.indexOf(chartFilters.revenue);
                          const nextFilter = filters[(currentIndex + 1) % filters.length];
                          setChartFilters({...chartFilters, revenue: nextFilter});
                        }}>
                          <Text style={styles.chartFilterText}>{chartFilters.revenue}</Text>
                        </TouchableOpacity>
                      </View>
                      {Platform.OS === 'web' && Chart ? (
                        <Chart
                          options={getChartOptions('revenue', chartFilters.revenue)}
                          series={[{ name: 'Revenue', data: getChartData('revenue', chartFilters.revenue) }]}
                          type="area"
                          height={200}
                        />
                      ) : (
                        <View style={styles.chartPlaceholder}>
                          <Ionicons name="trending-up" size={40} color={Colors.primary} />
                          <Text style={styles.placeholderText}>Revenue Chart</Text>
                        </View>
                      )}
                    </View>

                    {/* Subscription Status */}
                    <View style={styles.analyticsCard}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Subscription Status</Text>
                      </View>
                      {Platform.OS === 'web' && Chart ? (
                        <Chart
                          options={getChartOptions('subscriptions', chartFilters.subscriptions)}
                          series={[{ name: 'Subscriptions', data: getChartData('subscriptions', chartFilters.subscriptions) }]}
                          type="bar"
                          height={200}
                        />
                      ) : (
                        <View style={styles.chartPlaceholder}>
                          <Ionicons name="card" size={40} color={Colors.primary} />
                          <Text style={styles.placeholderText}>Subscription Chart</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Right Column */}
                  <View style={styles.analyticsColumn}>
                    {/* Clinic Growth */}
                    <View style={styles.analyticsCard}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Clinic Growth</Text>
                        <TouchableOpacity style={styles.chartFilter} onPress={() => {
                          const filters = ['week', 'month', 'year'];
                          const currentIndex = filters.indexOf(chartFilters.clinics);
                          const nextFilter = filters[(currentIndex + 1) % filters.length];
                          setChartFilters({...chartFilters, clinics: nextFilter});
                        }}>
                          <Text style={styles.chartFilterText}>{chartFilters.clinics}</Text>
                        </TouchableOpacity>
                      </View>
                      {Platform.OS === 'web' && Chart ? (
                        <Chart
                          options={getChartOptions('clinics', chartFilters.clinics)}
                          series={[{ name: 'New Clinics', data: getChartData('clinics', chartFilters.clinics) }]}
                          type="line"
                          height={200}
                        />
                      ) : (
                        <View style={styles.chartPlaceholder}>
                          <Ionicons name="business" size={40} color={Colors.primary} />
                          <Text style={styles.placeholderText}>Growth Chart</Text>
                        </View>
                      )}
                    </View>

                    {/* System Performance */}
                    <View style={styles.analyticsCard}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>System Performance</Text>
                      </View>
                      {Platform.OS === 'web' && Chart ? (
                        <Chart
                          options={{
                            ...getChartOptions('subscriptions'),
                            chart: { type: 'pie', toolbar: { show: false } },
                            labels: ['Uptime', 'Maintenance', 'Issues'],
                            colors: ['#10b981', '#f59e0b', '#ef4444']
                          }}
                          series={[98.5, 1.2, 0.3]}
                          type="pie"
                          height={200}
                        />
                      ) : (
                        <View style={styles.chartPlaceholder}>
                          <Ionicons name="speedometer" size={40} color={Colors.primary} />
                          <Text style={styles.placeholderText}>Performance Chart</Text>
                        </View>
                      )}
                    </View>
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
            </>
          )}
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
  analyticsGrid: {
    gap: Spacing.large,
  },
  analyticsGridTwoColumn: {
    flexDirection: 'row',
    gap: 24,
  },
  analyticsColumn: {
    flex: 1,
    gap: 20,
  },
  analyticsCard: {
    backgroundColor: '#fff',
    padding: Spacing.xlarge,
    borderRadius: Spacing.radiusLarge,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: Spacing.large,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.medium,
  },
  cardTitle: {
    fontSize: Typography.subtitle,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  chartFilter: {
    backgroundColor: '#800000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  chartFilterText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 200,
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 8,
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