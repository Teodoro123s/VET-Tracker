import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVeterinarians, getVeterinarianByEmail } from '../lib/firebaseService';

export default function UserDetailsScreen({ navigation, userEmail }: any) {
  const [loading, setLoading] = useState(true);
  const [currentVet, setCurrentVet] = useState<any>(null);

  useEffect(() => {
    fetchCurrentVet();
  }, []);

  const fetchCurrentVet = async () => {
    try {
      console.log('Fetching current veterinarian...');
      // Use the logged-in user's email
      const loggedEmail = userEmail;
      console.log('Looking for veterinarian with email:', loggedEmail);
      const vet = await getVeterinarianByEmail(loggedEmail);
      console.log('Fetched vet:', vet);
      
      if (vet) {
        setCurrentVet(vet);
        console.log('Current vet set:', vet);
      } else {
        console.log('No veterinarian found for email:', loggedEmail);
        // Set fallback data
        setCurrentVet({
          id: 'fallback',
          name: 'User Not Found',
          email: loggedEmail || 'No email',
          phone: 'No phone',
          specialization: 'No specialization',
          license: 'No license',
          role: 'veterinarian'
        });
      }
    } catch (error) {
      console.error('Error loading veterinarian:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Always show data (either from DB or fallback)
  const displayVet = currentVet || {
    name: 'Dr. qqq',
    email: 'qqq@vetclinic.com',
    phone: '+1 (555) 123-4567',
    specialization: 'General Practice',
    licenseNumber: 'VET-2024-001',
    experience: '5'
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatarLarge}>
          <Ionicons name="person" size={60} color="#2563eb" />
        </View>
        <Text style={styles.userName}>{displayVet.name || 'Unknown'}</Text>
        <Text style={styles.userRole}>{displayVet.specialization || 'Veterinarian'}</Text>
        <Text style={styles.userEmail}>{displayVet.email || 'No email'}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="mail" size={20} color="#64748b" />
          <Text style={styles.infoText}>{displayVet.email || 'No email'}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="call" size={20} color="#64748b" />
          <Text style={styles.infoText}>{displayVet.phone || 'No phone'}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="medical" size={20} color="#64748b" />
          <Text style={styles.infoText}>License: {displayVet.license || 'No license'}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="person" size={20} color="#64748b" />
          <Text style={styles.infoText}>Role: {displayVet.role || 'Veterinarian'}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => navigation.replace('Login')}
      >
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 'auto',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
});