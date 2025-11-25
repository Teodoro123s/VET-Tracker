import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAdminProfile } from '../../contexts/AdminProfileContext';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { hasActiveSubscription, daysRemaining, totalDaysRemaining, queuedPeriods, currentPeriod, endDate, loading, isInGracePeriod, graceDaysRemaining } = useSubscription();
  const { adminEmail, adminRole, profileImage, uploading, handleImageUpload } = useAdminProfile();
  const [adminData, setAdminData] = useState(null);
  const [clinicName, setClinicName] = useState('');

  const handleNavigation = async (route: string | null) => {
    if (!route) return;
    try {
      if (typeof window !== 'undefined') {
        window.location.href = route;
      }
    } catch (error) {
      console.error(`Navigation error to ${route}:`, error);
      alert('Failed to navigate. Please try again.');
    }
  };

  useEffect(() => {
    setClinicName(adminEmail.split('@')[0]);
  }, [adminEmail]);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const adminInfo = {
          email: adminEmail,
          role: adminRole,
          createdAt: (user as any)?.metadata?.creationTime || new Date().toISOString(),
          lastLogin: (user as any)?.metadata?.lastSignInTime || new Date().toISOString()
        };
        setAdminData(adminInfo);
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };
    
    loadAdminData();
  }, [user, adminEmail, adminRole]);

  return (
    <View style={styles.container}>
      {/* Admin Header */}
      <View style={styles.adminHeader}>
        <Image source={require('../../assets/pawns web logo v3.png')} style={styles.logo} />
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleNavigation('/client/notifications')}>
            <Ionicons name="notifications" size={20} color="#800000" />
          </TouchableOpacity>
          <View style={styles.profileContainer}>
            <TouchableOpacity style={styles.profileImage} onPress={handleImageUpload} disabled={uploading}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImagePhoto} />
              ) : (
                <Ionicons name="person" size={20} color="#666" />
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <Ionicons name="cloud-upload" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.adminName}>{adminEmail}</Text>
              <Text style={styles.adminRole}>{adminRole}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </View>
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
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Admin Details</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{adminData?.email || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Role:</Text>
            <Text style={styles.value}>{adminData?.role || 'Admin'}</Text>
          </View>
        </View>

        {/* Subscription Information */}
        {user?.role === 'admin' && !loading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription Status</Text>
            
            {hasActiveSubscription ? (
              <>
                <View style={styles.subscriptionStatusCard}>
                  <View style={styles.statusHeader}>
                    <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                    <Text style={styles.statusActive}>Active</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Current Period:</Text>
                  <Text style={styles.value}>{currentPeriod}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Days Remaining:</Text>
                  <Text style={[
                    styles.value, 
                    styles.daysRemainingText,
                    daysRemaining <= 7 && styles.daysWarning
                  ]}>
                    {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Expiry Date:</Text>
                  <Text style={styles.value}>
                    {endDate ? endDate.toLocaleDateString() : 'N/A'}
                  </Text>
                </View>

                {queuedPeriods > 0 && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Queued Periods:</Text>
                      <Text style={styles.value}>{queuedPeriods}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Total Days (with queue):</Text>
                      <Text style={[styles.value, styles.totalDaysText]}>
                        {totalDaysRemaining} days
                      </Text>
                    </View>
                  </>
                )}

                {daysRemaining <= 7 && (
                  <View style={styles.warningBox}>
                    <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                    <Text style={styles.warningText}>
                      Your subscription is expiring soon! Contact support to renew.
                    </Text>
                  </View>
                )}
              </>
            ) : isInGracePeriod ? (
              <>
                <View style={styles.subscriptionStatusCard}>
                  <View style={styles.statusHeader}>
                    <Ionicons name="alert-circle" size={32} color="#f59e0b" />
                    <Text style={styles.statusGrace}>Grace Period</Text>
                  </View>
                </View>

                <View style={styles.warningBox}>
                  <Ionicons name="time" size={24} color="#f59e0b" />
                  <View style={styles.warningTextContainer}>
                    <Text style={styles.warningTitle}>⏳ Grace Period Active</Text>
                    <Text style={styles.warningDescription}>
                      Your subscription has expired but you're in a {graceDaysRemaining}-day grace period. 
                      Most features remain accessible, but please renew soon to avoid service interruption.
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Grace Days Remaining:</Text>
                  <Text style={[styles.value, styles.graceDaysText]}>
                    {graceDaysRemaining} {graceDaysRemaining === 1 ? 'day' : 'days'}
                  </Text>
                </View>

                <View style={styles.contactInfo}>
                  <Text style={styles.contactTitle}>Contact Support to Renew:</Text>
                  <Text style={styles.contactDetail}>📧 Email: support@vettracker.com</Text>
                  <Text style={styles.contactDetail}>📞 Phone: +1 (555) 123-4567</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.subscriptionStatusCard}>
                  <View style={styles.statusHeader}>
                    <Ionicons name="close-circle" size={32} color="#ef4444" />
                    <Text style={styles.statusExpired}>Expired</Text>
                  </View>
                </View>

                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={24} color="#ef4444" />
                  <View style={styles.errorTextContainer}>
                    <Text style={styles.errorTitle}>Subscription Expired</Text>
                    <Text style={styles.errorDescription}>
                      Your subscription has expired. Most features are now restricted. 
                      Please contact support to renew your subscription and regain full access.
                    </Text>
                  </View>
                </View>

                <View style={styles.contactInfo}>
                  <Text style={styles.contactTitle}>Contact Support:</Text>
                  <Text style={styles.contactDetail}>📧 Email: support@vettracker.com</Text>
                  <Text style={styles.contactDetail}>📞 Phone: +1 (555) 123-4567</Text>
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Account Created:</Text>
            <Text style={styles.value}>{adminData?.createdAt ? new Date(adminData.createdAt).toLocaleDateString() : 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Last Login:</Text>
            <Text style={styles.value}>{adminData?.lastLogin ? new Date(adminData.lastLogin).toLocaleDateString() : 'N/A'}</Text>
          </View>
        </View>
            </View>
          </ScrollView>
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
    backgroundColor: '#f8f9fa',
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
    position: 'relative',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
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
    backgroundColor: '#FAFAFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    borderRadius: 10,
  },
  content: {
    flex: 1,
  },
  settingsSection: {
    marginBottom: 32,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#800000',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  value: {
    flex: 2,
    fontSize: 14,
    color: '#666',
  },
  subscriptionStatusCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusActive: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statusExpired: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  statusGrace: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  graceDaysText: {
    fontWeight: '600',
    color: '#f59e0b',
    fontSize: 16,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  daysRemainingText: {
    fontWeight: '600',
    fontSize: 16,
  },
  daysWarning: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  totalDaysText: {
    fontWeight: '600',
    color: '#10b981',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  errorTextContainer: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 4,
  },
  errorDescription: {
    fontSize: 13,
    color: '#7f1d1d',
    lineHeight: 18,
  },
  contactInfo: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  contactDetail: {
    fontSize: 14,
    color: '#1e3a8a',
    marginBottom: 4,
  },
});