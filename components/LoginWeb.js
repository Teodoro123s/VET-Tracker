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
    
      
        
          
            
          

          Veterinary Management System
        

        
          {errorMessage ? (
            
              {errorMessage}
            
          ) : null}
          
          
            
             {
                setUsername(text);
                if (errorMessage) setErrorMessage('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
          

          
            
             {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              onSubmitEditing={handleLogin}
            />
             setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              
            
          

          
            
              {isLoading ? 'Signing in...' : 'Sign In'}
            
          

           setShowForgotPassword(true)}
          >
            Forgot Password?
          
        
      
      
       setShowForgotPassword(false)}
        userType="admin"
      />
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding,
  },
  loginCard: {
    backgroundColor: Colors.surface,
    borderRadius,
    padding,
    width: '100%',
    maxWidth,
    shadowColor: Colors.primary,
    shadowOffset: { width, height},
    shadowOpacity: 0.1,
    shadowRadius,
    elevation,
    borderWidth,
    borderColor: Colors.border.light,
  },
  header: {
    alignItems: 'center',
    marginBottom,
  },
  logoContainer: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom,
  },
  logo: {
    width,
    height,
    resizeMode: 'contain',
  },
  title: {
    fontSize,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom,
  },
  subtitle: {
    fontSize,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: Colors.status.error + '20',
    borderColor: Colors.status.error,
    borderWidth,
    borderRadius,
    padding,
    marginBottom,
  },
  errorText: {
    color: Colors.status.error,
    fontSize,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius,
    marginBottom,
    paddingHorizontal,
    shadowColor: '#000',
    shadowOffset: { width, height},
    shadowOpacity: 0.05,
    shadowRadius,
    elevation,
  },
  inputIcon: {
    marginRight,
  },
  input: {
    flex,
    paddingVertical,
    fontSize,
    color: Colors.text.primary,
  },
  passwordInput: {
    paddingRight,
  },
  eyeIcon: {
    position: 'absolute',
    right,
    padding,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius,
    paddingVertical,
    alignItems: 'center',
    marginTop,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.interactive.disabled,
  },
  loginButtonText: {
    color: Colors.text.inverse,
    fontSize,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop,
  },
  forgotPasswordText: {
    color: Colors.secondary,
    fontSize,
    fontWeight: '500',
  },
});