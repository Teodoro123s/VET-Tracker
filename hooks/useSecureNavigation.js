import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

export const useSecureNavigation = () => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handlePopState = (event) => {
        if (!user) {
          // Prevent back navigation when logged out
          event.preventDefault();
          window.history.pushState(null, '', window.location.href);
          router.replace('/auth/admin-login');
        }
      };

      const handleBeforeUnload = (event) => {
        if (user) {
          // Warn user before closing tab/window when logged in
          event.preventDefault();
          event.returnValue = 'Are you sure you want to leave? You will be logged out.';
        }
      };

      // Disable browser back button when logged out
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Clear history on logout
      if (!user) {
        window.history.replaceState(null, '', '/auth/admin-login');
      }

      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [user, router]);
};