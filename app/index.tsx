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
        // User is logged in, redirect based on role and platform
        if (user.email?.includes('superadmin')) {
          router.replace('/server/superadmin');
        } else {
          // Platform-specific routing
          if (Platform.OS === 'web') {
            // Web users go to client interface
            router.replace('/client/dashboard');
          } else {
            // Mobile users go to veterinarian interface
            router.replace('/veterinarian/vet-mobile');
          }
        }
      } else {
        // User not logged in, platform-specific login
        if (Platform.OS === 'web') {
          router.replace('/auth/admin-login');
        } else {
          router.replace('/veterinarian/mobile-login');
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
