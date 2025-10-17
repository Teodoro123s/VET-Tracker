import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Modal, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import { subscribeToTenants, Subscriber } from '../../lib/services/superAdminService';
import { addSubscriptionPeriod } from '../../lib/services/subscriptionService';
import { collection, onSnapshot, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/config/firebaseConfig';


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
        const email = transaction.email;
        if (!subscriptionMap.has(email)) {
          subscriptionMap.set(email, []);
        }
        subscriptionMap.get(email).push(transaction);
      });
      
      const subscriptions = [];
      
      subscriptionMap.forEach((emailTransactions, email) => {
        // Sort by creation date
        emailTransactions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        emailTransactions.forEach((transaction, index) => {
          const now = new Date();
          let status = 'queued';
          let startDate = transaction.createdAt;
          
          if (index === 0) {
            // First transaction is always active
            status = 'active';
          } else {
            // Subsequent transactions are queued
            const prevTransaction = emailTransactions[index - 1];
            startDate = prevTransaction.endDate;
          }
          
          // Check if active period has expired
          if (status === 'active' && now > transaction.endDate) {
            status = 'expired';
            // Activate next queued period if exists
            if (index + 1 < emailTransactions.length) {
              emailTransactions[index + 1].status = 'active';
            }
          }
          
          subscriptions.push({
            ...transaction,
            status,
            startDate
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

  const calculateDaysLeft = (tenant: Subscriber): number => {
    if (!tenant.createdAt) return 30;
    const createdDate = tenant.createdAt.toDate ? tenant.createdAt.toDate() : new Date(tenant.createdAt);
    const periodDays = getPeriodDays(tenant.subscriptionPlan || '1 month');
    const endDate = new Date(createdDate);
    endDate.setDate(endDate.getDate() + periodDays);
    
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPeriodDays = (period: string): number => {
    switch (period) {
      case '1 month': return 30;
      case '6 months': return 180;
      case '1 year': return 365;
      case '2 years': return 730;
      default: return 30;
    }
  };

  const getSubscriptionStatus = (daysLeft: number): string => {
    if (daysLeft < 0) return 'Overdue';
    if (daysLeft <= 7) return 'Expiring Soon';
    return 'Active';
  };

  const getEndDate = (tenant: Subscriber): string => {
    if (!tenant.createdAt) return 'N/A';
    const createdDate = tenant.createdAt.toDate ? tenant.createdAt.toDate() : new Date(tenant.createdAt);
    const periodDays = getPeriodDays(tenant.subscriptionPlan || '1 month');
    const endDate = new Date(createdDate);
    endDate.setDate(endDate.getDate() + periodDays);
    return endDate.toLocaleDateString();
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showTenantDetails, setShowTenantDetails] = useState(false);
  const [showAddPeriodDrawer, setShowAddPeriodDrawer] = useState(false);
  const [addPeriodAnimation] = useState(new Animated.Value(-350));
  const [newPeriod, setNewPeriod] = useState({
    email: '',
    period: '1 month'
  });
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  
  const [tenantEmails, setTenantEmails] = useState([]);

  // Fetch tenant emails from database
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tenants'), (snapshot) => {
      const emails = snapshot.docs.map(doc => doc.data().email).filter(email => email);
      setTenantEmails(emails);
    });
    
    return () => unsubscribe();
  }, []);
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
      setSubscriptionPeriods(periodsData);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <SuperAdminSidebar />
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Subscription Management</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={14} color="#999" />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search tenants..."
              placeholderTextColor="#bbb"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>
        
        <View style={styles.content}>
          {!showTenantDetails ? (
          <View style={styles.tableContainer}>
            <View style={styles.tableTopRow}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.returnButton} onPress={() => router.back()}>
                  <Text style={styles.returnButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.detailTitle}>Subscription Management</Text>
                <View style={styles.filterButtons}>
                  <TouchableOpacity 
                    style={[styles.filterButton, statusFilter === 'Active' && styles.activeFilterButton]} 
                    onPress={() => setStatusFilter('Active')}
                  >
                    <Text style={[styles.filterButtonText, statusFilter === 'Active' && styles.activeFilterText]}>Active</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.filterButton, statusFilter === 'Queued' && styles.activeFilterButton]} 
                    onPress={() => setStatusFilter('Queued')}
                  >
                    <Text style={[styles.filterButtonText, statusFilter === 'Queued' && styles.activeFilterText]}>Queued</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.addPeriodButton} onPress={() => {
                setShowAddPeriodDrawer(true);
                Animated.timing(addPeriodAnimation, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: false,
                }).start();
              }}>
                <Text style={styles.addPeriodButtonText}>+ Add Subscription Period</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, {flex: 2}]}>Email</Text>
              <Text style={[styles.headerCell, {flex: 1.5}]}>Current Period</Text>
              <Text style={[styles.headerCell, {flex: 1.5}]}>End Date</Text>
              <Text style={[styles.headerCell, {flex: 1}]}>Days Left</Text>
              <Text style={[styles.headerCell, {flex: 1}]}>Status</Text>
            </View>
            
            <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
              {(() => {
                if (isLoading) {
                  return (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>Loading subscriptions...</Text>
                    </View>
                  );
                }
                
                const currentSubscriptions = statusFilter === 'Active' ? activeSubscriptions : queuedSubscriptions;
                const filteredSubscriptions = currentSubscriptions.filter(sub => 
                  sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  sub.clinicName?.toLowerCase().includes(searchTerm.toLowerCase())
                );
                
                if (filteredSubscriptions.length === 0) {
                  return (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>No {statusFilter.toLowerCase()} subscription periods found</Text>
                    </View>
                  );
                }
                
                return filteredSubscriptions.map((subscription) => {
                  if (statusFilter === 'Active') {
                    const now = new Date();
                    const daysLeft = Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const status = daysLeft < 0 ? 'Overdue' : daysLeft <= 7 ? 'Expiring Soon' : 'Active';
                    
                    return (
                      <TouchableOpacity 
                        key={subscription.id} 
                        style={[styles.tableRow, selectedTenant?.id === subscription.id && styles.selectedRow]}
                        onPress={() => {
                          setSelectedTenant(subscription);
                          setShowTenantDetails(true);
                        }}
                      >
                        <Text style={[styles.cell, {flex: 2}]}>{subscription.email}</Text>
                        <Text style={[styles.cell, {flex: 1.5}]}>{subscription.period}</Text>
                        <Text style={[styles.cell, {flex: 1.5}]}>{subscription.endDate.toLocaleDateString()}</Text>
                        <Text style={[styles.cell, {flex: 1},
                          daysLeft < 0 && styles.overdueText,
                          daysLeft <= 7 && daysLeft >= 0 && styles.dueSoonText
                        ]}>{daysLeft < 0 ? `${Math.abs(daysLeft)} overdue` : `${daysLeft} days`}</Text>
                        <View style={[styles.statusContainer, {flex: 1}]}>
                          <View style={[styles.statusBadge, 
                            status === 'Active' && styles.activeBadge,
                            status === 'Expiring Soon' && styles.expiringSoonBadge,
                            status === 'Overdue' && styles.overdueBadge
                          ]}>
                            <Text style={[styles.statusText,
                              status === 'Active' && styles.activeText,
                              status === 'Expiring Soon' && styles.expiringSoonText,
                              status === 'Overdue' && styles.overdueText
                            ]}>{status}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  } else {
                    return (
                      <TouchableOpacity 
                        key={subscription.id} 
                        style={[styles.tableRow, styles.queuedRow, selectedTenant?.id === subscription.id && styles.selectedRow]}
                        onPress={() => {
                          setSelectedTenant(subscription);
                          setShowTenantDetails(true);
                        }}
                      >
                        <Text style={[styles.cell, {flex: 2}]}>{subscription.email}</Text>
                        <Text style={[styles.cell, {flex: 1.5}]}>{subscription.period}</Text>
                        <Text style={[styles.cell, {flex: 1.5}]}>{subscription.startDate.toLocaleDateString()}</Text>
                        <Text style={[styles.cell, {flex: 1}]}>Queued</Text>
                        <View style={[styles.statusContainer, {flex: 1}]}>
                          <View style={[styles.statusBadge, styles.queuedBadge]}>
                            <Text style={[styles.statusText, styles.queuedText]}>Pending</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  }
                });
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
                <Text style={styles.pageOf}>of {Math.ceil((statusFilter === 'Active' ? activeSubscriptions : queuedSubscriptions).filter(sub => 
                  sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  sub.clinicName?.toLowerCase().includes(searchTerm.toLowerCase())
                ).length / itemsPerPage)}</Text>
                <TouchableOpacity style={styles.pageBtn} onPress={() => setCurrentPage(currentPage + 1)}>
                  <Text style={styles.pageBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          ) : (
            <View style={styles.tableContainer}>
              <View style={styles.tableTopRow}>
                <View style={styles.headerRow}>
                  <TouchableOpacity style={styles.returnButton} onPress={() => {
                    setShowTenantDetails(false);
                    setSelectedTenant(null);
                  }}>
                    <Text style={styles.returnButtonText}>←</Text>
                  </TouchableOpacity>
                  <Text style={styles.detailTitle}>Subscription Details - {selectedTenant?.clinicName}</Text>
                </View>
              </View>
              
              <View style={styles.tableHeader}>
                <Text style={styles.headerCell}>Field</Text>
                <Text style={styles.headerCell}>Value</Text>
              </View>
              
              <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
                <View style={styles.tableRow}>
                  <Text style={styles.cell}>Clinic Name</Text>
                  <Text style={styles.cell}>{selectedTenant?.clinicName}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cell}>Email Address</Text>
                  <Text style={styles.cell}>{selectedTenant?.email}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cell}>Current Period</Text>
                  <Text style={styles.cell}>{selectedTenant?.period || '1 month'}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cell}>Amount</Text>
                  <Text style={styles.cell}>{selectedTenant?.price || '₱44,994'}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cell}>Start Date</Text>
                  <Text style={styles.cell}>{selectedTenant?.startDate?.toLocaleDateString() || new Date().toLocaleDateString()}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cell}>End Date</Text>
                  <Text style={styles.cell}>{getEndDate(selectedTenant)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cell}>Days Left</Text>
                  <Text style={styles.cell}>{(() => {
                    const daysLeft = calculateDaysLeft(selectedTenant);
                    return daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days remaining`;
                  })()}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cell}>Status</Text>
                  <Text style={styles.cell}>{selectedTenant?.status?.charAt(0).toUpperCase() + selectedTenant?.status?.slice(1)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cell}>Created Date</Text>
                  <Text style={styles.cell}>{selectedTenant?.createdAt?.toDate?.()?.toLocaleDateString() || new Date('2024-09-15').toLocaleDateString()}</Text>
                </View>


              </ScrollView>
            </View>
          )}
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
                      const selectedPeriodData = subscriptionPeriods.find(p => p.period === newPeriod.period);
                      const periodPrice = selectedPeriodData?.price || '₱7,499';
                      
                      const result = await addSubscriptionPeriod(
                        tenantId,
                        newPeriod.email,
                        clinicName,
                        newPeriod.period,
                        periodPrice
                      );
                      
                      if (result.success) {
                        alert(`✅ ${result.message}`);
                        setNewPeriod({ email: '', period: '1 month' });
                        
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
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
    fontSize: 36,
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
  },
  searchIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  searchInput: {
    width: 200,
    fontSize: 12,
    outlineStyle: 'none',
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
    marginBottom: 20,
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  returnButton: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  detailTitle: {
    fontSize: 20,
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
    height: 120,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
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
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
  },

  statusContainer: {
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
  expiringSoonBadge: {
    backgroundColor: '#FFA500',
  },
  overdueBadge: {
    backgroundColor: '#FF6B6B',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeText: {
    color: '#fff',
  },
  expiringSoonText: {
    color: '#fff',
  },
  overdueText: {
    color: '#fff',
  },
  dueSoonText: {
    color: '#FFA500',
    fontWeight: 'bold',
  },

  billingActions: {
    width: 80,
    alignItems: 'center',
  },
  extendButton: {
    backgroundColor: '#23C062',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  extendText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectedRow: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#800000',
  },
  addPeriodButton: {
    backgroundColor: '#23C062',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addPeriodButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
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
    width: 350,
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
    fontSize: 14,
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
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 200,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  subHeader: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  subHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#800000',
    textTransform: 'uppercase',
  },
  queuedRow: {
    backgroundColor: '#f9f9f9',
  },
  queuedBadge: {
    backgroundColor: '#9C27B0',
  },
  queuedText: {
    color: '#fff',
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
  noPeriodsContainer: {
    padding: 15,
    alignItems: 'center',
  },
  noPeriodsText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },

});