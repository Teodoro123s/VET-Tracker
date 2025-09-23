import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
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
        if (user.email?.includes('superadmin')) {
          router.replace('/server/superadmin');
        } else {
          // All non-superadmin users go to blue veterinarian interface
          router.replace('/veterinarian/vet-mobile');
        }
      } else {
        // User not logged in, redirect to mobile login
        router.replace('/veterinarian/mobile-login');
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
