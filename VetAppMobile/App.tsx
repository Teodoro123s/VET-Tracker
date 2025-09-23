import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import CalendarScreen from './screens/CalendarScreen';
import CustomersScreen from './screens/CustomersScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import UserDetailsScreen from './screens/UserDetailsScreen';
import LogoutScreen from './screens/LogoutScreen';

const screens = {
  Login: LoginScreen,
  Dashboard: DashboardScreen,
  Calendar: CalendarScreen,
  Customers: CustomersScreen,
  Notifications: NotificationsScreen,
  'User Details': UserDetailsScreen,
  Logout: LogoutScreen,
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Login');
  const [showMenu, setShowMenu] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const CurrentComponent = screens[currentScreen];

  const handleNavigation = (screen: string, email?: string) => {
    if (email) setUserEmail(email);
    setCurrentScreen(screen);
    setShowMenu(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      {currentScreen !== 'Login' && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{currentScreen}</Text>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={() => setCurrentScreen('User Details')}
          >
            <Ionicons name="person-circle" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Screen Content */}
      <View style={styles.content}>
        <CurrentComponent 
          navigation={{ 
            replace: handleNavigation,
            navigate: handleNavigation
          }} 
          userEmail={userEmail}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 40,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatar: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
});