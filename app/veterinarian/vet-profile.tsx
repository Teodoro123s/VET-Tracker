import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTenant } from '@/contexts/TenantContext';
import { getVeterinarianByEmail, generateOwnPassword } from '@/lib/services/firebaseService';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';

export default function VetProfile() {
  const { userEmail } = useTenant();
  const router = useRouter();
  const { logout } = useAuth();
  const [vetData, setVetData] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);


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
            <Ionicons name="mail" size={20} color={Colors.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{vetData?.email || userEmail || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call" size={20} color={Colors.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{vetData?.phone || vetData?.phoneNumber || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="medical" size={20} color={Colors.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Specialization</Text>
              <Text style={styles.detailValue}>{vetData?.specialization || vetData?.role || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={20} color={Colors.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>License</Text>
              <Text style={styles.detailValue}>{vetData?.license || vetData?.licenseNumber || vetData?.tenantId || 'Not provided'}</Text>
            </View>
          </View>
        </View>
        

      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => setShowLogoutModal(true)}
      >
        <Ionicons name="log-out" size={20} color="white" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalContent}>
            <Ionicons name="log-out" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
            <Text style={styles.logoutModalTitle}>Confirm Logout</Text>
            <Text style={styles.logoutModalText}>Are you sure you want to logout? You will need to login again to access the system.</Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmLogoutButton}
                onPress={async () => {
                  setShowLogoutModal(false);
                  try {
                    await logout();
                    router.replace('/auth/admin-login');
                  } catch (error) {
                    console.error('Error during logout:', error);
                    router.replace('/auth/admin-login');
                  }
                }}
              >
                <Text style={styles.confirmLogoutButtonText}>Logout</Text>
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
    backgroundColor: Colors.background,
  },
  profileHeader: {
    backgroundColor: Colors.primary,
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
    color: Colors.text.inverse,
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
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
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
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: Colors.status.error,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: Colors.text.inverse,
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
  logoutModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  logoutModalText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmLogoutButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmLogoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});