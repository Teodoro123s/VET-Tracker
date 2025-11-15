import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { loginUser } from '../lib/services/firebaseService';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function LoginMobile() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginUser(username, password);
      console.log('Login successful:', result);
      
      // Mobile component should only allow admin/superadmin (same as web)
      if (username.includes('superadmin')) {
        router.replace('/superadmin');
      } else {
        router.replace('/dashboard');
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    
      
        
          
            
          
          VetCare
          Veterinary Management System
        

        
          
            
            
          

          
            
            
             setShowPassword(!showPassword)}
            >
              
            
          

          
            
              {isLoading ? 'Signing in...' : 'Sign In'}
            
          

           Alert.alert('Forgot Password', 'Please contact your administrator for password reset.')}
          >
            Forgot Password?
          
        
      
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex,
    backgroundColor: Colors.background,
    width: '100%',
    maxWidth: '100%',
  },
  scrollContainer: {
    flexGrow,
    justifyContent: 'center',
    paddingHorizontal,
    paddingVertical,
    width: '100%',
    maxWidth: '100%',
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
    maxWidth,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius,
    marginBottom,
    paddingHorizontal,
    minHeight,
    shadowColor: Colors.primary,
    shadowOffset: { width, height},
    shadowOpacity: 0.05,
    shadowRadius,
    elevation,
    borderWidth,
    borderColor: Colors.border.light,
  },
  inputIcon: {
    marginRight,
  },
  input: {
    flex,
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
    minWidth,
    minHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius,
    minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop,
    shadowColor: Colors.primary,
    shadowOffset: { width, height},
    shadowOpacity: 0.2,
    shadowRadius,
    elevation,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.interactive.disabled,
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: Colors.text.inverse,
    fontSize,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop,
    minHeight,
    justifyContent: 'center',
  },
  forgotPasswordText: {
    color: Colors.secondary,
    fontSize,
    fontWeight: '500',
  },
});