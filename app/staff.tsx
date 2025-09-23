import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Modal, Animated, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import SearchableDropdown from '@/components/SearchableDropdown';
import { getStaff, addStaff, deleteStaff, updateStaff, registerUser } from '../lib/firebaseService';
import { generateSecurePassword } from '../lib/emailService';
import { sendStaffCredentialsViaEmailJS } from '../lib/freeEmailService';
import { useTenant } from '../contexts/TenantContext';

export default function StaffScreen() {
  const { userEmail } = useTenant();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadStaff();
  }, []);
  
  const loadStaff = async () => {
    try {
      const staffData = await getStaff(userEmail);
      setStaff(staffData);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [addSlideAnim] = useState(new Animated.Value(-350));
  const [newStaff, setNewStaff] = useState({
    surname: '',
    firstname: '',
    middlename: '',
    contact: '',
    email: '',
    createAccount: false,
    password: '',
    role: 'staff'
  });
  
  const [staffList, setStaffList] = useState([]);
  
  useEffect(() => {
    setStaffList(staff);
  }, [staff]);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editSlideAnim] = useState(new Animated.Value(-350));
  const [editStaffData, setEditStaffData] = useState({});
  
  const filteredStaff = staffList.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStaff = filteredStaff.slice(startIndex, endIndex);
  
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
  
  const dropdownOptions = [10, 20, 50, 100];
  
  useEffect(() => {
    if (showEditDrawer) {
      editSlideAnim.setValue(-350);
      Animated.timing(editSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showEditDrawer]);
  
  useEffect(() => {
    if (showAddDrawer) {
      addSlideAnim.setValue(-350);
      Animated.timing(addSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showAddDrawer]);
  
  const handleAddStaff = async () => {
    // Validation
    if (!newStaff.firstname.trim() || !newStaff.surname.trim()) {
      Alert.alert('Error', 'First name and surname are required');
      return;
    }
    if (!newStaff.contact.trim()) {
      Alert.alert('Error', 'Contact number is required');
      return;
    }
    if (!newStaff.email.trim()) {
      Alert.alert('Error', 'Email address is required');
      return;
    }
    if (newStaff.createAccount && !newStaff.password.trim()) {
      Alert.alert('Error', 'Password is required when creating an account');
      return;
    }
    
    try {
      const fullName = `${newStaff.firstname} ${newStaff.surname}`;
      
      const staffMember = {
        name: fullName,
        phone: newStaff.contact,
        email: newStaff.email,
        role: 'receptionist',
        permissions: {
          appointments: { create: true, read: true, update: true, delete: false },
          customers: { create: true, read: true, update: true, delete: false },
          pets: { create: true, read: true, update: true, delete: false },
          veterinarians: { create: false, read: true, update: false, delete: false },
          medicalRecords: { create: false, read: true, update: false, delete: false }
        },
        hasAccount: newStaff.createAccount,
        createdBy: userEmail,
        createdAt: new Date()
      };
      
      // Create Firebase Auth account if requested
      if (newStaff.createAccount && newStaff.email && newStaff.password) {
        try {
          await registerUser(newStaff.email, newStaff.password);
          
          // Send credentials via email
          const emailResult = await sendStaffCredentialsViaEmailJS(
            newStaff.email,
            newStaff.password,
            fullName
          );
          
          if (emailResult.success) {
            Alert.alert('Success', `Staff account created and credentials sent to ${newStaff.email}`);
          } else {
            Alert.alert('Account Created', `Staff account created. Please share these credentials manually:\n\nEmail: ${newStaff.email}\nPassword: ${newStaff.password}`);
          }
        } catch (authError) {
          console.error('Auth error:', authError);
          Alert.alert('Error', 'Failed to create user account. Please try again.');
          return;
        }
      }
      
      const savedStaff = await addStaff(staffMember, userEmail);
      setStaff([...staff, savedStaff]);
      setStaffList([...staffList, savedStaff]);
      
      if (!newStaff.createAccount) {
        Alert.alert('Success', 'Staff member added successfully!');
      }
      
      setNewStaff({ 
        surname: '', 
        firstname: '', 
        middlename: '', 
        contact: '', 
        email: '', 
        createAccount: false, 
        password: '', 
        role: 'staff' 
      });
      setShowAddDrawer(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add staff member');
    }
  };
  
  const handleDeleteStaff = async (staffId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this staff member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStaff(staffId, userEmail);
              const updatedStaff = staff.filter(s => s.id !== staffId);
              setStaff(updatedStaff);
              setStaffList(updatedStaff);
              setSelectedStaff(null);
              Alert.alert('Success', 'Staff member deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete staff member');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Staff</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setShowAddDrawer(true)}
          >
            <Image source={require('@/assets/ic_round-plus.png')} style={styles.addIcon} />
            <Text style={styles.addButtonText}>Add Staff</Text>
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search staff..."
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
        {!selectedStaff && (
        <View style={styles.tableContainer}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCellName}>Name</Text>
              <Text style={styles.headerCell}>Contact</Text>
              <Text style={styles.headerCell}>Email</Text>
              <Text style={styles.headerCell}>Account</Text>
            </View>
            {currentStaff.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No staff members found</Text>
              </View>
            ) : itemsPerPage >= 20 ? (
              <ScrollView style={styles.tableBody}>
                {currentStaff.map((member) => (
                  <TouchableOpacity key={member.id} style={styles.tableRow} onPress={() => setSelectedStaff(member)}>
                    <Text style={styles.cellName} numberOfLines={1}>{member.name}</Text>
                    <Text style={styles.cell} numberOfLines={1}>{member.phone}</Text>
                    <Text style={styles.cell} numberOfLines={1}>{member.email}</Text>
                    <Text style={styles.cell} numberOfLines={1}>{member.hasAccount ? 'Yes' : 'No'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              currentStaff.map((member) => (
                <TouchableOpacity key={member.id} style={styles.tableRow} onPress={() => setSelectedStaff(member)}>
                  <Text style={styles.cellName} numberOfLines={1}>{member.name}</Text>
                  <Text style={styles.cell} numberOfLines={1}>{member.phone}</Text>
                  <Text style={styles.cell} numberOfLines={1}>{member.email}</Text>
                  <Text style={styles.cell} numberOfLines={1}>{member.hasAccount ? 'Yes' : 'No'}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
          
          <View style={styles.pagination}>
            <View style={styles.paginationControls}>
              <Text style={styles.paginationLabel}>Show:</Text>
              <SearchableDropdown
                options={dropdownOptions.map(option => ({
                  id: option,
                  label: option.toString(),
                  value: option
                }))}
                selectedValue={itemsPerPage}
                onSelect={(option) => handleItemsPerPageChange(option.value)}
                style={{ minWidth: 35 }}
                zIndex={1001}
              />
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
        )}
        
        {selectedStaff && (
          <View style={styles.tableContainer}>
            <View style={styles.tableTopRow}>
              <TouchableOpacity style={styles.returnButton} onPress={() => setSelectedStaff(null)}>
                <Text style={styles.returnButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.formDetailTitle}>{selectedStaff.name}</Text>
              <View style={styles.categoryActions}>
                <TouchableOpacity style={styles.editCategoryButton} onPress={() => {
                  setEditStaffData({
                    name: selectedStaff.name,
                    contact: selectedStaff.phone,
                    email: selectedStaff.email
                  });
                  setShowEditDrawer(true);
                }}>
                  <Text style={styles.editCategoryButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteCategoryButton} onPress={() => handleDeleteStaff(selectedStaff?.id)}>
                  <Text style={styles.deleteCategoryButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.detailTable} showsVerticalScrollIndicator={false}>
              <View style={styles.detailTableHeader}>
                <Text style={styles.detailHeaderCell}>Field</Text>
                <Text style={styles.detailHeaderCell}>Value</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Role</Text>
                <Text style={styles.detailCell}>Receptionist</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Permissions</Text>
                <Text style={styles.detailCell}>Appointments, Customers, Pets (View/Edit)</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Contact Number</Text>
                <Text style={styles.detailCell}>{selectedStaff.phone || 'Not Available'}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Email Address</Text>
                <Text style={styles.detailCell}>{selectedStaff.email || 'Not Available'}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Has Login Account</Text>
                <Text style={styles.detailCell}>{selectedStaff.hasAccount ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Date Created</Text>
                <Text style={styles.detailCell}>{selectedStaff.createdAt ? new Date(selectedStaff.createdAt.seconds * 1000).toLocaleDateString() : 'Not Available'}</Text>
              </View>
            </ScrollView>
          </View>
        )}
      </View>
      
      {/* Edit Staff Drawer */}
      {showEditDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: editSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Edit Staff Member</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(editSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowEditDrawer(false));
                }}>
                  <Image source={require('@/assets/Vector (1).png')} style={styles.drawerCloseIcon} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter full name"
                  value={editStaffData.name}
                  onChangeText={(text) => setEditStaffData({...editStaffData, name: text})}
                />
                
                <Text style={styles.fieldLabel}>Contact Number *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter contact number"
                  keyboardType="phone-pad"
                  value={editStaffData.contact}
                  onChangeText={(text) => setEditStaffData({...editStaffData, contact: text})}
                />
                
                <Text style={styles.fieldLabel}>Email Address *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={editStaffData.email}
                  onChangeText={(text) => setEditStaffData({...editStaffData, email: text})}
                />
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  Animated.timing(editSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowEditDrawer(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={async () => {
                  try {
                    await updateStaff(selectedStaff.id, {
                      name: editStaffData.name,
                      phone: editStaffData.contact,
                      email: editStaffData.email
                    }, userEmail);
                    
                    const updatedStaff = staff.map(s => 
                      s.id === selectedStaff.id 
                        ? { ...s, name: editStaffData.name, phone: editStaffData.contact, email: editStaffData.email }
                        : s
                    );
                    setStaff(updatedStaff);
                    setStaffList(updatedStaff);
                    setSelectedStaff({ ...selectedStaff, name: editStaffData.name, phone: editStaffData.contact, email: editStaffData.email });
                    setShowEditDrawer(false);
                    Alert.alert('Success', 'Staff member updated successfully');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to update staff member');
                  }
                }}>
                  <Text style={styles.drawerSaveText}>Update Staff</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
      
      {/* Add Staff Drawer */}
      {showAddDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Staff Member</Text>
                  <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                    Animated.timing(addSlideAnim, {
                      toValue: -350,
                      duration: 200,
                      useNativeDriver: false,
                    }).start(() => setShowAddDrawer(false));
                  }}>
                    <Image source={require('@/assets/Vector (1).png')} style={styles.drawerCloseIcon} />
                  </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                    <Text style={styles.fieldLabel}>Surname *</Text>
                    <TextInput
                      style={styles.drawerInput}
                      placeholder="Enter surname"
                      placeholderTextColor="#ccc"
                      value={newStaff.surname}
                      onChangeText={(text) => setNewStaff({...newStaff, surname: text})}
                    />
                    
                    <Text style={styles.fieldLabel}>First Name *</Text>
                    <TextInput
                      style={styles.drawerInput}
                      placeholder="Enter first name"
                      value={newStaff.firstname}
                      onChangeText={(text) => setNewStaff({...newStaff, firstname: text})}
                    />
                    
                    <Text style={styles.fieldLabel}>Middle Name</Text>
                    <TextInput
                      style={styles.drawerInput}
                      placeholder="Enter middle name (optional)"
                      value={newStaff.middlename}
                      onChangeText={(text) => setNewStaff({...newStaff, middlename: text})}
                    />
                    
                    <Text style={styles.fieldLabel}>Contact Number *</Text>
                    <TextInput
                      style={styles.drawerInput}
                      placeholder="Enter contact number"
                      keyboardType="phone-pad"
                      value={newStaff.contact}
                      onChangeText={(text) => setNewStaff({...newStaff, contact: text})}
                    />
                    
                    <Text style={styles.fieldLabel}>Email Address *</Text>
                    <TextInput
                      style={styles.drawerInput}
                      placeholder="Enter email address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={newStaff.email}
                      onChangeText={(text) => setNewStaff({...newStaff, email: text})}
                    />
                    
                    <View style={styles.accountSection}>
                      <TouchableOpacity 
                        style={styles.accountToggle}
                        onPress={() => setNewStaff({...newStaff, createAccount: !newStaff.createAccount, password: newStaff.createAccount ? '' : generateSecurePassword()})}
                      >
                        <Text style={styles.accountToggleText}>
                          {newStaff.createAccount ? '✓' : '○'} Create Login Account
                        </Text>
                      </TouchableOpacity>
                      
                      {newStaff.createAccount && (
                        <View style={styles.passwordSection}>
                          <Text style={styles.fieldLabel}>Password *</Text>
                          <View style={styles.passwordRow}>
                            <View style={styles.passwordInputContainer}>
                              <TextInput
                                style={styles.drawerInput}
                                placeholder="Generated password"
                                value={newStaff.password}
                                onChangeText={(text) => setNewStaff({...newStaff, password: text})}
                                secureTextEntry={false}
                              />
                            </View>
                            <TouchableOpacity 
                              style={styles.generatePasswordButton}
                              onPress={() => setNewStaff({...newStaff, password: generateSecurePassword()})}
                            >
                              <Text style={styles.generatePasswordText}>Generate</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.accountNote}>
                            Account credentials will be automatically sent to the provided email address. The staff member will be able to log in to the system using these credentials.
                          </Text>
                        </View>
                      )}
                    </View>
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                  <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                    Animated.timing(addSlideAnim, {
                      toValue: -350,
                      duration: 200,
                      useNativeDriver: false,
                    }).start(() => setShowAddDrawer(false));
                  }}>
                    <Text style={styles.drawerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.drawerSaveButton} onPress={handleAddStaff}>
                    <Text style={styles.drawerSaveText}>Add Staff Member</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23C062',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
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
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  headerCellName: {
    flex: 2,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  cell: {
    flex: 1,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
  },
  cellName: {
    flex: 2,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
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
  tableBody: {
    flex: 1,
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
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
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
  formDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
    flex: 1,
    textAlign: 'center',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editCategoryButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  editCategoryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteCategoryButton: {
    backgroundColor: '#dc3545',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  deleteCategoryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  detailTable: {
    backgroundColor: '#fff',
  },
  detailTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  detailTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  detailCell: {
    flex: 1,
    fontSize: 12,
    color: '#555',
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
  drawerCloseIcon: {
    width: 16,
    height: 16,
    tintColor: '#800000',
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
  accountSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  accountToggle: {
    marginBottom: 15,
  },
  accountToggleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  passwordSection: {
    marginTop: 10,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  passwordInputContainer: {
    flex: 1,
  },
  generatePasswordButton: {
    backgroundColor: '#28a745',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 0,
  },
  generatePasswordText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  accountNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
    lineHeight: 16,
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
});