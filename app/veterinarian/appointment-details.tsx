import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { updateAppointment, deleteAppointment } from '../../lib/services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';

export default function AppointmentDetails() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  const [appointment, setAppointment] = useState(null);


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
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Customer</Text>
          <View style={styles.fieldBox}>
            <Text style={styles.fieldValue}>{appointment.customerName || 'N/A'}</Text>
          </View>
        </View>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Pet</Text>
          <View style={styles.fieldBox}>
            <Text style={styles.fieldValue}>{appointment.petName || 'N/A'}</Text>
          </View>
        </View>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Date</Text>
          <View style={styles.fieldBox}>
            <Text style={styles.fieldValue}>{date}</Text>
          </View>
        </View>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Time</Text>
          <View style={styles.fieldBox}>
            <Text style={styles.fieldValue}>{time}</Text>
          </View>
        </View>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Veterinarian</Text>
          <View style={styles.fieldBox}>
            <Text style={styles.fieldValue}>{appointment.veterinarian || 'Not assigned'}</Text>
          </View>
        </View>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Reason</Text>
          <View style={styles.fieldBox}>
            <Text style={styles.fieldValue}>{appointment.reason || appointment.service || 'N/A'}</Text>
          </View>
        </View>
        
        {appointment.notes && (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldValue}>{appointment.notes}</Text>
            </View>
          </View>
        )}
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Status</Text>
          <View style={styles.fieldBox}>
            <Text style={[styles.fieldValue, { color: getStatusColor(appointment.status), fontWeight: '600' }]}>{appointment.status}</Text>
          </View>
        </View>
        
        {appointment.status !== 'Completed' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.doneButton} onPress={handleMarkDone}>
              <Text style={styles.buttonText}>Mark as Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFF',
  },

  content: {
    flex: 1,
    padding: 20,
    paddingTop: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#7B2C2C',
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'sans-serif',
  },
  fieldBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  fieldValue: {
    fontSize: 15,
    color: '#7B2C2C',
    fontFamily: 'sans-serif',
  },
  actionButtons: {
    gap: 12,
  },
  doneButton: {
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
});