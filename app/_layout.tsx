import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

import { NotificationProvider } from '@/contexts/NotificationContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';
import React, { createContext, useContext } from 'react';

const CustomerContext = createContext();

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    return { selectedCustomer: null, setSelectedCustomer: () => {} };
  }
  return context;
};

function CustomerProvider({ children }) {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPetsView, setShowPetsView] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showMedicalView, setShowMedicalView] = useState(false);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState(null);
  return (
    <CustomerContext.Provider value={{ 
      selectedCustomer, setSelectedCustomer, 
      showPetsView, setShowPetsView,
      selectedPet, setSelectedPet,
      showMedicalView, setShowMedicalView,
      selectedMedicalRecord, setSelectedMedicalRecord
    }}>
      {children}
    </CustomerContext.Provider>
  );
}
import Sidebar from '@/components/Sidebar';
import VetBottomMenu from '@/components/VetBottomMenu';
import VetMobileHeader from '@/components/VetMobileHeader';
import { subscriptionScheduler } from '@/lib/utils/subscriptionScheduler';

function AppContent() {
  const pathname = usePathname();
  
  // Check for veterinarian routes
  const isVetRoute = pathname.startsWith('/veterinarian/') && pathname !== '/veterinarian/mobile-login';
  
  // Routes that should have no sidebar
  const noSidebarRoutes = pathname === '/server/superadmin' || pathname === '/server/subscriptions' || pathname === '/server/subscription-periods' || pathname === '/server/transaction-history' || pathname === '/server/superadmin-dashboard' || pathname === '/auth/admin-login' || pathname === '/auth/superadmin-login' || pathname === '/veterinarian/mobile-login' || pathname === '/auth/login' || pathname === '/login' || pathname === '/' || pathname.startsWith('/veterinarian/');
  
  const showMainSidebar = !noSidebarRoutes;
  const showBottomMenu = isVetRoute;
  const showMobileHeader = isVetRoute;
  
  const { selectedCustomer, showPetsView, selectedPet, showMedicalView, selectedMedicalRecord } = useCustomer();
  
  // Get page title and determine if should show back button
  const getHeaderProps = () => {
    if (pathname === '/veterinarian/vet-mobile') {
      return { showBackButton: false, title: '' };
    }
    if (pathname === '/veterinarian/vet-customers') {
      return { 
        showBackButton: true, 
        title: selectedMedicalRecord ? 'Medical Record Details' :
               showMedicalView ? 'Medical History' : 
               selectedPet ? 'Pet Details' : 
               showPetsView ? 'Pets' : 
               selectedCustomer ? 'Customer Details' : 'Customers' 
      };
    }
    if (pathname === '/veterinarian/vet-calendar') {
      return { showBackButton: true, title: 'Calendar' };
    }
    if (pathname === '/veterinarian/vet-appointments') {
      return { showBackButton: true, title: 'Appointments' };
    }
    if (pathname === '/veterinarian/vet-notifications') {
      return { showBackButton: true, title: 'Notifications' };
    }
    return { showBackButton: true, title: 'Veterinarian' };
  };
  
  return (
    <NavigationThemeProvider value={DefaultTheme}>
      <View style={styles.container}>
        {showMainSidebar && <Sidebar />}
        <View style={!showMainSidebar ? styles.fullContent : styles.content}>
          {showMobileHeader && <VetMobileHeader {...getHeaderProps()} onBackPress={() => {}} />}
          <View style={showBottomMenu ? styles.contentWithMenu : styles.fullHeight}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />

            <Stack.Screen name="client/dashboard" />
            <Stack.Screen name="client/appointments" />
            <Stack.Screen name="client/customers" />
            <Stack.Screen name="client/veterinarians" />
            <Stack.Screen name="client/records" />
            <Stack.Screen name="client/notifications" />
            <Stack.Screen name="client/settings" />
            <Stack.Screen name="client/admin-details" />
            <Stack.Screen name="client/dashboard-analytics" />
            <Stack.Screen name="shared/logout" />
            <Stack.Screen name="server/superadmin" />
            <Stack.Screen name="server/subscriptions" />
            <Stack.Screen name="server/subscription-periods" />
            <Stack.Screen name="server/transaction-history" />
            <Stack.Screen name="server/superadmin-dashboard" />
            <Stack.Screen name="veterinarian/vet-calendar" />
            <Stack.Screen name="veterinarian/vet-appointments" />
            <Stack.Screen name="veterinarian/vet-medical-record" />
            <Stack.Screen name="veterinarian/vet-profile" />
            <Stack.Screen name="veterinarian/mobile-login" />
            <Stack.Screen name="auth/admin-login" />
            <Stack.Screen name="auth/superadmin-login" />

            <Stack.Screen name="+not-found" />
          </Stack>
          </View>
          {showBottomMenu && <VetBottomMenu />}
        </View>
      </View>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
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
          <CustomerProvider>
            <AppContent />
          </CustomerProvider>
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
  contentWithMenu: {
    flex: 1,
  },
  fullHeight: {
    flex: 1,
  },
});