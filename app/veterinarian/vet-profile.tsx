import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTenant } from '@/contexts/TenantContext';
import { getVeterinarianByEmail, generateOwnPassword } from '@/lib/services/firebaseService';
import { useRouter } from 'expo-router';

export default function VetProfile() {
  const { userEmail } = useTenant();
  const router = useRouter();
  const [vetData, setVetData] = useState(null);


  useEffect(() => {
    loadVetData();
  }, [userEmail]);

  const loadVetData = async () => {
    try {
      if (userEmail) {
        const vetData = await getVeterinarianByEmail(userEmail, userEmail);
        setVetData(vetData);
      }
    } catch (error) {
      console.error('Error loading veterinarian data:', error);
    }
  };

  const getDisplayName = (email) => {
    if (!email) return 'User';
    return email.split('@')[0];
  };



  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={30} color="#fff" />
        </View>
        <Text style={styles.profileName}>{vetData?.name || vetData?.clinicName || getDisplayName(userEmail)}</Text>
        <Text style={styles.profileEmail}>{vetData?.email || userEmail}</Text>
      </View>

      <View style={styles.profileDetails}>
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Contact & Professional Information</Text>
          {console.log('Rendering with vetData:', vetData)}
          <View style={styles.detailRow}>
            <Ionicons name="mail" size={20} color="#800020" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{vetData?.email || userEmail || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call" size={20} color="#800020" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{vetData?.phone || vetData?.phoneNumber || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="medical" size={20} color="#800020" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Specialization</Text>
              <Text style={styles.detailValue}>{vetData?.specialization || vetData?.role || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={20} color="#800020" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>License</Text>
              <Text style={styles.detailValue}>{vetData?.license || vetData?.licenseNumber || vetData?.tenantId || 'Not provided'}</Text>
            </View>
          </View>
        </View>
        

      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => router.push('/shared/logout')}
      >
        <Ionicons name="log-out" size={20} color="white" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      

      

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  profileHeader: {
    backgroundColor: '#800020',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  profileDetails: {
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailText: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  generatePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c5aa0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  generatePasswordText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 12,
  },
  modalContent: {
    padding: 24,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#2c5aa0',
    borderBottomRightRadius: 16,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  successMessage: {
    backgroundColor: '#E8F5E8',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  successText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});