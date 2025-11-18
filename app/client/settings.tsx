import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useState, useEffect } from 'react';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { userEmail } = useTenant();
  const { hasActiveSubscription, daysRemaining, totalDaysRemaining, queuedPeriods, currentPeriod, endDate, loading, isInGracePeriod, graceDaysRemaining } = useSubscription();
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const email = user?.email || userEmail || 'admin@clinic.com';
        
        const adminInfo = {
          email: email,
          role: 'Clinic Administrator',
          createdAt: user?.metadata?.creationTime || new Date().toISOString(),
          lastLogin: user?.metadata?.lastSignInTime || new Date().toISOString()
        };
        setAdminData(adminInfo);
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };
    
    loadAdminData();
  }, [user, userEmail]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Admin Details</Text>
      </View>
      
      <View style={styles.content}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#800000',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: 15,
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