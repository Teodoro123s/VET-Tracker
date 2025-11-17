import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { useState, useEffect } from 'react';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { userEmail } = useTenant();
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const email = user?.email || userEmail || 'admin@clinic.com';
        
        const adminInfo = {
          email: email,
          role: 'Clinic Administrator',
          createdAt: user?.metadata?.creationTime || new Date().toISOString(),
          lastLogin: user?.metadata?.lastSignInTime || new Date().toISOString()
        };
        setAdminData(adminInfo);
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };
    
    loadAdminData();
  }, [user, userEmail]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Admin Details</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{adminData?.email || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Role:</Text>
            <Text style={styles.value}>{adminData?.role || 'Admin'}</Text>
          </View>
        </View>



        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Account Created:</Text>
            <Text style={styles.value}>{adminData?.createdAt ? new Date(adminData.createdAt).toLocaleDateString() : 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Last Login:</Text>
            <Text style={styles.value}>{adminData?.lastLogin ? new Date(adminData.lastLogin).toLocaleDateString() : 'N/A'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#800000',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    flex: 2,
    fontSize: 14,
    color: '#666',
  },

});