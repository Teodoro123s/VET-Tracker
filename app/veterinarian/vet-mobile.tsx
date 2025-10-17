import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, Alert, TextInput, Dimensions } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { addCustomer } from '@/lib/services/firebaseService';
import { Colors } from '@/constants/Colors';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function VetMobile() {
  const router = useRouter();
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstname: '',
    surname: '',
    email: '',
    contact: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vetStats, setVetStats] = useState({
    todayAppointments: 0,
    pendingRecords: 0,
    weeklyAppointments: 0,
    completedToday: 0,
    upcomingAppointments: 0,
    totalPatients: 0
  });
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0]);
  const [todayAppointmentsList, setTodayAppointmentsList] = useState([]);
  const [upcomingAppointmentsList, setUpcomingAppointmentsList] = useState([]);



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
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      await Promise.all([fetchVetDetails(), fetchVetStats()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const fetchVetDetails = async () => {
    if (!user?.email) return;
    
    try {
      const { getVeterinarians } = await import('@/lib/services/firebaseService');
      const vets = await getVeterinarians(user.email);
      const currentVet = vets.find(vet => vet.email === user.email);
      
      if (currentVet) {
        setVetDetails({
          name: currentVet.name || 'Dr. Veterinarian',
          email: currentVet.email || user.email,
          license: currentVet.license || 'Not Available',
          specialization: currentVet.specialization || 'General Practice',
          phone: currentVet.phone || 'Not Available',
          experience: 'Not Available'
        });
      } else {
        // Fallback if veterinarian not found in database
        setVetDetails({
          name: 'Dr. Veterinarian',
          email: user.email,
          license: 'Not Available',
          specialization: 'General Practice',
          phone: 'Not Available',
          experience: 'Not Available'
        });
      }
    } catch (error) {
      console.error('Error fetching vet details:', error);
      // Fallback to basic data on error
      setVetDetails({
        name: 'Dr. Veterinarian',
        email: user.email,
        license: 'Not Available',
        specialization: 'General Practice',
        phone: 'Not Available',
        experience: 'Not Available'
      });
    }
  };

  const fetchVetStats = async (retryCount = 0) => {
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
    
    try {
      const { getVeterinarianAppointments } = await import('@/lib/services/firebaseService');
      console.log('=== MOBILE DASHBOARD DEBUG ===');
      console.log('User email:', user.email);
      console.log('Retry count:', retryCount);
      
      const appointments = await getVeterinarianAppointments(user.email, user.email);
      console.log('Fetched appointments:', appointments.length);
      console.log('Sample appointment:', appointments[0]);
      
      const now = new Date();
      const today = now.toDateString();
      console.log('Today date string:', today);
      
      const todayApts = appointments.filter(apt => {
        try {
          const aptDate = apt.appointmentDate?.seconds 
            ? new Date(apt.appointmentDate.seconds * 1000)
            : new Date(apt.appointmentDate);
          return aptDate.toDateString() === today;
        } catch { return false; }
      });
      
      const upcomingApts = appointments.filter(apt => {
        try {
          const aptDate = apt.appointmentDate?.seconds 
            ? new Date(apt.appointmentDate.seconds * 1000)
            : new Date(apt.appointmentDate);
          return aptDate > now;
        } catch { return false; }
      });
      
      const weekData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayCount = appointments.filter(apt => {
          try {
            const aptDate = apt.appointmentDate?.seconds 
              ? new Date(apt.appointmentDate.seconds * 1000)
              : new Date(apt.appointmentDate);
            return aptDate.toDateString() === date.toDateString();
          } catch { return false; }
        }).length;
        weekData.push(dayCount);
      }
      
      console.log('Today appointments:', todayApts.length, todayApts);
      console.log('Upcoming appointments:', upcomingApts.length, upcomingApts);
      console.log('Weekly data:', weekData);
      
      setVetStats({
        todayAppointments: todayApts.length,
        pendingRecords: 0,
        weeklyAppointments: 0,
        completedToday: 0,
        upcomingAppointments: upcomingApts.length,
        totalPatients: 0
      });
      
      setWeeklyData(weekData);
      setTodayAppointmentsList(todayApts.slice(0, 5));
      setUpcomingAppointmentsList(upcomingApts.slice(0, 3));
      
      console.log('=== END MOBILE DASHBOARD DEBUG ===');
      
    } catch (error) {
      console.error('Error fetching vet stats:', error);
      
      // Retry logic for network issues
      if (retryCount < 2) {
        console.log('Retrying data fetch...');
        setTimeout(() => fetchVetStats(retryCount + 1), 1000);
        return;
      }
      
      // Fallback to sample data if all retries fail
      console.log('Using fallback sample data');
      const sampleData = [
        { petName: 'Max', customerName: 'John Doe', reason: 'Checkup', appointmentDate: new Date() },
        { petName: 'Bella', customerName: 'Jane Smith', reason: 'Vaccination', appointmentDate: new Date(Date.now() + 86400000) }
      ];
      
      setVetStats({
        todayAppointments: 1,
        pendingRecords: 0,
        weeklyAppointments: 0,
        completedToday: 0,
        upcomingAppointments: 1,
        totalPatients: 0
      });
      
      setWeeklyData([1, 2, 1, 3, 2, 1]);
      setTodayAppointmentsList([sampleData[0]]);
      setUpcomingAppointmentsList([sampleData[1]]);
    }
  };

  const confirmNavigation = (route: string, title: string) => {
    Alert.alert(
      `Navigate to ${title}`,
      `You are about to access ${title}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => router.push(route) }
      ]
    );
  };

  const handleLogout = () => {
    setShowProfile(false);
    setShowLogoutModal(true);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome, {vetDetails.name}</Text>
          <TouchableOpacity 
            style={[styles.refreshButton, refreshing && styles.refreshingButton]} 
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Text style={styles.refreshText}>
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Enhanced Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={() => confirmNavigation('/veterinarian/vet-calendar', 'Calendar')}>
            <Ionicons name="calendar" size={24} color={Colors.primary} />
            <ThemedText style={styles.statValue}>{vetStats.todayAppointments}</ThemedText>
            <ThemedText style={styles.statLabel}>Today</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={() => confirmNavigation('/veterinarian/vet-calendar', 'Calendar')}>
            <Ionicons name="time" size={24} color="#f59e0b" />
            <ThemedText style={styles.statValue}>{vetStats.upcomingAppointments}</ThemedText>
            <ThemedText style={styles.statLabel}>Upcoming</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Analytics Section */}
        <View style={styles.analyticsSection}>
          <ThemedText style={styles.sectionTitle}>Weekly Overview</ThemedText>
          <View style={styles.analyticsCard}>
            <Text style={styles.chartTitle}>Weekly Appointments</Text>
            <LineChart
              data={{
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                datasets: [{
                  data: weeklyData.length > 0 ? weeklyData : [0, 0, 0, 0, 0, 0],
                  strokeWidth: 3
                }]
              }}
              width={screenWidth - 80}
              height={180}
              chartConfig={{
                backgroundColor: Colors.surface,
                backgroundGradientFrom: Colors.surface,
                backgroundGradientTo: Colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => Colors.primary,
                labelColor: (opacity = 1) => Colors.text.secondary,
                style: {
                  borderRadius: 8
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: Colors.primary
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: Colors.border.light,
                  strokeWidth: 1
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 8
              }}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => setShowAddCustomerModal(true)}>
              <Ionicons name="person-add" size={32} color={Colors.primary} />
              <Text style={styles.actionText}>Add Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => confirmNavigation('/veterinarian/vet-customers', 'Patient Search')}>
              <Ionicons name="search" size={32} color={Colors.primary} />
              <Text style={styles.actionText}>Search Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => confirmNavigation('/veterinarian/vet-calendar', 'Calendar')}>
              <Ionicons name="calendar" size={32} color={Colors.primary} />
              <Text style={styles.actionText}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => confirmNavigation('/veterinarian/vet-appointments', 'Appointments')}>
              <Ionicons name="list" size={32} color={Colors.primary} />
              <Text style={styles.actionText}>Appointments</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Appointments */}
        <View style={styles.recentActivity}>
          <ThemedText style={styles.sectionTitle}>Today's Appointments</ThemedText>
          <View style={styles.activityCard}>
            {todayAppointmentsList.length > 0 ? (
              todayAppointmentsList.map((appointment, index) => {
                const appointmentTime = appointment.appointmentDate?.seconds 
                  ? new Date(appointment.appointmentDate.seconds * 1000)
                  : new Date(appointment.appointmentDate);
                const timeString = appointmentTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                });
                
                return (
                  <View key={index} style={styles.activityItem}>
                    <Ionicons name="calendar" size={20} color={Colors.primary} />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {appointment.petName || 'Pet'} - {appointment.reason || 'Appointment'}
                      </Text>
                      <Text style={styles.activityTime}>
                        {appointment.customerName || 'Customer'} at {timeString}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.activityItem}>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>No appointments today</Text>
                  <Text style={styles.activityTime}>Your schedule is clear</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Upcoming Appointments */}
        {upcomingAppointmentsList.length > 0 && (
          <View style={styles.recentActivity}>
            <ThemedText style={styles.sectionTitle}>Upcoming Appointments</ThemedText>
            <View style={styles.activityCard}>
              {upcomingAppointmentsList.map((appointment, index) => {
                const appointmentTime = appointment.appointmentDate?.seconds 
                  ? new Date(appointment.appointmentDate.seconds * 1000)
                  : new Date(appointment.appointmentDate);
                const dateString = appointmentTime.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                });
                const timeString = appointmentTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                });
                
                return (
                  <View key={index} style={styles.activityItem}>
                    <Ionicons name="time" size={20} color="#f59e0b" />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {appointment.petName || 'Pet'} - {appointment.reason || 'Appointment'}
                      </Text>
                      <Text style={styles.activityTime}>
                        {appointment.customerName || 'Customer'} on {dateString} at {timeString}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
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
              onPress={handleLogout}
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

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalContent}>
            <Ionicons name="log-out" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
            <Text style={styles.logoutModalTitle}>Confirm Logout</Text>
            <Text style={styles.logoutModalText}>Are you sure you want to logout? You will need to login again to access the system.</Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmLogoutButton}
                onPress={() => {
                  setShowLogoutModal(false);
                  router.push('/');
                }}
              >
                <Text style={styles.confirmLogoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        visible={showAddCustomerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddCustomerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addCustomerModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.addCustomerModalTitle}>Add New Customer</Text>
              <TouchableOpacity onPress={() => setShowAddCustomerModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.addCustomerForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.firstname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, firstname: text})}
                  placeholder="Enter first name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Surname *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.surname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, surname: text})}
                  placeholder="Enter surname"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.email}
                  onChangeText={(text) => setNewCustomer({...newCustomer, email: text})}
                  placeholder="Enter email address"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.contact}
                  onChangeText={(text) => setNewCustomer({...newCustomer, contact: text})}
                  placeholder="Enter contact number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.address}
                  onChangeText={(text) => setNewCustomer({...newCustomer, address: text})}
                  placeholder="Enter address"
                  placeholderTextColor="#999"
                />
              </View>
            </ScrollView>

            <View style={styles.addCustomerModalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddCustomerModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={async () => {
                  if (!newCustomer.firstname || !newCustomer.surname) {
                    Alert.alert('Error', 'Please fill in first name and surname');
                    return;
                  }
                  try {
                    await addCustomer(newCustomer, user?.email);
                    setNewCustomer({ firstname: '', surname: '', email: '', contact: '', address: '' });
                    setShowAddCustomerModal(false);
                    Alert.alert('Success', 'Customer added successfully');
                  } catch (error) {
                    console.error('Error adding customer:', error);
                    Alert.alert('Error', 'Failed to add customer');
                  }
                }}
              >
                <Text style={styles.saveButtonText}>Add Customer</Text>
              </TouchableOpacity>
            </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  logoutModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  logoutModalText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.border.light,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  confirmLogoutButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmLogoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addCustomerModalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  addCustomerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  addCustomerForm: {
    padding: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  addCustomerModalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  refreshingButton: {
    backgroundColor: '#999',
  },
  refreshText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});