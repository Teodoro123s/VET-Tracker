import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { getCustomers, getAppointments, getVeterinarians } from '@/lib/services/firebaseService';
import { useTenant } from '@/contexts/TenantContext';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

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

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ThemedText>Loading dashboard...</ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.quickStats}>
              <TouchableOpacity style={styles.statCard} onPress={() => router.push('/client/customers')}>
                <Ionicons name="people" size={32} color={Colors.primary} />
                <ThemedText style={styles.statValue}>{stats.totalCustomers}</ThemedText>
                <ThemedText style={styles.statLabel}>Total Customers</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statCard} onPress={() => router.push('/client/appointments')}>
                <Ionicons name="calendar" size={32} color={Colors.primary} />
                <ThemedText style={styles.statValue}>{stats.todayAppointments}</ThemedText>
                <ThemedText style={styles.statLabel}>Today's Appointments</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.quickStats}>
              <TouchableOpacity style={styles.statCard} onPress={() => router.push('/client/appointments')}>
                <Ionicons name="today" size={32} color={Colors.primary} />
                <ThemedText style={styles.statValue}>{stats.totalAppointments}</ThemedText>
                <ThemedText style={styles.statLabel}>Total Appointments</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statCard} onPress={() => router.push('/client/veterinarians')}>
                <Ionicons name="medical" size={32} color={Colors.primary} />
                <ThemedText style={styles.statValue}>{stats.totalVeterinarians}</ThemedText>
                <ThemedText style={styles.statLabel}>Veterinarians</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.quickActions}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/client/appointments')}>
              <Ionicons name="add-circle" size={40} color={Colors.primary} />
              <Text style={styles.actionText}>New Appointment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/client/customers')}>
              <Ionicons name="person-add" size={40} color={Colors.primary} />
              <Text style={styles.actionText}>Add Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/client/records')}>
              <Ionicons name="document-text" size={40} color={Colors.primary} />
              <Text style={styles.actionText}>Medical Records</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/client/notifications')}>
              <Ionicons name="notifications" size={40} color={Colors.primary} />
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
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 0.48,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  quickActions: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  actionText: {
    fontSize: 12,
    color: Colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});