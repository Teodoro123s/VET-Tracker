import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getAppointments, updateAppointment, getMedicalRecords, addMedicalRecord } from '../../lib/services/firebaseService';
import { useTenant } from '../../contexts/TenantContext';

export default function VetAppointments() {
  const router = useRouter();
  const { userEmail } = useTenant();
  
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('Today');
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
      const allAppointments = await getAppointments(userEmail);
      
      // Filter appointments for current veterinarian
      const myAppointments = allAppointments.filter(apt => 
        apt.veterinarian === userEmail || apt.staff === userEmail
      );
      
      setAppointments(myAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    // Filter by time period
    const today = new Date();
    const todayStr = today.toDateString();
    
    switch (selectedFilter) {
      case 'Today':
        filtered = appointments.filter(apt => 
          apt.dateTime?.includes('Today') || 
          new Date(apt.date).toDateString() === todayStr
        );
        break;
      case 'This Week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        filtered = appointments.filter(apt => {
          const aptDate = new Date(apt.date);
          return aptDate >= weekStart && aptDate <= weekEnd;
        });
        break;
      case 'Pending':
        filtered = appointments.filter(apt => apt.status === 'Pending');
        break;
      case 'Completed':
        filtered = appointments.filter(apt => apt.status === 'Completed');
        break;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.petName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.service?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await updateAppointment(appointmentId, { status: newStatus }, userEmail);
      loadAppointments();
      Alert.alert('Success', `Appointment ${newStatus.toLowerCase()}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update appointment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#ff9800';
      case 'Approved': return '#4caf50';
      case 'Due': return '#f44336';
      case 'Completed': return '#2196f3';
      case 'Cancelled': return '#9e9e9e';
      default: return '#9e9e9e';
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Appointments</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients, pets, or services..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['Today', 'This Week', 'Pending', 'Completed'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, selectedFilter === filter && styles.activeFilterTab]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[styles.filterText, selectedFilter === filter && styles.activeFilterText]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Appointments List */}
      <ScrollView style={styles.appointmentsList} showsVerticalScrollIndicator={false}>
        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No appointments found</Text>
          </View>
        ) : (
          filteredAppointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
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
                <Text style={styles.petInfo}>{appointment.petName} - {appointment.service}</Text>
              </View>

              <View style={styles.appointmentActions}>
                {appointment.status === 'Pending' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => updateAppointmentStatus(appointment.id, 'Approved')}
                    >
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => updateAppointmentStatus(appointment.id, 'Cancelled')}
                    >
                      <Text style={styles.actionButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
                
                {(appointment.status === 'Approved' || appointment.status === 'Due') && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.completeButton]}
                      onPress={() => updateAppointmentStatus(appointment.id, 'Completed')}
                    >
                      <Text style={styles.actionButtonText}>Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.recordButton]}
                      onPress={() => router.push(`/vet-medical-record?appointmentId=${appointment.id}`)}
                    >
                      <Text style={styles.actionButtonText}>Add Record</Text>
                    </TouchableOpacity>
                  </>
                )}

                {appointment.status === 'Completed' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => router.push(`/appointment-details?id=${appointment.id}`)}
                  >
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
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
  header: {
    backgroundColor: '#2c5aa0',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  activeFilterTab: {
    backgroundColor: '#2c5aa0',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  appointmentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flex: 1,
  },
  appointmentTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5aa0',
  },
  appointmentDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  appointmentInfo: {
    marginBottom: 16,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  petInfo: {
    fontSize: 14,
    color: '#666',
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
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