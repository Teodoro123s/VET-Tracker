import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function IndexScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for layout to be ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && isReady) {
      // Security: Clear browser history on auth state change
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', window.location.href);
        window.onpopstate = () => {
          if (!user) {
            // Prevent back navigation when logged out
            window.history.pushState(null, '', window.location.href);
          }
        };
      }
      
      if (user) {
        // User is logged in, redirect based on role
        if (user.email?.includes('superadmin') || user.role === 'superadmin') {
          router.replace('/server/superadmin');
        } else if (user.role === 'admin') {
          router.replace('/client/dashboard');
        } else if (user.role === 'veterinarian' || user.role === 'staff') {
          // Vets can use both interfaces, default to mobile on mobile platform
          if (Platform.OS === 'web') {
            router.replace('/client/dashboard');
          } else {
            router.replace('/veterinarian/vet-mobile');
          }
        } else {
          // Unknown role, redirect to login
          if (Platform.OS === 'web') {
            router.replace('/auth/admin-login');
          } else {
            router.replace('/veterinarian/mobile-login');
          }
        }
      } else {
        // No user logged in - Platform-specific default login
        if (Platform.OS === 'web') {
          router.replace('/auth/admin-login');  // Web -> Admin Login
        } else {
          router.replace('/veterinarian/mobile-login');  // Mobile -> Vet Login
        }
      }
    }
  }, [user, loading, isReady]);
  


  if (loading || !isReady) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text>Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
