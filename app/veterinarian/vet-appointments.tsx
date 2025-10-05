import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getAppointments, updateAppointment, deleteAppointment } from '../../lib/services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';

export default function VetAppointments() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedFilter, searchTerm]);

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
        // Keep completed/cancelled status unchanged
        if (appointment.status === 'Completed' || appointment.status === 'completed' || appointment.status === 'cancelled') {
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
        
        // Smart status assignment: Due = overdue, Pending = future, Completed = done
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
      const filterStatus = selectedFilter === 'Completed' ? 'Completed' : selectedFilter;
      filtered = appointments.filter(apt => apt.status === filterStatus);
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
              <View style={styles.appointmentHeader}>
                <View style={styles.timeContainer}>
                  <Text style={styles.appointmentTime}>
                    {appointment.dateTime?.split('\n')[1] || 'Time TBD'}
                  </Text>
                  <Text style={styles.appointmentDate}>
                    {appointment.dateTime?.split('\n')[0] || 'Date TBD'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                  <Text style={styles.statusText}>{appointment.status}</Text>
                </View>
              </View>

              <View style={styles.appointmentInfo}>
                <Text style={styles.patientName}>{appointment.customerName}</Text>
                <Text style={styles.petInfo}>{appointment.petName} - {appointment.reason || appointment.service}</Text>
              </View>

              <View style={styles.appointmentActions}>
                {appointment.status !== 'Completed' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.completeButton]}
                      onPress={() => updateAppointmentStatus(appointment.id, 'Completed')}
                    >
                      <Text style={styles.actionButtonText}>Done</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleDeleteAppointment(appointment.id)}
                    >
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </>
                )}


              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
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
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  appointmentsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  timeContainer: {
    flex: 1,
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#800020',
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
    marginBottom: 6,
  },
  patientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  petInfo: {
    fontSize: 12,
    color: '#666',
  },
  appointmentActions: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 8,
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
});