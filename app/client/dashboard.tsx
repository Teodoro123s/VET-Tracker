import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { getCustomers, getAppointments, getVeterinarians } from '@/lib/services/firebaseService';
import { useTenant } from '@/contexts/TenantContext';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const { userEmail } = useTenant();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalAppointments: 0,
    totalVeterinarians: 0,
    todayAppointments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) {
      loadDashboardData();
    }
  }, [userEmail]);

  const loadDashboardData = async () => {
    try {
      const [customers, appointments, veterinarians] = await Promise.all([
        getCustomers(userEmail),
        getAppointments(userEmail),
        getVeterinarians(userEmail)
      ]);

      const today = new Date().toDateString();
      const todayAppointments = appointments.filter(apt => 
        new Date(apt.date).toDateString() === today
      ).length;

      setStats({
        totalCustomers: customers.length,
        totalAppointments: appointments.length,
        totalVeterinarians: veterinarians.length,
        todayAppointments
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: 'people',
      color: '#4CAF50',
      route: '/client/customers'
    },
    {
      title: 'Total Appointments',
      value: stats.totalAppointments,
      icon: 'calendar',
      color: '#2196F3',
      route: '/client/appointments'
    },
    {
      title: 'Today\'s Appointments',
      value: stats.todayAppointments,
      icon: 'today',
      color: '#FF9800',
      route: '/client/appointments'
    },
    {
      title: 'Veterinarians',
      value: stats.totalVeterinarians,
      icon: 'medical',
      color: '#9C27B0',
      route: '/client/veterinarians'
    }
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Dashboard</ThemedText>
        <Text style={styles.subtitle}>Welcome to your veterinary clinic management system</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ThemedText>Loading dashboard...</ThemedText>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {dashboardCards.map((card, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.card, { borderLeftColor: card.color }]}
                onPress={() => router.push(card.route)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardValue}>{card.value}</Text>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                  </View>
                  <View style={[styles.cardIcon, { backgroundColor: card.color }]}>
                    <Ionicons name={card.icon as any} size={24} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.quickActions}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/client/appointments')}
            >
              <Ionicons name="add-circle" size={32} color="#2196F3" />
              <Text style={styles.actionText}>New Appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/client/customers')}
            >
              <Ionicons name="person-add" size={32} color="#4CAF50" />
              <Text style={styles.actionText}>Add Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/client/records')}
            >
              <Ionicons name="document-text" size={32} color="#FF9800" />
              <Text style={styles.actionText}>Medical Records</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/client/notifications')}
            >
              <Ionicons name="notifications" size={32} color="#9C27B0" />
              <Text style={styles.actionText}>Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  cardsContainer: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  cardTitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});