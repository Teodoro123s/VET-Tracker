import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTenant } from '@/contexts/TenantContext';
import { getVeterinarians, generateOwnPassword } from '@/lib/services/firebaseService';
import { useRouter } from 'expo-router';

export default function VetProfile() {
  const { userEmail } = useTenant();
  const router = useRouter();
  const [vetData, setVetData] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    loadVetData();
  }, [userEmail]);

  const loadVetData = async () => {
    // Hardcode the veterinarian data
    const hardcodedVetData = {
      name: 'Dr. qwer qwer',
      email: 'edanel.teodoro@gmail.com',
      phone: 'qwer',
      specialization: 'qwer',
      license: '123'
    };
    setVetData(hardcodedVetData);
  };

  const getDisplayName = (email) => {
    if (!email) return 'User';
    return email.split('@')[0];
  };

  const handleGeneratePassword = async () => {
    setLoading(true);
    try {
      await generateOwnPassword(userEmail);
      setShowGenerateModal(false);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={30} color="#fff" />
        </View>
        <Text style={styles.profileName}>{vetData?.name || getDisplayName(userEmail)}</Text>
        <Text style={styles.profileEmail}>{vetData?.email || userEmail}</Text>
      </View>

      <View style={styles.profileDetails}>
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Contact & Professional Information</Text>
          {console.log('Rendering with vetData:', vetData)}
          <View style={styles.detailRow}>
            <Ionicons name="mail" size={20} color="#2c5aa0" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{vetData?.email || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call" size={20} color="#2c5aa0" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>qwer</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="medical" size={20} color="#2c5aa0" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Specialization</Text>
              <Text style={styles.detailValue}>qwer</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={20} color="#2c5aa0" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>License</Text>
              <Text style={styles.detailValue}>123</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Security</Text>
          <TouchableOpacity 
            style={styles.generatePasswordButton}
            onPress={() => setShowGenerateModal(true)}
          >
            <Ionicons name="key" size={20} color="#fff" />
            <Text style={styles.generatePasswordText}>Generate New Password</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => router.push('/shared/logout')}
      >
        <Ionicons name="log-out" size={20} color="white" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      {showSuccessMessage && (
        <View style={styles.successMessage}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.successText}>New password sent to your email!</Text>
        </View>
      )}
      
      <Modal visible={showGenerateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="shield-checkmark" size={32} color="#2c5aa0" />
              <Text style={styles.modalTitle}>Generate New Password</Text>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalMessage}>
                Generate a new password for your account?
              </Text>
              <Text style={styles.modalSubtext}>
                New credentials will be sent to {userEmail}
              </Text>
              <Text style={styles.modalNote}>
                Your current password will remain valid until you use the new one.
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowGenerateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
                onPress={handleGeneratePassword}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? 'Generating...' : 'Generate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  profileHeader: {
    backgroundColor: '#2c5aa0',
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