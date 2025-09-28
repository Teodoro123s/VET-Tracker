import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Modal, Animated, Image } from 'react-native';
import { getCustomers, addCustomer, deleteCustomer, getMedicalForms, getMedicalCategories, addMedicalRecord } from '@/lib/services/firebaseService';
import { useTenant } from '@/contexts/TenantContext';
import { router } from 'expo-router';

export default function CustomersScreen() {
  const { userEmail } = useTenant();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [addSlideAnim] = useState(new Animated.Value(-350));
  const [recordSlideAnim] = useState(new Animated.Value(-350));
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [categories, setCategories] = useState([]);
  const [formTemplates, setFormTemplates] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFormTemplateDropdown, setShowFormTemplateDropdown] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    firstname: '',
    surname: '',
    email: '',
    contact: '',
    address: ''
  });
  const [newRecord, setNewRecord] = useState({
    category: 'No Category',
    formTemplate: ''
  });

  useEffect(() => {
    if (userEmail) {
      loadCustomers();
      loadRecordData();
    } else {
      setLoading(false);
    }
  }, [userEmail]);

  const loadCustomers = async () => {
    try {
      console.log('Loading customers for:', userEmail);
      const customersData = await getCustomers(userEmail);
      console.log('Loaded customers:', customersData.length);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecordData = async () => {
    try {
      const [forms, cats] = await Promise.all([
        getMedicalForms(userEmail),
        getMedicalCategories(userEmail)
      ]);
      
      const formTemplatesList = forms.map(form => ({
        id: form.id,
        formName: form.formName || form.type || form.name,
        category: form.category || 'No Category'
      }));
      
      console.log('RAW FORMS FROM DB:', JSON.stringify(forms, null, 2));
      console.log('MAPPED FORM TEMPLATES:', JSON.stringify(formTemplatesList, null, 2));
      setFormTemplates(formTemplatesList);
      
      const categoryList = cats.map(cat => ({
        id: cat.id,
        category: cat.name || cat.category
      }));
      
      if (!categoryList.find(cat => cat.category === 'No Category')) {
        categoryList.unshift({ id: 'no-category', category: 'No Category' });
      }
      
      console.log('RAW CATEGORIES FROM DB:', JSON.stringify(cats, null, 2));
      console.log('MAPPED CATEGORIES:', JSON.stringify(categoryList, null, 2));
      setCategories(categoryList);
    } catch (error) {
      console.error('Error loading record data:', error);
      setCategories([{ id: 'no-category', category: 'No Category' }]);
    }
  };

  const handleAddCustomer = async () => {
    try {
      if (!newCustomer.firstname || !newCustomer.surname) {
        Alert.alert('Error', 'Please fill in first name and surname');
        return;
      }
      
      await addCustomer(newCustomer, userEmail);
      setNewCustomer({ firstname: '', surname: '', email: '', contact: '', address: '' });
      loadCustomers();
      Alert.alert('Success', 'Customer added successfully');
      
      Animated.timing(addSlideAnim, {
        toValue: -350,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowAddModal(false));
    } catch (error) {
      Alert.alert('Error', 'Failed to add customer');
    }
  };

  const handleAddRecord = async () => {
    if (newRecord.category && newRecord.formTemplate) {
      try {
        const recordData = {
          category: newRecord.category,
          formTemplate: newRecord.formTemplate,
          createdAt: new Date().toISOString(),
          data: {}
        };
        
        await addMedicalRecord(recordData, userEmail);
        
        setNewRecord({ category: 'No Category', formTemplate: '' });
        Animated.timing(recordSlideAnim, {
          toValue: -350,
          duration: 200,
          useNativeDriver: false,
        }).start(() => setShowAddRecordModal(false));
        
        Alert.alert('Success', 'Record added successfully!');
      } catch (error) {
        console.error('Error adding record:', error);
        Alert.alert('Error', 'Error adding record');
      }
    } else {
      Alert.alert('Error', 'Please select both category and form template');
    }
  };

  useEffect(() => {
    if (showAddModal) {
      addSlideAnim.setValue(-350);
      Animated.timing(addSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showAddModal]);

  useEffect(() => {
    if (showAddRecordModal) {
      recordSlideAnim.setValue(-350);
      Animated.timing(recordSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showAddRecordModal]);

  useEffect(() => {
    if (newRecord.category) {
      setShowFormTemplateDropdown(false);
    }
  }, [newRecord.category]);

  const handleRowPress = (customer) => {
    console.log('Navigating to customer:', customer.id);
    router.push(`/client/customer-detail?id=${customer.id}`);
  };

  const filteredCustomers = customers.filter(customer => {
    const displayName = customer.name || `${customer.surname || ''} ${customer.firstname || ''}`;
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (page) => {
    const pageNum = parseInt(page);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleDeleteCustomer = (customer) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer.name || `${customer.firstname} ${customer.surname}`}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomer(customer.id, userEmail);
              loadCustomers();
              Alert.alert('Success', 'Customer deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete customer');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Customers</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addButtonText}>+ Add Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.recordButton} onPress={() => setShowAddRecordModal(true)}>
            <Text style={styles.recordButtonText}>+ Add Record</Text>
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <TextInput 
              style={styles.searchInput}
              placeholder="Search customers..."
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
                setCurrentPage(1);
              }}
            />
          </View>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.tableContainer}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Name</Text>
              <Text style={styles.headerCell}>Contact</Text>
              <Text style={styles.headerCell}>Email</Text>
              <Text style={styles.headerCell}>Address</Text>
            </View>
            
            {loading ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>Loading customers...</Text>
              </View>
            ) : filteredCustomers.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  {!userEmail ? 'Please log in to view customers' : 'No customers found'}
                </Text>
              </View>
            ) : itemsPerPage >= 20 ? (
              <ScrollView style={styles.tableBody}>
                {currentCustomers.map((customer) => (
                  <TouchableOpacity 
                    key={customer.id} 
                    style={styles.tableRow}
                    onPress={() => handleRowPress(customer)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cell}>{customer.name || `${customer.surname || ''}, ${customer.firstname || ''}`}</Text>
                    <Text style={styles.cell}>{customer.contact || 'N/A'}</Text>
                    <Text style={styles.cell}>{customer.email || 'N/A'}</Text>
                    <Text style={styles.cell}>{customer.address || 'N/A'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              currentCustomers.map((customer) => (
                <TouchableOpacity 
                  key={customer.id} 
                  style={styles.tableRow}
                  onPress={() => handleRowPress(customer)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cell}>{customer.name || `${customer.surname || ''}, ${customer.firstname || ''}`}</Text>
                  <Text style={styles.cell}>{customer.contact || 'N/A'}</Text>
                  <Text style={styles.cell}>{customer.email || 'N/A'}</Text>
                  <Text style={styles.cell}>{customer.address || 'N/A'}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
          
          <View style={styles.pagination}>
            <View style={styles.paginationControls}>
              <Text style={styles.paginationLabel}>Show:</Text>
              <View style={styles.dropdown}>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => {}}
                >
                  <Text style={styles.dropdownText}>{itemsPerPage}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.paginationLabel}>entries</Text>
              
              <TouchableOpacity style={styles.pageBtn} onPress={handlePrevious}>
                <Text style={styles.pageBtnText}>Prev</Text>
              </TouchableOpacity>
              <TextInput 
                style={styles.pageInput}
                value={currentPage.toString()}
                keyboardType="numeric"
                onChangeText={handlePageChange}
              />
              <Text style={styles.pageOf}>of {totalPages}</Text>
              <TouchableOpacity style={styles.pageBtn} onPress={handleNext}>
                <Text style={styles.pageBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {showAddModal && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Customer</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(addSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddModal(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>First Name *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter first name"
                  value={newCustomer.firstname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, firstname: text})}
                />
                
                <Text style={styles.fieldLabel}>Surname *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter surname"
                  value={newCustomer.surname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, surname: text})}
                />
                
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={newCustomer.email}
                  onChangeText={(text) => setNewCustomer({...newCustomer, email: text})}
                />
                
                <Text style={styles.fieldLabel}>Contact</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter contact number"
                  keyboardType="phone-pad"
                  value={newCustomer.contact}
                  onChangeText={(text) => setNewCustomer({...newCustomer, contact: text})}
                />
                
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter address"
                  value={newCustomer.address}
                  onChangeText={(text) => setNewCustomer({...newCustomer, address: text})}
                />
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  Animated.timing(addSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddModal(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={handleAddCustomer}>
                  <Text style={styles.drawerSaveText}>Add Customer</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {showAddRecordModal && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: recordSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Record</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(recordSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddRecordModal(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.drawerForm} showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Category *</Text>
                <View style={styles.categoryDropdownContainer}>
                  <TouchableOpacity style={styles.drawerDropdown} onPress={() => {
                    setShowCategoryDropdown(!showCategoryDropdown);
                    setShowFormTemplateDropdown(false);
                  }}>
                    <Text style={styles.drawerDropdownText}>{newRecord.category}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showCategoryDropdown && (
                    <View style={styles.categoryDropdownMenu}>
                      <ScrollView style={styles.categoryDropdownScroll} showsVerticalScrollIndicator={false}>
                        {categories.map((category) => (
                          <TouchableOpacity
                            key={category.id}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewRecord({...newRecord, category: category.category, formTemplate: ''});
                              setShowCategoryDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{category.category}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Form Template *</Text>
                <View style={styles.categoryDropdownContainer}>
                  <TouchableOpacity style={styles.drawerDropdown} onPress={() => {
                    setShowFormTemplateDropdown(!showFormTemplateDropdown);
                    setShowCategoryDropdown(false);
                  }}>
                    <Text style={styles.drawerDropdownText}>{newRecord.formTemplate || 'Select form template'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showFormTemplateDropdown && (
                    <View style={styles.categoryDropdownMenu} key={newRecord.category}>
                      <ScrollView style={styles.categoryDropdownScroll} showsVerticalScrollIndicator={false}>
                        {(() => {
                          console.log('=== FILTERING DEBUG ===');
                          console.log('All formTemplates:', JSON.stringify(formTemplates, null, 2));
                          console.log('Selected category:', newRecord.category);
                          
                          const filtered = formTemplates.filter(form => {
                            const formCategory = form.category || 'No Category';
                            const selectedCategory = newRecord.category || 'No Category';
                            const match = formCategory === selectedCategory;
                            console.log(`Form: ${form.formName} | FormCat: "${formCategory}" | SelectedCat: "${selectedCategory}" | Match: ${match}`);
                            return match;
                          });
                          
                          console.log('Filtered results:', JSON.stringify(filtered, null, 2));
                          console.log('=== END FILTERING DEBUG ===');
                          
                          return filtered;
                        })()
                          .sort((a, b) => a.formName.localeCompare(b.formName))
                          .map((form) => (
                          <TouchableOpacity
                            key={form.id}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewRecord({...newRecord, formTemplate: form.formName});
                              setShowFormTemplateDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{form.formName}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </ScrollView>
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  Animated.timing(recordSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddRecordModal(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={handleAddRecord}>
                  <Text style={styles.drawerSaveText}>Add Record</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#800000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  addButton: {
    backgroundColor: '#23C062',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  recordButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  recordButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  searchContainer: {
    borderWidth: 2,
    borderColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    width: 150,
    fontSize: 12,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  tableContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  table: {
    backgroundColor: '#fff',
    height: 390,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  rowContent: {
    flexDirection: 'row',
    flex: 1,
  },
  actionsCell: {
    flex: 0.3,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  cell: {
    flex: 1,
    fontSize: 12,
    color: '#555',
  },
  tableBody: {
    flex: 1,
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  drawerInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    backgroundColor: '#fafafa',
  },
  drawerButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    gap: 10,
  },
  drawerCancelButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    flex: 1,
  },
  drawerCancelText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
    fontSize: 12,
  },
  drawerSaveButton: {
    backgroundColor: '#23C062',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
  },
  drawerSaveText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 10,
    marginRight: 2,
  },
  dropdownArrow: {
    fontSize: 6,
    color: '#666',
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
  categoryDropdownContainer: {
    position: 'relative',
    zIndex: 3001,
  },
  drawerDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  drawerDropdownText: {
    fontSize: 14,
    color: '#333',
  },
  categoryDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 3002,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    maxHeight: 200,
  },
  categoryDropdownScroll: {
    maxHeight: 200,
  },
  dropdownOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#333',
  },
});