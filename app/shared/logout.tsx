import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export default function LogoutScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { userRole } = useTenant();

  const getLoginRoute = () => {
    const role = user?.role || userRole;
    switch (role) {
      case 'superadmin':
        return '/auth/superadmin-login';
      case 'veterinarian':
        return '/veterinarian/mobile-login';
      case 'admin':
      default:
        return '/auth/admin-login';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace(getLoginRoute());
    } catch (error) {
      console.error('Error during logout:', error);
      router.replace(getLoginRoute());
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