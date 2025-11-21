import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Global authentication guard
 * - Redirects unauthenticated users to the appropriate login screen
 * - Works for both web and mobile (Expo Router)
 */
export function useAuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // If not authenticated, always redirect to login
    if (!user) {
      if (Platform.OS === 'web') {
        router.replace('/auth/admin-login');
      } else {
        router.replace('/veterinarian/mobile-login');
      }
    }
  }, [user, loading, router]);
}
