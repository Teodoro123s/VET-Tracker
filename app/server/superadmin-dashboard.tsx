import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { Typography, Spacing } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getSystemStats, getClinicGrowthData, getSubscriptionData } from '@/lib/services/firebaseService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/config/firebaseConfig';
import { parseAnalyticsPrice } from '@/lib/utils/priceUtils';

// Subscription Analytics Interface
interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeCount: number;
  expiredCount: number;
  expiringCount: number;
  revenue: number;
  mostPopularPeriod: string;
}

export default function SuperAdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<SubscriptionAnalytics>({
    totalSubscriptions: 0,
    activeCount: 0,
    expiredCount: 0,
    expiringCount: 0,
    revenue: 0,
    mostPopularPeriod: 'N/A'
  });
  
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

  const [periodCounts, setPeriodCounts] = useState<Record<string, number>>({});
  const [revenueViewMode, setRevenueViewMode] = useState<'numbers' | 'graph'>('numbers');
  const [revenueFilter, setRevenueFilter] = useState<'7days' | 'monthly' | 'yearly'>('monthly');
  const [filteredRevenue, setFilteredRevenue] = useState({ '7days': 0, 'monthly': 0, 'yearly': 0 });
  const [transactionsSnapshot, setTransactionsSnapshot] = useState(null);

  useEffect(() => {
    loadSystemData();
    loadSubscriptionAnalytics();
  }, []);
  
  useEffect(() => {
    // Refresh analytics when filter changes to ensure live data
    loadSubscriptionAnalytics();
  }, [revenueFilter]);

  useEffect(() => {
    loadChartData();
  }, [chartFilters]);

  const loadSystemData = async () => {
    try {
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

  const loadSubscriptionAnalytics = async () => {
    try {
      const transactionsSnap = await getDocs(collection(db, 'transactions'));
      setTransactionsSnapshot(transactionsSnap);
      const now = new Date();
      
      let activeCount = 0;
      let expiredCount = 0;
      let expiringCount = 0;
      let totalRevenue = 0;
      const periodCounts: Record<string, number> = {};
      
      const tenantsByEmail = new Map<string, any[]>();
      
      transactionsSnap.docs.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate() || new Date();
        const periodDays = getPeriodDays(data.period);
        const endDate = new Date(createdAt);
        endDate.setDate(createdAt.getDate() + periodDays);
        
        periodCounts[data.period] = (periodCounts[data.period] || 0) + 1;
        
        // Parse price using utility function
        const price = parseAnalyticsPrice(data.price || data.amount);
        totalRevenue += price;
        
        if (!tenantsByEmail.has(data.email)) {
          tenantsByEmail.set(data.email, []);
        }
        tenantsByEmail.get(data.email)!.push({ ...data, endDate, createdAt, parsedPrice: price });
      });
      
      tenantsByEmail.forEach((transactions, email) => {
        transactions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const first = transactions[0];
        
        if (now <= first.endDate) {
          const daysLeft = Math.ceil((first.endDate.getTime() - now.getTime()) / (1000*60*60*24));
          activeCount++;
          if (daysLeft <= 7) expiringCount++;
        } else {
          expiredCount++;
        }
      });
      
      let mostPopular = 'N/A';
      let maxCount = 0;
      Object.entries(periodCounts).forEach(([period, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostPopular = period;
        }
      });
      
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);
      
      let revenue7Days = 0;
      let revenueMonthly = 0;
      let revenueYearly = 0;
      
      transactionsSnap.docs.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate() || new Date();
        
        // Parse price using utility function
        const price = parseAnalyticsPrice(data.price || data.amount);
        
        if (createdAt >= sevenDaysAgo) revenue7Days += price;
        if (createdAt >= monthStart) revenueMonthly += price;
        if (createdAt >= yearStart) revenueYearly += price;
      });
      
      setFilteredRevenue({ '7days': revenue7Days, 'monthly': revenueMonthly, 'yearly': revenueYearly });
      
      setSubscriptionAnalytics({
        totalSubscriptions: tenantsByEmail.size,
        activeCount,
        expiredCount,
        expiringCount,
        revenue: totalRevenue,
        mostPopularPeriod: mostPopular
      });
      
      setPeriodCounts(periodCounts);
    } catch (error) {
      console.error('Error loading subscription analytics:', error);
    }
  };

  const getPeriodDays = (period: string): number => {
    switch (period) {
      case '1 month': return 30;
      case '6 months': return 180;
      case '1 year': return 365;
      case '2 years': return 730;
      default: return 30;
    }
  };

  const getSubscriptionPeriodCount = (period: string): number => {
    return periodCounts[period] || 0;
  };
  
  const getFilteredRevenue = (): number => {
    return filteredRevenue[revenueFilter] || 0;
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
    <SuperAdminLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading system data...</Text>
          </View>
        ) : (
          <>
            {/* Analytics Section */}
            <View style={[styles.section, { marginTop: 30 }]}>
              <Text style={styles.sectionTitle}>Analytics Overview</Text>
              <View style={styles.analyticsContainer}>
                {/* Revenue Analytics */}
                <View style={styles.analyticsCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.analyticsCardTitle}>Revenue Analytics</Text>
                    <View style={styles.headerControls}>
                      <View style={styles.filterButtons}>
                        {['7days', 'monthly', 'yearly'].map((filter) => (
                          <TouchableOpacity
                            key={filter}
                            style={[styles.filterButton, revenueFilter === filter && styles.activeFilterButton]}
                            onPress={() => setRevenueFilter(filter as any)}
                          >
                            <Text style={[styles.filterButtonText, revenueFilter === filter && styles.activeFilterButtonText]}>
                              {filter === '7days' ? '7D' : filter === 'monthly' ? 'M' : 'Y'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TouchableOpacity 
                        style={styles.toggleButton}
                        onPress={() => setRevenueViewMode(revenueViewMode === 'numbers' ? 'graph' : 'numbers')}
                      >
                        <Ionicons 
                          name={revenueViewMode === 'numbers' ? 'bar-chart' : 'calculator'} 
                          size={16} 
                          color={Colors.primary} 
                        />
                        <Text style={styles.toggleText}>{revenueViewMode === 'numbers' ? 'Graph' : 'Numbers'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {revenueViewMode === 'numbers' ? (
                    <View style={styles.revenueDisplay}>
                      <Ionicons name="cash" size={48} color="#3B82F6" style={{ marginBottom: 16 }} />
                      <Text style={styles.revenueValue}>₱{getFilteredRevenue().toLocaleString()}</Text>
                      <Text style={styles.revenueLabel}>Total Revenue ({revenueFilter === '7days' ? 'Last 7 Days' : revenueFilter === 'monthly' ? 'This Month' : 'This Year'})</Text>
                    </View>
                  ) : (
                    <View style={styles.lineGraphContainer}>
                      {(() => {
                        const now = new Date();
                        let data = [];
                        let labels = [];
                        
                        if (revenueFilter === '7days') {
                          // Last 7 days
                          for (let i = 6; i >= 0; i--) {
                            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                            const dayRevenue = transactionsSnapshot?.docs?.reduce((sum, doc) => {
                              const docData = doc.data();
                              const docDate = docData.createdAt?.toDate();
                              if (docDate && docDate.toDateString() === date.toDateString()) {
                                return sum + parseAnalyticsPrice(docData.price || docData.amount);
                              }
                              return sum;
                            }, 0) || 0;
                            data.push(dayRevenue);
                            labels.push(date.toLocaleDateString('en', { weekday: 'short' }));
                          }
                        } else if (revenueFilter === 'monthly') {
                          // Last 12 months
                          for (let i = 11; i >= 0; i--) {
                            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                            const monthRevenue = transactionsSnapshot?.docs?.reduce((sum, doc) => {
                              const docData = doc.data();
                              const docDate = docData.createdAt?.toDate();
                              if (docDate && docDate.getMonth() === date.getMonth() && docDate.getFullYear() === date.getFullYear()) {
                                return sum + parseAnalyticsPrice(docData.price || docData.amount);
                              }
                              return sum;
                            }, 0) || 0;
                            data.push(monthRevenue);
                            labels.push(date.toLocaleDateString('en', { month: 'short' }));
                          }
                        } else {
                          // Last 5 years
                          for (let i = 4; i >= 0; i--) {
                            const year = now.getFullYear() - i;
                            const yearRevenue = transactionsSnapshot?.docs?.reduce((sum, doc) => {
                              const docData = doc.data();
                              const docDate = docData.createdAt?.toDate();
                              if (docDate && docDate.getFullYear() === year) {
                                return sum + parseAnalyticsPrice(docData.price || docData.amount);
                              }
                              return sum;
                            }, 0) || 0;
                            data.push(yearRevenue);
                            labels.push(year.toString());
                          }
                        }
                        
                        const maxValue = Math.max(...data, 1);
                        
                        const chartWidth = 520;
                        const chartHeight = 180;
                        const padding = 35;
                        
                        // Calculate points for SVG path
                        const points = data.map((value, index) => {
                          const x = padding + (index / Math.max(data.length - 1, 1)) * (chartWidth - 2 * padding);
                          const y = chartHeight - padding - ((value / maxValue) * (chartHeight - 2 * padding));
                          return { x, y, value };
                        });
                        
                        // Create smooth path
                        const createPath = () => {
                          if (points.length < 2) return '';
                          let path = `M ${points[0].x} ${points[0].y}`;
                          for (let i = 1; i < points.length; i++) {
                            const prev = points[i - 1];
                            const curr = points[i];
                            const cpx1 = prev.x + (curr.x - prev.x) * 0.5;
                            const cpy1 = prev.y;
                            const cpx2 = curr.x - (curr.x - prev.x) * 0.5;
                            const cpy2 = curr.y;
                            path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
                          }
                          return path;
                        };
                        
                        return (
                          <View style={styles.chartContainer}>
                            <Svg width={chartWidth} height={chartHeight} style={styles.svgChart}>
                              {/* Grid lines */}
                              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                                const y = chartHeight - padding - (ratio * (chartHeight - 2 * padding));
                                return (
                                  <Line
                                    key={index}
                                    x1={padding}
                                    y1={y}
                                    x2={chartWidth - padding}
                                    y2={y}
                                    stroke="#F1F5F9"
                                    strokeWidth="0.8"
                                    opacity="0.7"
                                  />
                                );
                              })}
                              
                              {/* Gradient definition */}
                              <defs>
                                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="1" />
                                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity="1" />
                                </linearGradient>
                              </defs>
                              
                              {/* Main line */}
                              <Path
                                d={createPath()}
                                stroke="#3B82F6"
                                strokeWidth="1.5"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              
                              {/* Data points */}
                              {points.map((point, index) => (
                                <Circle
                                  key={index}
                                  cx={point.x}
                                  cy={point.y}
                                  r="3"
                                  fill="#3B82F6"
                                  stroke="#FFFFFF"
                                  strokeWidth="1"
                                />
                              ))}
                              
                              {/* Y-axis labels */}
                              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                                const y = chartHeight - padding - (ratio * (chartHeight - 2 * padding));
                                const value = maxValue * ratio;
                                return (
                                  <SvgText
                                    key={index}
                                    x={padding - 8}
                                    y={y + 3}
                                    fontSize="10"
                                    fill="#64748B"
                                    textAnchor="end"
                                    fontWeight="500"
                                  >
                                    ₱{value > 1000 ? `${(value/1000).toFixed(0)}k` : value.toFixed(0)}
                                  </SvgText>
                                );
                              })}
                            </Svg>
                            
                            <View style={styles.xAxisLabels}>
                              {labels.map((label, index) => (
                                <Text key={index} style={styles.axisLabel}>{label}</Text>
                              ))}
                            </View>
                          </View>
                        );
                      })()
                      }
                    </View>
                  )}
                </View>
                
                {/* Subscription Periods Bar Graph */}
                <View style={styles.analyticsCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.analyticsCardTitle}>Popular Subscription Periods</Text>
                    <Text style={styles.totalSubscriptionsText}>Total: {subscriptionAnalytics.totalSubscriptions}</Text>
                  </View>
                  <View style={styles.barGraphContainer}>
                    {['1 month', '6 months', '1 year', '2 years'].map((period, index) => {
                      const count = getSubscriptionPeriodCount(period);
                      const maxCount = Math.max(...['1 month', '6 months', '1 year', '2 years'].map(p => getSubscriptionPeriodCount(p)));
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      
                      return (
                        <View key={period} style={styles.barItem}>
                          <Text style={styles.barLabel}>{period}</Text>
                          <View style={styles.barContainer}>
                            <View style={[styles.bar, { width: `${percentage}%`, backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index] }]} />
                          </View>
                          <Text style={styles.barValue}>{count}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
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

              </View>
            </View>

            {/* Subscription Analytics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subscription Analytics</Text>
              <View style={styles.metricsGrid}>

                <View style={styles.metricCard}>
                  <Ionicons name="checkmark-done-circle" size={32} color="#10B981" style={{ marginBottom: 8 }} />
                  <Text style={[styles.metricValue, { color: '#10B981' }]}>{subscriptionAnalytics.activeCount}</Text>
                  <Text style={styles.metricLabel}>Active</Text>
                </View>
                <View style={styles.metricCard}>
                  <Ionicons name="time" size={32} color="#F59E0B" style={{ marginBottom: 8 }} />
                  <Text style={[styles.metricValue, { color: '#F59E0B' }]}>{subscriptionAnalytics.expiringCount}</Text>
                  <Text style={styles.metricLabel}>Expiring Soon (≤7 days)</Text>
                </View>
                <View style={styles.metricCard}>
                  <Ionicons name="close-circle" size={32} color="#EF4444" style={{ marginBottom: 8 }} />
                  <Text style={[styles.metricValue, { color: '#EF4444' }]}>{subscriptionAnalytics.expiredCount}</Text>
                  <Text style={styles.metricLabel}>Expired</Text>
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
    </SuperAdminLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xxlarge,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: Typography.title,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: Spacing.large,
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
  analyticsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    minHeight: 230,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  analyticsCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#800000',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    padding: 2,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  activeFilterButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  revenueDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 267,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  revenueLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  graphPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  graphText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  graphSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  barGraphContainer: {
    width: 520,
    height: 180,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 35,
    marginTop: 40,
  },
  barItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barLabel: {
    fontSize: 12,
    color: '#374151',
    width: 60,
    fontWeight: '500',
  },
  barContainer: {
    flex: 1,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
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
  totalSubscriptionsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  lineGraphContainer: {
    paddingVertical: 20,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  svgChart: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 520,
    paddingHorizontal: 35,
    marginTop: 12,
  },
  axisLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});