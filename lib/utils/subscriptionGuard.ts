import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

/**
 * Route Protection Hook
 * Prevents access to restricted routes when subscription is expired
 * Only applies to admin role users
 */
export function useProtectedRoute() {
  const { user } = useAuth();
  const { hasActiveSubscription, loading } = useSubscription();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return; // Wait for subscription status to load

    // Check if user is in a restricted area
    const inRestrictedArea = segments[0] === 'client' && 
                             segments[1] !== 'settings'; // Settings is always accessible

    // Only restrict admin users without active subscription
    if (user?.role === 'admin' && 
        !hasActiveSubscription && 
        inRestrictedArea) {
      console.log('⚠️ Access denied: Subscription expired. Redirecting to settings...');
      router.replace('/client/settings');
    }
  }, [hasActiveSubscription, loading, segments, user]);
}
