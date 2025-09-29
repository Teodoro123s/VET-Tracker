import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VetNotificationsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.notificationItem}>
          <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Appointment Due</Text>
            <Text style={styles.notificationText}>Sarah Johnson - Max appointment is due</Text>
            <Text style={styles.notificationTime}>Today at 3:30 PM</Text>
          </View>
        </View>
        
        <View style={styles.notificationItem}>
          <Ionicons name="time" size={20} color="#FFA500" />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Appointment Pending</Text>
            <Text style={styles.notificationText}>John Smith - Buddy needs approval</Text>
            <Text style={styles.notificationTime}>Today at 2:00 PM</Text>
          </View>
        </View>
        
        <View style={styles.notificationItem}>
          <Ionicons name="calendar" size={20} color="#4ECDC4" />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Upcoming Appointment</Text>
            <Text style={styles.notificationText}>Mike Davis - Luna scheduled tomorrow</Text>
            <Text style={styles.notificationTime}>Tomorrow at 10:00 AM</Text>
          </View>
        </View>

        <View style={styles.notificationItem}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Appointment Completed</Text>
            <Text style={styles.notificationText}>Emma Wilson - Charlie checkup completed</Text>
            <Text style={styles.notificationTime}>Yesterday at 4:00 PM</Text>
          </View>
        </View>

        <View style={styles.notificationItem}>
          <Ionicons name="medical" size={20} color="#9C27B0" />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Medical Record Updated</Text>
            <Text style={styles.notificationText}>Tom Brown - Bella's vaccination record updated</Text>
            <Text style={styles.notificationTime}>2 days ago</Text>
          </View>
        </View>

        <View style={styles.notificationItem}>
          <Ionicons name="warning" size={20} color="#FF9800" />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Appointment Cancelled</Text>
            <Text style={styles.notificationText}>Lisa White - Rocky's appointment cancelled</Text>
            <Text style={styles.notificationTime}>3 days ago</Text>
          </View>
        </View>

        <View style={styles.notificationItem}>
          <Ionicons name="heart" size={20} color="#E91E63" />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Surgery Scheduled</Text>
            <Text style={styles.notificationText}>Mark Johnson - Fluffy surgery scheduled</Text>
            <Text style={styles.notificationTime}>1 week ago</Text>
          </View>
        </View>

        <View style={styles.notificationItem}>
          <Ionicons name="star" size={20} color="#FFC107" />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Review Received</Text>
            <Text style={styles.notificationText}>Happy customer left 5-star review</Text>
            <Text style={styles.notificationTime}>1 week ago</Text>
          </View>
        </View>

        <View style={styles.notificationItem}>
          <Ionicons name="document" size={20} color="#607D8B" />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>Report Generated</Text>
            <Text style={styles.notificationText}>Monthly appointment report is ready</Text>
            <Text style={styles.notificationTime}>2 weeks ago</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});