import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function LogoutScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to appropriate login based on platform
      if (Platform.OS === 'web') {
        router.replace('/auth/admin-login');
      } else {
        router.replace('/veterinarian/mobile-login');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback to appropriate login
      if (Platform.OS === 'web') {
        router.replace('/auth/admin-login');
      } else {
        router.replace('/veterinarian/mobile-login');
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Logout</ThemedText>
      <ThemedText>Are you sure you want to logout?</ThemedText>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Confirm Logout</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  button: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});