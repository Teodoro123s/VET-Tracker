import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCustomers, getAppointments, getVeterinarians, getPets, getMedicalForms } from '../../lib/services/firebaseService';
import { useTenant } from '../../contexts/TenantContext';
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
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);

  useEffect(() => {
    if (userEmail) {
      loadDashboardData();
    }
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
      const todayAppointmentsCount = appointments.filter(apt => {
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
        appointmentsToday: todayAppointmentsCount,
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
      }).slice(0, 5);
      setTodayAppointments(todayAppointmentDetails);

      // Generate recent activity
      generateRecentActivity(customers, appointments, pets);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivity = (customers, appointments, pets) => {
    const activities = [];
    const now = new Date();

    // Recent appointments
    const recentAppointments = appointments
      .filter(apt => {
        try {
          const aptDate = apt.appointmentDate?.seconds 
            ? new Date(apt.appointmentDate.seconds * 1000)
            : new Date(apt.appointmentDate);
          return (now - aptDate) < 24 * 60 * 60 * 1000 && aptDate <= now;
        } catch { return false; }
      })
      .slice(0, 2);

    recentAppointments.forEach((apt, index) => {
      activities.push({
        id: `apt-${index}`,
        type: 'appointment',
        message: `Appointment: ${apt.petName || 'Pet'} with ${apt.veterinarian || 'Doctor'}`,
        time: getTimeAgo(apt.appointmentDate?.seconds ? new Date(apt.appointmentDate.seconds * 1000) : new Date(apt.appointmentDate)),
        icon: 'calendar'
      });
    });

    // Recent customers
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
      const firstName = customer.firstname || customer.firstName || customer.name || 'Customer';
      const lastName = customer.lastname || customer.lastName || '';
      const fullName = lastName ? `${firstName} ${lastName}` : firstName;
      
      activities.push({
        id: `cust-${index}`,
        type: 'customer',
        message: `New customer: ${fullName}`,
        time: getTimeAgo(customer.createdAt?.seconds ? new Date(customer.createdAt.seconds * 1000) : new Date(customer.createdAt || customer.dateAdded)),
        icon: 'person-add'
      });
    });

    setRecentActivity(activities.slice(0, 4));
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'appointment': return '#F59E0B';
      case 'customer': return '#3B82F6';
      case 'pet': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

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
              <Text style={styles.actionSubtitle}>Manage clients</Text>
              <View style={styles.actionBadge}>
                <Text style={styles.badgeText}>{stats.totalCustomers}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/client/veterinarians')}>
              <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="medical-outline" size={24} color="#22C55E" />
              </View>
              <Text style={styles.actionTitle}>Personnel</Text>
              <Text style={styles.actionSubtitle}>Staff & vets</Text>
              <View style={styles.actionBadge}>
                <Text style={styles.badgeText}>{stats.totalVeterinarians}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/client/records')}>
              <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="document-text-outline" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.actionTitle}>Records</Text>
              <Text style={styles.actionSubtitle}>Medical records</Text>
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
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <View key={activity.id} style={styles.activityItem}>
                      <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type) }]}>
                        <Ionicons name={activity.icon} size={16} color="#FFFFFF" />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityMessage}>{activity.message}</Text>
                        <Text style={styles.activityTime}>{activity.time}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.activityItem}>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityMessage}>No recent activity</Text>
                    </View>
                  </View>
                )}
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
    height: 250,
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#7B2A3B',
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
    color: '#FFFFFF',
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
    height: 250,
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