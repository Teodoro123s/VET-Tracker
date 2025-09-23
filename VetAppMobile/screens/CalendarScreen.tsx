import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarScreen() {
  const appointments = [
    { id: 1, time: '09:00', pet: 'Max', owner: 'John Doe', type: 'Checkup' },
    { id: 2, time: '10:30', pet: 'Luna', owner: 'Jane Smith', type: 'Vaccination' },
    { id: 3, time: '14:00', pet: 'Charlie', owner: 'Bob Wilson', type: 'Surgery' },
    { id: 4, time: '15:30', pet: 'Bella', owner: 'Alice Brown', type: 'Consultation' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={24} color="#2563eb" />
          </TouchableOpacity>
          <Text style={styles.dateText}>Today, December 15, 2024</Text>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Add Appointment Button */}
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>New Appointment</Text>
        </TouchableOpacity>

        {/* Appointments List */}
        <View style={styles.appointmentsList}>
          <Text style={styles.sectionTitle}>Today's Appointments</Text>
          {appointments.map((appointment) => (
            <TouchableOpacity key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{appointment.time}</Text>
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.petName}>{appointment.pet}</Text>
                <Text style={styles.ownerName}>Owner: {appointment.owner}</Text>
                <Text style={styles.appointmentType}>{appointment.type}</Text>
              </View>
              <View style={styles.statusContainer}>
                <Ionicons name="ellipsis-vertical" size={20} color="#64748b" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Calendar View Toggle */}
        <TouchableOpacity style={styles.calendarToggle}>
          <Ionicons name="calendar" size={20} color="#2563eb" />
          <Text style={styles.calendarToggleText}>View Full Calendar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  appointmentsList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  appointmentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  petName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  ownerName: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  appointmentType: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusContainer: {
    justifyContent: 'center',
  },
  calendarToggle: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  calendarToggleText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});