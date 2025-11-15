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
// import ChatBot from '../components/ChatBot'; // Commented out - component not available


import { subscriptionScheduler } from '@/lib/utils/subscriptionScheduler';
import { useAuth } from '@/contexts/AuthContext';

function AppContent() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Check for veterinarian routes
  const isVetRoute = pathname.startsWith('/veterinarian/') && pathname !== '/veterinarian/mobile-login';
  
  // Check for client routes
  const isClientRoute = pathname.startsWith('/client/');
  
  // Routes that should have no sidebar
  const noSidebarRoutes = pathname === '/server/superadmin' || pathname === '/server/subscriptions' || pathname === '/server/subscription-periods' || pathname === '/server/transaction-history' || pathname === '/server/superadmin-dashboard' || pathname === '/server/financial-analytics' || pathname === '/auth/admin-login' || pathname === '/veterinarian/mobile-login' || pathname === '/auth/login' || pathname === '/login' || pathname === '/' || pathname.startsWith('/veterinarian/') || pathname.startsWith('/server/');
  
  const showMainSidebar = !noSidebarRoutes;
  const showBottomMenu = isVetRoute;
  const showMobileHeader = isVetRoute;
  
  const { selectedCustomer, setSelectedCustomer, showPetsView, setShowPetsView, selectedPet, setSelectedPet, showMedicalView, setShowMedicalView, selectedMedicalRecord, setSelectedMedicalRecord } = useCustomer();
  
  // Get page title and determine if should show back button
  const getHeaderProps = () => {
    if (pathname === '/veterinarian/vet-mobile') {
      return { showBackButton: false, title: '' };
    }
    if (pathname === '/veterinarian/vet-customers') {
      return { 
        showBackButton: selectedMedicalRecord || showMedicalView || selectedPet || showPetsView || selectedCustomer, 
        title: selectedMedicalRecord ? 'Medical Record Details' :
               showMedicalView ? 'Medical History' : 
               selectedPet ? 'Pet Details' : 
               showPetsView ? 'Pets' : 
               selectedCustomer ? 'Customer Details' : 'Customers' 
      };
    }
    if (pathname === '/veterinarian/vet-calendar') {
      return { showBackButton: false, title: 'Calendar' };
    }
    if (pathname === '/veterinarian/vet-appointments') {
      return { showBackButton: false, title: 'Appointments' };
    }
    if (pathname === '/veterinarian/vet-notifications') {
      return { showBackButton: true, title: 'Notifications' };
    }
    if (pathname === '/veterinarian/appointment-details') {
      return { showBackButton: true, title: 'Appointment Details', hideActions: true };
    }
    if (pathname === '/veterinarian/vet-medical-record-detail') {
      return { showBackButton: true, title: 'Medical Record', hideActions: true };
    }
    return { showBackButton: true, title: 'Veterinarian' };
  };
  
  return (
    <NavigationThemeProvider value={DefaultTheme}>
      <View style={styles.container}>
        {showMainSidebar && <Sidebar />}
        <View style={!showMainSidebar ? styles.fullContent : styles.content}>
          {showMobileHeader && <VetMobileHeader {...getHeaderProps()} onBackPress={() => {
            if (pathname === '/veterinarian/vet-customers') {
              if (selectedMedicalRecord) {
                setSelectedMedicalRecord(null);
              } else if (showMedicalView) {
                setShowMedicalView(false);
              } else if (selectedPet) {
                setSelectedPet(null);
              } else if (showPetsView) {
                setShowPetsView(false);
              } else if (selectedCustomer) {
                setSelectedCustomer(null);
              }
            } else {
              require('expo-router').router.back();
            }
          }} />}
          <View style={showBottomMenu ? styles.contentWithMenu : styles.fullHeight}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />

            <Stack.Screen name="client/dashboard" />
            <Stack.Screen name="client/appointments" />
            <Stack.Screen name="client/customers" />
            <Stack.Screen name="client/customer-detail" />
            <Stack.Screen name="client/veterinarians" />
            <Stack.Screen name="client/records" />
            <Stack.Screen name="client/notifications" />
            <Stack.Screen name="client/settings" />
            <Stack.Screen name="client/admin-details" />


            <Stack.Screen name="server/superadmin" />
            <Stack.Screen name="server/subscriptions" />
            <Stack.Screen name="server/subscription-periods" />
            <Stack.Screen name="server/transaction-history" />
            <Stack.Screen name="server/superadmin-dashboard" />
            <Stack.Screen name="veterinarian/vet-calendar" />
            <Stack.Screen name="veterinarian/vet-appointments" />
            <Stack.Screen name="veterinarian/vet-medical-record" />
            <Stack.Screen name="veterinarian/vet-medical-record-detail" />
            <Stack.Screen name="veterinarian/vet-profile" />
            <Stack.Screen name="veterinarian/mobile-login" />
            <Stack.Screen name="auth/admin-login" />

            <Stack.Screen name="+not-found" />
          </Stack>
          </View>
          {showBottomMenu && <VetBottomMenu />}
        </View>
        
        {/* AI Chatbot - Show on client routes */}
        {/* {isClientRoute && <ChatBot tenantId="default" />} */}
        

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