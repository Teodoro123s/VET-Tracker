import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAppointments, updateAppointment, deleteAppointment } from '../../lib/services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';

export default function VetAppointments() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedFilter, selectedDateFilter, searchTerm]);

  const loadAppointments = async () => {
    try {
      const allAppointments = await getAppointments(user?.email);
      
      // Filter appointments for current veterinarian
      const myAppointments = allAppointments.filter(apt => 
        apt.veterinarian === user?.email || apt.staff === user?.email ||
        (apt.veterinarian && apt.veterinarian.includes('Dr.'))
      );
      
      // Smart status assignment
      const now = new Date();
      const smartAppointments = myAppointments.map(appointment => {
        console.log('Processing appointment:', appointment.id, 'Status:', appointment.status);
        // Keep completed/cancelled status unchanged - check all possible variations
        if (appointment.status === 'completed' || appointment.status === 'Completed' || 
            appointment.status === 'cancelled') {
          console.log('Found completed appointment:', appointment.id);
          return { ...appointment, status: 'Completed' };
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
        const timeDiff = appointmentDateTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        let newStatus;
        if (hoursDiff <= 0) {
          newStatus = 'Due'; // Overdue appointments
        } else {
          newStatus = 'Pending'; // Future appointments
        }
        
        return { ...appointment, status: newStatus };
      });
      
      setAppointments(smartAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    // Filter by status
    if (selectedFilter !== 'All') {
      if (selectedFilter === 'Completed') {
        filtered = appointments.filter(apt => 
          apt.status === 'Completed' || apt.status === 'completed' || apt.status === 'Done'
        );
      } else {
        filtered = appointments.filter(apt => apt.status === selectedFilter);
      }
    }

    // Filter by date category
    if (selectedDateFilter !== 'All') {
      const now = new Date();
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
    const now = new Date();
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
      } else if (selectedFilter === 'Completed') {
        return dateB.getTime() - dateA.getTime();
      } else {
        // All: Sort by status priority (Due, Pending, Completed)
        const statusPriority = { 'Due': 0, 'Pending': 1, 'Completed': 2 };
        return (statusPriority[a.status] || 3) - (statusPriority[b.status] || 3);
      }
    });

    setFilteredAppointments(filtered);
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await updateAppointment(user?.email, appointmentId, { status: newStatus });
      loadAppointments();
      Alert.alert('Success', `Appointment ${newStatus.toLowerCase()}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update appointment');
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


      <View style={styles.filterHeader}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['All', 'Pending', 'Due', 'Completed'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.dateFilterHeader}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['All', 'Today', 'This Week', 'Next Week', 'Later'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.dateFilterButton, selectedDateFilter === filter && styles.dateFilterButtonActive]}
              onPress={() => setSelectedDateFilter(filter)}
            >
              <Text style={[styles.dateFilterText, selectedDateFilter === filter && styles.dateFilterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Appointments List */}
      <ScrollView style={styles.appointmentsList} showsVerticalScrollIndicator={false}>
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
                  name={appointment.status === 'Pending' ? 'time' : appointment.status === 'Due' ? 'alert-circle' : appointment.status === 'Completed' ? 'checkmark-circle' : 'time'} 
                  size={20} 
                  color={getStatusColor(appointment.status)} 
                />
              </View>
              <View style={styles.appointmentContent}>
                <Text style={styles.patientName}>{appointment.customerName}</Text>
                <Text style={styles.petInfo}>{appointment.petName}</Text>
                <Text style={styles.appointmentTime}>
                  {appointment.createdAt ? new Date(appointment.createdAt.seconds * 1000 || appointment.createdAt).toLocaleDateString() + ' ' + new Date(appointment.createdAt.seconds * 1000 || appointment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Created: N/A'}
                </Text>
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
    backgroundColor: '#f5f7fa',
    paddingBottom: 0,
    marginBottom: -34,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterHeader: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#7B2C2C',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  dateFilterHeader: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 15,
    backgroundColor: '#e9ecef',
  },
  dateFilterButtonActive: {
    backgroundColor: '#7B2C2C',
  },
  dateFilterText: {
    fontSize: 12,
    color: '#7B2C2C',
    fontWeight: '500',
  },
  dateFilterTextActive: {
    color: '#fff',
  },
  appointmentsList: {
    flex: 1,
    padding: 16,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 44, 0.1)',
    marginBottom: 4,
    elevation: 8,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
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
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  appointmentDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  appointmentInfo: {
    marginBottom: 4,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  petInfo: {
    fontSize: 15,
    color: '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusIcon: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconText: {
    fontSize: 16,
    color: '#000',
  },
  appointmentContent: {
    flex: 1,
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
    writingMode: 'vertical-rl',
    textOrientation: 'mixed',
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
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontStyle: 'italic',
  },
  addButton: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});