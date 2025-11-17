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
      if (user) {
        // User is logged in, redirect based on role
        if (user.role === 'superadmin' || user.email === 'edzhelteodoro@gmail.com') {
          router.replace('/server/superadmin');
        } else if (user.role === 'admin') {
          router.replace('/client/dashboard');
        } else if (user.role === 'veterinarian' || user.role === 'staff' || user.email?.includes('veterinarian') || user.email?.includes('staff')) {
          router.replace('/veterinarian/vet-appointments');
        } else {
          // Unknown role, redirect to appropriate login
          if (Platform.OS === 'web') {
            router.replace('/auth/admin-login');
          } else {
            router.replace('/auth/mobile-login');
          }
        }
      } else {
        // No user logged in - route to login screen
        if (Platform.OS === 'web') {
          router.replace('/auth/admin-login');
        } else {
          router.replace('/auth/mobile-login');
        }
      }
    }
  }, [user, loading, isReady, router]);
  


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
