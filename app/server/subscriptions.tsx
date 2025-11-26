import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Modal, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { subscribeToTenants, Subscriber } from '../../lib/services/superAdminService';
import { addSubscriptionPeriod } from '../../lib/services/subscriptionService';
import { collection, onSnapshot, doc, updateDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/config/firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { getDisplayPrice, getFormattedSubscriptionPrice } from '../../lib/utils/priceUtils';


export default function SubscriptionsScreen() {
  const router = useRouter();
  
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [queuedSubscriptions, setQueuedSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Active');

  useEffect(() => {
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
      
      // Group by email and determine status
      const subscriptionMap = new Map();
      
      transactions.forEach(transaction => {
        const email = (transaction as any).email;
        if (email && !subscriptionMap.has(email)) {
          subscriptionMap.set(email, []);
        }
        if (email) {
          subscriptionMap.get(email).push(transaction);
        }
      });
      
      const subscriptions = [];
      
      subscriptionMap.forEach((emailTransactions, email) => {
        // Sort by creation date
        emailTransactions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        emailTransactions.forEach((transaction, index) => {
          const now = new Date();
          let status = 'queued';
          let startDate = transaction.createdAt;
          let endDate = transaction.endDate;
          
          if (index === 0) {
            // First transaction - check if still active
            if (now <= transaction.endDate) {
              status = 'active';
            } else {
              status = 'expired';
            }
          } else {
            // Subsequent transactions are queued - start after previous ends
            const prevTransaction = emailTransactions[index - 1];
            startDate = prevTransaction.endDate;
            
            // Calculate new end date based on queued start date
            const periodDays = transaction.period === '1 month' ? 30 : 
                             transaction.period === '6 months' ? 180 : 
                             transaction.period === '1 year' ? 365 : 730;
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + periodDays);
            
            status = 'queued';
          }
          
          subscriptions.push({
            ...transaction,
            status,
            startDate,
            endDate
          });
        });
      });
      
      const active = subscriptions.filter(sub => sub.status === 'active');
      const queued = subscriptions.filter(sub => sub.status === 'queued');
      
      setActiveSubscriptions(active);
      setQueuedSubscriptions(queued);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [showAddPeriodDrawer, setShowAddPeriodDrawer] = useState(false);
  const [addPeriodAnimation] = useState(new Animated.Value(-350));
  const [newPeriod, setNewPeriod] = useState({
    email: '',
    period: '1 month',
    paymentImage: null,
    localImageUri: null
  });
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  
  const [tenantEmails, setTenantEmails] = useState([]);

  // Fetch tenant emails from database (only admin role)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tenants'), (snapshot) => {
      const emails = snapshot.docs
        .map(doc => ({ email: doc.data().email, role: doc.data().role }))
        .filter(item => item.email && item.role === 'admin')
        .map(item => item.email);
      setTenantEmails(emails);
    });
    
    return () => unsubscribe();
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showDropdown, setShowDropdown] = useState(false);

  const [subscriptionPeriods, setSubscriptionPeriods] = useState([]);
  const [notification, setNotification] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Delete queued subscription
  const deleteQueuedSubscription = (subscriptionId, email, period) => {
    setDeleteConfirm({ subscriptionId, email, period });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      await deleteDoc(doc(db, 'transactions', deleteConfirm.subscriptionId));
      setNotification({ 
        type: 'success', 
        message: `Queued subscription deleted successfully` 
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error deleting subscription:', error);
      setNotification({ 
        type: 'warning', 
        message: `Failed to delete subscription: ${error.message}` 
      });
      setTimeout(() => setNotification(null), 3000);
    }
    setDeleteConfirm(null);
  };

  // Fetch subscription periods from database
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'subscriptionPeriods'), (snapshot) => {
      const periodsData = snapshot.docs.map(doc => ({
        id: doc.id,
        period: doc.data().period,
        price: doc.data().price || '₱7,499'
      }));
      setSubscriptionPeriods(periodsData);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <SuperAdminLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Subscriptions</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.addButton} onPress={() => {
              setShowAddPeriodDrawer(true);
              Animated.timing(addPeriodAnimation, {
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
        </View>
        
        <View style={styles.content}>
          <View style={styles.tableContainer}>
            <View style={styles.table}>
              <View style={styles.subHeader}>
                <View style={styles.filterTabs}>
                  <TouchableOpacity 
                    style={[styles.filterTab, statusFilter === 'Active' && styles.activeFilterTab]} 
                    onPress={() => setStatusFilter('Active')}
                  >
                    <Text style={[styles.filterTabText, statusFilter === 'Active' && styles.activeFilterTabText]}>
                      Active ({activeSubscriptions.length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.filterTab, statusFilter === 'Queued' && styles.activeFilterTab]} 
                    onPress={() => setStatusFilter('Queued')}
                  >
                    <Text style={[styles.filterTabText, statusFilter === 'Queued' && styles.activeFilterTabText]}>
                      Queued ({queuedSubscriptions.length})
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.emailHeader]}>Email</Text>
                <Text style={[styles.headerCell, styles.periodHeader]}>Period</Text>
                <Text style={[styles.headerCell, styles.priceHeader]}>Price</Text>
                <Text style={[styles.headerCell, styles.statusHeader]}>Status</Text>
                <Text style={[styles.headerCell, styles.dateHeader]}>Start Date</Text>
                <Text style={[styles.headerCell, styles.endDateHeader]}>End Date</Text>
                {statusFilter === 'Queued' && <Text style={[styles.headerCell, { flex: 0.5 }]}>Actions</Text>}
              </View>
              
              <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={true}>
                {(() => {
                  const currentData = statusFilter === 'Active' ? activeSubscriptions : queuedSubscriptions;
                  const filteredData = currentData.filter(sub => 
                    sub.email?.toLowerCase().includes(searchTerm.toLowerCase())
                  );
                  
                  if (filteredData.length === 0) {
                    return (
                      <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>No {statusFilter.toLowerCase()} subscriptions found</Text>
                      </View>
                    );
                  }
                  
                  return filteredData.map((subscription) => {
                    const startDate = subscription.startDate ? new Date(subscription.startDate) : new Date();
                    const endDate = subscription.endDate ? new Date(subscription.endDate) : new Date();
                    

                    
                    return (
                      <View key={subscription.id} style={styles.tableRow}>
                        <Text style={[styles.cellText, styles.emailCell]}>{subscription.email}</Text>
                        <Text style={[styles.cellText, styles.periodCell]}>{subscription.period}</Text>
                        <Text style={[styles.cellText, styles.priceCell]}>{getDisplayPrice(subscription)}</Text>
                        <Text style={[styles.cellText, styles.statusCell]}>
                          {subscription.status === 'active' ? 'Active' : 'Queued'}
                        </Text>
                        <Text style={[styles.cellText, styles.dateCell]}>
                          {startDate.toLocaleDateString()}
                        </Text>
                        <Text style={[styles.cellText, styles.endDateCell]}>
                          {endDate.toLocaleDateString()}
                        </Text>
                        {statusFilter === 'Queued' && (
                          <View style={{ flex: 0.5, alignItems: 'center' }}>
                            <TouchableOpacity 
                              style={styles.deleteButton}
                              onPress={() => {
                                console.log('Delete button pressed for:', subscription.id);
                                deleteQueuedSubscription(subscription.id, subscription.email, subscription.period);
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash" size={14} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  });
                })()
                }
              </ScrollView>
            </View>

            {/* Pagination */}
            <View style={styles.pagination}>
              <View style={styles.paginationControls}>
                <Text style={styles.paginationLabel}>Rows per page:</Text>
                <View style={styles.dropdown}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowDropdown(!showDropdown)}
                  >
                    <Text style={styles.dropdownText}>{itemsPerPage}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showDropdown && (
                    <View style={styles.dropdownMenu}>
                      {[5, 10, 25, 50].map((size) => (
                        <TouchableOpacity
                          key={size}
                          style={styles.dropdownOption}
                          onPress={() => {
                            setItemsPerPage(size);
                            setCurrentPage(1);
                            setShowDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>{size}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                
                <TouchableOpacity
                  style={styles.pageBtn}
                  onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <Text style={styles.pageBtnText}>‹</Text>
                </TouchableOpacity>
                
                <Text style={styles.pageOf}>
                  {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, (statusFilter === 'Active' ? activeSubscriptions : queuedSubscriptions).length)} of {(statusFilter === 'Active' ? activeSubscriptions : queuedSubscriptions).length}
                </Text>
                
                <TouchableOpacity
                  style={styles.pageBtn}
                  onPress={() => setCurrentPage(Math.min(Math.ceil((statusFilter === 'Active' ? activeSubscriptions : queuedSubscriptions).length / itemsPerPage), currentPage + 1))}
                  disabled={currentPage >= Math.ceil((statusFilter === 'Active' ? activeSubscriptions : queuedSubscriptions).length / itemsPerPage)}
                >
                  <Text style={styles.pageBtnText}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        
        {showAddPeriodDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addPeriodAnimation }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add Subscription Period</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(addPeriodAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowAddPeriodDrawer(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Email *</Text>
                <View style={styles.emailDropdownContainer}>
                  <TouchableOpacity style={styles.drawerDropdown} onPress={() => setShowEmailDropdown(!showEmailDropdown)}>
                    <Text style={styles.drawerDropdownText}>{newPeriod.email || (tenantEmails.length === 0 ? 'No emails available' : 'Select Email')}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showEmailDropdown && (
                    <View style={styles.emailDropdownMenu}>
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false} style={styles.emailDropdownScroll}>
                        {tenantEmails.length === 0 ? (
                          <View style={styles.noEmailsContainer}>
                            <Text style={styles.noEmailsText}>No tenant emails found</Text>
                          </View>
                        ) : (
                          tenantEmails.map((email, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setNewPeriod({...newPeriod, email: email});
                                setShowEmailDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{email}</Text>
                            </TouchableOpacity>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Subscription Period *</Text>
                <View style={styles.periodDropdownContainer}>
                  <TouchableOpacity style={styles.drawerDropdown} onPress={() => setShowPeriodDropdown(!showPeriodDropdown)}>
                    <Text style={styles.drawerDropdownText}>{subscriptionPeriods.length === 0 ? 'No periods available' : newPeriod.period}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showPeriodDropdown && (
                    <View style={styles.periodDropdownMenu}>
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                        {subscriptionPeriods.length === 0 ? (
                          <View style={styles.noPeriodsContainer}>
                            <Text style={styles.noPeriodsText}>No subscription periods found</Text>
                          </View>
                        ) : (
                          subscriptionPeriods.map((item, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setNewPeriod({...newPeriod, period: item.period});
                                setShowPeriodDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{item.period}</Text>
                            </TouchableOpacity>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Payment Proof</Text>
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
                      setNewPeriod({...newPeriod, localImageUri: asset.uri});
                    }
                  } catch (error) {
                    console.error('Error selecting image:', error);
                    Alert.alert('Error', 'Failed to select image. Please try again.');
                  }
                }}>
                  <Ionicons name="cloud-upload" size={20} color="#666" />
                  <Text style={styles.uploadButtonText}>
                    {newPeriod.localImageUri ? 'Change Image' : 'Upload Payment Screenshot'}
                  </Text>
                </TouchableOpacity>
                {newPeriod.localImageUri && (
                  <View style={styles.imagePreview}>
                    <Image 
                      source={{ uri: newPeriod.localImageUri }} 
                      style={styles.previewImage} 
                    />
                    <Text style={styles.imagePreviewText}>Payment proof selected</Text>
                  </View>
                )}
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  Animated.timing(addPeriodAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowAddPeriodDrawer(false));
                }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={async () => {
                  if (newPeriod.email && newPeriod.period) {
                    try {
                      // Get tenant ID from email
                      const tenantId = newPeriod.email.split('@')[0];
                      const clinicName = newPeriod.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
                      
                      // Get the price for the selected period
                      const periodPrice = getFormattedSubscriptionPrice(newPeriod.period);
                      
                      // Convert image to base64 if selected
                      let paymentImageBase64 = null;
                      if (newPeriod.localImageUri) {
                        console.log('Converting image to base64:', newPeriod.localImageUri);
                        const response = await fetch(newPeriod.localImageUri);
                        const blob = await response.blob();
                        const reader = new FileReader();
                        paymentImageBase64 = await new Promise((resolve) => {
                          reader.onloadend = () => resolve(reader.result);
                          reader.readAsDataURL(blob);
                        });
                        console.log('Image converted to base64, length:', paymentImageBase64?.length);
                      }
                      
                      console.log('Calling addSubscriptionPeriod with paymentImage:', paymentImageBase64 ? 'YES' : 'NO');
                      let result;
                      try {
                        result = await addSubscriptionPeriod(
                          tenantId,
                          newPeriod.email,
                          clinicName,
                          newPeriod.period,
                          periodPrice,
                          paymentImageBase64 || null
                        );
                        console.log('addSubscriptionPeriod result:', result);
                        
                        // Check if the transaction was saved with paymentImage
                        if (result.periodId) {
                          const { doc, getDoc } = await import('firebase/firestore');
                          const transactionDoc = await getDoc(doc(db, 'transactions', result.periodId));
                          if (transactionDoc.exists()) {
                            const data = transactionDoc.data();
                            console.log('Transaction saved with paymentImage:', data.paymentImage ? 'YES' : 'NO');
                          }
                        }
                      } catch (addError) {
                        console.error('Error calling addSubscriptionPeriod:', addError);
                        throw addError;
                      }
                      
                      if (result.success) {
                        alert(`✅ ${result.message}`);
                        setNewPeriod({ email: '', period: '1 month', paymentImage: null, localImageUri: null });
                        
                        Animated.timing(addPeriodAnimation, {
                          toValue: -350,
                          duration: 300,
                          useNativeDriver: false,
                        }).start(() => setShowAddPeriodDrawer(false));
                      } else {
                        alert(`❌ ${result.message}`);
                      }
                    } catch (error) {
                      console.error('Error adding subscription period:', error);
                      alert('❌ Failed to add subscription period');
                    }
                  } else {
                    alert('Please fill in all required fields');
                  }
                }}>
                  <Text style={styles.saveButtonText}>Add Period</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
      
      {notification && (
        <View style={[styles.notification, notification.type === 'success' ? styles.successNotification : styles.warningNotification]}>
          <Text style={styles.notificationText}>{notification.message}</Text>
          <TouchableOpacity style={styles.notificationClose} onPress={() => setNotification(null)}>
            <Text style={styles.notificationCloseText}>×</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {deleteConfirm && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmModal}>
              <Text style={styles.confirmTitle}>Delete Subscription?</Text>
              <Text style={styles.confirmMessage}>
                This will permanently delete the queued subscription.
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity style={styles.confirmCancel} onPress={() => setDeleteConfirm(null)}>
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmDelete} onPress={confirmDelete}>
                  <Text style={styles.confirmDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      </View>
    </SuperAdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#800000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
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
  table: {
    flex: 1,
    borderRadius: 12,
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
  headerCell: {
    fontWeight: '600',
    fontSize: 14,
    color: '#374151',
    letterSpacing: 0.5,
  },
  emailHeader: {
    flex: 1.8,
    textAlign: 'left',
  },
  periodHeader: {
    flex: 1,
    textAlign: 'left',
  },
  priceHeader: {
    flex: 1,
    textAlign: 'left',
  },
  statusHeader: {
    flex: 1,
    textAlign: 'left',
  },
  dateHeader: {
    flex: 1.1,
    textAlign: 'left',
  },
  endDateHeader: {
    flex: 1.1,
    textAlign: 'left',
  },
  cellText: {
    fontSize: 13,
    color: '#6B7280',
  },
  emailCell: {
    flex: 1.8,
    textAlign: 'left',
  },
  periodCell: {
    flex: 1,
    textAlign: 'left',
  },
  priceCell: {
    flex: 1,
    textAlign: 'left',
  },
  statusCell: {
    flex: 1,
    textAlign: 'left',
  },
  dateCell: {
    flex: 1.1,
    textAlign: 'left',
  },
  endDateCell: {
    flex: 1.1,
    textAlign: 'left',
  },
  tableBody: {
    flex: 1,
    backgroundColor: '#fff',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  pagination: {
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
  dropdown: {
    position: 'relative',
    zIndex: 1001,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    padding: 12,
  },
  dropdownText: {
    fontSize: 10,
    marginRight: 4,
  },
  dropdownArrow: {
    fontSize: 6,
    color: '#666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    zIndex: 10000,
    maxHeight: 200,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
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
  pageOf: {
    fontSize: 10,
    color: '#666',
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  drawerHeader: {
    padding: 15,
    paddingLeft: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
  },
  drawerCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerCloseText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  drawerForm: {
    flex: 1,
    padding: 20,
  },
  drawerButtons: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontWeight: 'bold',
  },
  emailDropdownContainer: {
    position: 'relative',
    zIndex: 2000,
  },
  emailDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 2001,
    elevation: 20,
    maxHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emailDropdownScroll: {
    maxHeight: 150,
  },
  noEmailsContainer: {
    padding: 15,
    alignItems: 'center',
  },
  noEmailsText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
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
  noPeriodsContainer: {
    padding: 15,
    alignItems: 'center',
  },
  noPeriodsText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveButton: {
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
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmCancel: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmCancelText: {
    color: '#666',
    fontWeight: 'bold',
  },
  confirmDelete: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});