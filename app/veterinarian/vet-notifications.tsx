import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAppointments } from '../../lib/services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';

export default function VetNotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const generateAINotifications = (appointments, currentTime) => {
    const aiNotifs = [];
    
    // AI Schedule Optimization
    const todayAppts = appointments.filter(apt => {
      const aptDate = apt.appointmentDate?.seconds ? 
        new Date(apt.appointmentDate.seconds * 1000) : 
        new Date(apt.appointmentDate);
      return aptDate.toDateString() === currentTime.toDateString();
    });
    
    if (todayAppts.length > 3) {
      aiNotifs.push({
        id: 'ai-schedule',
        icon: 'analytics',
        color: '#9C27B0',
        title: 'AI Schedule Optimizer',
        text: `Busy day ahead! ${todayAppts.length} appointments. Consider 15min buffer between visits.`,
        time: '30m ago'
      });
    }
    
    // AI Medical Record Reminder
    const completedWithoutRecords = appointments.filter(apt => 
      apt.status === 'Completed' && !apt.medicalRecordAdded
    );
    
    if (completedWithoutRecords.length > 0) {
      aiNotifs.push({
        id: 'ai-records',
        icon: 'document-text',
        color: '#FF9800',
        title: 'AI Record Assistant',
        text: `${completedWithoutRecords.length} completed appointments need medical records`,
        time: '45m ago'
      });
    }
    
    // AI Chatbot availability
    if (appointments.length > 2) {
      aiNotifs.push({
        id: 'ai-chatbot',
        icon: 'chatbubble',
        color: '#00BCD4',
        title: 'AI Chatbot',
        text: 'Ask me about appointment scheduling or medical protocols',
        time: '1h ago'
      });
    }
    
    return aiNotifs;
  };

  const loadNotifications = async () => {
    try {
      const appointments = await getAppointments(user?.email);
      const vetAppointments = appointments.filter(apt => 
        apt.veterinarian === user?.email || 
        apt.assignedVet === user?.email || 
        (apt.veterinarian && apt.veterinarian.includes('Dr.'))
      );

      const now = new Date();
      const notificationList = [];

      vetAppointments.forEach(apt => {
        let aptDate;
        if (apt.appointmentDate?.seconds) {
          aptDate = new Date(apt.appointmentDate.seconds * 1000);
        } else {
          aptDate = new Date(apt.appointmentDate || apt.dateTime);
        }

        if (!isNaN(aptDate.getTime())) {
          const timeDiff = aptDate.getTime() - now.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          if (hoursDiff <= 0 && apt.status !== 'Completed') {
            notificationList.push({
              id: `due-${apt.id}`,
              icon: 'alert-circle',
              color: '#FF6B6B',
              title: 'Appointment Overdue',
              text: `${apt.customerName} - ${apt.petName} appointment is overdue`,
              time: aptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            });
          } else if (hoursDiff <= 1 && hoursDiff > 0) {
            notificationList.push({
              id: `reminder-${apt.id}`,
              icon: 'time',
              color: '#FFA500',
              title: 'Appointment Reminder',
              text: `${apt.customerName} - ${apt.petName} appointment in ${Math.round(hoursDiff * 60)} minutes`,
              time: aptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            });
          } else if (hoursDiff <= 24 && hoursDiff > 1) {
            notificationList.push({
              id: `upcoming-${apt.id}`,
              icon: 'calendar',
              color: '#4ECDC4',
              title: 'Upcoming Appointment',
              text: `${apt.customerName} - ${apt.petName} scheduled ${hoursDiff < 24 ? 'today' : 'tomorrow'}`,
              time: aptDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            });
          }

          if (apt.status === 'Completed') {
            const completedHours = (now.getTime() - aptDate.getTime()) / (1000 * 60 * 60);
            if (completedHours <= 24) {
              notificationList.push({
                id: `completed-${apt.id}`,
                icon: 'checkmark-circle',
                color: '#4CAF50',
                title: 'Appointment Completed',
                text: `${apt.customerName} - ${apt.petName} ${apt.reason || 'checkup'} completed`,
                time: `${Math.round(completedHours)}h ago`
              });
            }
          }
        }
      });

      // AI-powered notifications
      const aiNotifications = generateAINotifications(vetAppointments, now);
      notificationList.push(...aiNotifications);

      // Admin notice
      notificationList.push({
        id: 'admin-notice',
        icon: 'megaphone',
        color: '#FF5722',
        title: 'Admin Notice',
        text: 'New vaccination protocol guidelines',
        time: '2d ago'
      });

      setNotifications(notificationList);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationItem}>
              <Ionicons name={notification.icon} size={20} color={notification.color} />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationText}>{notification.text}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});