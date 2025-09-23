import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCustomers, getPets, getVeterinarians, getAppointments } from '../lib/firebaseService';
import { useTenant } from '../contexts/TenantContext';


export default function DashboardScreen() {
  const router = useRouter();
  const { openDrawer } = useLocalSearchParams();
  const { userEmail, tenantId } = useTenant();
  
  const [customers, setCustomers] = useState([]);
  const [pets, setPets] = useState([]);
  const [veterinarians, setVeterinarians] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [customersData, petsData, vetsData, appointmentsData] = await Promise.all([
        getCustomers(userEmail),
        getPets(userEmail),
        getVeterinarians(userEmail),
        getAppointments(userEmail)
      ]);
      
      setCustomers(customersData);
      setPets(petsData);
      setVeterinarians(vetsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0];
    const aptDate = apt.date ? new Date(apt.date).toISOString().split('T')[0] : null;
    return aptDate === today;
  }).length;

  const pendingAppointments = appointments.filter(apt => apt.status === 'Pending').length;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading dashboard data...</Text>
      </View>
    );
  }

  const StatCard = ({ title, value, color = '#800000', bgColor = '#f8f9fa', onPress }) => (
    <TouchableOpacity style={[styles.statCard, { backgroundColor: bgColor }]} onPress={onPress}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Dashboard - {tenantId}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Today's Appointments" 
              value={todayAppointments} 
              color="#23C062" 
              bgColor="#e8f5e8" 
              onPress={() => router.push('/appointments')}
            />
            <StatCard 
              title="Total Customers" 
              value={customers.length} 
              color="#007BFF" 
              bgColor="#e3f2fd" 
              onPress={() => router.push('/customers')}
            />
            <StatCard 
              title="Total Pets" 
              value={pets.length} 
              color="#FF6B6B" 
              bgColor="#ffebee" 
            />
            <StatCard 
              title="Pending Appointments" 
              value={pendingAppointments} 
              color="#FFA500" 
              bgColor="#fff3e0" 
              onPress={() => router.push('/appointments')}
            />
            <StatCard 
              title="Total Veterinarians" 
              value={veterinarians.length} 
              color="#9C27B0" 
              bgColor="#f3e5f5" 
              onPress={() => router.push('/veterinarians')}
            />
            <StatCard 
              title="Total Appointments" 
              value={appointments.length} 
              color="#800000" 
              bgColor="#f8f9fa" 
              onPress={() => router.push('/appointments')}
            />
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
  header: {
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#800000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'flex-start',
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    minWidth: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 100,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
});