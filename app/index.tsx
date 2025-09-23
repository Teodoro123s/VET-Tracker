import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { isStaffMember } from '../lib/staffService';

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
          router.replace('/superadmin');
        } else {
          // Check if user is staff
          checkUserRoleAndRedirect(user.email);
        }
      } else {
        // User not logged in, redirect to login
        router.replace('/login');
      }
    }
  }, [user, loading, isReady]);
  
  const checkUserRoleAndRedirect = async (email: string) => {
    try {
      const staffCheck = await isStaffMember(email, email);
      if (staffCheck) {
        router.replace('/staff-dashboard');
      } else {
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      router.replace('/dashboard'); // Default to admin dashboard
    }
  };

  if (loading) {
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
