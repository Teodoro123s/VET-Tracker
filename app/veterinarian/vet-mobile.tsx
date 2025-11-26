import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, Alert, TextInput, Dimensions } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { addCustomer, getVeterinarians, getCustomers, getPets, getVeterinarianAppointments } from '../../lib/services/firebaseService';
import { Colors } from '@/constants/Colors';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function VetMobile() {
  const router = useRouter();
  const navigate = (path: any) => router.push(path as any);
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
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

  // Auto-open Add Customer modal if parameter is passed
  useEffect(() => {
    if (params.openAddCustomer === 'true') {
      setShowAddCustomerModal(true);
    }
  }, [params]);

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

  const handleAddCustomer = async () => {
    if (!newCustomer.firstname || !newCustomer.surname) {
      Alert.alert('Error', 'Please fill in first name and surname');
      return;
    }

    try {
      await addCustomer(newCustomer, user?.email);
      setNewCustomer({ firstname: '', surname: '', email: '', contact: '', address: '' });
      setShowAddCustomerModal(false);
      Alert.alert('Success', 'Customer added successfully');
      // Optionally refresh stats after adding customer
      await loadData();
    } catch (error) {
      console.error('Error adding customer:', error);
      Alert.alert('Error', 'Failed to add customer');
    }
  };

  const fetchVetDetails = async () => {
    if (!user?.email) {
      console.log('❌ fetchVetDetails: No user email');
      return;
    }
    
    try {
      console.log('🔍 Fetching vet details for:', user.email);
      const vets = await getVeterinarians(user.email);
      console.log('📋 Found vets:', vets.length, vets);
      const currentVet = vets.find(vet => vet.email === user.email);
      console.log('👤 Current vet match:', currentVet);
      
      if (currentVet) {
        const details = {
          name: currentVet.name || 'Dr. Veterinarian',
          email: currentVet.email || user.email,
          license: currentVet.license || 'Not Available',
          specialization: currentVet.specialization || 'General Practice',
          phone: currentVet.phone || 'Not Available',
          experience: 'Not Available'
        };
        console.log('✅ Setting vet details:', details);
        setVetDetails(details);
      } else {
        console.log('⚠️ No matching vet found, using fallback');
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
      console.error('❌ Error fetching vet details:', error);
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
      console.log('❌ No user email found');
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
      console.log('=== 📊 MOBILE DASHBOARD DATA FETCH START ===');
      console.log('👤 User email:', user.email);
      console.log('🔄 Retry count:', retryCount);
      
      // Use getVeterinarianAppointments to get only appointments assigned to this vet
      const [allAppointments, customers, pets] = await Promise.all([
        getVeterinarianAppointments(user.email, user.email),
        getCustomers(user.email).catch(() => []),
        getPets(user.email).catch(() => [])
      ]);
      
      console.log('📅 Fetched appointments:', allAppointments?.length || 0);
      console.log('👥 Fetched customers:', customers?.length || 0);
      console.log('🐾 Fetched pets:', pets?.length || 0);
      
      if (allAppointments && allAppointments.length > 0) {
        console.log('📋 Sample appointment:', JSON.stringify(allAppointments[0], null, 2));
      }
      
      // Apply same smart status logic as appointments page
      const now = new Date();
      const appointments = allAppointments.map(appointment => {
        // Keep completed/cancelled status unchanged - normalize all to 'Done'
        if (appointment.status === 'completed' || appointment.status === 'Completed' || 
            appointment.status === 'Done' || appointment.status === 'cancelled') {
          if (appointment.status !== 'cancelled') {
            return { ...appointment, status: 'Done' };
          }
          return appointment;
        }
        
        let appointmentDateTime;
        if (appointment.appointmentDate?.seconds) {
          appointmentDateTime = new Date(appointment.appointmentDate.seconds * 1000);
        } else {
          appointmentDateTime = new Date(appointment.appointmentDate || appointment.dateTime);
        }
        
        if (isNaN(appointmentDateTime.getTime())) {
          return { ...appointment, status: 'Pending' };
        }
        
        // Smart status assignment: Due = overdue, Pending = future
        const isPast = appointmentDateTime.getTime() <= now.getTime();
        const newStatus = isPast ? 'Due' : 'Pending';
        
        return { ...appointment, status: newStatus };
      });
      
      const today = now.toDateString();
      console.log('📆 Today date string:', today);
      console.log('🕐 Current time:', now.toISOString());
      
      // Filter today's appointments
      const todayApts = (appointments || []).filter(apt => {
        try {
          const aptDate = apt.appointmentDate?.seconds 
            ? new Date(apt.appointmentDate.seconds * 1000)
            : new Date(apt.appointmentDate);
          const isToday = aptDate.toDateString() === today;
          if (isToday) {
            console.log('✅ Today appointment:', {
              pet: apt.petName,
              customer: apt.customerName,
              date: aptDate.toISOString(),
              status: apt.status
            });
          }
          return isToday;
        } catch (error) { 
          console.error('❌ Error parsing appointment date:', error, apt);
          return false; 
        }
      });
      
      // Filter upcoming appointments
      const upcomingApts = (appointments || []).filter(apt => {
        try {
          const aptDate = apt.appointmentDate?.seconds 
            ? new Date(apt.appointmentDate.seconds * 1000)
            : new Date(apt.appointmentDate);
          const isFuture = aptDate > now;
          return isFuture;
        } catch (error) { 
          console.error('❌ Error parsing upcoming appointment date:', error);
          return false; 
        }
      });
      
      // Calculate weekly data (last 6 days)
      console.log('📊 Calculating weekly data...');
      const weekData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        const dayCount = (appointments || []).filter(apt => {
          try {
            const aptDate = apt.appointmentDate?.seconds 
              ? new Date(apt.appointmentDate.seconds * 1000)
              : new Date(apt.appointmentDate);
            const isInRange = aptDate >= date && aptDate <= endDate;
            return isInRange;
          } catch { return false; }
        }).length;
        
        console.log(`   Day ${6-i} (${date.toDateString()}): ${dayCount} appointments`);
        weekData.push(dayCount);
      }
      
      console.log('📈 Weekly data array:', weekData);
      console.log('✅ Today appointments count:', todayApts.length);
      console.log('🔜 Upcoming appointments count:', upcomingApts.length);
      
      // Calculate completed today - match appointments page logic (status === 'Done')
      const completedToday = todayApts.filter(a => {
        const isDone = a.status === 'Done';
        if (isDone) {
          console.log('✔️ Completed appointment:', a.petName, 'Status:', a.status);
        }
        return isDone;
      }).length;
      
      // Calculate pending today (status = 'Pending' or 'Due', excluding 'Done' and 'cancelled')
      const pendingToday = todayApts.filter(a => {
        return a.status === 'Pending' || a.status === 'Due';
      }).length;
      
      console.log('📋 Pending today:', pendingToday);
      
      const weeklyAppointments = weekData.reduce((s, v) => s + v, 0);
      console.log('📊 Total weekly appointments:', weeklyAppointments);

      const statsData = {
        todayAppointments: todayApts.length,
        pendingRecords: pendingToday,
        weeklyAppointments,
        completedToday,
        upcomingAppointments: upcomingApts.length,
        totalPatients: pets.length || 0
      };
      
      console.log('📊 Final stats:', JSON.stringify(statsData, null, 2));
      
      setVetStats(statsData);
      setWeeklyData(weekData);
      setTodayAppointmentsList((todayApts || []).slice(0, 5));
      setUpcomingAppointmentsList((upcomingApts || []).slice(0, 3));
      
      console.log('=== ✅ MOBILE DASHBOARD DATA FETCH COMPLETE ===');
      
    } catch (error) {
      console.error('❌ Error fetching vet stats:', error);
      console.error('Error details:', error.message, error.stack);
      
      // Retry logic for network issues
      if (retryCount < 2) {
        console.log('🔄 Retrying data fetch in 1 second...');
        setTimeout(() => fetchVetStats(retryCount + 1), 1000);
        return;
      }
      
      // Fallback to sample data if all retries fail
      console.log('⚠️ Using fallback sample data');
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
        { text: 'Continue', onPress: () => navigate(route) }
      ]
    );
  };

  const handleLogout = () => {
    setShowProfile(false);
    setShowLogoutModal(true);
  };

  // Function to open Add Customer modal programmatically
  const openAddCustomerModal = () => {
    setShowAddCustomerModal(true);
  };

  // Function to close Add Customer modal and reset form
  const closeAddCustomerModal = () => {
    setShowAddCustomerModal(false);
    setNewCustomer({ firstname: '', surname: '', email: '', contact: '', address: '' });
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
        {/* Quick Stats Summary */}
        <View style={styles.quickStatsSection}>
          <ThemedText style={[styles.sectionTitle, { marginBottom: 12 }]}>Weekly Summary</ThemedText>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryRow, styles.firstSummaryRow]}>
              <View style={styles.summaryItem}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryValue}>{vetStats.weeklyAppointments}</Text>
                  <Text style={styles.summaryLabel}>This Week</Text>
                </View>
              </View>
              <View style={styles.summaryItem}>
                <View style={styles.iconContainer}>
                  <Ionicons name="checkmark-done" size={20} color="#10b981" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryValue}>{vetStats.completedToday}</Text>
                  <Text style={styles.summaryLabel}>Completed</Text>
                </View>
              </View>
            </View>
            <View style={[styles.summaryRow, styles.lastSummaryRow]}>
              <View style={styles.summaryItem}>
                <View style={styles.iconContainer}>
                  <Ionicons name="hourglass-outline" size={20} color="#f59e0b" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryValue}>{vetStats.pendingRecords}</Text>
                  <Text style={styles.summaryLabel}>Pending</Text>
                </View>
              </View>
              <View style={styles.summaryItem}>
                <View style={styles.iconContainer}>
                  <Ionicons name="trending-up" size={20} color="#8b5cf6" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryValue}>{vetStats.upcomingAppointments}</Text>
                  <Text style={styles.summaryLabel}>Upcoming</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Enhanced Stats Grid */}
        <ThemedText style={[styles.sectionTitle, { marginBottom: 12 }]}>Overview</ThemedText>
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem} onPress={() => navigate('/veterinarian/vet-appointments')}>
            <Ionicons name="calendar" size={24} color="#7B2C2C" />
            <Text style={styles.statNumber}>{vetStats.todayAppointments}</Text>
            <Text style={styles.statText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={() => navigate('/veterinarian/vet-appointments')}>
            <Ionicons name="time" size={24} color="#f59e0b" />
            <Text style={styles.statNumber}>{vetStats.upcomingAppointments}</Text>
            <Text style={styles.statText}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={() => navigate('/veterinarian/vet-customers')}>
            <Ionicons name="people" size={24} color="#10b981" />
            <Text style={styles.statNumber}>{vetStats.totalPatients}</Text>
            <Text style={styles.statText}>Patients</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem} onPress={() => navigate('/veterinarian/vet-appointments')}>
            <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>{vetStats.completedToday}</Text>
            <Text style={styles.statText}>Completed</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
            <View style={styles.scrollButtons}>
              <TouchableOpacity onPress={() => scrollViewRef.current?.scrollTo({ x: 0, animated: true })} style={styles.scrollButton}>
                <Ionicons name="chevron-back" size={20} color="#7B2C2C" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => scrollViewRef.current?.scrollTo({ x: 200, animated: true })}>
                <Ionicons name="chevron-forward" size={20} color="#7B2C2C" />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView ref={scrollViewRef} horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigate('/veterinarian/add-appointment')}>
              <View style={styles.iconCircle}>
                <Ionicons name="add-circle" size={28} color="#7B2C2C" />
              </View>
              <Text style={styles.actionText}>New Appointment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => setShowAddCustomerModal(true)}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-add" size={28} color="#7B2C2C" />
              </View>
              <Text style={styles.actionText}>Add Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigate('/veterinarian/vet-customers')}>
              <View style={styles.iconCircle}>
                <Ionicons name="search" size={28} color="#7B2C2C" />
              </View>
              <Text style={styles.actionText}>Search Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigate('/veterinarian/vet-calendar')}>
              <View style={styles.iconCircle}>
                <Ionicons name="calendar" size={28} color="#7B2C2C" />
              </View>
              <Text style={styles.actionText}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigate('/veterinarian/vet-appointments')}>
              <View style={styles.iconCircle}>
                <Ionicons name="list" size={28} color="#7B2C2C" />
              </View>
              <Text style={styles.actionText}>View All Appointments</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Today's Appointments */}
        <View style={styles.recentActivity}>
          <ThemedText style={[styles.sectionTitle, { marginBottom: 12 }]}>Today's Appointments</ThemedText>
          <View style={styles.activityCard}>
            {todayAppointmentsList.length > 0 ? (
              todayAppointmentsList.map((appointment, index) => {
                try {
                  const appointmentTime = appointment.appointmentDate?.seconds 
                    ? new Date(appointment.appointmentDate.seconds * 1000)
                    : new Date(appointment.appointmentDate);
                  const timeString = appointmentTime.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit', 
                    hour12: true 
                  });
                  
                  return (
                    <View key={appointment.id || index} style={styles.activityItem}>
                      <Ionicons name="calendar" size={20} color={Colors.primary} />
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>
                          {appointment.petName || 'Pet'} - {appointment.reason || appointment.service || 'Appointment'}
                        </Text>
                        <Text style={styles.activityTime}>
                          {appointment.customerName || 'Customer'} at {timeString}
                        </Text>
                      </View>
                    </View>
                  );
                } catch (error) {
                  console.error('Error rendering appointment:', error, appointment);
                  return null;
                }
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
            <ThemedText style={[styles.sectionTitle, { marginBottom: 12 }]}>Upcoming Appointments</ThemedText>
            <View style={styles.activityCard}>
              {upcomingAppointmentsList.map((appointment, index) => {
                try {
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
                    <View key={appointment.id || index} style={styles.activityItem}>
                      <Ionicons name="time" size={20} color="#f59e0b" />
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>
                          {appointment.petName || 'Pet'} - {appointment.reason || appointment.service || 'Appointment'}
                        </Text>
                        <Text style={styles.activityTime}>
                          {appointment.customerName || 'Customer'} on {dateString} at {timeString}
                        </Text>
                      </View>
                    </View>
                  );
                } catch (error) {
                  console.error('Error rendering upcoming appointment:', error, appointment);
                  return null;
                }
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
                    navigate('/veterinarian/mobile-login');
                }}
              >
                <Text style={styles.confirmLogoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddCustomerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeAddCustomerModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addCustomerModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.addCustomerModalTitle}>Add New Customer</Text>
              <TouchableOpacity onPress={closeAddCustomerModal}>
                <Ionicons name="close" size={24} color="#7B2C2C" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.firstname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, firstname: text})}
                  placeholder="Enter first name"
                  placeholderTextColor="rgba(123, 44, 44, 0.5)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Surname *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.surname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, surname: text})}
                  placeholder="Enter surname"
                  placeholderTextColor="rgba(123, 44, 44, 0.5)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.email}
                  onChangeText={(text) => setNewCustomer({...newCustomer, email: text})}
                  placeholder="Enter email address"
                  placeholderTextColor="rgba(123, 44, 44, 0.5)"
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
                  placeholderTextColor="rgba(123, 44, 44, 0.5)"
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
                  placeholderTextColor="rgba(123, 44, 44, 0.5)"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={closeAddCustomerModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleAddCustomer}
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
    fontFamily: 'Satoshi',
    color: Colors.text.primary,
    marginBottom: 5,
  },
  refreshButtonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dateText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 32,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'sans-serif',
    color: '#1f2937',
    marginTop: 8,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'sans-serif',
    color: '#6b7280',
    marginTop: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
    color: '#7B2C2C',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'sans-serif',
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scrollButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollButton: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
    color: '#7B2C2C',
  },
  quickActions: {
    marginBottom: 32,
  },
  actionsScroll: {
    flexDirection: 'row',
  },
  actionCard: {
    alignItems: 'center',
    width: 80,
    marginRight: 8,
    padding: 4,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 9,
    fontFamily: 'sans-serif',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: 'normal',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 0,
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
    fontFamily: 'sans-serif',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'sans-serif',
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
    fontFamily: 'sans-serif',
    color: Colors.text.secondary,
  },
  logoutModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
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
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  addCustomerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B2C2C',
  },
  modalForm: {
    padding: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2C2C',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#7B2C2C',
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
    fontFamily: 'Satoshi',
    textAlign: 'center',
  },
  debugButton: {
    backgroundColor: '#4a5568',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Satoshi',
    textAlign: 'center',
  },
  quickStatsSection: {
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  firstSummaryRow: {
    marginTop: 10,
  },
  lastSummaryRow: {
    marginBottom: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingHorizontal: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
    marginTop: 5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'sans-serif',
    color: '#1f2937',
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: 'sans-serif',
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
  },
});