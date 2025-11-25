import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useAdminProfile } from '../contexts/AdminProfileContext';
import ProfileImageModal from './ProfileImageModal';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { userEmail } = useTenant();
  const { 
    profileImage, 
    uploading, 
    showImageModal, 
    previewImage,
    handleImageUpload, 
    handleGalleryUpload, 
    handleSaveImage, 
    handleCancelUpload 
  } = useAdminProfile();

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
      {/* Admin Header */}
      <View style={styles.adminHeader}>
        <Image source={require('../assets/pawns web logo v3.png')} style={styles.logo} />
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleNavigation('/client/notifications')}>
            <Ionicons name="notifications" size={24} color="#800000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileContainer} onPress={handleImageUpload}>
            <View style={styles.profileImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImagePhoto} />
              ) : (
                <Ionicons name="person" size={20} color="#666" />
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#800000" />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.adminName}>{user?.email || userEmail || 'admin@clinic.com'}</Text>
              <Text style={styles.adminRole}>Administrator</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main Layout Container */}
      <View style={styles.mainLayout}>
        {/* Admin Sidebar */}
        <View style={styles.adminSidebar}>
          <Sidebar />
        </View>
        
        {/* Main Content */}
        <View style={styles.mainContent}>
          {children}
        </View>
      </View>
      
      <ProfileImageModal
        visible={showImageModal}
        previewImage={previewImage}
        uploading={uploading}
        onGalleryUpload={handleGalleryUpload}
        onSaveImage={handleSaveImage}
        onCancel={handleCancelUpload}
        primaryColor="#800000"
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 200,
  },
  searchInput: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    color: '#333',
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
    backgroundColor: '#f8f9fa',
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
  profileImagePhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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