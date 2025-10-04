import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';

export default function LoginWeb() {
  const router = useRouter();
  const { checkAuthState } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async () => {
    setErrorMessage('');
    
    // Validation
    if (!username.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    
    if (!password.trim()) {
      setErrorMessage('Please enter your password');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username.trim())) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Check in tenants collection for user credentials
      const q = query(collection(db, 'tenants'), where('email', '==', username.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setErrorMessage('No account found with this email address');
        return;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Check password
      if (userData.password !== password) {
        setErrorMessage('Incorrect password. Please try again.');
        return;
      }
      
      // Check account status
      if (userData.status === 'inactive' || userData.status === 'suspended') {
        setErrorMessage('This account has been disabled. Contact support.');
        return;
      }
      
      console.log('Login successful:', userData);
      
      // Store user data in AsyncStorage
      await AsyncStorage.setItem('currentUser', JSON.stringify({
        email: userData.email,
        role: userData.role,
        tenantId: userData.tenantId,
        clinicName: userData.clinicName
      }));
      
      // Update auth context immediately
      await checkAuthState();
      
      // Route based on role or email
      if (username.includes('superadmin') || userData.role === 'superadmin') {
        router.replace('/superadmin');
      } else if (userData.role === 'staff') {
        router.replace('/staff-dashboard');
      } else {
        router.replace('/dashboard');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Login failed. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginCard}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('@/assets/logo.png')} style={styles.logo} />
          </View>
          <Text style={styles.title}>VetCare</Text>
          <Text style={styles.subtitle}>Veterinary Management System</Text>
        </View>

        <View style={styles.formContainer}>
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address (e.g., clinic@gmail.com)"
              placeholderTextColor="#bbb"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errorMessage) setErrorMessage('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor="#bbb"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={18} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.forgotPassword} 
            onPress={() => setShowForgotPassword(true)}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ForgotPasswordModal
        visible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        userType="admin"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 40,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#800000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#fee',
    borderColor: '#fcc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#c33',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: '#333',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#800000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#cc9999',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 24,
  },
  forgotPasswordText: {
    color: '#800000',
    fontSize: 14,
    fontWeight: '500',
  },
});