import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Modal, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { collection, doc, setDoc, getDocs, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/config/firebaseConfig';
import { Typography, Spacing, ButtonSizes, ModalSizes } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';

export default function SubscriptionPeriodsScreen() {
  const router = useRouter();
  
  const [periods, setPeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'subscriptionPeriods'), (snapshot) => {
      const periodsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          period: data.period || '',
          price: data.price || '₱0',
          description: data.description || '',
          status: data.status || 'Active',
          createdAt: data.createdAt
        };
      });
      
      // Remove duplicates, keeping only the first occurrence
      const uniquePeriods = [];
      const seenPeriods = new Set();
      
      periodsData.forEach(period => {
        if (!seenPeriods.has(period.period)) {
          seenPeriods.add(period.period);
          uniquePeriods.push(period);
        } else {
          // Delete duplicate from database
          deleteDoc(doc(db, 'subscriptionPeriods', period.id)).catch(console.error);
        }
      });
      
      setPeriods(uniquePeriods);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [addDrawerAnimation] = useState(new Animated.Value(-350));
  const [periodQuantity, setPeriodQuantity] = useState('1');
  const [periodUnit, setPeriodUnit] = useState('month');
  const [periodPrice, setPeriodPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);

  return (
    <SuperAdminLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Subscription Periods</Text>
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
        </View>
        
        <View style={styles.content}>
          <View style={styles.tableContainer}>
            <View style={styles.table}>

            
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.orderHeader]}>Order</Text>
                <Text style={[styles.headerCell, styles.periodHeader]}>Period</Text>
                <Text style={[styles.headerCell, styles.priceHeader]}>Price</Text>
                <Text style={[styles.headerCell, styles.actionsHeader]}>Actions</Text>
              </View>
              
              <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={true}>
              {(() => {
                if (isLoading) {
                  return (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>Loading periods...</Text>
                    </View>
                  );
                }

                const filteredPeriods = periods.filter(period => 
                  period.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  period.description.toLowerCase().includes(searchTerm.toLowerCase())
                ).sort((a, b) => {
                  const parseValue = (period) => {
                    const match = period.period.match(/(\d+)\s*(month|year)/);
                    if (!match) return { value: 0, unit: 'month' };
                    return { value: parseInt(match[1]), unit: match[2] };
                  };
                  
                  const aData = parseValue(a);
                  const bData = parseValue(b);
                  
                  // Months first, then years
                  if (aData.unit !== bData.unit) {
                    return aData.unit === 'month' ? -1 : 1;
                  }
                  
                  // Same unit, sort by value (smallest to greatest)
                  return aData.value - bData.value;
                });
                
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedPeriods = filteredPeriods.slice(startIndex, endIndex);
                
                if (paginatedPeriods.length === 0) {
                  return (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>No subscription periods found</Text>
                    </View>
                  );
                }
                
                return paginatedPeriods.map((period, index) => (
                  <View key={period.id} style={styles.tableRow}>
                    <Text style={[styles.cell, styles.orderCell]}>{startIndex + index + 1}</Text>
                    <Text style={[styles.cell, styles.periodCell]}>{period.period}</Text>
                    <Text style={[styles.cell, styles.priceCell]}>{period.price}</Text>
                    <View style={styles.actionsCell}>
                      <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.editButton} 
                        onPress={() => {
                          const match = period.period.match(/(\d+)\s*(month|year)/);
                          if (match) {
                            setPeriodQuantity(match[1]);
                            setPeriodUnit(match[2]);
                          }
                          setPeriodPrice(period.price.startsWith('₱') ? period.price : '₱' + period.price);
                          setEditingPeriod(period);
                          setShowAddDrawer(true);
                          Animated.timing(addDrawerAnimation, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: false,
                          }).start();
                        }}
                      >
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteButton} 
                        onPress={() => {
                          Alert.alert(
                            'Delete Period',
                            `Are you sure you want to delete "${period.period}"?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { 
                                text: 'Delete', 
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    await deleteDoc(doc(db, 'subscriptionPeriods', period.id));
                                    Alert.alert('Success', 'Period deleted successfully!');
                                  } catch (error) {
                                    console.error('Error deleting period:', error);
                                    Alert.alert('Error', 'Failed to delete period');
                                  }
                                }
                              }
                            ]
                          );
                        }}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ));
              })()}
              </ScrollView>
            </View>

            {/* Pagination */}
            <View style={styles.pagination}>
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
                <Text style={styles.pageOf}>of {Math.ceil(periods.filter(period => 
                  period.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  period.description.toLowerCase().includes(searchTerm.toLowerCase())
                ).length / itemsPerPage)}</Text>
                <TouchableOpacity style={styles.pageBtn} onPress={() => setCurrentPage(currentPage + 1)}>
                  <Text style={styles.pageBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        
        {showAddDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addDrawerAnimation }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Period</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(addDrawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => {
                    setShowAddDrawer(false);
                    setEditingPeriod(null);
                    setPeriodQuantity('1');
                    setPeriodUnit('month');
                    setPeriodPrice('');
                  });
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Duration *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter duration (e.g., 1, 7, 30)"
                  placeholderTextColor="#bbb"
                  keyboardType="numeric"
                  value={periodQuantity}
                  onChangeText={setPeriodQuantity}
                />
                
                <Text style={styles.fieldLabel}>Unit *</Text>
                <View style={styles.unitToggleContainer}>
                  <TouchableOpacity 
                    style={[styles.unitOption, periodUnit === 'month' && styles.unitOptionActive]}
                    onPress={() => setPeriodUnit('month')}
                  >
                    <Text style={[styles.unitOptionText, periodUnit === 'month' && styles.unitOptionTextActive]}>Month</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.unitOption, periodUnit === 'year' && styles.unitOptionActive]}
                    onPress={() => setPeriodUnit('year')}
                  >
                    <Text style={[styles.unitOptionText, periodUnit === 'year' && styles.unitOptionTextActive]}>Year</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.fieldLabel}>Price *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter price (e.g., ₱7,499.00)"
                  placeholderTextColor="#bbb"
                  value={periodPrice}
                  onChangeText={(text) => {
                    if (text === '') {
                      setPeriodPrice('₱');
                    } else if (!text.startsWith('₱')) {
                      setPeriodPrice('₱' + text);
                    } else {
                      setPeriodPrice(text);
                    }
                  }}
                  onBlur={() => {
                    if (periodPrice && periodPrice !== '₱') {
                      let price = periodPrice.replace('₱', '').replace(/,/g, '');
                      if (price && !price.includes('.')) {
                        setPeriodPrice('₱' + price + '.00');
                      } else if (price && price.includes('.') && price.split('.')[1].length === 1) {
                        setPeriodPrice('₱' + price + '0');
                      }
                    }
                  }}
                />
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  Animated.timing(addDrawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => {
                    setShowAddDrawer(false);
                    setEditingPeriod(null);
                    setPeriodQuantity('1');
                    setPeriodUnit('month');
                    setPeriodPrice('');
                  });
                }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={async () => {
                  if (!periodQuantity || !periodUnit || !periodPrice) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  
                  const quantity = parseInt(periodQuantity);
                  if (isNaN(quantity) || quantity <= 0) {
                    alert('Please enter a valid duration (positive number)');
                    return;
                  }
                  
                  const finalPeriod = `${quantity} ${periodUnit}${quantity > 1 ? 's' : ''}`;
                  
                  try {
                    if (editingPeriod) {
                      await setDoc(doc(db, 'subscriptionPeriods', editingPeriod.id), {
                        period: finalPeriod,
                        price: periodPrice,
                        description: editingPeriod.description || 'Custom subscription period',
                        status: editingPeriod.status || 'Active',
                        createdAt: editingPeriod.createdAt || new Date(),
                        updatedAt: new Date()
                      });
                      alert('✅ Subscription period updated successfully!');
                    } else {
                      const existingPeriod = periods.find(p => p.period === finalPeriod);
                      if (existingPeriod) {
                        alert('❌ This subscription period already exists!');
                        return;
                      }
                      
                      await setDoc(doc(collection(db, 'subscriptionPeriods')), {
                        period: finalPeriod,
                        price: periodPrice,
                        description: 'Custom subscription period',
                        status: 'Active',
                        createdAt: new Date()
                      });
                      alert('✅ Subscription period added successfully!');
                    }
                    
                    setPeriodQuantity('1');
                    setPeriodUnit('month');
                    setPeriodPrice('');
                    setEditingPeriod(null);
                    Animated.timing(addDrawerAnimation, {
                      toValue: -350,
                      duration: 300,
                      useNativeDriver: false,
                    }).start(() => setShowAddDrawer(false));
                  } catch (error) {
                    console.error('Error saving period:', error);
                    alert(`❌ Failed to ${editingPeriod ? 'update' : 'add'} subscription period`);
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tableContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  table: {
    backgroundColor: '#fff',
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
  filterTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'left',
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
  addPeriodButton: {
    backgroundColor: '#23C062',
    borderRadius: Spacing.radiusSmall,
    paddingHorizontal: ButtonSizes.paddingHorizontal,
    paddingVertical: ButtonSizes.paddingVertical,
    height: ButtonSizes.height,
  },
  addPeriodButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: Typography.button,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 24,
    paddingLeft: 70,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
  tableBody: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    paddingLeft: 70,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
    minHeight: 60,
  },
  rowContent: {
    flexDirection: 'row',
    flex: 1,
  },
  headerCell: {
    fontWeight: '600',
    fontSize: 14,
    color: '#374151',
    letterSpacing: 0.5,
  },
  orderHeader: {
    flex: 0.5,
    textAlign: 'left',
  },
  periodHeader: {
    flex: 1.5,
    textAlign: 'left',
  },
  priceHeader: {
    flex: 1,
    textAlign: 'left',
  },
  actionsHeader: {
    flex: 1.2,
    textAlign: 'center',
  },
  cell: {
    fontSize: 13,
    color: '#6B7280',
    paddingLeft: 0,
  },
  orderCell: {
    flex: 0.5,
    textAlign: 'left',
  },
  periodCell: {
    flex: 1.5,
    textAlign: 'left',
  },
  priceCell: {
    flex: 1,
    textAlign: 'left',
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
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeText: {
    color: '#fff',
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
  dropdownContainer: {
    position: 'relative',
    zIndex: 100,
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
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    backgroundColor: '#fff',
    fontSize: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  unitToggleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    marginBottom: 15,
  },
  unitOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  unitOptionActive: {
    backgroundColor: '#800000',
  },
  unitOptionText: {
    fontSize: 12,
    color: '#666',
  },
  unitOptionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  headerCellActions: {
    width: 80,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  actionsCell: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  editButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    width: 80,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    width: 80,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});