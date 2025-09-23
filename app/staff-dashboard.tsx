import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { getStaffDashboardData, hasPermission } from '../lib/staffService';
import { useRouter } from 'expo-router';

export default function StaffDashboard() {
  const { userEmail } = useTenant();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await getStaffDashboardData(userEmail, userEmail);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unable to load dashboard data</Text>
      </View>
    );
  }

  const { staff, todayAppointments, customerCount, permissions } = dashboardData;

  const quickActions = [
    {
      title: 'Schedule Appointment',
      icon: require('@/assets/appointments.png'),
      route: '/appointments',
      permission: 'appointments',
      action: 'create'
    },
    {
      title: 'Add Customer',
      icon: require('@/assets/customers.png'),
      route: '/customers',
      permission: 'customers',
      action: 'create'
    },
    {
      title: 'View Appointments',
      icon: require('@/assets/appointments.png'),
      route: '/appointments',
      permission: 'appointments',
      action: 'read'
    },
    {
      title: 'Customer List',
      icon: require('@/assets/customers.png'),
      route: '/customers',
      permission: 'customers',
      action: 'read'
    }
  ];

  const availableActions = quickActions.filter(action => 
    hasPermission(staff, action.permission, action.action)
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {staff.name}</Text>
        <Text style={styles.roleText}>Receptionist</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayAppointments.length}</Text>
          <Text style={styles.statLabel}>Today's Appointments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{customerCount}</Text>
          <Text style={styles.statLabel}>Total Customers</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {availableActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => router.push(action.route)}
            >
              <Image source={action.icon} style={styles.actionIcon} />
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {todayAppointments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Appointments</Text>
          <View style={styles.appointmentsList}>
            {todayAppointments.slice(0, 5).map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentTime}>
                  <Text style={styles.timeText}>{appointment.time}</Text>
                </View>
                <View style={styles.appointmentDetails}>
                  <Text style={styles.customerName}>{appointment.customerName}</Text>
                  <Text style={styles.petName}>{appointment.petName}</Text>
                  <Text style={styles.serviceType}>{appointment.service}</Text>
                </View>
                <View style={styles.appointmentStatus}>
                  <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                    {appointment.status || 'Scheduled'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          {todayAppointments.length > 5 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/appointments')}
            >
              <Text style={styles.viewAllText}>View All Appointments</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Permissions</Text>
        <View style={styles.permissionsContainer}>
          {Object.entries(permissions).map(([module, perms]: [string, any]) => (
            <View key={module} style={styles.permissionCard}>
              <Text style={styles.permissionModule}>{module.charAt(0).toUpperCase() + module.slice(1)}</Text>
              <View style={styles.permissionActions}>
                {Object.entries(perms).map(([action, allowed]: [string, any]) => (
                  <Text 
                    key={action} 
                    style={[styles.permissionAction, { color: allowed ? '#28a745' : '#dc3545' }]}
                  >
                    {action}: {allowed ? '✓' : '✗'}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed': return '#28a745';
    case 'in-progress': return '#ffc107';
    case 'cancelled': return '#dc3545';
    default: return '#007bff';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#800000',
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  actionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  appointmentsList: {
    gap: 10,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentTime: {
    width: 80,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#800000',
  },
  appointmentDetails: {
    flex: 1,
    paddingHorizontal: 15,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  petName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  serviceType: {
    fontSize: 12,
    color: '#999',
  },
  appointmentStatus: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewAllButton: {
    backgroundColor: '#800000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  viewAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  permissionsContainer: {
    gap: 10,
  },
  permissionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  permissionModule: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  permissionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  permissionAction: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#dc3545',
  },
});