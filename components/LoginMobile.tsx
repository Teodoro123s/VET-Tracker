import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { loginUser } from '../lib/services/firebaseService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/config/firebaseConfig';
import { verifyPassword } from '../lib/utils/passwordUtils';


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
    let authSuccess = false;
    let userRole = '';
    
    try {
      console.log('=== LOGIN DEBUG START ===');
      console.log('Attempting login for:', username);
      
      // Try Firebase Auth login first
      try {
        const result = await loginUser(username, password);
        console.log('✅ Firebase Auth login successful:', result.email);
        authSuccess = true;
      } catch (firebaseError: any) {
        console.log('❌ Firebase Auth failed:', firebaseError.code, firebaseError.message);
        console.log('Trying Firestore password check as fallback...');
        
        // If Firebase Auth fails, try checking hashed password in Firestore
        const tenantQuery = query(
          collection(db, 'tenants'),
          where('email', '==', username)
        );
        const tenantSnapshot = await getDocs(tenantQuery);
        
        console.log('Tenant snapshot empty?', tenantSnapshot.empty);
        console.log('Number of tenant documents found:', tenantSnapshot.size);
        
        if (!tenantSnapshot.empty) {
          const tenantData = tenantSnapshot.docs[0].data();
          console.log('Tenant data found:', {
            email: tenantData.email,
            role: tenantData.role,
            hasPassword: !!tenantData.password,
            hasSalt: !!tenantData.salt,
            status: tenantData.status
          });
          
          if (tenantData.password && tenantData.salt) {
            // Check hashed password
            console.log('Verifying hashed password...');
            const isValidPassword = verifyPassword(password, tenantData.password, tenantData.salt);
            console.log('Password verification result:', isValidPassword);
            
            if (isValidPassword) {
              console.log('✅ Firestore password verification successful');
              authSuccess = true;
              userRole = tenantData.role || '';
            } else {
              console.log('❌ Firestore password verification failed - password mismatch');
            }
          } else {
            console.log('❌ Tenant has no password or salt stored');
          }
        } else {
          console.log('❌ No tenant document found for email:', username);
        }
        
        if (!authSuccess) {
          console.log('❌ All authentication methods failed');
          throw firebaseError; // Re-throw original error if Firestore check also failed
        }
      }
      
      // If auth succeeded, check user role from tenants collection
      if (!userRole) {
        const tenantQuery = query(
          collection(db, 'tenants'),
          where('email', '==', username)
        );
        const tenantSnapshot = await getDocs(tenantQuery);
        
        if (!tenantSnapshot.empty) {
          const tenantData = tenantSnapshot.docs[0].data();
          userRole = tenantData.role || '';
          
          console.log('User role from Firestore:', userRole);
          console.log('Tenant data:', tenantData);
        }
      }
      
      // Route based on role
      console.log('Authentication successful, routing based on role:', userRole);
      if (userRole === 'veterinarian') {
        console.log('✅ Routing to veterinarian mobile: /veterinarian/vet-mobile');
        router.replace('/veterinarian/vet-mobile');
      } else if (username.includes('superadmin')) {
        console.log('✅ Routing to superadmin: /server/superadmin');
        router.replace('/server/superadmin');
      } else {
        console.log('✅ Routing to client dashboard: /client/dashboard');
        router.replace('/client/dashboard');
      }
      console.log('=== LOGIN DEBUG END ===');
      
    } catch (error: any) {
      console.log('=== LOGIN ERROR ===');
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.log('=== LOGIN DEBUG END ===');
      
      // Provide more specific error messages
      let errorMessage = 'Invalid email or password';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      }
      
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('@/assets/mobile-logo.png')} style={styles.logo} />
          </View>
          <Text style={styles.title}>VetCare</Text>
          <Text style={styles.subtitle}>Veterinary Management System</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
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
            onPress={() => Alert.alert('Forgot Password', 'Please contact your administrator for password reset.')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    width: '100%',
    maxWidth: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: '100%',
    maxWidth: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    minHeight: 48,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
    minWidth: 24,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.interactive.disabled,
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: Colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 32,
    minHeight: 48,
    justifyContent: 'center',
  },
  forgotPasswordText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
});