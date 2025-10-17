import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';
import { Colors } from '../constants/Colors';

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
      // Check superadmins collection first
      const superAdminQuery = query(collection(db, 'superadmins'), where('email', '==', username.trim()));
      const superAdminSnapshot = await getDocs(superAdminQuery);
      
      if (!superAdminSnapshot.empty) {
        const superAdminData = superAdminSnapshot.docs[0].data();
        
        if (superAdminData.password !== password) {
          setErrorMessage('Incorrect password. Please try again.');
          return;
        }
        
        await AsyncStorage.setItem('currentUser', JSON.stringify({
          email: superAdminData.email,
          role: 'superadmin',
          name: superAdminData.name
        }));
        
        await checkAuthState();
        router.replace('/server/superadmin');
        return;
      }
      
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
      
      // Restrict mobile accounts from web login
      if (userData.role === 'veterinarian' || userData.role === 'staff') {
        setErrorMessage('Mobile accounts cannot access web interface. Please use mobile login.');
        return;
      }
      
      // Route based on role
      if (username.includes('superadmin') || userData.role === 'superadmin') {
        router.replace('/server/superadmin');
      } else if (userData.role === 'admin') {
        router.replace('/client/dashboard');
      } else {
        setErrorMessage('Invalid account type for web access.');
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
            <Image source={require('@/assets/mobile-logo.png')} style={styles.logo} />
          </View>

          <Text style={styles.subtitle}>Veterinary Management System</Text>
        </View>

        <View style={styles.formContainer}>
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color={Colors.text.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address (e.g., clinic@gmail.com)"
              placeholderTextColor={Colors.text.muted}
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
            <Ionicons name="lock-closed-outline" size={18} color={Colors.text.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor={Colors.text.muted}
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
                color={Colors.text.muted} 
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
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 40,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
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
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: Colors.status.error + '20',
    borderColor: Colors.status.error,
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.status.error,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.text.primary,
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
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.interactive.disabled,
  },
  loginButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 24,
  },
  forgotPasswordText: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
});