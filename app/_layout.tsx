import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

import { NotificationProvider } from '@/contexts/NotificationContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';
import Sidebar from '@/components/Sidebar';
import { subscriptionScheduler } from '@/lib/utils/subscriptionScheduler';

function AppContent() {
  const pathname = usePathname();
  const noSidebarRoutes = pathname === '/server/superadmin' || pathname === '/server/subscriptions' || pathname === '/server/subscription-periods' || pathname === '/server/transaction-history' || pathname === '/server/superadmin-dashboard' || pathname === '/auth/admin-login' || pathname === '/auth/superadmin-login' || pathname === '/veterinarian/mobile-login' || pathname === '/veterinarian/vet-mobile' || pathname === '/client/staff-dashboard' || pathname === '/veterinarian/mobile' || pathname === '/auth/login' || pathname === '/login' || pathname === '/';
  const showSidebar = !noSidebarRoutes;
  
  return (
    <NavigationThemeProvider value={DefaultTheme}>
      <View style={styles.container}>
        {showSidebar && <Sidebar />}
        <View style={(!showSidebar) ? styles.fullContent : styles.content}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="client/dashboard" />
            <Stack.Screen name="client/appointments" />
            <Stack.Screen name="client/customers" />
            <Stack.Screen name="client/veterinarians" />
            <Stack.Screen name="client/staff" />
            <Stack.Screen name="client/records" />
            <Stack.Screen name="client/notifications" />
            <Stack.Screen name="client/settings" />
            <Stack.Screen name="client/staff-dashboard" />
            <Stack.Screen name="client/staff-profile" />
            <Stack.Screen name="client/admin-details" />
            <Stack.Screen name="client/dashboard-analytics" />
            <Stack.Screen name="shared/logout" />
            <Stack.Screen name="server/superadmin" />
            <Stack.Screen name="server/subscriptions" />
            <Stack.Screen name="server/subscription-periods" />
            <Stack.Screen name="server/transaction-history" />
            <Stack.Screen name="server/superadmin-dashboard" />
            <Stack.Screen name="veterinarian/vet-calendar" />
            <Stack.Screen name="veterinarian/vet-mobile" />
            <Stack.Screen name="veterinarian/vet-appointments" />
            <Stack.Screen name="veterinarian/vet-medical-record" />
            <Stack.Screen name="veterinarian/mobile-login" />
            <Stack.Screen name="veterinarian/mobile" />
            <Stack.Screen name="auth/admin-login" />
            <Stack.Screen name="auth/superadmin-login" />

            <Stack.Screen name="+not-found" />
          </Stack>
        </View>
      </View>
      <StatusBar style="dark" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Initialize subscription scheduler
    subscriptionScheduler.start();
    
    return () => {
      subscriptionScheduler.stop();
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <TenantProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </TenantProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  fullContent: {
    flex: 1,
    width: '100%',
  },
});