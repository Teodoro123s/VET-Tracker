import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { requestPasswordReset } from '@/lib/services/firebaseService';

export default function ForgotPasswordModal({ visible, onClose, userType }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('input');

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
    
      
        
          {step === 'input' ? (
            
              
                
                Forgot Password?
              
              
              
                
                  Enter your email address and we'll send you new login credentials.
                
                
                
              
              
              
                
                  Cancel
                
                
                  
                    {loading ? 'Sending...' : 'Send Password'}
                  
                
              
            
          ) : (
            
              
                
                Password Sent!
              
              
              
                
                  New login credentials have been sent to {email}
                
                
                  Check your email and use the new password to log in.
                
              
              
              
                Done
              
            
          )}
        
      
    
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    maxWidth,
    shadowColor: '#000',
    shadowOffset: { width, height},
    shadowOpacity: 0.3,
    shadowRadius,
    elevation,
  },
  modalHeader: {
  modalTitle: {
    fontSize,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop,
  },
  modalContent: {
    padding,
  },
  modalMessage: {
    fontSize,
  emailInput: {
    borderWidth,
    borderColor: '#ddd',
    borderRadius,
    padding,
    fontSize,
  modalButtons: {
    flexDirection: 'row',
    borderTopWidth,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex,
    paddingVertical,
    borderRightColor: '#f0f0f0',
  },
  sendButton: {
    flex,
    paddingVertical,
  sendButtonDisabled: {
  cancelButtonText: {
    fontSize,
  sendButtonText: {
    fontSize,
  successHeader: {
  successTitle: {
    fontSize,
  successContent: {
    padding,
  },
  successMessage: {
    fontSize,
  successNote: {
    fontSize,
    fontStyle: 'italic',
  },
  doneButton: {
  doneButtonText: {
    fontSize,});