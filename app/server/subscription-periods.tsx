import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Modal, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import { collection, doc, setDoc, getDocs, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/config/firebaseConfig';
import { Typography, Spacing, ButtonSizes, ModalSizes } from '@/constants/Typography';

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
    <View style={styles.container}>
      <SuperAdminSidebar />
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Subscription Periods</Text>
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
        
        <View style={styles.content}>
          <View style={styles.tableContainer}>
            <View style={styles.tableTopRow}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.returnButton} onPress={() => router.back()}>
                  <Image source={require('@/assets/Vector.png')} style={styles.returnIcon} />
                </TouchableOpacity>
                <Text style={styles.detailTitle}>Subscription Period Management</Text>
              </View>
              <TouchableOpacity style={styles.addPeriodButton} onPress={() => {
                setShowAddDrawer(true);
                Animated.timing(addDrawerAnimation, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: false,
                }).start();
              }}>
                <Text style={styles.addPeriodButtonText}>+ Add New Period</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Order</Text>
              <Text style={styles.headerCell}>Period</Text>
              <Text style={styles.headerCell}>Price</Text>
              <Text style={styles.headerCellActions}>Actions</Text>
            </View>
            
            <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
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
                    <Text style={styles.cell}>{startIndex + index + 1}</Text>
                    <Text style={styles.cell}>{period.period}</Text>
                    <Text style={styles.cell}>{period.price}</Text>
                    <View style={styles.actionsCell}>
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
                  <Image source={require('@/assets/Vector (1).png')} style={styles.drawerCloseIcon} />
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
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  tableBody: {
    height: 250,
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
    fontSize: Typography.tableHeader,
    color: '#333',
    paddingRight: Spacing.medium,
  },
  cell: {
    flex: 1,
    textAlign: 'left',
    fontSize: Typography.tableData,
    color: '#555',
    paddingRight: Spacing.medium,
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
    fontSize: Typography.dropdown,
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
    width: 80,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  editButton: {
    backgroundColor: '#FFA500',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});