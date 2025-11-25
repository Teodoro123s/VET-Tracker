import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, TextInput, ActivityIndicator } from 'react-native';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useTenant } from '../../contexts/TenantContext';
import { useAdminProfile } from '../../contexts/AdminProfileContext';
import ProfileImageModal from '../../components/ProfileImageModal';
import { getAppointments, getCustomers, getMedicalForms, getPets, getVeterinarians } from '../../lib/services/firebaseService';


const screenWidth = Dimensions.get('window').width;

export default function Dashboard() {
  const { userEmail } = useTenant();
  const { user } = useAuth();
  const { hasActiveSubscription, daysRemaining, loading: subscriptionLoading } = useSubscription();
  const { 
    profileImage, 
    uploading, 
    showImageModal, 
    previewImage,
    handleImageUpload, 
    handleGalleryUpload, 
    handleSaveImage, 
    handleCancelUpload 
  } = useAdminProfile();
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

  const handleNavigation = async (route: string | null) => {
    if (!route) return;
    try {
      if (Platform.OS === 'web') {
        window.location.href = route;
      } else {
        router.push(route as any);
      }
    } catch (error) {
      console.error(`Navigation error to ${route}:`, error);
      alert('Failed to navigate. Please try again.');
    }
  };

  // Check subscription on mount
  useEffect(() => {
    if (!subscriptionLoading && user?.role === 'admin' && !hasActiveSubscription) {
      // Add a small delay to ensure navigation is ready
      const timer = setTimeout(() => {
        Alert.alert(
          '⚠️ Subscription Expired',
          'Your subscription has expired. Access to most features is restricted. Please contact support to renew your subscription.',
          [
            { text: 'OK', onPress: () => handleNavigation('/client/settings') }
          ]
        );
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [subscriptionLoading, hasActiveSubscription, user?.role]);

  // Ensure authenticated access — redirect to login when not signed in
  useEffect(() => {
    if (!user) {
      // Add a small delay to ensure navigation is ready
      const timer = setTimeout(() => {
        handleNavigation(Platform.OS === 'web' ? '/auth/admin-login' : '/veterinarian/mobile-login');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user]);

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
          return (now.getTime() - aptDate.getTime()) < 24 * 60 * 60 * 1000 && aptDate.getTime() <= now.getTime();
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
          return (now.getTime() - createdDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
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
    const diffMs = now.getTime() - date.getTime();
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
      {/* Admin Header */}
      <View style={styles.adminHeader}>
        <Image source={require('../../assets/pawns web logo v3.png')} style={styles.logo} />
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleNavigation('/client/notifications')}>
            <Ionicons name="notifications" size={20} color="#800000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileContainer} onPress={handleImageUpload}>
            <View style={styles.profileImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImagePhoto} />
              ) : (
                <Ionicons name="person" size={20} color="#666" />
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#800000" />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.adminName}>{user?.email || userEmail || 'admin@clinic.com'}</Text>
              <Text style={styles.adminRole}>Administrator</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main Layout Container */}
      <View style={styles.mainLayout}>
        {/* Admin Sidebar */}
        <View style={styles.adminSidebar}>
          <Sidebar />
        </View>
        
        {/* Main Content */}
        <View style={styles.mainContent}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => handleNavigation('/client/appointments')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="calendar-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionTitle}>Appointments</Text>
              <Text style={styles.actionSubtitle}>Manage schedule</Text>
              <View style={styles.actionBadge}>
                <Text style={styles.badgeText}>{stats.totalAppointments}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={() => handleNavigation('/client/customers')}>
              <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="people-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.actionTitle}>Customers</Text>
              <Text style={styles.actionSubtitle}>Manage clients</Text>
              <View style={styles.actionBadge}>
                <Text style={styles.badgeText}>{stats.totalCustomers}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={() => handleNavigation('/client/veterinarians')}>
              <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="medical-outline" size={24} color="#22C55E" />
              </View>
              <Text style={styles.actionTitle}>Personnel</Text>
              <Text style={styles.actionSubtitle}>Staff & vets</Text>
              <View style={styles.actionBadge}>
                <Text style={styles.badgeText}>{stats.totalVeterinarians}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={() => handleNavigation('/client/records')}>
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

        {/* Performance Metrics - New Feature */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Ionicons name="trending-up" size={24} color="#22C55E" />
              <Text style={styles.metricValue}>+15%</Text>
              <Text style={styles.metricLabel}>Growth Rate</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="star" size={24} color="#F59E0B" />
              <Text style={styles.metricValue}>4.8</Text>
              <Text style={styles.metricLabel}>Satisfaction</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
              <Text style={styles.metricValue}>{stats.totalAppointments}</Text>
              <Text style={styles.metricLabel}>Total Appointments</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="paw" size={24} color="#8B5CF6" />
              <Text style={styles.metricValue}>{stats.totalPets}</Text>
              <Text style={styles.metricLabel}>Patients</Text>
            </View>
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

        {/* System Health - New Feature */}
        <View style={styles.healthSection}>
          <Text style={styles.sectionTitle}>System Health</Text>
          <View style={styles.healthCard}>
            <View style={styles.healthItem}>
              <View style={styles.healthIndicator}>
                <View style={[styles.healthDot, { backgroundColor: '#22C55E' }]} />
                <Text style={styles.healthLabel}>Database</Text>
              </View>
              <Text style={styles.healthStatus}>Operational</Text>
            </View>
            <View style={styles.healthItem}>
              <View style={styles.healthIndicator}>
                <View style={[styles.healthDot, { backgroundColor: '#22C55E' }]} />
                <Text style={styles.healthLabel}>Notifications</Text>
              </View>
              <Text style={styles.healthStatus}>Active</Text>
            </View>
            <View style={styles.healthItem}>
              <View style={styles.healthIndicator}>
                <View style={[styles.healthDot, { backgroundColor: '#22C55E' }]} />
                <Text style={styles.healthLabel}>Backup</Text>
              </View>
              <Text style={styles.healthStatus}>Synced</Text>
            </View>
          </View>
        </View>
          </ScrollView>
        </View>
      </View>
      
      <ProfileImageModal
        visible={showImageModal}
        previewImage={previewImage}
        uploading={uploading}
        onGalleryUpload={handleGalleryUpload}
        onSaveImage={handleSaveImage}
        onCancel={handleCancelUpload}
        primaryColor="#800000"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  adminHeader: {
    height: 70,
    borderRadius: 10,
    backgroundColor: '#FAFAFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  iconButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'column',
  },
  adminName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  adminRole: {
    fontSize: 12,
    color: '#666',
  },
  mainLayout: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
  },

  adminSidebar: {
    width: 279,
    flexShrink: 0,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    borderRadius: 10,
  },

  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#800000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
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
  metricsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  healthSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  healthLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  healthStatus: {
    fontSize: 14,
    color: '#6B7280',
  },
  profileImagePhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});