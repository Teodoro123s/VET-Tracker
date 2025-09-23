import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Animated, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import SearchableDropdown from '@/components/SearchableDropdown';
import { createTenant, registerUser } from '../../lib/services/firebaseService';
import { createClinicUser } from '../../lib/clientAuth';
import { fetchAllTenants, deleteTenant, subscribeToTenants, updateSubscriber, createSubscriber, Subscriber } from '../../lib/services/superAdminService';
import { sendCredentialsEmail, generateSecurePassword } from '../../lib/utils/emailService';
import { deleteUserCompletely } from '../../lib/utils/completeUserDeletion';
import { addSubscriptionPeriod } from '../../lib/services/subscriptionService';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/config/firebaseConfig';
import { Typography, Spacing, ButtonSizes, ModalSizes } from '@/constants/Typography';

function SubscriptionPeriodsTable({ selectedTenant }) {
  const [subscriberTransactions, setSubscriberTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showDropdown, setShowDropdown] = useState(false);
  
  useEffect(() => {
    if (selectedTenant?.email) {
      const unsubscribe = onSnapshot(collection(db, 'transactions'), (snapshot) => {
        const transactions = snapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate() || new Date();
          const periodDays = data.period === '1 month' ? 30 : 
                           data.period === '6 months' ? 180 : 
                           data.period === '1 year' ? 365 : 730;
          const endDate = new Date(createdAt);
          endDate.setDate(createdAt.getDate() + periodDays);
          
          return {
            id: doc.id,
            ...data,
            startDate: createdAt,
            endDate,
            createdAt
          };
        });
        
        const emailTransactions = transactions
          .filter(t => t.email === selectedTenant.email)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        const processedTransactions = emailTransactions.map((transaction, index) => {
          const now = new Date();
          let status = 'queued';
          let startDate = transaction.createdAt;
          
          if (index === 0) {
            if (now <= transaction.endDate) {
              status = 'active';
            } else {
              status = 'expired';
            }
          } else {
            const prevTransaction = emailTransactions[index - 1];
            startDate = prevTransaction.endDate;
            status = 'queued';
          }
          
          return {
            ...transaction,
            status,
            startDate
          };
        });
        
        setSubscriberTransactions(processedTransactions);
      });
      
      return () => unsubscribe();
    }
  }, [selectedTenant?.email]);
  
  const filteredTransactions = subscriberTransactions.filter(transaction => 
    transaction.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  return (
    <View style={[styles.tableContainer, { marginTop: 20 }]}>
      <View style={styles.tableTopRow}>
        <Text style={styles.detailTitle}>Subscription Periods</Text>
        <View style={styles.searchContainer}>
          <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search periods..."
            placeholderTextColor="#bbb"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>
      
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, {flex: 2}]}>Period</Text>
        <Text style={[styles.headerCell, {flex: 2}]}>Start Date</Text>
        <Text style={[styles.headerCell, {flex: 2}]}>End Date</Text>
        <Text style={[styles.headerCell, {flex: 1}]}>Status</Text>
      </View>
      
      <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
        {paginatedTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {subscriberTransactions.length === 0 ? 'No subscription periods found' : 'No matching periods found'}
            </Text>
          </View>
        ) : (
          paginatedTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.tableRow}>
              <Text style={[styles.cell, {flex: 2}]}>{transaction.period}</Text>
              <Text style={[styles.cell, {flex: 2}]}>{transaction.startDate.toLocaleDateString()}</Text>
              <Text style={[styles.cell, {flex: 2}]}>{transaction.endDate.toLocaleDateString()}</Text>
              <View style={[styles.statusContainer, {flex: 1}]}>
                <Text style={[styles.statusText,
                  transaction.status === 'active' && styles.activeText,
                  transaction.status === 'queued' && styles.pendingText,
                  transaction.status === 'expired' && styles.expiredText
                ]}>{transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      
      <View style={styles.paginationContainer}>
        <View style={styles.paginationControls}>
          <Text style={styles.paginationLabel}>Show:</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(!showDropdown)}>
              <Text style={styles.dropdownText}>{itemsPerPage}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            {showDropdown && (
              <View style={styles.dropdownMenu}>
                {[5, 10, 20, 50].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setItemsPerPage(option);
                      setCurrentPage(1);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <Text style={styles.paginationLabel}>entries</Text>
          
          <TouchableOpacity style={styles.pageBtn} onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}>
            <Text style={styles.pageBtnText}>Prev</Text>
          </TouchableOpacity>
          <TextInput 
            style={styles.pageInput}
            value={currentPage.toString()}
            keyboardType="numeric"
            onChangeText={(text) => {
              const page = parseInt(text);
              if (page >= 1) setCurrentPage(page);
            }}
          />
          <Text style={styles.pageOf}>of {Math.ceil(filteredTransactions.length / itemsPerPage)}</Text>
          <TouchableOpacity style={styles.pageBtn} onPress={() => setCurrentPage(currentPage + 1)}>
            <Text style={styles.pageBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function SuperAdminScreen() {
  const router = useRouter();
  
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [addDrawerAnimation] = useState(new Animated.Value(-350));
  const [newSubscriber, setNewSubscriber] = useState({
    email: '',
    period: '1 month'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const [activePeriod, setActivePeriod] = useState('');
  const [subscriberPeriods, setSubscriberPeriods] = useState({});
  

  const [notification, setNotification] = useState(null);

  // Real-time subscription to tenants with inactivity check
  useEffect(() => {
    setIsLoading(true);
    
    const unsubscribe = subscribeToTenants((tenants) => {
      // Check for inactive tenants (no subscription activity in 6 months)
      const updatedTenants = tenants.map(tenant => {
        // Get last transaction for this tenant
        onSnapshot(collection(db, 'transactions'), (snapshot) => {
          const transactions = snapshot.docs
            .map(doc => ({ ...doc.data(), createdAt: doc.data().createdAt?.toDate() }))
            .filter(t => t.email === tenant.email)
            .sort((a, b) => b.createdAt - a.createdAt);
          
          if (transactions.length > 0) {
            const lastTransaction = transactions[0];
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            // If last transaction was more than 6 months ago, mark as inactive
            if (lastTransaction.createdAt < sixMonthsAgo && tenant.status === 'active') {
              updateSubscriber(tenant.id, { status: 'expired' });
            }
          }
        });
        
        return tenant;
      });
      
      setSubscribers(updatedTenants);
      setIsLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  
  // Fetch active subscription data from transactions
  const [subscriptionData, setSubscriptionData] = useState(null);
  
  useEffect(() => {
    if (selectedTenant?.email) {
      const unsubscribe = onSnapshot(collection(db, 'transactions'), (snapshot) => {
        const transactions = snapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate() || new Date();
          const periodDays = data.period === '1 month' ? 30 : data.period === '6 months' ? 180 : data.period === '1 year' ? 365 : 730;
          const endDate = new Date(createdAt);
          endDate.setDate(createdAt.getDate() + periodDays);
          
          return {
            id: doc.id,
            ...data,
            startDate: createdAt,
            endDate,
            createdAt
          };
        });
        
        // Get transactions for this email
        const emailTransactions = transactions.filter(t => t.email === selectedTenant.email)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        // Find active subscription (first one that hasn't expired)
        const now = new Date();
        let activeSubscription = null;
        
        for (let i = 0; i < emailTransactions.length; i++) {
          const transaction = emailTransactions[i];
          if (i === 0) {
            // First transaction is active if not expired
            if (now <= transaction.endDate) {
              activeSubscription = { ...transaction, status: 'active' };
              break;
            }
          }
        }
        
        setActivePeriod(activeSubscription?.period || 'No active period');
        setSubscriptionData(activeSubscription);
      });
      
      return () => unsubscribe();
    }
  }, [selectedTenant?.email]);
  

  


  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showDropdown, setShowDropdown] = useState(false);

  const [subscriptionPeriods, setSubscriptionPeriods] = useState([]);

  // Fetch subscription periods from database
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'subscriptionPeriods'), (snapshot) => {
      const periodsData = snapshot.docs.map(doc => ({
        id: doc.id,
        period: doc.data().period,
        price: doc.data().price || '₱7,499'
      }));
      console.log('Fetched subscription periods from database:', periodsData);
      setSubscriptionPeriods(periodsData);
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch periods for all subscribers
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const transactions = snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate() || new Date();
        return {
          id: doc.id,
          ...data,
          createdAt
        };
      });
      
      const periods = {};
      subscribers.forEach(subscriber => {
        const emailTransactions = transactions.filter(t => t.email === subscriber.email)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        if (emailTransactions.length > 0) {
          const now = new Date();
          const firstTransaction = emailTransactions[0];
          const periodDays = firstTransaction.period === '1 month' ? 30 : 
                           firstTransaction.period === '6 months' ? 180 : 
                           firstTransaction.period === '1 year' ? 365 : 730;
          const endDate = new Date(firstTransaction.createdAt);
          endDate.setDate(endDate.getDate() + periodDays);
          
          if (now <= endDate) {
            periods[subscriber.email] = firstTransaction.period;
          } else {
            periods[subscriber.email] = 'Expired';
          }
        } else {
          periods[subscriber.email] = 'No subscription';
        }
      });
      
      setSubscriberPeriods(periods);
    });
    
    return () => unsubscribe();
  }, [subscribers]);

  return (
    <View style={styles.container}>
      <SuperAdminSidebar />
      <View style={styles.mainContent}>

      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Subscriber Management</Text>
          <View style={styles.headerActions}>

            <View style={styles.searchContainer}>
              <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search subscribers..."
                placeholderTextColor="#bbb"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
          </View>
        </View>
        {!showTenantDetails ? (
        <View style={styles.tableContainer}>
            <View style={styles.tableTopRow}>
            <View style={styles.headerRow}>
              <Text style={styles.detailTitle}>Subscriber Management</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity 
                  style={[styles.filterButton, statusFilter === 'Active' && styles.activeFilterButton]} 
                  onPress={() => setStatusFilter('Active')}
                >
                  <Text style={[styles.filterButtonText, statusFilter === 'Active' && styles.activeFilterText]}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterButton, statusFilter === 'Inactive' && styles.activeFilterButton]} 
                  onPress={() => setStatusFilter('Inactive')}
                >
                  <Text style={[styles.filterButtonText, statusFilter === 'Inactive' && styles.activeFilterText]}>Inactive</Text>
                </TouchableOpacity>
              </View>
            </View>
              <TouchableOpacity style={styles.addSubscriberButton} onPress={() => {
                setShowAddDrawer(true);
                Animated.timing(addDrawerAnimation, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: false,
                }).start();
              }}>
                <Text style={styles.addSubscriberButtonText}>+ Add New Subscriber</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, {flex: 2}]}>Email</Text>
            <Text style={[styles.headerCell, {flex: 2}]}>Clinic Name</Text>
            <Text style={[styles.headerCell, {flex: 1.5}]}>Expiry Date</Text>
            <Text style={[styles.headerCell, {flex: 1}]}>Period</Text>
            <Text style={[styles.headerCell, {flex: 1}]}>Status</Text>
            </View>
          
          <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
            {(() => {
              const filteredSubscribers = subscribers.filter(subscriber => {
                const matchesSearch = (subscriber.clinicName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (subscriber.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (subscriber.status || '').toLowerCase().includes(searchTerm.toLowerCase());
                
                const matchesStatus = (statusFilter === 'Active' && subscriber.status === 'active') ||
                  (statusFilter === 'Inactive' && (subscriber.status === 'expired' || subscriber.status === 'suspended' || subscriber.status === 'pending'));
                
                return matchesSearch && matchesStatus;
              });
              
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const paginatedSubscribers = filteredSubscribers.slice(startIndex, endIndex);
              
              if (paginatedSubscribers.length === 0) {
                return (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      {statusFilter === 'Inactive' ? 'No inactive subscribers found' : 'No subscribers found'}
                    </Text>
                  </View>
                );
              }
              
              return paginatedSubscribers.map((subscriber) => (
                <TouchableOpacity 
                  key={subscriber.id} 
                  style={[styles.tableRow, selectedTenant?.id === subscriber.id && styles.selectedRow]}
                  onPress={() => {
                    setSelectedTenant(subscriber);
                    setShowTenantDetails(true);
                  }}
                >
                  <Text style={[styles.cell, {flex: 2}]} numberOfLines={1}>{subscriber.email}</Text>
                  <Text style={[styles.cell, {flex: 2}]} numberOfLines={1}>{subscriber.clinicName || subscriber.email?.split('@')[0]}</Text>
                  <Text style={[styles.cell, {flex: 1.5}]} numberOfLines={1}>{subscriber.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</Text>
                  <Text style={[styles.cell, {flex: 1}]} numberOfLines={1}>{subscriberPeriods[subscriber.email] || 'Loading...'}</Text>
                  <View style={[styles.statusCell, {flex: 1}]}>
                    <View style={[styles.statusBadge, 
                      subscriber.status === 'active' && styles.activeBadge,
                      subscriber.status === 'expired' && styles.expiredBadge,
                      subscriber.status === 'suspended' && styles.suspendedBadge,
                      subscriber.status === 'pending' && styles.pendingBadge
                    ]}>
                      <Text style={[styles.statusText,
                        subscriber.status === 'active' && styles.activeText,
                        subscriber.status === 'expired' && styles.expiredText,
                        subscriber.status === 'suspended' && styles.suspendedText,
                        subscriber.status === 'pending' && styles.pendingText
                      ]}>{subscriber.status?.charAt(0).toUpperCase() + subscriber.status?.slice(1)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ));
            })()}
          </ScrollView>
          
          <View style={styles.paginationContainer}>
            <View style={styles.paginationControls}>
              <Text style={styles.paginationLabel}>Show:</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(!showDropdown)}>
                  <Text style={styles.dropdownText}>{itemsPerPage}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {showDropdown && (
                  <View style={styles.dropdownMenu}>
                    {[5, 10, 20, 50].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setItemsPerPage(option);
                          setCurrentPage(1);
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <Text style={styles.paginationLabel}>entries</Text>
              
              <TouchableOpacity style={styles.pageBtn} onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}>
                <Text style={styles.pageBtnText}>Prev</Text>
              </TouchableOpacity>
              <TextInput 
                style={styles.pageInput}
                value={currentPage.toString()}
                keyboardType="numeric"
                onChangeText={(text) => {
                  const page = parseInt(text);
                  if (page >= 1) setCurrentPage(page);
                }}
              />
              <Text style={styles.pageOf}>of {Math.ceil(subscribers.filter(subscriber => {
                const matchesSearch = (subscriber.clinicName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (subscriber.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (subscriber.status || '').toLowerCase().includes(searchTerm.toLowerCase());
                
                const matchesStatus = (statusFilter === 'Active' && subscriber.status === 'active') ||
                  (statusFilter === 'Inactive' && (subscriber.status === 'expired' || subscriber.status === 'suspended' || subscriber.status === 'pending'));
                
                return matchesSearch && matchesStatus;
              }).length / itemsPerPage)}</Text>
              <TouchableOpacity style={styles.pageBtn} onPress={() => setCurrentPage(currentPage + 1)}>
                <Text style={styles.pageBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        ) : (
          <>
          <View style={styles.tableContainer}>
              <View style={styles.tableTopRow}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.returnButton} onPress={() => {
                  setShowTenantDetails(false);
                  setSelectedTenant(null);
                }}>
                  <Image source={require('@/assets/Vector.png')} style={styles.returnIcon} />
                </TouchableOpacity>
                <Text style={styles.detailTitle}>Subscriber Details</Text>
              </View>
              </View>
              
              <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, {flex: 1}]}>Field</Text>
              <Text style={[styles.headerCell, {flex: 2}]}>Value</Text>
              </View>
            
            <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
              <View style={styles.tableRow}>
                <Text style={[styles.cell, {flex: 1}]}>Clinic Name</Text>
                <Text style={[styles.cell, {flex: 2}]}>{selectedTenant?.clinicName || 'Clinic Name'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.cell, {flex: 1}]}>Email Address</Text>
                <Text style={[styles.cell, {flex: 2}]}>{selectedTenant?.email}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.cell, {flex: 1}]}>Account Created</Text>
                <Text style={[styles.cell, {flex: 2}]}>{selectedTenant?.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.cell, {flex: 1}]}>Actions</Text>
                <View style={[styles.actionButtonsRow, {flex: 2}]}>
                  <TouchableOpacity 
                    style={[styles.resendCredentialsButton, { flex: 0, minWidth: 150, opacity: isGeneratingPassword ? 0.5 : 1 }]} 
                    disabled={isGeneratingPassword}
                    onPress={async () => {
                    if (isGeneratingPassword) return;
                    setIsGeneratingPassword(true);
                    
                    const newTempPassword = generateSecurePassword();
                    
                    try {
                      // Try to update password via server API first
                      let passwordUpdated = false;
                      
                      try {
                        const response = await fetch('http://localhost:3001/api/update-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            uid: selectedTenant?.adminUid || selectedTenant?.uid,
                            newPassword: newTempPassword
                          })
                        });
                        
                        if (response.ok) {
                          passwordUpdated = true;
                          console.log('✅ Password updated via server API');
                        } else {
                          console.warn('⚠️ Server API failed, will show manual instructions');
                        }
                      } catch (serverError) {
                        console.warn('⚠️ Server not available, will show manual instructions:', serverError.message);
                      }
                      
                      // Send new credentials via email
                      const emailResult = await sendCredentialsEmail(selectedTenant?.email, newTempPassword);
                      
                      // Update database with new password
                      await updateSubscriber(selectedTenant.id, {
                        password: newTempPassword,
                        lastPasswordReset: new Date().toISOString()
                      });
                      
                      // Update local state
                      const updatedSubscribers = subscribers.map(sub => 
                        sub.id === selectedTenant.id 
                          ? { ...sub, password: newTempPassword, lastPasswordReset: new Date().toISOString() }
                          : sub
                      );
                      setSubscribers(updatedSubscribers);
                      setSelectedTenant({ ...selectedTenant, password: newTempPassword, lastPasswordReset: new Date().toISOString() });
                      
                      // Show notification
                      const message = passwordUpdated 
                        ? `✅ Password updated and saved to database!\n📧 Email sent to ${selectedTenant?.email}\n🔑 New password: ${newTempPassword}`
                        : `⚠️ Password generated and saved to database!\n📧 Email sent to ${selectedTenant?.email}\n🔑 New password: ${newTempPassword}\n\n⚠️ Manual Firebase Console update required`;
                      
                      setNotification({ type: passwordUpdated ? 'success' : 'warning', message });
                      setTimeout(() => setNotification(null), 5000);
                      
                      Alert.alert('Success', `✅ Password Generated Successfully!\n\n📧 Email: ${selectedTenant?.email}\n🔑 New Password: ${newTempPassword}\n\n${emailResult.message}\n\n💡 New credentials have been sent to the user's email.`);
                      
                    } catch (error) {
                      console.error('Error in password reset process:', error);
                      Alert.alert('Error', `❌ Failed to reset password\n\nError: ${error.message}\n\nPlease try again or contact support.`);
                    } finally {
                      setIsGeneratingPassword(false);
                    }
                  }}>
                    <Text style={styles.resendCredentialsText}>
                      {isGeneratingPassword ? 'Generating...' : 'Generate New Password'}
                    </Text>
                  </TouchableOpacity>

                </View>
              </View>
            </ScrollView>
          </View>
          
          <SubscriptionPeriodsTable selectedTenant={selectedTenant} />
          </>
        )}
      </ScrollView>
      </View>
      
      {notification && (
        <View style={[styles.notification, notification.type === 'success' ? styles.successNotification : styles.warningNotification]}>
          <Text style={styles.notificationText}>{notification.message}</Text>
          <TouchableOpacity style={styles.notificationClose} onPress={() => setNotification(null)}>
            <Text style={styles.notificationCloseText}>×</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {showAddDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addDrawerAnimation }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Subscriber</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(addDrawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowAddDrawer(false));
                }}>
                  <Image source={require('@/assets/Vector (1).png')} style={styles.drawerCloseIcon} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Email *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter email (e.g., clinic@gmail.com)"
                  value={newSubscriber.email}
                  onChangeText={(text) => setNewSubscriber({...newSubscriber, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <Text style={styles.fieldLabel}>Subscription Period *</Text>
                <SearchableDropdown
                  options={subscriptionPeriods.map((item, index) => ({
                    id: index,
                    label: `${item.period} - ${item.price}`,
                    value: item.period
                  }))}
                  placeholder={subscriptionPeriods.length === 0 ? "No subscription periods available" : "Select subscription period"}
                  selectedValue={newSubscriber.period}
                  onSelect={(option) => setNewSubscriber({...newSubscriber, period: option.value})}
                  zIndex={1500}
                />
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  Animated.timing(addDrawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowAddDrawer(false));
                }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={async () => {
                  if (newSubscriber.email && newSubscriber.period) {
                    const tempPassword = generateSecurePassword();
                    const tenantId = newSubscriber.email.split('@')[0];
                    
                    try {
                      // Store user credentials in database
                      const subscriberId = await createSubscriber({
                        email: newSubscriber.email,
                        password: tempPassword,
                        tenantId: tenantId,
                        clinicName: tenantId.replace(/[^a-zA-Z0-9]/g, ' '),
                        role: 'admin',
                        status: 'active'
                      });
                      
                      if (!subscriberId) {
                        throw new Error('Failed to create subscriber in database');
                      }
                      
                      // Add initial subscription period
                      const selectedPeriod = subscriptionPeriods.find(p => p.period === newSubscriber.period);
                      const periodPrice = selectedPeriod?.price || '₱7,499';
                      
                      const subscriptionResult = await addSubscriptionPeriod(
                        tenantId,
                        newSubscriber.email,
                        tenantId.replace(/[^a-zA-Z0-9]/g, ' '),
                        newSubscriber.period,
                        periodPrice
                      );
                      
                      // Send credentials via email
                      try {
                        const emailResult = await sendCredentialsEmail(newSubscriber.email, tempPassword);
                        
                        Alert.alert(
                          'Success',
                          `✅ Subscriber created successfully!\n\n📧 Email: ${newSubscriber.email}\n🔑 Password: ${tempPassword}\n📅 Subscription: ${newSubscriber.period}\n\n${emailResult.message}\n\n💡 Credentials sent to user's email.`
                        );
                      } catch (emailError) {
                        Alert.alert(
                          'Partial Success',
                          `✅ Subscriber created successfully!\n\n📧 Email: ${newSubscriber.email}\n🔑 Password: ${tempPassword}\n📅 Subscription: ${newSubscriber.period}\n\n⚠️ Email sending failed: ${emailError.message}\n\n💡 Please send credentials manually.`
                        );
                      }
                      
                      setNewSubscriber({ email: '', period: '1 month' });
                      Animated.timing(addDrawerAnimation, {
                        toValue: -350,
                        duration: 300,
                        useNativeDriver: false,
                      }).start(() => setShowAddDrawer(false));
                      
                    } catch (error) {
                      Alert.alert('Error', `❌ Failed to create subscriber: ${error.message}`);
                    }
                  } else {
                    Alert.alert('Error', 'Please fill in all required fields');
                  }
                }}>
                  <Text style={styles.saveButtonText}>Add Subscriber</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 20,
    marginTop: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerText: {
    fontSize: Typography.header,
    fontWeight: 'bold',
    color: '#800000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: '#fff',
  },
  searchIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  searchInput: {
    width: 200,
    fontSize: Typography.fieldInput,
    outlineStyle: 'none',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  content: {
    flex: 1,
    padding: 20,
  },
  tableContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  stickyHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  tableTopRow: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    position: 'static',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  returnButton: {
    backgroundColor: '#800000',
    borderRadius: Spacing.radiusSmall,
    paddingHorizontal: ButtonSizes.paddingHorizontal,
    paddingVertical: ButtonSizes.paddingVertical,
    alignItems: 'center',
    height: ButtonSizes.height,
  },
  returnIcon: {
    width: 16,
    height: 16,
    tintColor: '#ffffff',
  },
  detailTitle: {
    fontSize: Typography.title,
    fontWeight: 'bold',
    color: '#800000',
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  tableBody: {
    height: 250,
  },
  tableBodySmall: {
    height: 150,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  selectedRow: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#800000',
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: Typography.tableHeader,
    color: '#333',
    paddingRight: Spacing.medium,
  },
  headerCellActions: {
    width: 80,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  cell: {
    flex: 1,
    textAlign: 'left',
    fontSize: Typography.tableData,
    color: '#555',
    paddingRight: Spacing.medium,
  },
  statusCell: {
    flex: 1,
    paddingRight: 10,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: '#23C062',
  },
  expiredBadge: {
    backgroundColor: '#FFA500',
  },
  suspendedBadge: {
    backgroundColor: '#FF6B6B',
  },
  pendingBadge: {
    backgroundColor: '#9C27B0',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeText: {
    color: '#fff',
  },
  expiredText: {
    color: '#fff',
  },
  suspendedText: {
    color: '#fff',
  },
  pendingText: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  transactionHistoryButton: {
    backgroundColor: '#007bff',
    borderRadius: Spacing.radiusSmall,
    paddingHorizontal: ButtonSizes.paddingHorizontal,
    paddingVertical: ButtonSizes.paddingVertical,
    height: ButtonSizes.height,
  },
  transactionHistoryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: Typography.button,
  },
  addSubscriberButton: {
    backgroundColor: '#23C062',
    borderRadius: Spacing.radiusSmall,
    paddingHorizontal: ButtonSizes.paddingHorizontal,
    paddingVertical: ButtonSizes.paddingVertical,
    height: ButtonSizes.height,
  },
  addSubscriberButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: Typography.button,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 5,
    marginLeft: 20,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#f8f9fa',
  },
  activeFilterButton: {
    backgroundColor: '#800000',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  modalDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    marginBottom: 15,
  },
  modalDropdownText: {
    fontSize: Typography.dropdown,
    color: '#333',
  },
  modalDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 1000,
    elevation: 15,
    maxHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalDropdownOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalDropdownOptionText: {
    fontSize: Typography.dropdown,
    color: '#333',
  },
  dropdownScrollView: {
    maxHeight: 120,
  },
  emailDropdownContainer: {
    position: 'relative',
    zIndex: 2000,
  },
  periodDropdownContainer: {
    position: 'relative',
    zIndex: 1500,
  },
  paginationContainer: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 20,
    paddingRight: 15,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationLabel: {
    fontSize: 10,
    color: '#666',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 100,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 35,
  },
  dropdownText: {
    fontSize: 10,
    marginRight: 2,
  },
  dropdownArrow: {
    fontSize: 8,
    color: '#666',
    fontWeight: 'bold',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 0,
    left: 40,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    zIndex: 101,
    minWidth: 35,
    elevation: 5,
  },
  dropdownOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 10,
    textAlign: 'center',
  },
  pageBtn: {
    backgroundColor: '#800000',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },
  pageBtnText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  pageInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    width: 25,
    textAlign: 'center',
    fontSize: 10,
  },
  pageOf: {
    fontSize: 10,
    color: '#666',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10000,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: ModalSizes.drawerWidth,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  drawerTitle: {
    fontSize: Typography.drawerTitle,
    fontWeight: 'bold',
    color: '#800000',
  },
  drawerCloseButton: {
    width: ButtonSizes.iconButton,
    height: ButtonSizes.iconButton,
    borderRadius: ButtonSizes.iconButton / 2,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerCloseIcon: {
    width: 16,
    height: 16,
    tintColor: '#800000',
  },
  drawerForm: {
    flex: 1,
    padding: 20,
  },
  drawerButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    gap: 10,
  },
  fieldLabel: {
    fontSize: Typography.fieldLabel,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: Spacing.small,
    marginTop: Spacing.large,
    textAlign: 'left',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 12,
    backgroundColor: '#fafafa',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: '#23C062',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  periodDropdownContainer: {
    position: 'relative',
    zIndex: 1500,
  },
  periodDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 1501,
    elevation: 15,
    maxHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  drawerDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  drawerDropdownText: {
    fontSize: 12,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#666',
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 12,
    textAlign: 'left',
    color: '#333',
  },

  resendCredentialsButton: {
    backgroundColor: '#007BFF',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flex: 1,
    alignItems: 'center',
  },
  resendCredentialsText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtonsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  deleteSubscriberButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flex: 1,
    alignItems: 'center',
  },
  deleteSubscriberText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  notification: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    minWidth: 300,
    maxWidth: 400,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10000,
  },
  successNotification: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  warningNotification: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
  },
  notificationText: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
  notificationClose: {
    marginLeft: 10,
    padding: 2,
  },
  notificationCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: Typography.fieldLabel,
    color: '#999',
    textAlign: 'center',
  },
  periodSearchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 20,
  },
});