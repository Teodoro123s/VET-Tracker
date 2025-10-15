import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/config/firebaseConfig';
import { Colors } from '@/constants/Colors';
import { getAppointments, getMedicalRecords } from '@/lib/services/firebaseService';
import { paginatedFirebaseService } from '@/lib/services/paginatedFirebaseService';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function VetMobile() {
  const router = useRouter();
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vetStats, setVetStats] = useState({
    todayAppointments: 0,
    pendingRecords: 0,
    weeklyAppointments: 0,
    completedToday: 0,
    upcomingAppointments: 0,
    totalPatients: 0
  });

  const [Chart, setChart] = useState(null);
  const [chartData, setChartData] = useState({
    weeklyAppointments: [2, 4, 3, 5, 6, 4, 3],
    appointmentTypes: [15, 8, 5, 3],
    patientSpecies: [25, 15, 8, 2]
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        import('react-apexcharts').then((module) => {
          setChart(() => module.default);
        }).catch(() => {
          // Charts not available
        });
      } catch {
        // Charts not available
      }
    }
  }, []);

  const getChartOptions = (type) => {
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
      case 'weekly':
        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: 'line' },
          xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
          colors: ['#800000'],
          stroke: { curve: 'smooth', width: 3 },
          markers: { size: 6 },
          grid: { show: true, borderColor: '#e2e8f0' }
        };
      case 'types':
        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: 'pie' },
          labels: ['Checkup', 'Vaccination', 'Surgery', 'Emergency'],
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
        };
      case 'species':
        return {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: 'donut' },
          labels: ['Dogs', 'Cats', 'Birds', 'Others'],
          colors: ['#8b5cf6', '#ef4444', '#10b981', '#f59e0b']
        };
      default:
        return baseOptions;
    }
  };
  const [vetDetails, setVetDetails] = useState({
    name: 'Loading...',
    email: user?.email || '',
    license: 'Loading...',
    specialization: 'Loading...',
    phone: 'Loading...',
    experience: 'Loading...'
  });

  useEffect(() => {
    if (user?.email) {
      Promise.all([fetchVetDetails(), fetchVetStats()])
        .finally(() => setLoading(false));
    }
  }, [user]);

  const fetchVetDetails = async () => {
    if (!user?.email) return;
    
    try {
      // Query veterinarians collection directly
      const vetQuery = query(
        collection(db, 'veterinarians'),
        where('email', '==', user.email)
      );
      
      const vetSnapshot = await getDocs(vetQuery);
      
      if (!vetSnapshot.empty) {
        const vetData = vetSnapshot.docs[0].data();
        setVetDetails({
          name: vetData.name || 'Dr. Veterinarian',
          email: vetData.email || user.email,
          license: vetData.license || 'Not provided',
          specialization: vetData.specialization || 'Not provided',
          phone: vetData.phone || 'Not provided',
          experience: vetData.experience || 'Not provided'
        });
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const fetchVetStats = async () => {
    if (!user?.email) {
      setVetStats({
        todayAppointments: 0,
        pendingRecords: 0,
        weeklyAppointments: 0,
        completedToday: 0,
        upcomingAppointments: 0,
        totalPatients: 0
      });
      return;
    }
    
    const mockStats = {
      todayAppointments: 3,
      pendingRecords: 2,
      weeklyAppointments: 15,
      completedToday: 1,
      upcomingAppointments: 5,
      totalPatients: 25
    };
    
    setVetStats(mockStats);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome, {vetDetails.name}</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</Text>
        </View>




        {/* Enhanced Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/veterinarian/vet-appointments')}>
            <Ionicons name="calendar" size={24} color={Colors.primary} />
            <ThemedText style={styles.statValue}>{vetStats.todayAppointments}</ThemedText>
            <ThemedText style={styles.statLabel}>Today</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <ThemedText style={styles.statValue}>{vetStats.completedToday}</ThemedText>
            <ThemedText style={styles.statLabel}>Completed</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard}>
            <Ionicons name="time" size={24} color="#f59e0b" />
            <ThemedText style={styles.statValue}>{vetStats.upcomingAppointments}</ThemedText>
            <ThemedText style={styles.statLabel}>Upcoming</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard}>
            <Ionicons name="people" size={24} color="#8b5cf6" />
            <ThemedText style={styles.statValue}>{vetStats.totalPatients}</ThemedText>
            <ThemedText style={styles.statLabel}>Patients</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Analytics Section */}
        <View style={styles.analyticsSection}>
          <ThemedText style={styles.sectionTitle}>Weekly Overview</ThemedText>
          <View style={styles.analyticsCard}>
            {Platform.OS === 'web' && Chart ? (
              <Chart
                options={getChartOptions('weekly')}
                series={[{ name: 'Appointments', data: chartData.weeklyAppointments }]}
                type="line"
                height={180}
              />
            ) : (
              <View style={styles.chartPlaceholder}>
                <Ionicons name="analytics" size={40} color={Colors.primary} />
                <Text style={styles.placeholderText}>Weekly Appointments</Text>
                <Text style={styles.placeholderSubText}>View on web for charts</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/veterinarian/vet-medical-record')}>
              <Ionicons name="add-circle" size={32} color={Colors.primary} />
              <Text style={styles.actionText}>New Record</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/veterinarian/vet-customers')}>
              <Ionicons name="search" size={32} color={Colors.primary} />
              <Text style={styles.actionText}>Search Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/veterinarian/vet-calendar')}>
              <Ionicons name="calendar" size={32} color={Colors.primary} />
              <Text style={styles.actionText}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/veterinarian/vet-appointments')}>
              <Ionicons name="list" size={32} color={Colors.primary} />
              <Text style={styles.actionText}>Appointments</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivity}>
          <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Completed checkup for Max</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="document-text" size={20} color="#3b82f6" />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Updated medical record for Bella</Text>
                <Text style={styles.activityTime}>4 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="calendar" size={20} color="#f59e0b" />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Scheduled surgery for Charlie</Text>
                <Text style={styles.activityTime}>Yesterday</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Profile Modal */}
      <Modal
        visible={showProfile}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Veterinarian Profile</ThemedText>
              <TouchableOpacity onPress={() => setShowProfile(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileDetails}>
              <View style={styles.profileRow}>
                <ThemedText style={styles.profileLabel}>Name:</ThemedText>
                <ThemedText style={styles.profileValue}>{vetDetails.name}</ThemedText>
              </View>
              <View style={styles.profileRow}>
                <ThemedText style={styles.profileLabel}>Email:</ThemedText>
                <ThemedText style={styles.profileValue}>{vetDetails.email}</ThemedText>
              </View>
              <View style={styles.profileRow}>
                <ThemedText style={styles.profileLabel}>Phone:</ThemedText>
                <ThemedText style={styles.profileValue}>{vetDetails.phone}</ThemedText>
              </View>
              <View style={styles.profileRow}>
                <ThemedText style={styles.profileLabel}>License:</ThemedText>
                <ThemedText style={styles.profileValue}>{vetDetails.license}</ThemedText>
              </View>
              <View style={styles.profileRow}>
                <ThemedText style={styles.profileLabel}>Specialization:</ThemedText>
                <ThemedText style={styles.profileValue}>{vetDetails.specialization}</ThemedText>
              </View>
              <View style={styles.profileRow}>
                <ThemedText style={styles.profileLabel}>Experience:</ThemedText>
                <ThemedText style={styles.profileValue}>{vetDetails.experience}</ThemedText>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                setShowProfile(false);
                router.push('/');
              }}
            >
              <Ionicons name="log-out" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.notificationTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.notificationList}>
              <View style={styles.notificationItem}>
                <Ionicons name="time" size={20} color="#FFA500" />
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationItemTitle}>Appointment Pending</Text>
                  <Text style={styles.notificationText}>John Smith - Buddy needs approval</Text>
                  <Text style={styles.notificationTime}>Today at 2:00 PM</Text>
                </View>
              </View>
              
              <View style={styles.notificationItem}>
                <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationItemTitle}>Appointment Due</Text>
                  <Text style={styles.notificationText}>Sarah Johnson - Max appointment is due</Text>
                  <Text style={styles.notificationTime}>Today at 3:30 PM</Text>
                </View>
              </View>
              
              <View style={styles.notificationItem}>
                <Ionicons name="calendar" size={20} color="#4ECDC4" />
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationItemTitle}>Upcoming Appointment</Text>
                  <Text style={styles.notificationText}>Mike Davis - Luna scheduled tomorrow</Text>
                  <Text style={styles.notificationTime}>Tomorrow at 10:00 AM</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    color: Colors.text.primary,
    marginBottom: 5,
  },
  dateText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  vetDetailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 3,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 8,
    width: 70,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text.muted,
    flex: 1,
    fontStyle: 'italic',
  },
  detailValueActive: {
    color: Colors.text.primary,
    fontStyle: 'normal',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    elevation: 3,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  quickActions: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    elevation: 2,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  actionText: {
    fontSize: 12,
    color: Colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 55, 72, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  profileDetails: {
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  profileLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    width: 120,
  },
  profileValue: {
    fontSize: 16,
    color: Colors.text.secondary,
    flex: 1,
  },
  logoutButton: {
    backgroundColor: Colors.status.error,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
  },

  notificationModal: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 0,
    width: '90%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  notificationList: {
    maxHeight: 400,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    alignItems: 'flex-start',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.text.muted,
    fontStyle: 'italic',
  },
  analyticsSection: {
    marginBottom: 24,
  },
  analyticsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  chartPlaceholder: {
    alignItems: 'center',
    paddingVertical: 30,
    minHeight: 180,
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 8,
  },
  placeholderSubText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  recentActivity: {
    marginBottom: 24,
  },
  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
});