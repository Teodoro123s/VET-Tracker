import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SuperAdminSidebar from './SuperAdminSidebar';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/config/firebaseConfig';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [superAdminData, setSuperAdminData] = useState<any>(null);

  useEffect(() => {
    const fetchSuperAdminData = async () => {
      if (user?.email) {
        try {
          const superAdminDoc = await getDoc(doc(db, 'superadmins', user.email));
          if (superAdminDoc.exists()) {
            setSuperAdminData(superAdminDoc.data());
          }
        } catch (error) {
          console.error('Error fetching superadmin data:', error);
        }
      }
    };

    fetchSuperAdminData();
  }, [user]);

  const handleNavigation = async (route: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.location.href = route;
      } else {
        router.push(route as any);
      }
    } catch (error) {
      console.error(`Navigation error to ${route}:`, error);
      alert('Failed to navigate. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* SuperAdmin Header */}
      <View style={styles.adminHeader}>
        <Image source={require('../assets/pawns web logo v3.png')} style={styles.logo} />
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleNavigation('/server/notifications')}>
            <Ionicons name="notifications" size={24} color="#800000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileContainer}>
            <View style={styles.profileImage}>
              <Ionicons name="person" size={20} color="#666" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.adminName}>{superAdminData?.name || user?.email || 'superadmin@system.com'}</Text>
              <Text style={styles.adminRole}>Super Administrator</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main Layout Container */}
      <View style={styles.mainLayout}>
        {/* SuperAdmin Sidebar */}
        <View style={styles.adminSidebar}>
          <SuperAdminSidebar />
        </View>
        
        {/* Main Content */}
        <View style={styles.mainContent}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  adminHeader: {
    height: 70,
    borderRadius: 10,
    backgroundColor: '#FAFAFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 8,
    borderRadius: 6,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'column',
  },
  adminName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  adminRole: {
    fontSize: 12,
    color: '#666',
  },
  mainLayout: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
  },
  adminSidebar: {
    width: 279,
    flexShrink: 0,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    borderRadius: 10,
  },
});