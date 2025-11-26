import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Animated, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import SearchableDropdown from '@/components/SearchableDropdown';
import { createTenant, registerUser } from '../../lib/services/firebaseService';
import { fetchAllTenants, deleteTenant, subscribeToTenants, updateSubscriber, createSubscriber, Subscriber } from '../../lib/services/superAdminService';
import { sendCredentialsEmail } from '../../lib/services/workingEmailService';
import { generateSecurePassword } from '../../lib/utils/emailService';
import { deleteUserCompletely } from '../../lib/utils/completeUserDeletion';
import { addSubscriptionPeriod , lockTenantByEmail, unlockTenantByEmail } from '../../lib/services/subscriptionService';
import { updateDoc, doc } from 'firebase/firestore';
import { hashPassword } from '../../lib/utils/passwordUtils';

import { collection, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../../lib/config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Typography, Spacing, ButtonSizes, ModalSizes } from '@/constants/Typography';

// Update payment status function
const updatePaymentStatus = async (transactionId, newStatus) => {
  try {
    await updateDoc(doc(db, 'transactions', transactionId), {
      paymentStatus: newStatus,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
  }
};

function SubscriptionPeriodsTable({ selectedTenant }) {
  const [subscriberTransactions, setSubscriberTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  useEffect(() => {
    if (selectedTenant?.email) {
      const unsubscribe = onSnapshot(collection(db, 'transactions'), (snapshot) => {
        const transactions = snapshot.docs.map(doc => {
          const data = doc.data() as any;
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
          .filter(t => t.email === selectedTenant?.email)
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
            startDate,
            paymentStatus: transaction.paymentStatus || 'completed'
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
          <Ionicons name="search" size={14} color="#800000" />
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
        <Text style={[styles.headerCell, {flex: 1.5}]}>Period</Text>
        <Text style={[styles.headerCell, {flex: 1.5}]}>Start Date</Text>
        <Text style={[styles.headerCell, {flex: 1.5}]}>End Date</Text>
        <Text style={[styles.headerCell, {flex: 1}]}>Status</Text>
        <Text style={[styles.headerCell, {flex: 1.2}]}>Payment Status</Text>
        <Text style={[styles.headerCell, {flex: 1.3}]}>Payment Proof</Text>
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
              <Text style={[styles.cell, {flex: 1.5}]}>{transaction.period}</Text>
              <Text style={[styles.cell, {flex: 1.5}]}>{transaction.startDate.toLocaleDateString()}</Text>
              <Text style={[styles.cell, {flex: 1.5}]}>{transaction.endDate.toLocaleDateString()}</Text>
              <View style={[styles.statusContainer, {flex: 1}]}>
                <TouchableOpacity 
                  style={[styles.statusBadge,
                    transaction.status === 'active' && styles.activeBadge,
                    transaction.status === 'queued' && styles.pendingBadge,
                    transaction.status === 'expired' && styles.expiredBadge
                  ]}
                  onPress={() => {
                    const paymentStatus = transaction.paymentStatus || 'completed';
                    Alert.alert(
                      'Update Payment Status',
                      `Current status: ${paymentStatus}\nSelect new status:`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Completed', onPress: () => updatePaymentStatus(transaction.id, 'completed') },
                        { text: 'Pending', onPress: () => updatePaymentStatus(transaction.id, 'pending') },
                        { text: 'Failed', onPress: () => updatePaymentStatus(transaction.id, 'failed') }
                      ]
                    );
                  }}
                >
                  <Text style={[styles.statusText,
                    transaction.status === 'active' && styles.activeText,
                    transaction.status === 'queued' && styles.pendingText,
                    transaction.status === 'expired' && styles.expiredText
                  ]}>{transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.statusContainer, {flex: 1}]}>
                <TouchableOpacity 
                  style={[styles.statusBadge,
                    (transaction.paymentStatus === 'completed' || !transaction.paymentStatus) && styles.activeBadge,
                    transaction.paymentStatus === 'pending' && styles.pendingBadge,
                    transaction.paymentStatus === 'failed' && styles.expiredBadge
                  ]}
                  onPress={() => {
                    const paymentStatus = transaction.paymentStatus || 'completed';
                    Alert.alert(
                      'Update Payment Status',
                      `Current status: ${paymentStatus}\nSelect new status:`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Completed', onPress: () => updatePaymentStatus(transaction.id, 'completed') },
                        { text: 'Pending', onPress: () => updatePaymentStatus(transaction.id, 'pending') },
                        { text: 'Failed', onPress: () => updatePaymentStatus(transaction.id, 'failed') }
                      ]
                    );
                  }}
                >
                  <Text style={[styles.statusText,
                    (transaction.paymentStatus === 'completed' || !transaction.paymentStatus) && styles.activeText,
                    transaction.paymentStatus === 'pending' && styles.pendingText,
                    transaction.paymentStatus === 'failed' && styles.expiredText
                  ]}>{(transaction.paymentStatus || 'completed').charAt(0).toUpperCase() + (transaction.paymentStatus || 'completed').slice(1)}</Text>
                </TouchableOpacity>
              </View>
              <View style={{flex: 1.5}}>
                {(() => {
                  console.log('Transaction details:', {
                    id: transaction.id,
                    email: transaction.email,
                    paymentImage: transaction.paymentImage ? 'HAS IMAGE' : 'NO IMAGE',
                    paymentImageLength: transaction.paymentImage?.length || 0,
                    allFields: Object.keys(transaction)
                  });
                  return transaction.paymentImage ? (
                    <TouchableOpacity onPress={() => {
                      setSelectedImage(transaction.paymentImage);
                      setShowImageModal(true);
                    }}>
                      <Text style={styles.paymentProofLink}>View Proof</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.noPaymentText}>No proof</Text>
                  );
                })()}
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
      
      {showImageModal && selectedImage && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.imageModalOverlay}>
            <View style={styles.imageModalContainer}>
              <TouchableOpacity style={styles.imageModalClose} onPress={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}>
                <Text style={styles.imageModalCloseText}>×</Text>
              </TouchableOpacity>
              <Image source={{ uri: selectedImage }} style={styles.modalImage} resizeMode="contain" />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

export default function SuperAdminScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [superAdminData, setSuperAdminData] = useState(null);
  
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [addDrawerAnimation] = useState(new Animated.Value(-350));
  const [newSubscriber, setNewSubscriber] = useState({
    email: '',
    clinicName: '',
    period: '1 month',
    paymentImage: null,
    localImageUri: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showSubscriberPeriodDropdown, setShowSubscriberPeriodDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const [activePeriod, setActivePeriod] = useState('');
  const [subscriberPeriods, setSubscriberPeriods] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);



  const [notification, setNotification] = useState(null);

  // Fetch superadmin data
  useEffect(() => {
    if (user?.email) {
      // Fetch superadmin data from database
      const fetchSuperAdminData = async () => {
        try {
          const unsubscribe = onSnapshot(collection(db, 'superadmins'), (snapshot) => {
            const superAdmins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const currentSuperAdmin = superAdmins.find(admin => admin.email === user.email);
            if (currentSuperAdmin) {
              setSuperAdminData(currentSuperAdmin);
            }
          });
          return () => unsubscribe();
        } catch (error) {
          console.error('Error fetching superadmin data:', error);
        }
      };
      fetchSuperAdminData();
    }
  }, [user?.email]);

  // Real-time subscription to tenants with inactivity check
  useEffect(() => {
    setIsLoading(true);
    
    const unsubscribe = subscribeToTenants((tenants) => {
      // Filter to only show admin accounts (clinic owners), not veterinarians/staff
      const adminTenants = tenants.filter(tenant => 
        (tenant as any).role === 'admin' || 
        (!(tenant as any).role && !(tenant as any).email?.includes('veterinarian') && !(tenant as any).email?.includes('staff'))
      );
      
      // Check for inactive tenants (no subscription activity in 6 months)
      const updatedTenants = adminTenants.map(tenant => {
        // Get last transaction for this tenant
        onSnapshot(collection(db, 'transactions'), (snapshot) => {
          const transactions = snapshot.docs
            .map(doc => ({ ...doc.data(), createdAt: doc.data().createdAt?.toDate() }))
            .filter(t => (t as any).email === (tenant as any).email)
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
          const data = doc.data() as any;
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
        const emailTransactions = transactions.filter(t => (t as any).email === selectedTenant.email)
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
    const unsubscribe = onSnapshot(collection(db, 'subscriptionPeriods'), async (snapshot) => {
      const periodsData = snapshot.docs.map(doc => ({
        id: doc.id,
        period: doc.data().period,
        price: doc.data().price || '₱7,499'
      }));
      
      // If no periods exist, create default ones
      if (periodsData.length === 0) {
        const defaultPeriods = [
          { period: '1 month', price: '₱7,499' },
          { period: '6 months', price: '₱44,994' },
          { period: '1 year', price: '₱89,988' }
        ];
        
        try {
          const { doc, setDoc, collection } = await import('firebase/firestore');
          for (const period of defaultPeriods) {
            await setDoc(doc(collection(db, 'subscriptionPeriods')), {
              ...period,
              description: 'Default subscription period',
              status: 'Active',
              createdAt: new Date()
            });
          }
        } catch (error) {
          console.error('Error creating default periods:', error);
        }
      }
      
      setSubscriptionPeriods(periodsData);
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch periods for all subscribers
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const transactions = snapshot.docs.map(doc => {
          const data = doc.data() as any;
        const createdAt = data.createdAt?.toDate() || new Date();
        return {
          id: doc.id,
          ...data,
          createdAt
        };
      });
      
      const periods = {};
      subscribers.forEach(subscriber => {
        const emailTransactions = transactions.filter(t => (t as any).email === subscriber.email)
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
      {/* SuperAdmin Header */}
      <View style={styles.adminHeader}>
        <Image source={require('../../assets/pawns web logo v3.png')} style={styles.logo} />
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications" size={24} color="#800000" />
          </TouchableOpacity>
          <View style={styles.profileContainer}>
            <Ionicons name="person" size={20} color="#666" />
            <View style={styles.profileInfo}>
              <Text style={styles.adminName}>{superAdminData?.email || user?.email || 'SuperAdmin'}</Text>
              <Text style={styles.adminRole}>{superAdminData?.role || 'Super Administrator'}</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Main Layout Container */}
      <View style={styles.mainLayout}>
        <View style={styles.adminSidebar}>
          <SuperAdminSidebar />
        </View>
        <View style={styles.mainContent}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.headerText}>Clinic Management</Text>
              {!showTenantDetails && (
                <View style={styles.headerActions}>
                  <TouchableOpacity style={styles.addButton} onPress={() => {
                    setShowAddDrawer(true);
                    Animated.timing(addDrawerAnimation, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: false,
                    }).start();
                  }}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
                  
                  <View style={styles.searchContainer}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search..."
                      placeholderTextColor="rgba(153, 153, 153, 0.8)"
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                    />
                    <View style={styles.searchIconContainer}>
                      <Ionicons name="search" size={14} color="#fff" />
                    </View>
                  </View>
                </View>
              )}
            </View>
            
            <View style={styles.content}>
              {!showTenantDetails ? (
              <View style={styles.tableContainer}>
                <View style={styles.table}>
                  <View style={styles.subHeader}>
                    <View style={styles.filterTabs}>
                      <TouchableOpacity 
                        style={[styles.filterTab, statusFilter === 'Active' && styles.activeFilterTab]} 
                        onPress={() => setStatusFilter('Active')}
                      >
                        <Text style={[styles.filterTabText, statusFilter === 'Active' && styles.activeFilterTabText]}>
                          Active ({subscribers.filter(s => s.status === 'active').length})
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.filterTab, statusFilter === 'Inactive' && styles.activeFilterTab]} 
                        onPress={() => setStatusFilter('Inactive')}
                      >
                        <Text style={[styles.filterTabText, statusFilter === 'Inactive' && styles.activeFilterTabText]}>
                          Inactive ({subscribers.filter(s => s.status !== 'active').length})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, {flex: 2}]}>Email</Text>
                  <Text style={[styles.headerCell, {flex: 2}]}>Clinic Name</Text>
                  <Text style={[styles.headerCell, {flex: 1.5}]}>Expiry Date</Text>
                  <Text style={[styles.headerCell, {flex: 1}]}>Period</Text>
                  <Text style={[styles.headerCell, {flex: 1}]}>Status</Text>
                  <Text style={[styles.headerCell, {flex: 0.8}]}>Actions</Text>
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
                <View key={subscriber.id} style={[styles.tableRow, selectedTenant?.id === subscriber.id && styles.selectedRow]}>
                  <TouchableOpacity 
                    style={{flex: 2}}
                    onPress={() => {
                      setSelectedTenant(subscriber);
                      setShowTenantDetails(true);
                    }}
                  >
                    <Text style={styles.cell} numberOfLines={1}>{subscriber.email}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{flex: 2}}
                    onPress={() => {
                      setSelectedTenant(subscriber);
                      setShowTenantDetails(true);
                    }}
                  >
                    <Text style={styles.cell} numberOfLines={1}>{subscriber.clinicName || subscriber.email?.split('@')[0]}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{flex: 1.5}}
                    onPress={() => {
                      setSelectedTenant(subscriber);
                      setShowTenantDetails(true);
                    }}
                  >
                    <Text style={styles.cell} numberOfLines={1}>{subscriber.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{flex: 1}}
                    onPress={() => {
                      setSelectedTenant(subscriber);
                      setShowTenantDetails(true);
                    }}
                  >
                    <Text style={styles.cell} numberOfLines={1}>{subscriberPeriods[(subscriber as any).email] || 'Loading...'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{flex: 1}}
                    onPress={() => {
                      setSelectedTenant(subscriber);
                      setShowTenantDetails(true);
                    }}
                  >
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
                  </TouchableOpacity>
                  <View style={{flex: 0.8, alignItems: 'center'}}>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => {
                        setTenantToDelete(subscriber);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Ionicons name="trash" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
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
              </View>
              ) : (
                <>
                <View style={styles.detailsContainer}>
                  <View style={styles.detailsHeader}>
                    <TouchableOpacity style={styles.returnButton} onPress={() => {
                      setShowTenantDetails(false);
                      setSelectedTenant(null);
                    }}>
                      <Ionicons name="arrow-back" size={16} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.detailTitle}>Clinic Details</Text>
                    <View style={styles.detailActionsContainer}>
                  <TouchableOpacity
                    style={styles.detailActionButton}
                    onPress={() => {
                      const action = selectedTenant?.status === 'locked' ? 'unlock' : 'lock';
                      Alert.alert(
                        action === 'lock' ? 'Lock Account' : 'Unlock Account',
                        `Are you sure you want to ${action} ${selectedTenant?.email}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: action === 'lock' ? 'Lock' : 'Unlock', onPress: async () => {
                            try {
                              setIsLoading(true);
                              if (action === 'lock') {
                                await lockTenantByEmail(selectedTenant?.email, 'Locked by SuperAdmin');
                                const updatedSubscribers = subscribers.map(sub => sub.id === selectedTenant.id ? { ...sub, status: 'locked' } : sub);
                                setSubscribers(updatedSubscribers);
                                setSelectedTenant({ ...selectedTenant, status: 'locked' });
                                setNotification({ type: 'warning', message: `Tenant ${selectedTenant?.email} locked` });
                              } else {
                                await unlockTenantByEmail(selectedTenant?.email, 'Unlocked by SuperAdmin');
                                const updatedSubscribers = subscribers.map(sub => sub.id === selectedTenant.id ? { ...sub, status: 'active' } : sub);
                                setSubscribers(updatedSubscribers);
                                setSelectedTenant({ ...selectedTenant, status: 'active' });
                                setNotification({ type: 'success', message: `Tenant ${selectedTenant?.email} unlocked` });
                              }
                              setTimeout(() => setNotification(null), 4000);
                            } catch (error) {
                              console.error('Error locking/unlocking tenant:', error);
                              Alert.alert('Error', error?.message || 'Operation failed');
                            } finally {
                              setIsLoading(false);
                            }
                          } }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.detailActionButtonText}>{selectedTenant?.status === 'locked' ? 'Unlock Account' : 'Lock Account'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.detailActionButton, styles.primaryActionButton, { opacity: isGeneratingPassword ? 0.5 : 1 }]} 
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
                      const emailResult = await sendCredentialsEmail(selectedTenant?.email, selectedTenant?.clinicName || 'Admin', newTempPassword);
                      
                      // Hash new password before storing
                      const { hashPassword } = await import('../../lib/utils/passwordUtils.js');
                      const { passwordHash, salt } = hashPassword(newTempPassword);
                      
                      // Update database with new hashed password
                      await updateSubscriber(selectedTenant.id, {
                        passwordHash,
                        salt,
                        lastPasswordReset: new Date().toISOString()
                      } as any);
                      
                      // Update local state
                      const updatedSubscribers = subscribers.map(sub => 
                        sub.id === selectedTenant.id 
                          ? { ...sub, passwordHash, salt, lastPasswordReset: new Date().toISOString() }
                          : sub
                      );
                      setSubscribers(updatedSubscribers);
                      setSelectedTenant({ ...selectedTenant, passwordHash, salt, lastPasswordReset: new Date().toISOString() });
                      
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
                    <Text style={styles.detailActionButtonText}>
                      {isGeneratingPassword ? 'Generating...' : 'Generate New Password'}
                    </Text>
                  </TouchableOpacity>
                    </View>
                  </View>
                  
                  <ScrollView style={styles.detailsForm} showsVerticalScrollIndicator={false}>
                    <View style={styles.formRow}>
                      <View style={styles.formColumn}>
                        <Text style={styles.detailFieldLabel}>Clinic Name</Text>
                        <View style={styles.detailFieldValue}>
                          <Text style={styles.detailValueText}>{selectedTenant?.clinicName || 'N/A'}</Text>
                        </View>
                      </View>
                      <View style={styles.formColumn}>
                        <Text style={styles.detailFieldLabel}>Email Address</Text>
                        <View style={styles.detailFieldValue}>
                          <Text style={styles.detailValueText}>{selectedTenant?.email || 'N/A'}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.formRow}>
                      <View style={styles.formColumn}>
                        <Text style={styles.detailFieldLabel}>Account Created</Text>
                        <View style={styles.detailFieldValue}>
                          <Text style={styles.detailValueText}>{selectedTenant?.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</Text>
                        </View>
                      </View>
                      <View style={styles.formColumn}>
                        <Text style={styles.detailFieldLabel}>Status</Text>
                        <View style={styles.detailFieldValue}>
                          <Text style={[styles.detailValueText, 
                            selectedTenant?.status === 'active' && styles.activeStatusText,
                            selectedTenant?.status === 'locked' && styles.lockedStatusText
                          ]}>{selectedTenant?.status?.charAt(0).toUpperCase() + selectedTenant?.status?.slice(1) || 'N/A'}</Text>
                        </View>
                      </View>
                    </View>
                  </ScrollView>
                </View>
                
                <SubscriptionPeriodsTable selectedTenant={selectedTenant} />
                </>
              )}
            </View>
          </View>
        </View>
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Subscriber</Text>
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => {
                  setShowAddDrawer(false);
                }}>
                  <Text style={styles.modalCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalForm}>
                <Text style={styles.modalFieldLabel}>Email *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter email (e.g., clinic@gmail.com)"
                  value={newSubscriber.email}
                  onChangeText={(text) => setNewSubscriber({...newSubscriber, email: text})}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <Text style={styles.modalFieldLabel}>Clinic Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter clinic name"
                  value={newSubscriber.clinicName}
                  onChangeText={(text) => setNewSubscriber({...newSubscriber, clinicName: text})}
                />
                
                <Text style={styles.modalFieldLabel}>Subscription Period *</Text>
                <View style={styles.periodDropdownContainer}>
                  <TouchableOpacity style={styles.modalDropdown} onPress={() => setShowSubscriberPeriodDropdown(!showSubscriberPeriodDropdown)}>
                    <Text style={styles.modalDropdownText}>{subscriptionPeriods.length === 0 ? 'No periods available' : newSubscriber.period}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showSubscriberPeriodDropdown && (
                    <View style={styles.modalDropdownMenu}>
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                        {subscriptionPeriods.length === 0 ? (
                          <View style={styles.noPeriodsContainer}>
                            <Text style={styles.noPeriodsText}>No subscription periods found</Text>
                          </View>
                        ) : (
                          subscriptionPeriods.map((item, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.modalDropdownOption}
                              onPress={() => {
                                setNewSubscriber({...newSubscriber, period: item.period});
                                setShowSubscriberPeriodDropdown(false);
                              }}
                            >
                              <Text style={styles.modalDropdownOptionText}>{item.period}</Text>
                            </TouchableOpacity>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.modalFieldLabel}>Payment Proof</Text>
                <TouchableOpacity style={styles.uploadButton} onPress={async () => {
                  try {
                    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!permissionResult.granted) {
                      Alert.alert('Permission Required', 'Please allow access to your photo library to upload payment proof.');
                      return;
                    }
                    
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      allowsEditing: true,
                      aspect: [4, 3],
                      quality: 0.8,
                    });
                    
                    if (!result.canceled && result.assets[0]) {
                      const asset = result.assets[0];
                      setNewSubscriber({...newSubscriber, localImageUri: asset.uri});
                    }
                  } catch (error) {
                    console.error('Error selecting image:', error);
                    Alert.alert('Error', 'Failed to select image. Please try again.');
                  }
                }}>
                  <Ionicons name="cloud-upload" size={20} color="#666" />
                  <Text style={styles.uploadButtonText}>
                    {newSubscriber.localImageUri ? 'Change Image' : 'Upload Payment Screenshot'}
                  </Text>
                </TouchableOpacity>
                {newSubscriber.localImageUri && (
                  <View style={styles.imagePreview}>
                    <Image 
                      source={{ uri: newSubscriber.localImageUri }} 
                      style={styles.previewImage} 
                    />
                    <Text style={styles.imagePreviewText}>Payment proof selected</Text>
                  </View>
                )}
              </ScrollView>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => {
                  setShowAddDrawer(false);
                }}>
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveButton} onPress={async () => {
                  if (newSubscriber.email && newSubscriber.clinicName) {
                    const tempPassword = generateSecurePassword();
                    const tenantId = newSubscriber.email.split('@')[0];
                    
                    try {
                      // Hash password before storing
                      const { passwordHash, salt } = hashPassword(tempPassword);
                      
                      // Create database records
                      const subscriberData = {
                        email: newSubscriber.email,
                        passwordHash,
                        salt,
                        tenantId: tenantId,
                        clinicName: newSubscriber.clinicName,
                        role: 'admin',
                        status: 'active'
                      };
                      
                      const subscriberId = await createSubscriber(subscriberData);
                      
                      if (!subscriberId) {
                        throw new Error('Failed to create subscriber in database');
                      }
                      
                      // Convert image to base64 if selected
                      let paymentImageBase64 = null;
                      if (newSubscriber.localImageUri) {
                        const response = await fetch(newSubscriber.localImageUri);
                        const blob = await response.blob();
                        const reader = new FileReader();
                        paymentImageBase64 = await new Promise((resolve) => {
                          reader.onloadend = () => resolve(reader.result);
                          reader.readAsDataURL(blob);
                        });
                      }
                      
                      // Create transaction record for the subscription
                      const { addDoc, collection } = await import('firebase/firestore');
                      const periodDays = newSubscriber.period === '1 month' ? 30 : 
                                       newSubscriber.period === '6 months' ? 180 : 
                                       newSubscriber.period === '1 year' ? 365 : 730;
                      const startDate = new Date();
                      const endDate = new Date(startDate);
                      endDate.setDate(startDate.getDate() + periodDays);
                      
                      // Get the price for the selected period
                      const selectedPeriodData = subscriptionPeriods.find(p => p.period === newSubscriber.period);
                      const periodPrice = selectedPeriodData?.price || '₱7,499';
                      
                      await addDoc(collection(db, 'transactions'), {
                        email: newSubscriber.email,
                        period: newSubscriber.period,
                        price: periodPrice,
                        paymentImage: paymentImageBase64,
                        status: 'paid',
                        createdAt: startDate,
                        startDate: startDate,
                        endDate: endDate,
                        createdBy: 'superadmin'
                      });
                      
                      // Send login credentials email
                      await sendCredentialsEmail(
                        newSubscriber.email,
                        newSubscriber.clinicName,
                        tempPassword
                      );
                      
                      // Show success notification
                      setNotification({ 
                        type: 'success', 
                        message: `✅ Subscriber added successfully!\n📧 ${newSubscriber.email}` 
                      });
                      setTimeout(() => setNotification(null), 3000);
                      
                      setNewSubscriber({ email: '', clinicName: '', period: '1 month', paymentImage: null, localImageUri: null });
                      setShowAddDrawer(false);
                      
                    } catch (error) {
                      setNotification({ 
                        type: 'warning', 
                        message: `❌ Failed to create subscriber: ${error.message}` 
                      });
                      setTimeout(() => setNotification(null), 5000);
                    }
                  } else {
                    setNotification({ 
                      type: 'warning', 
                      message: '⚠️ Please fill in all required fields (Email and Clinic Name)' 
                    });
                    setTimeout(() => setNotification(null), 3000);
                  }
                }}>
                  <Text style={styles.modalSaveButtonText}>Add Subscriber</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      
      {showDeleteModal && tenantToDelete && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { width: '30%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Delete Account</Text>
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => {
                  setShowDeleteModal(false);
                  setTenantToDelete(null);
                }}>
                  <Text style={styles.modalCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.deleteModalContent}>
                <Ionicons name="warning" size={48} color="#FF6B6B" style={styles.deleteWarningIcon} />
                <Text style={styles.deleteModalText}>
                  Are you sure you want to delete this account?
                </Text>
                <Text style={styles.deleteModalSubtext}>
                  <Text style={styles.deleteModalEmail}>{(tenantToDelete as any).email}</Text>
                  {(tenantToDelete as any).clinicName && (
                    <Text>\n{(tenantToDelete as any).clinicName}</Text>
                  )}
                </Text>
                <Text style={styles.deleteModalWarning}>
                  This action cannot be undone. All data associated with this account will be permanently deleted.
                </Text>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => {
                  setShowDeleteModal(false);
                  setTenantToDelete(null);
                }}>
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalSaveButton, styles.deleteConfirmButton]} onPress={async () => {
                  try {
                    setIsLoading(true);
                    
                    // Delete from database
                    await deleteTenant((tenantToDelete as any).id);
                    
                    // Update local state
                    const updatedSubscribers = subscribers.filter(sub => sub.id !== (tenantToDelete as any).id);
                    setSubscribers(updatedSubscribers);
                    
                    // Show success notification
                    setNotification({ 
                      type: 'success', 
                      message: `✅ Account deleted successfully: ${(tenantToDelete as any).email}` 
                    });
                    setTimeout(() => setNotification(null), 4000);
                    
                    // Close modal
                    setShowDeleteModal(false);
                    setTenantToDelete(null);
                    
                  } catch (error) {
                    console.error('Error deleting tenant:', error);
                    setNotification({ 
                      type: 'warning', 
                      message: `❌ Failed to delete account: ${error.message}` 
                    });
                    setTimeout(() => setNotification(null), 4000);
                  } finally {
                    setIsLoading(false);
                  }
                }}>
                  <Text style={styles.modalSaveButtonText}>Delete Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    fontSize: 30,
    fontWeight: 'bold',
    color: '#800000',
  },
  addButton: {
    backgroundColor: '#7F1D1F',
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(127, 29, 31, 0.3)',
    borderRadius: 8,
    paddingLeft: 10,
    width: 265.798,
    height: 32,
    flexShrink: 0,
    backgroundColor: 'rgba(250, 250, 250, 0.00)',
    shadowColor: 'rgba(31, 61, 89, 0.04)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  searchIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#7F1D1F',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },

  content: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 20,
  },
  tableContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
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

  detailTitle: {
    fontSize: Typography.title,
    fontWeight: 'bold',
    color: '#800000',
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingLeft: 80,
    paddingRight: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
  },
  tableBody: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tableBodySmall: {
    height: 150,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingLeft: 80,
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
    minHeight: 60,
  },
  selectedRow: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#800000',
  },
  headerCell: {
    fontWeight: '600',
    fontSize: 14,
    color: '#374151',
    letterSpacing: 0.5,
    textAlign: 'left',
  },
  headerCellActions: {
    width: 80,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  cell: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusCell: {
    flex: 1,
    paddingRight: 10,
  },
  statusContainer: {
    flex: 1,
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
  subHeader: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  filterTabs: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'flex-start',
    marginRight: 5,
  },
  activeFilterTab: {
    backgroundColor: '#800000',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'left',
  },
  activeFilterTabText: {
    color: '#fff',
  },
  table: {
    backgroundColor: '#fff',
    flex: 1,
    borderRadius: 12,
  },


  dropdownScrollView: {
    maxHeight: 120,
  },
  emailDropdownContainer: {
    position: 'relative',
    zIndex: 2000,
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
  periodDropdownContainer: {
    position: 'relative',
    zIndex: 1500,
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
  lockButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  lockButtonText: {
    color: '#fff',
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    padding: 15,
    paddingLeft: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  modalForm: {
    flex: 1,
    padding: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  modalFieldLabel: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontWeight: 'bold',
  },
  modalCancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalCancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalSaveButton: {
    backgroundColor: '#7B2C2C',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalSaveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
    fontSize: 12,
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
    zIndex: 1501,
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
    fontSize: 12,
    color: '#333',
  },
  noPeriodsContainer: {
    padding: 15,
    alignItems: 'center',
  },
  noPeriodsText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  uploadButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  imagePreview: {
    padding: 10,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  imagePreviewText: {
    fontSize: 12,
    color: '#2d5a2d',
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  detailsHeader: {
    padding: 15,
    paddingLeft: 25,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    gap: 15,
  },
  detailsForm: {
    flex: 1,
    padding: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  formColumn: {
    flex: 1,
  },
  detailFieldLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    fontWeight: 'bold',
  },
  detailFieldValue: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    minHeight: 44,
    justifyContent: 'center',
  },
  detailValueText: {
    fontSize: 14,
    color: '#333',
  },
  activeStatusText: {
    color: '#23C062',
    fontWeight: 'bold',
  },
  lockedStatusText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  detailActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  detailActionButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
    paddingHorizontal: 16,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionButton: {
    backgroundColor: '#007BFF',
  },
  detailActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentProofLink: {
    color: '#007BFF',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  noPaymentText: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    width: '80%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    position: 'relative',
  },
  imageModalClose: {
    position: 'absolute',
    top: 10,
    right: 15,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    padding: 20,
    alignItems: 'center',
  },
  deleteWarningIcon: {
    marginBottom: 16,
  },
  deleteModalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteModalSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  deleteModalEmail: {
    fontWeight: 'bold',
    color: '#800000',
  },
  deleteModalWarning: {
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  deleteConfirmButton: {
    backgroundColor: '#FF6B6B',
  },
});