import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Modal, Animated, Image } from 'react-native';
import { getCustomers, addCustomer, deleteCustomer, updateCustomer } from '@/lib/services/firebaseService';
import { useTenant } from '@/contexts/TenantContext';
import { router } from 'expo-router';

export default function CustomersScreen() {
  const { userEmail } = useTenant();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);

  const [addSlideAnim] = useState(new Animated.Value(-350));
  const [editSlideAnim] = useState(new Animated.Value(-350));
  const [recordSlideAnim] = useState(new Animated.Value(-350));

  const [editingCustomer, setEditingCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [newCustomer, setNewCustomer] = useState({
    firstname: '',
    surname: '',
    email: '',
    contact: '',
    address: ''
  });
  const [editCustomer, setEditCustomer] = useState({
    firstname: '',
    surname: '',
    email: '',
    contact: '',
    address: ''
  });

  const [categories, setCategories] = useState([]);
  const [formTemplates, setFormTemplates] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFormTemplateDropdown, setShowFormTemplateDropdown] = useState(false);
  const [newRecord, setNewRecord] = useState({
    category: '',
    formTemplate: ''
  });


  useEffect(() => {
    if (userEmail) {
      loadCustomers();

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
    if (showEditModal) {
      editSlideAnim.setValue(-350);
      Animated.timing(editSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showEditModal]);



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

  const handleEditCustomer = (customer) => {
    const [surname, firstname] = customer.name ? customer.name.split(', ') : [customer.surname || '', customer.firstname || ''];
    setEditingCustomer(customer);
    setEditCustomer({
      firstname: firstname || customer.firstname || '',
      surname: surname || customer.surname || '',
      email: customer.email || '',
      contact: customer.contact || '',
      address: customer.address || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async () => {
    try {
      if (!editCustomer.firstname || !editCustomer.surname) {
        Alert.alert('Error', 'Please fill in first name and surname');
        return;
      }
      
      await updateCustomer(editingCustomer.id, editCustomer, userEmail);
      setEditCustomer({ firstname: '', surname: '', email: '', contact: '', address: '' });
      setEditingCustomer(null);
      loadCustomers();
      Alert.alert('Success', 'Customer updated successfully');
      
      Animated.timing(editSlideAnim, {
        toValue: -350,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowEditModal(false));
    } catch (error) {
      Alert.alert('Error', 'Failed to update customer');
    }
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

  const handleAddRecord = async () => {
    try {
      if (!newRecord.category || !newRecord.formTemplate) {
        Alert.alert('Error', 'Please select category and form template');
        return;
      }
      
      const recordData = {
        category: newRecord.category,
        formTemplate: newRecord.formTemplate,
        createdAt: new Date().toISOString()
      };
      
      await addMedicalRecord(recordData, userEmail);
      setNewRecord({ category: '', formTemplate: '' });
      Alert.alert('Success', 'Medical record added successfully');
      
      Animated.timing(recordSlideAnim, {
        toValue: -350,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowAddRecordModal(false));
    } catch (error) {
      Alert.alert('Error', 'Failed to add medical record');
    }
  };

  const renderFormModal = () => {
    return null;
  };



  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Customers</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addButtonText}>+ Add Customer</Text>
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search customers..."
              placeholderTextColor="#999"
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
              <Text style={[styles.headerCell, { textAlign: 'center' }]}>Actions</Text>
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
                  <View key={customer.id} style={styles.tableRow}>
                    <TouchableOpacity 
                      style={styles.rowContent}
                      onPress={() => handleRowPress(customer)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cell}>{customer.name || `${customer.surname || ''}, ${customer.firstname || ''}`}</Text>
                      <Text style={styles.cell}>{customer.contact || 'N/A'}</Text>
                      <Text style={styles.cell}>{customer.email || 'N/A'}</Text>
                      <Text style={styles.cell}>{customer.address || 'N/A'}</Text>
                    </TouchableOpacity>
                    <View style={styles.actionsCell}>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity 
                          style={styles.editButton} 
                          onPress={(e) => {
                            e.stopPropagation();
                            handleEditCustomer(customer);
                          }}
                        >
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.deleteButton} 
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomer(customer);
                          }}
                        >
                          <Text style={styles.deleteButtonText}>Del</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              currentCustomers.map((customer) => (
                <View key={customer.id} style={styles.tableRow}>
                  <TouchableOpacity 
                    style={styles.rowContent}
                    onPress={() => handleRowPress(customer)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cell}>{customer.name || `${customer.surname || ''}, ${customer.firstname || ''}`}</Text>
                    <Text style={styles.cell}>{customer.contact || 'N/A'}</Text>
                    <Text style={styles.cell}>{customer.email || 'N/A'}</Text>
                    <Text style={styles.cell}>{customer.address || 'N/A'}</Text>
                  </TouchableOpacity>
                  <View style={styles.actionsCell}>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.editButton} 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEditCustomer(customer);
                        }}
                      >
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteButton} 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomer(customer);
                        }}
                      >
                        <Text style={styles.deleteButtonText}>Del</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
          
          <View style={styles.pagination}>
            <View style={styles.paginationControls}>
              <Text style={styles.paginationLabel}>Rows per page:</Text>
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => {}}
                >
                  <Text style={styles.dropdownText}>{itemsPerPage}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.pageBtn}
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <Text style={styles.pageBtnText}>‹</Text>
              </TouchableOpacity>
              
              <Text style={styles.pageOf}>
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length}
              </Text>
              
              <TouchableOpacity
                style={styles.pageBtn}
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <Text style={styles.pageBtnText}>›</Text>
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

      {showEditModal && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: editSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Edit Customer</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(editSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowEditModal(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>First Name *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter first name"
                  value={editCustomer.firstname}
                  onChangeText={(text) => setEditCustomer({...editCustomer, firstname: text})}
                />
                
                <Text style={styles.fieldLabel}>Surname *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter surname"
                  value={editCustomer.surname}
                  onChangeText={(text) => setEditCustomer({...editCustomer, surname: text})}
                />
                
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={editCustomer.email}
                  onChangeText={(text) => setEditCustomer({...editCustomer, email: text})}
                />
                
                <Text style={styles.fieldLabel}>Contact</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter contact number"
                  keyboardType="phone-pad"
                  value={editCustomer.contact}
                  onChangeText={(text) => setEditCustomer({...editCustomer, contact: text})}
                />
                
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter address"
                  value={editCustomer.address}
                  onChangeText={(text) => setEditCustomer({...editCustomer, address: text})}
                />
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  Animated.timing(editSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowEditModal(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={handleUpdateCustomer}>
                  <Text style={styles.drawerSaveText}>Update Customer</Text>
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
    width: 150,
    fontSize: 12,
    outlineStyle: 'none',
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
    flex: 0.2,
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
  },
  editButtonText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 9,
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
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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

});