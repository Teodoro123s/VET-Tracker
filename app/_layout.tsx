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
import { subscriptionScheduler } from '@/lib/subscriptionScheduler';

function AppContent() {
  const pathname = usePathname();
  const isSuperAdmin = pathname === '/superadmin' || pathname === '/subscriptions' || pathname === '/subscription-periods' || pathname === '/transaction-history' || pathname === '/superadmin-dashboard' || pathname === '/login';
  const showSidebar = !isSuperAdmin;
  
  return (
    <NavigationThemeProvider value={DefaultTheme}>
      <View style={styles.container}>
        {showSidebar && <Sidebar />}
        <View style={(!showSidebar) ? styles.fullContent : styles.content}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="appointments" />
            <Stack.Screen name="customers" />
            <Stack.Screen name="veterinarians" />
            <Stack.Screen name="staff" />

            <Stack.Screen name="records" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="logout" />
            <Stack.Screen name="superadmin" />
            <Stack.Screen name="subscriptions" />
            <Stack.Screen name="subscription-periods" />
            <Stack.Screen name="transaction-history" />
            <Stack.Screen name="admin-details" />
            <Stack.Screen name="vet-calendar" />
            <Stack.Screen name="login" />

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