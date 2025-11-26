import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';

export default function MobileLogin() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const handleLogin = async () => {
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      // Test veterinarian credentials (development shortcut)
      if (email.trim() === 'edzhel.teodoro25@gmail.com' && password === 'vet123') {
        const payload = JSON.stringify({
          email: 'edzhel.teodoro25@gmail.com',
          role: 'veterinarian',
          tenantId: 'edmo.teodoro.swu',
          name: 'Dr. Edzhel Teodoro'
        });
        if (rememberMe) {
          try { await AsyncStorage.setItem('currentUser', payload); } catch (e) {}
        }

        router.replace('/veterinarian/vet-mobile');
        return;
      }

      const result = await login(email.trim(), password, rememberMe);

      if (result.success) {
        const userRole = result.user?.role;

        if (userRole === 'veterinarian' || userRole === 'staff') {
          router.replace('/veterinarian/vet-mobile');
        } else if (userRole === 'admin' || userRole === 'superadmin') {
          setErrorMessage('Admin accounts cannot access mobile interface. Please use web login.');
        } else {
          setErrorMessage('Invalid account type for mobile access.');
        }
      } else {
        setErrorMessage(result.error || 'Invalid credentials');
      }
    } catch (error) {
      setErrorMessage('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={require('@/assets/Pawn_Logo_v2.png')} style={styles.logo} />
        </View>
        
        <Text style={styles.title}>Veterinary Login</Text>
        <Text style={styles.subtitle}>Welcome back! Please sign in to continue.</Text>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color="#7F1D1F" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorMessage) setErrorMessage('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color="#7F1D1F" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              secureTextEntry={!showPassword}
              editable={!loading}
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={18} 
                color="#7F1D1F" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} />
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
              <Text style={styles.forgotPasswordText}>Forgot password</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ForgotPasswordModal
        visible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        userType="veterinarian"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 80,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 130,
    height: 130,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
    color: '#7F1D1F',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: 'normal',
    fontFamily: 'sans-serif',
    color: '#7F1D1F',
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 80,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 14,
    fontFamily: 'sans-serif',
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: '#ffe6e6',
    padding: 10,
    borderRadius: 6,
    width: '100%',
  },
  formContainer: {
    width: '100%',
    maxWidth: 300,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'sans-serif',
    color: '#7F1D1F',
    marginBottom: 8,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7F1D1F80',
    marginBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#7F1D1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: 'sans-serif',
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#7F1D1F',
    borderColor: '#7F1D1F',
  },
  rememberText: {
    fontSize: 14,
    fontFamily: 'sans-serif',
    color: '#666',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'sans-serif',
    color: '#7F1D1F',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#7F1D1F',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  loginButtonDisabled: {
    backgroundColor: '#999',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
});