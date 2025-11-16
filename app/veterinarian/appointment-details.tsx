import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { updateAppointment, deleteAppointment } from '../../lib/services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';

export default function AppointmentDetails() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  const [appointment, setAppointment] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);


  useEffect(() => {
    if (params.appointmentData) {
      try {
        const appointmentData = JSON.parse(params.appointmentData as string);
        setAppointment(appointmentData);
      } catch (error) {
        console.error('Error parsing appointment data:', error);
        router.back();
      }
    }
  }, [params.appointmentData]);

  const handleAddRecord = () => {
    router.push({
      pathname: '/veterinarian/medical-record-selection',
      params: {
        appointmentId: appointment?.id,
        petName: appointment?.petName,
        customerName: appointment?.customerName,
        petId: appointment?.petId
      }
    });
    setShowDropdown(false);
  };





  const handleMarkDone = async () => {
    if (!appointment) return;
    
    try {
      await updateAppointment(user?.email, appointment.id, { status: 'Completed' });
      Alert.alert('Success', 'Appointment marked as completed', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update appointment');
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;
    
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
              await deleteAppointment(user?.email, appointment.id);
              Alert.alert('Success', 'Appointment deleted', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete appointment');
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

  const formatDateTime = (appointment) => {
    let appointmentTime;
    if (appointment.appointmentDate?.seconds) {
      appointmentTime = new Date(appointment.appointmentDate.seconds * 1000);
    } else {
      appointmentTime = new Date(appointment.appointmentDate || appointment.dateTime);
    }
    
    if (isNaN(appointmentTime.getTime())) {
      return { date: 'Date TBD', time: 'Time TBD' };
    }
    
    return {
      date: appointmentTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: appointmentTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      })
    };
  };

  if (!appointment) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading appointment details...</Text>
      </View>
    );
  }

  const { date, time } = formatDateTime(appointment);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.detailTable}>
          <View style={styles.detailTableHeader}>
            <Text style={styles.detailHeaderCell}>Field</Text>
            <Text style={styles.detailHeaderCell}>Value</Text>
            {appointment.status !== 'Completed' && (
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.menuButton} onPress={() => setShowDropdown(!showDropdown)}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#7B2C2C" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Customer</Text>
            <Text style={styles.detailCell}>{appointment.customerName || 'N/A'}</Text>
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Pet</Text>
            <Text style={styles.detailCell}>{appointment.petName || 'N/A'}</Text>
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Date</Text>
            <Text style={styles.detailCell}>{date}</Text>
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Time</Text>
            <Text style={styles.detailCell}>{time}</Text>
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Reason</Text>
            <Text style={styles.detailCell}>{appointment.reason || appointment.service || 'N/A'}</Text>
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Veterinarian</Text>
            <Text style={styles.detailCell}>{appointment.veterinarian || 'Not assigned'}</Text>
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Notes</Text>
            <Text style={styles.detailCell}>{appointment.notes || 'No notes'}</Text>
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Status</Text>
            <Text style={[styles.detailCell, { color: getStatusColor(appointment.status), fontWeight: 'bold' }]}>{appointment.status}</Text>
          </View>
        </View>
      </ScrollView>
      {showDropdown && (
        <Modal transparent={true} visible={showDropdown} onRequestClose={() => setShowDropdown(false)}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
            <View style={styles.dropdown}>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { handleMarkDone(); setShowDropdown(false); }}>
                <Text style={styles.dropdownText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { handleAddRecord(); setShowDropdown(false); }}>
                <Text style={styles.dropdownText}>Add Record</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { handleDelete(); setShowDropdown(false); }}>
                <Text style={styles.dropdownText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  detailTable: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 44, 0.1)',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  detailTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  detailTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#7B2C2C',
  },
  detailCell: {
    flex: 1,
    fontSize: 12,
    color: '#7B2C2C',
  },
  headerActions: {
    position: 'relative',
  },
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 95,
    paddingRight: 20,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 44, 0.1)',
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownText: {
    fontSize: 14,
    color: '#7B2C2C',
  },


});