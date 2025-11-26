import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { deleteAppointment, getVeterinarianAppointments, updateAppointment } from '../../lib/services/firebaseService';

export default function VetAppointments() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDateFilters, setShowDateFilters] = useState(false);

  useEffect(() => {
    if (user?.email) {
      loadAppointments();
      testFirebaseConnection();
    }
  }, [user?.email]);
  
  const testFirebaseConnection = async () => {
    try {
      console.log('=== FIREBASE CONNECTION TEST ===');
      console.log('Testing Firebase connection with user:', user?.email);
      
      // Test basic Firebase connection
      const testAppointments = await getVeterinarianAppointments(user?.email, user?.email);
      console.log('Direct Firebase test - vet appointments found:', testAppointments.length);
      
      if (testAppointments.length === 0) {
        console.log('NO APPOINTMENTS FOUND IN FIREBASE!');
        console.log('This means either:');
        console.log('1. No appointments have been created yet');
        console.log('2. Tenant ID mismatch');
        console.log('3. Firebase permissions issue');
      } else {
        console.log('Appointments exist! Sample:', testAppointments[0]);
      }
    } catch (error) {
      console.error('Firebase connection test failed:', error);
    }
  };

  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedFilter, selectedDateFilter, searchTerm]);

  const loadAppointments = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      console.log('=== MOBILE APPOINTMENTS DEBUG ===');
      console.log('Mobile user email:', user?.email);
      console.log('Mobile user object:', user);
      
      if (!user?.email) {
        console.log('ERROR: No user email in mobile app!');
        return;
      }
      
      // Get only appointments assigned to this veterinarian
      const allAppointments = await getVeterinarianAppointments(user.email, user.email);
      console.log('Appointments assigned to this vet:', allAppointments.length);
      
      console.log('Setting appointments to:', allAppointments.length, 'appointments');
      if (allAppointments.length > 0) {
        console.log('First appointment sample:', allAppointments[0]);
      }
      
      // Smart status assignment
      const now = new Date();
      const smartAppointments = allAppointments.map(appointment => {
        console.log('Processing appointment:', appointment.id, 'Status:', appointment.status, 'Vet field:', appointment.veterinarian);
        // Keep completed/cancelled status unchanged - normalize all to 'Done'
        if (appointment.status === 'completed' || appointment.status === 'Completed' || 
            appointment.status === 'Done' || appointment.status === 'cancelled') {
          if (appointment.status !== 'cancelled') {
            console.log('Found completed appointment:', appointment.id);
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
      
      setAppointments(smartAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAppointments = () => {
    const now = new Date();
    
    // Re-apply smart status logic in real-time
    let filtered = appointments.map(apt => {
      // Keep completed/cancelled status unchanged but normalize to 'Done'
      if (apt.status === 'Done' || apt.status === 'completed' || apt.status === 'Completed') {
        return { ...apt, status: 'Done' };
      }
      if (apt.status === 'cancelled') {
        return apt;
      }
      
      // Check if appointment is overdue
      let appointmentDateTime;
      if (apt.appointmentDate?.seconds) {
        appointmentDateTime = new Date(apt.appointmentDate.seconds * 1000);
      } else {
        appointmentDateTime = new Date(apt.appointmentDate);
      }
      
      if (isNaN(appointmentDateTime.getTime())) {
        return { ...apt, status: 'Pending' };
      }
      
      const isPast = appointmentDateTime.getTime() <= now.getTime();
      const newStatus = isPast ? 'Due' : 'Pending';
      
      return { ...apt, status: newStatus };
    });

    // Filter by status
    if (selectedFilter !== 'All') {
      if (selectedFilter === 'Done') {
        filtered = filtered.filter(apt => apt.status === 'Done');
      } else {
        filtered = filtered.filter(apt => apt.status === selectedFilter);
      }
    }

    // Filter by date category
    if (selectedDateFilter !== 'All') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const nextWeekStart = new Date(weekEnd);
      nextWeekStart.setDate(weekEnd.getDate() + 1);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

      filtered = filtered.filter(apt => {
        let aptDate;
        if (apt.appointmentDate?.seconds) {
          aptDate = new Date(apt.appointmentDate.seconds * 1000);
        } else {
          aptDate = new Date(apt.appointmentDate || apt.dateTime);
        }
        
        if (isNaN(aptDate.getTime())) return false;
        
        const aptDateOnly = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());
        
        switch (selectedDateFilter) {
          case 'Today':
            return aptDateOnly.getTime() === today.getTime();
          case 'This Week':
            return aptDateOnly >= weekStart && aptDateOnly <= weekEnd;
          case 'Next Week':
            return aptDateOnly >= nextWeekStart && aptDateOnly <= nextWeekEnd;
          case 'Later':
            return aptDateOnly > nextWeekEnd;
          default:
            return true;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.petName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Smart sorting based on filter
    filtered.sort((a, b) => {
      let dateA, dateB;
      
      if (a.appointmentDate?.seconds) {
        dateA = new Date(a.appointmentDate.seconds * 1000);
      } else {
        dateA = new Date(a.appointmentDate || a.dateTime);
      }
      
      if (b.appointmentDate?.seconds) {
        dateB = new Date(b.appointmentDate.seconds * 1000);
      } else {
        dateB = new Date(b.appointmentDate || b.dateTime);
      }
      
      if (selectedFilter === 'Pending') {
        return dateA.getTime() - dateB.getTime();
      } else if (selectedFilter === 'Due') {
        const isAOverdue = dateA.getTime() < now.getTime();
        const isBOverdue = dateB.getTime() < now.getTime();
        
        if (isAOverdue && !isBOverdue) return -1;
        if (!isAOverdue && isBOverdue) return 1;
        
        return dateA.getTime() - dateB.getTime();
      } else if (selectedFilter === 'Done') {
        return dateB.getTime() - dateA.getTime();
      } else {
        // All: Sort by status priority (Due, Pending, Done)
        const statusPriority = { 'Due': 0, 'Pending': 1, 'Done': 2 };
        return (statusPriority[a.status] || 3) - (statusPriority[b.status] || 3);
      }
    });

    setFilteredAppointments(filtered);
  };

  const [updatingId, setUpdatingId] = useState(null);

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    if (updatingId === appointmentId) return;
    
    setUpdatingId(appointmentId);
    try {
      await updateAppointment(user?.email, appointmentId, { status: newStatus });
      loadAppointments();
      Alert.alert('Success', `Appointment ${newStatus.toLowerCase()}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update appointment');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAppointment(user?.email, appointmentId);
              loadAppointments();
            } catch (error) {
              console.error('Error deleting appointment:', error);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#28a745';
      case 'Due': return '#dc3545';
      case 'Done': return '#007bff';
      case 'Completed': return '#007bff';
      case 'cancelled': return '#6c757d';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>


      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          {['All', 'Pending', 'Due', 'Done'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={selectedFilter === filter ? styles.activeFilterButton : styles.inactiveFilterButton}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={selectedFilter === filter ? styles.activeFilterText : styles.inactiveFilterText}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#8E8E93"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <TouchableOpacity 
            style={styles.filterIconButton}
            onPress={() => setShowDateFilters(!showDateFilters)}
          >
            <Ionicons name="options" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        {showDateFilters && (
          <View style={styles.dateFilterDropdown}>
            {['All', 'Today', 'This Week', 'Next Week', 'Later'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={styles.dateFilterOption}
                onPress={() => {
                  setSelectedDateFilter(filter);
                  setShowDateFilters(false);
                }}
              >
                <Text style={[styles.dateFilterOptionText, selectedDateFilter === filter && styles.dateFilterOptionTextActive]}>
                  {filter}
                </Text>
                {selectedDateFilter === filter && (
                  <Ionicons name="checkmark" size={16} color="#7B2C2C" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Appointments List */}
      <ScrollView 
        style={styles.appointmentsList} 
        contentContainerStyle={styles.appointmentsListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAppointments(true);
            }}
            colors={['#7B2C2C']}
            tintColor="#7B2C2C"
          />
        }
      >
        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No appointments found</Text>
          </View>
        ) : (
          filteredAppointments.map((appointment) => (
            <TouchableOpacity 
              key={appointment.id} 
              style={styles.appointmentCard}
              onPress={() => {
                router.push({
                  pathname: '/veterinarian/appointment-details',
                  params: { appointmentData: JSON.stringify(appointment) }
                });
              }}
            >
              <View style={styles.statusIcon}>
                <Ionicons 
                  name={appointment.status === 'Pending' ? 'time' : appointment.status === 'Due' ? 'alert-circle' : (appointment.status === 'Done' || appointment.status === 'Completed') ? 'checkmark-circle' : 'time'} 
                  size={20} 
                  color={getStatusColor(appointment.status)} 
                />
              </View>
              <View style={styles.appointmentContent}>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Name:</Text>
                  <Text style={styles.patientName}>{appointment.customerName}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Pet:</Text>
                  <Text style={styles.petInfo}>{appointment.petName}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Date:</Text>
                  <Text style={styles.appointmentTime}>
                    {appointment.createdAt ? new Date(appointment.createdAt.seconds * 1000 || appointment.createdAt).toLocaleDateString() + ' ' + new Date(appointment.createdAt.seconds * 1000 || appointment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                  </Text>
                </View>
              </View>


            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push('/veterinarian/add-appointment')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFF',
    paddingBottom: 0,
    marginBottom: -34,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    fontFamily: 'sans-serif',
  },
  filterIconButton: {
    width: 42,
    height: 42,
    backgroundColor: '#7B2C2C',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateFilterDropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dateFilterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dateFilterOptionText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontFamily: 'sans-serif',
  },
  dateFilterOptionTextActive: {
    color: '#7B2C2C',
    fontWeight: '600',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FAFAFF',
  },
  appointmentsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    fontFamily: 'sans-serif',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  activeFilterButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginRight: 16,
    borderRadius: 20,
    backgroundColor: '#7B2C2C',
  },
  inactiveFilterButton: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginRight: 16,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  inactiveFilterText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentsList: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 12,
  },
  appointmentsListContent: {
    paddingBottom: 100,
  },
  appointmentCard: {
    backgroundColor: '#FAFAFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  timeContainer: {
    flex: 1,
  },
  appointmentTime: {
    fontSize: 13,
    color: '#48484A',
    fontWeight: '400',
    flex: 1,
    fontFamily: 'sans-serif',
  },
  appointmentDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
    fontWeight: '400',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  appointmentInfo: {
    marginBottom: 6,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    fontFamily: 'sans-serif',
  },
  petInfo: {
    fontSize: 15,
    color: '#48484A',
    fontWeight: '500',
    flex: 1,
    fontFamily: 'sans-serif',
  },
  statusIcon: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(123, 44, 44, 0.08)',
  },
  statusIconText: {
    fontSize: 16,
    color: '#000',
  },
  appointmentContent: {
    flex: 1,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dataLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    minWidth: 45,
    marginRight: 8,
    fontFamily: 'sans-serif',
  },
  appointmentActions: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 6,
  },
  statusEdge: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 30,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusVerticalText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    // vertical text properties removed (web-only)
  },
  actionButton: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  approveButton: {
    backgroundColor: '#4caf50',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  completeButton: {
    backgroundColor: '#2196f3',
  },
  recordButton: {
    backgroundColor: '#ff9800',
  },
  viewButton: {
    backgroundColor: '#9c27b0',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  addButton: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7B2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
});