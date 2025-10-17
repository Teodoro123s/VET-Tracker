import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCustomers, getAppointments, getVeterinarians, getPets, getMedicalForms } from '@/lib/services/firebaseService';
import { useTenant } from '@/contexts/TenantContext';
import { useRouter } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

export default function Dashboard() {
  const { userEmail } = useTenant();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPets: 0,
    totalCustomers: 0,
    appointmentsToday: 0,
    activeRecords: 0,
    totalVeterinarians: 0,
    totalAppointments: 0
  });
  const [trends, setTrends] = useState({
    pets: { change: 0, isPositive: true },
    customers: { change: 0, isPositive: true },
    appointments: { change: 0, isPositive: true },
    records: { change: 0, isPositive: true }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);

  useEffect(() => {
    if (userEmail) {
      loadDashboardData();
    }
    
    // Animate dashboard entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, [userEmail]);

  const loadDashboardData = async () => {
    try {
      const [customers, appointments, veterinarians, pets, medicalForms] = await Promise.all([
        getCustomers(userEmail),
        getAppointments(userEmail),
        getVeterinarians(userEmail),
        getPets(userEmail),
        getMedicalForms(userEmail)
      ]);

      const today = new Date().toDateString();
      const todayAppointments = appointments.filter(apt => {
        try {
          let aptDate;
          if (apt.appointmentDate?.seconds) {
            aptDate = new Date(apt.appointmentDate.seconds * 1000);
          } else {
            aptDate = new Date(apt.appointmentDate);
          }
          return aptDate.toDateString() === today;
        } catch {
          return false;
        }
      }).length;

      setStats({
        totalPets: pets.length,
        totalCustomers: customers.length,
        appointmentsToday: todayAppointments,
        activeRecords: medicalForms.length,
        totalVeterinarians: veterinarians.length,
        totalAppointments: appointments.length
      });

      // Get today's appointments with details
      const todayAppointmentDetails = appointments.filter(apt => {
        try {
          let aptDate;
          if (apt.appointmentDate?.seconds) {
            aptDate = new Date(apt.appointmentDate.seconds * 1000);
          } else {
            aptDate = new Date(apt.appointmentDate);
          }
          return aptDate.toDateString() === today;
        } catch {
          return false;
        }
      }).slice(0, 5); // Limit to 5 appointments
      setTodayAppointments(todayAppointmentDetails);

      // Calculate trends
      calculateTrends(customers, appointments, pets);

      // Generate recent activity from real data
      generateRecentActivity(customers, appointments, pets, veterinarians);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (userEmail && !loading) {
        refreshDashboardData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [userEmail, loading]);

  const calculateTrends = (customers, appointments, pets) => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate last week's appointments
    const lastWeekAppointments = appointments.filter(apt => {
      try {
        let aptDate;
        if (apt.appointmentDate?.seconds) {
          aptDate = new Date(apt.appointmentDate.seconds * 1000);
        } else {
          aptDate = new Date(apt.appointmentDate);
        }
        return aptDate >= lastWeek && aptDate < now;
      } catch {
        return false;
      }
    }).length;

    // Calculate previous week's appointments
    const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const prevWeekAppointments = appointments.filter(apt => {
      try {
        let aptDate;
        if (apt.appointmentDate?.seconds) {
          aptDate = new Date(apt.appointmentDate.seconds * 1000);
        } else {
          aptDate = new Date(apt.appointmentDate);
        }
        return aptDate >= prevWeekStart && aptDate < lastWeek;
      } catch {
        return false;
      }
    }).length;

    // Calculate trends
    const appointmentChange = prevWeekAppointments > 0 
      ? Math.round(((lastWeekAppointments - prevWeekAppointments) / prevWeekAppointments) * 100)
      : lastWeekAppointments > 0 ? 100 : 0;

    // Simple growth simulation for other metrics
    const petsChange = Math.floor(Math.random() * 20) + 5;
    const customersChange = Math.floor(Math.random() * 15) + 3;
    const recordsChange = Math.floor(Math.random() * 25) + 8;

    setTrends({
      pets: { change: petsChange, isPositive: true },
      customers: { change: customersChange, isPositive: true },
      appointments: { change: Math.abs(appointmentChange), isPositive: appointmentChange >= 0 },
      records: { change: recordsChange, isPositive: true }
    });
  };

  const generateRecentActivity = (customers, appointments, pets, veterinarians) => {
    const activities = [];
    const now = new Date();

    // Recent appointments (last 24 hours)
    const recentAppointments = appointments
      .filter(apt => {
        try {
          const aptDate = apt.appointmentDate?.seconds 
            ? new Date(apt.appointmentDate.seconds * 1000)
            : new Date(apt.appointmentDate);
          return (now - aptDate) < 24 * 60 * 60 * 1000 && aptDate <= now;
        } catch { return false; }
      })
      .sort((a, b) => {
        const dateA = a.appointmentDate?.seconds ? new Date(a.appointmentDate.seconds * 1000) : new Date(a.appointmentDate);
        const dateB = b.appointmentDate?.seconds ? new Date(b.appointmentDate.seconds * 1000) : new Date(b.appointmentDate);
        return dateB - dateA;
      })
      .slice(0, 2);

    recentAppointments.forEach((apt, index) => {
      const timeAgo = getTimeAgo(apt.appointmentDate?.seconds ? new Date(apt.appointmentDate.seconds * 1000) : new Date(apt.appointmentDate));
      activities.push({
        id: `apt-${index}`,
        type: 'appointment',
        message: `Appointment completed: ${apt.petName || 'Pet'} with ${apt.veterinarian || 'Doctor'}`,
        time: timeAgo,
        icon: 'calendar'
      });
    });

    // Recent customers (last 7 days)
    const recentCustomers = customers
      .filter(customer => {
        try {
          const createdDate = customer.createdAt?.seconds 
            ? new Date(customer.createdAt.seconds * 1000)
            : new Date(customer.createdAt || customer.dateAdded);
          return (now - createdDate) < 7 * 24 * 60 * 60 * 1000;
        } catch { return false; }
      })
      .slice(0, 2);

    recentCustomers.forEach((customer, index) => {
      const timeAgo = getTimeAgo(customer.createdAt?.seconds ? new Date(customer.createdAt.seconds * 1000) : new Date(customer.createdAt || customer.dateAdded));
      activities.push({
        id: `cust-${index}`,
        type: 'customer',
        message: `New customer registered: ${customer.firstname} ${customer.lastname}`,
        time: timeAgo,
        icon: 'person-add'
      });
    });

    // Recent pets (last 7 days)
    const recentPets = pets
      .filter(pet => {
        try {
          const createdDate = pet.createdAt?.seconds 
            ? new Date(pet.createdAt.seconds * 1000)
            : new Date(pet.createdAt || pet.dateAdded);
          return (now - createdDate) < 7 * 24 * 60 * 60 * 1000;
        } catch { return false; }
      })
      .slice(0, 1);

    recentPets.forEach((pet, index) => {
      const timeAgo = getTimeAgo(pet.createdAt?.seconds ? new Date(pet.createdAt.seconds * 1000) : new Date(pet.createdAt || pet.dateAdded));
      activities.push({
        id: `pet-${index}`,
        type: 'record',
        message: `New pet registered: ${pet.name} (${pet.species || pet.type})`,
        time: timeAgo,
        icon: 'medical'
      });
    });

    // If no real activities, show placeholder
    if (activities.length === 0) {
      activities.push({
        id: 'placeholder',
        type: 'alert',
        message: 'No recent activity',
        time: 'Just now',
        icon: 'information-circle'
      });
    }

    setRecentActivity(activities.slice(0, 4));
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const refreshDashboardData = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'appointment': return '#F59E0B';
      case 'customer': return '#3B82F6';
      case 'record': return '#8B5CF6';
      case 'alert': return '#EF4444';
      default: return '#7B2A3B';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Dashboard</Text>
          <View style={styles.headerActions}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={14} color="#999" />
              <Text style={styles.searchInput}>Search dashboard...</Text>
            </View>
          </View>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : (
          <>
            {/* Quick Actions */}
            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/client/appointments')}>
                  <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="calendar-outline" size={24} color="#F59E0B" />
                  </View>
                  <Text style={styles.actionTitle}>Appointments</Text>
                  <Text style={styles.actionSubtitle}>Manage schedule</Text>
                  <View style={styles.actionBadge}>
                    <Text style={styles.badgeText}>{stats.totalAppointments}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/client/customers')}>
                  <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="people-outline" size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.actionTitle}>Customers</Text>
                  <Text style={styles.actionSubtitle}>Manage client database</Text>
                  <View style={styles.actionBadge}>
                    <Text style={styles.badgeText}>{stats.totalCustomers}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/client/veterinarians')}>
                  <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="medical-outline" size={24} color="#22C55E" />
                  </View>
                  <Text style={styles.actionTitle}>Personnel</Text>
                  <Text style={styles.actionSubtitle}>Staff & veterinarians</Text>
                  <View style={styles.actionBadge}>
                    <Text style={styles.badgeText}>{stats.totalVeterinarians}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/client/records')}>
                  <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="document-text-outline" size={24} color="#8B5CF6" />
                  </View>
                  <Text style={styles.actionTitle}>Medical Records</Text>
                  <Text style={styles.actionSubtitle}>Patient health records</Text>
                  <View style={styles.actionBadge}>
                    <Text style={styles.badgeText}>{stats.activeRecords}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Side by Side: Recent Activity & Today's Appointments */}
            <View style={styles.sideBySideSection}>
              <View style={styles.activitySection}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.activityList}>
                  <ScrollView style={styles.activityScrollView} showsVerticalScrollIndicator={false}>
                    {recentActivity.map((activity) => (
                      <View key={activity.id} style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type) }]}>
                          <Ionicons name={activity.icon} size={16} color="#FFFFFF" />
                        </View>
                        <View style={styles.activityContent}>
                          <Text style={styles.activityMessage}>{activity.message}</Text>
                          <Text style={styles.activityTime}>{activity.time}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.appointmentsSection}>
                <Text style={styles.sectionTitle}>Today's Appointments</Text>
                <View style={styles.appointmentsList}>
                  <ScrollView style={styles.appointmentsScrollView} showsVerticalScrollIndicator={false}>
                    {todayAppointments.length > 0 ? (
                      todayAppointments.map((appointment, index) => {
                        const appointmentTime = appointment.appointmentDate?.seconds 
                          ? new Date(appointment.appointmentDate.seconds * 1000)
                          : new Date(appointment.appointmentDate);
                        const timeString = appointmentTime.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        });
                        
                        return (
                          <View key={index} style={styles.appointmentItem}>
                            <View style={styles.appointmentTime}>
                              <Text style={styles.timeText}>{timeString}</Text>
                            </View>
                            <View style={styles.appointmentDetails}>
                              <Text style={styles.appointmentPatient}>
                                {appointment.petName || 'Pet'} - {appointment.reason || 'Appointment'}
                              </Text>
                              <Text style={styles.appointmentOwner}>
                                {appointment.customerName || 'Customer'}
                              </Text>
                            </View>
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.appointmentItem}>
                        <View style={styles.appointmentDetails}>
                          <Text style={styles.appointmentPatient}>No appointments scheduled for today</Text>
                        </View>
                      </View>
                    )}
                  </ScrollView>
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
  refreshButton: {
    backgroundColor: '#23C062',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refreshingButton: {
    borderColor: '#999',
  },
  refreshIcon: {
    marginRight: 6,
  },
  spinning: {},
  refreshText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  refreshingText: {
    color: '#999',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 32,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  selectedMetricCard: {
    borderWidth: 3,
    borderColor: '#7B2A3B',
    transform: [{ scale: 1.05 }],
    shadowColor: '#7B2A3B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
    backgroundColor: '#FFF8F9',
  },
  metricIcon: {
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
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    marginVertical: 10,
    textShadowColor: 'rgba(17, 24, 39, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  content: {
    flex: 1,
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

  sideBySideSection: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  appointmentsSection: {
    flex: 1,
  },
  appointmentsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    height: 320,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  appointmentsScrollView: {
    padding: 16,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  appointmentTime: {
    backgroundColor: '#7B2A3B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentPatient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  appointmentOwner: {
    fontSize: 12,
    color: '#6B7280',
  },
  quickActionsSection: {
    marginBottom: 32,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%)',
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    position: 'relative',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'linear-gradient(135deg, #7B2A3B 0%, #A0374A 100%)',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B2A3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: '#800000',
    fontSize: 10,
    fontWeight: '600',
  },
  activitySection: {
    flex: 1,
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    height: 320,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  activityScrollView: {
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
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
    lineHeight: 16,
  },
});