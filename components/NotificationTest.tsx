import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';

export default function NotificationTest() {
  const { addNotification, notifySuccess, notifyError, notifyInfo } = useNotifications();

  const testNotifications = () => {
    // Test different types of notifications
    notifySuccess('Success!', 'This is a success notification');
    
    setTimeout(() => {
      notifyError('Error!', 'This is an error notification');
    }, 1000);
    
    setTimeout(() => {
      notifyInfo('Info', 'This is an info notification');
    }, 2000);
    
    setTimeout(() => {
      addNotification({
        title: 'Appointment Reminder',
        message: 'John Doe - Fluffy (Vaccination) in 30 minutes',
        type: 'due'
      });
    }, 3000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Test</Text>
      <TouchableOpacity style={styles.button} onPress={testNotifications}>
        <Text style={styles.buttonText}>Test Notifications</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#800020',
  },
  button: {
    backgroundColor: '#800020',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});