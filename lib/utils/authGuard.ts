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

    // Get current pathname
    const currentPath = window?.location?.pathname || '';
    
    // If not authenticated, redirect to login but allow direct access to login pages
    if (!user && !currentPath.includes('/mobile-login') && !currentPath.includes('/admin-login')) {
      if (Platform.OS === 'web') {
        router.replace('/auth/admin-login');
      } else {
        router.replace('/veterinarian/mobile-login');
      }
    }
  }, [user, loading, router]);
}
