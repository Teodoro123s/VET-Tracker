import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { requestPasswordReset } from '@/lib/services/firebaseService';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  userType: string;
}

export default function ForgotPasswordModal({ visible, onClose, userType }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'success'>('input');

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim(), userType);
      setStep('success');
    } catch (error) {
      Alert.alert('Error', 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setEmail('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {step === 'input' ? (
            <>
              <View style={styles.modalHeader}>
                <Ionicons name="key" size={32} color="#2c5aa0" />
                <Text style={styles.modalTitle}>Forgot Password?</Text>
              </View>
              
              <View style={styles.modalContent}>
                <Text style={styles.modalMessage}>
                  Enter your email address and we'll send you new login credentials.
                </Text>
                
                <TextInput
                  style={styles.emailInput}
                  placeholder="Enter your email address"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                />
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.sendButton, loading && styles.sendButtonDisabled]} 
                  onPress={handleForgotPassword}
                  disabled={loading}
                >
                  <Text style={styles.sendButtonText}>
                    {loading ? 'Sending...' : 'Send Password'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.successHeader}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                <Text style={styles.successTitle}>Password Sent!</Text>
              </View>
              
              <View style={styles.successContent}>
                <Text style={styles.successMessage}>
                  New login credentials have been sent to {email}
                </Text>
                <Text style={styles.successNote}>
                  Check your email and use the new password to log in.
                </Text>
              </View>
              
              <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 20,
    lineHeight: 22,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
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
  sendButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#2c5aa0',
    borderBottomRightRadius: 16,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  sendButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  successHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 12,
  },
  successContent: {
    padding: 24,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  successNote: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});