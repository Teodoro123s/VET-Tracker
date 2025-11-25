import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Modal, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCustomers, addCustomer, deleteCustomer, updateCustomer } from '@/lib/services/firebaseService';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';
import AdminLayout from '../../components/AdminLayout';

export default function CustomersScreen() {
  const { user } = useAuth();
  const { userEmail, tenantId, isSuperAdmin } = useTenant();
  const { triggerCustomerCreated } = useNotificationTriggers();
  
  console.log('=== CUSTOMERS SCREEN DEBUG ===');
  console.log('Auth user:', user);
  console.log('userEmail from tenant:', userEmail);
  console.log('tenantId:', tenantId);
  console.log('isSuperAdmin:', isSuperAdmin);
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
      console.log('=== LOADING CUSTOMERS ===');
      console.log('Loading customers for userEmail:', userEmail);
      const customersData = await getCustomers(userEmail);
      console.log('Loaded customers count:', customersData.length);
      console.log('First customer sample:', customersData[0]);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleAddCustomer = async () => {
    try {
      if (!userEmail) {
        alert('Please log in to add customers');
        return;
      }
      
      if (!newCustomer.firstname || !newCustomer.surname) {
        alert('Please fill in first name and surname');
        return;
      }
      
      console.log('=== ADDING CUSTOMER ===');
      console.log('Customer data:', newCustomer);
      console.log('User email:', userEmail);
      
      const customerData = {
        ...newCustomer,
        createdAt: new Date().toISOString(),
        name: `${newCustomer.surname}, ${newCustomer.firstname}`
      };
      
      // If superadmin, require explicit tenant selection
      if (isSuperAdmin && !tenantId) {
        alert('Please select a tenant before adding a customer (you are a superadmin).');
        return;
      }

      const result = await addCustomer(customerData, userEmail);
      console.log('Customer added successfully:', result);
      
      // Trigger notification
      triggerCustomerCreated(`${newCustomer.firstname} ${newCustomer.surname}`);
      
      setNewCustomer({ firstname: '', surname: '', email: '', contact: '', address: '' });
      await loadCustomers();
      alert('Customer added successfully');
      
      Animated.timing(addSlideAnim, {
        toValue: -350,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowAddModal(false));
    } catch (error) {
      console.error('Error adding customer:', error);
      alert(`Failed to add customer: ${error.message}`);
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
    router.replace(`/client/customer-detail?id=${customer.id}`);
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
        alert('Please fill in first name and surname');
        return;
      }
      
      await updateCustomer(editingCustomer.id, editCustomer, userEmail);
      setEditCustomer({ firstname: '', surname: '', email: '', contact: '', address: '' });
      setEditingCustomer(null);
      loadCustomers();
      alert('Customer updated successfully');
      
      Animated.timing(editSlideAnim, {
        toValue: -350,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowEditModal(false));
    } catch (error) {
      alert('Failed to update customer');
    }
  };

  const handleDeleteCustomer = (customer) => {
    const confirmed = confirm(`Are you sure you want to delete ${customer.name || `${customer.firstname} ${customer.surname}`}? This action cannot be undone.`);
    if (confirmed) {
      (async () => {
        try {
          await deleteCustomer(customer.id, userEmail);
          await loadCustomers();
          alert('Customer deleted successfully');
        } catch (error) {
          alert(`Failed to delete customer: ${error.message}`);
        }
      })();
    }
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
      
      // await addMedicalRecord(recordData, userEmail);
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
    <AdminLayout>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Customers</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="rgba(153, 153, 153, 0.8)"
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
                setCurrentPage(1);
              }}
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
              <Text style={[styles.headerCell, styles.nameHeader]}>Name</Text>
              <Text style={[styles.headerCell, styles.contactHeader]}>Contact</Text>
              <Text style={[styles.headerCell, styles.emailHeader]}>Email</Text>
              <Text style={[styles.headerCell, styles.addressHeader]}>Address</Text>
              <Text style={[styles.headerCell, styles.actionsHeader]}>Actions</Text>
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
                      <Text style={[styles.cell, styles.nameCell]}>{customer.name || `${customer.surname || ''}, ${customer.firstname || ''}`}</Text>
                      <Text style={[styles.cell, styles.contactCell]}>{customer.contact || 'N/A'}</Text>
                      <Text style={[styles.cell, styles.emailCell]}>{customer.email || 'N/A'}</Text>
                      <Text style={[styles.cell, styles.addressCell]}>{customer.address || 'N/A'}</Text>
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
                          onPress={() => handleDeleteCustomer(customer)}
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
                    <Text style={[styles.cell, styles.nameCell]}>{customer.name || `${customer.surname || ''}, ${customer.firstname || ''}`}</Text>
                    <Text style={[styles.cell, styles.contactCell]}>{customer.contact || 'N/A'}</Text>
                    <Text style={[styles.cell, styles.emailCell]}>{customer.email || 'N/A'}</Text>
                    <Text style={[styles.cell, styles.addressCell]}>{customer.address || 'N/A'}</Text>
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
                        onPress={() => handleDeleteCustomer(customer)}
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
            <View style={styles.drawer}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Edit Customer</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.fieldLabel}>First Name *</Text>
                    <TextInput
                      style={styles.drawerInput}
                      placeholder="Enter first name"
                      value={editCustomer.firstname}
                      onChangeText={(text) => setEditCustomer({...editCustomer, firstname: text})}
                    />
                  </View>
                  <View style={styles.formColumn}>
                    <Text style={styles.fieldLabel}>Surname *</Text>
                    <TextInput
                      style={styles.drawerInput}
                      placeholder="Enter surname"
                      value={editCustomer.surname}
                      onChangeText={(text) => setEditCustomer({...editCustomer, surname: text})}
                    />
                  </View>
                </View>
                
                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <TextInput
                      style={styles.drawerInput}
                      placeholder="Enter email address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={editCustomer.email}
                      onChangeText={(text) => setEditCustomer({...editCustomer, email: text})}
                    />
                  </View>
                  <View style={styles.formColumn}>
                    <Text style={styles.fieldLabel}>Contact</Text>
                    <TextInput
                      style={styles.drawerInput}
                      placeholder="Enter contact number"
                      keyboardType="phone-pad"
                      value={editCustomer.contact}
                      onChangeText={(text) => setEditCustomer({...editCustomer, contact: text})}
                    />
                  </View>
                </View>
                
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter address"
                  value={editCustomer.address}
                  onChangeText={(text) => setEditCustomer({...editCustomer, address: text})}
                />
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.drawerSaveButton, { backgroundColor: '#800000' }]} onPress={handleUpdateCustomer}>
                  <Text style={styles.drawerSaveText}>Update Customer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}


      </ScrollView>
    </AdminLayout>
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
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
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
  scrollContent: {
    flexGrow: 1,
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
    borderWidth: 1,
    borderColor: '#ddd',
  },
  table: {
    backgroundColor: '#fff',
    flex: 1,
    borderRadius: 12,
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
    marginLeft: 0,
  },
  actionsCell: {
    flex: 0.3,
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
  headerCell: {
    fontWeight: '600',
    fontSize: 14,
    color: '#374151',
    letterSpacing: 0.5,
  },
  nameHeader: {
    flex: 1.2,
    textAlign: 'left',
  },
  contactHeader: {
    flex: 1,
    textAlign: 'left',
  },
  emailHeader: {
    flex: 1.2,
    textAlign: 'left',
  },
  addressHeader: {
    flex: 1.3,
    textAlign: 'left',
  },
  actionsHeader: {
    flex: 1.2,
    textAlign: 'center',
  },
  nameCell: {
    flex: 1.2,
    textAlign: 'left',
  },
  contactCell: {
    flex: 1,
    textAlign: 'left',
  },
  emailCell: {
    flex: 1.2,
    textAlign: 'left',
  },
  addressCell: {
    flex: 1.3,
    textAlign: 'left',
  },
  cell: {
    fontSize: 13,
    color: '#6B7280',
    paddingLeft: 0,
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
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '60%',
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
  fieldLabel: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontWeight: 'bold',
  },
  drawerInput: {
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
  drawerButtons: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  drawerCancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  drawerCancelText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  drawerSaveButton: {
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
  drawerSaveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  formColumn: {
    flex: 1,
  },

});