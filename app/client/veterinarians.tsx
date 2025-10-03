import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Modal, Animated, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import SearchableDropdown from '@/components/SearchableDropdown';
import { getVeterinarians, addVeterinarian, deleteVeterinarian, updateVeterinarian } from '../../lib/services/firebaseService';
import { generateSecurePassword } from '../../lib/utils/emailService';
import { sendStaffCredentialsViaEmailJS } from '../../lib/utils/freeEmailService';
import { registerUser } from '../../lib/services/firebaseService';
import { useTenant } from '../../contexts/TenantContext';

export default function VeterinariansScreen() {
  const { userEmail } = useTenant();
  const [veterinarians, setVeterinarians] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadVeterinarians();
  }, []);
  
  const loadVeterinarians = async () => {
    try {
      const allData = await getVeterinarians(userEmail);
      const vetsData = allData.filter(item => item.role !== 'staff');
      setVeterinarians(vetsData);
    } catch (error) {
      console.error('Error loading veterinarians:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [addSlideAnim] = useState(new Animated.Value(-350));
  const [newVeterinarian, setNewVeterinarian] = useState({
    surname: '',
    firstname: '',
    middlename: '',
    specialty: '',
    contact: '',
    email: '',
    license: ''
  });
  

  const [veterinarianList, setVeterinarianList] = useState([]);
  
  useEffect(() => {
    setVeterinarianList(veterinarians);
  }, [veterinarians]);
  const [selectedVeterinarian, setSelectedVeterinarian] = useState(null);
  const [showEditVetDrawer, setShowEditVetDrawer] = useState(false);
  const [editSlideAnim] = useState(new Animated.Value(-350));
  const [editVetData, setEditVetData] = useState({});
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
  const [showAdminDetails, setShowAdminDetails] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const [lastPasswordGenerated, setLastPasswordGenerated] = useState(null);

  
  const specializations = [
    'General Practice', 'Surgery', 'Internal Medicine', 'Dermatology',
    'Cardiology', 'Oncology', 'Orthopedics', 'Emergency Medicine',
    'Exotic Animals', 'Dentistry'
  ];
  
  const adminDetails = {
    'dr.brown@vetclinic.com': { username: 'dr.brown', role: 'Senior Veterinarian', lastLogin: 'Today 9:15 AM', permissions: 'Full Access', status: 'Active' },
    'dr.smith@vetclinic.com': { username: 'dr.smith', role: 'Veterinarian', lastLogin: 'Yesterday 5:30 PM', permissions: 'Standard Access', status: 'Active' },
    'dr.johnson@vetclinic.com': { username: 'dr.johnson', role: 'Emergency Specialist', lastLogin: 'Today 7:45 AM', permissions: 'Emergency Access', status: 'Active' },
    'dr.williams@vetclinic.com': { username: 'dr.williams', role: 'Dermatologist', lastLogin: '2 days ago', permissions: 'Standard Access', status: 'Active' },
    'dr.davis@vetclinic.com': { username: 'dr.davis', role: 'Orthopedic Specialist', lastLogin: 'Today 8:20 AM', permissions: 'Standard Access', status: 'Active' },
    'dr.miller@vetclinic.com': { username: 'dr.miller', role: 'Cardiologist', lastLogin: 'Yesterday 3:15 PM', permissions: 'Standard Access', status: 'Active' },
    'dr.wilson@vetclinic.com': { username: 'dr.wilson', role: 'Oncologist', lastLogin: 'Today 10:30 AM', permissions: 'Standard Access', status: 'Active' },
    'dr.moore@vetclinic.com': { username: 'dr.moore', role: 'Neurologist', lastLogin: '3 days ago', permissions: 'Standard Access', status: 'Inactive' }
  };
  
  const filteredVeterinarians = veterinarianList.filter(veterinarian =>
    veterinarian.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredVeterinarians.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVeterinarians = filteredVeterinarians.slice(startIndex, endIndex);
  
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
    setShowDropdown(false);
  };
  
  const dropdownOptions = [10, 20, 50, 100];
  
  useEffect(() => {
    if (showEditVetDrawer) {
      editSlideAnim.setValue(-350);
      Animated.timing(editSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showEditVetDrawer]);
  
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
  
  const handleAddVeterinarian = async () => {
    if (!newVeterinarian.surname || !newVeterinarian.firstname || !newVeterinarian.specialty || !newVeterinarian.contact || !newVeterinarian.email || !newVeterinarian.license) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    try {
      const fullName = `Dr. ${newVeterinarian.firstname} ${newVeterinarian.surname}`;
      const generatedPassword = generateSecurePassword();
      
      const veterinarian = {
        name: fullName,
        specialization: newVeterinarian.specialty,
        phone: newVeterinarian.contact,
        email: newVeterinarian.email,
        license: newVeterinarian.license,
        role: 'veterinarian',
        hasAccount: true,
        createdBy: userEmail,
        createdAt: new Date()
      };
      
      // Save to database first
      const savedVeterinarian = await addVeterinarian(veterinarian, userEmail);
      
      // Create Firebase Auth account
      try {
        await registerUser(newVeterinarian.email, generatedPassword);
        console.log('Firebase Auth account created successfully');
      } catch (authError) {
        console.error('Auth error:', authError);
        // Continue even if auth fails
      }
      
      // Create tenant entry for login authentication
      try {
        const { useTenant } = require('../../contexts/TenantContext');
        const { addDoc, collection } = require('firebase/firestore');
        const { db } = require('../../lib/config/firebaseConfig');
        
        await addDoc(collection(db, 'tenants'), {
          email: newVeterinarian.email,
          password: generatedPassword,
          role: 'veterinarian',
          status: 'active',
          tenantId: userEmail?.match(/^([^@]+)@/)?.[1] || 'default',
          clinicName: 'Veterinary Clinic',
          createdAt: new Date(),
          createdBy: userEmail
        });
        console.log('Tenant entry created for veterinarian login');
      } catch (tenantError) {
        console.error('Error creating tenant entry:', tenantError);
        // Continue even if tenant creation fails
      }
      
      // Send credentials via EmailJS
      try {
        const emailResult = await sendStaffCredentialsViaEmailJS(
          newVeterinarian.email,
          generatedPassword,
          fullName
        );
        
        if (emailResult.success) {
          Alert.alert('Success', `Veterinarian added successfully!\n\nCredentials sent to: ${newVeterinarian.email}\n\nLogin Details:\nEmail: ${newVeterinarian.email}\nPassword: ${generatedPassword}`);
        } else {
          Alert.alert('Success', `Veterinarian added successfully!\n\nEmail sending failed. Please share these credentials manually:\n\nEmail: ${newVeterinarian.email}\nPassword: ${generatedPassword}`);
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
        Alert.alert('Success', `Veterinarian added successfully!\n\nEmail sending failed. Please share these credentials manually:\n\nEmail: ${newVeterinarian.email}\nPassword: ${generatedPassword}`);
      }
      
      // Update local state
      setVeterinarians([...veterinarians, savedVeterinarian]);
      setVeterinarianList([...veterinarianList, savedVeterinarian]);
      
      // Reset form and close drawer
      setNewVeterinarian({ 
        surname: '', 
        firstname: '', 
        middlename: '', 
        specialty: '', 
        contact: '', 
        email: '', 
        license: ''
      });
      
      // Close drawer with animation
      Animated.timing(addSlideAnim, {
        toValue: -350,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setShowAddDrawer(false));
      
    } catch (error) {
      console.error('Error adding veterinarian:', error);
      Alert.alert('Error', `Failed to add veterinarian: ${error.message}`);
    }
  };
  
  const handleDeleteVeterinarian = async (vetId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this veterinarian?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVeterinarian(vetId, userEmail);
              const updatedVets = veterinarians.filter(v => v.id !== vetId);
              setVeterinarians(updatedVets);
              setVeterinarianList(updatedVets);
              setSelectedVeterinarian(null);
              Alert.alert('Success', 'Veterinarian deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete veterinarian');
            }
          }
        }
      ]
    );
  };
  


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Veterinarians</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.vetAddButton} 
            onPress={() => setShowAddDrawer(true)}
          >
            <Image source={require('@/assets/ic_round-plus.png')} style={styles.addIcon} />
            <Text style={styles.vetAddButtonText}>Add Veterinarian</Text>
          </TouchableOpacity>
          <View style={styles.vetSearchContainer}>
            <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
            <TextInput 
              style={styles.vetSearchInput}
              placeholder="Search veterinarians..."
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
        {!selectedVeterinarian && (
        <View style={styles.tableContainer}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCellName}>Name</Text>
              <Text style={styles.headerCell}>Specialty</Text>
              <Text style={styles.headerCell}>Contact</Text>
              <Text style={styles.headerCell}>Email</Text>
            </View>
            {currentVeterinarians.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No veterinarians found</Text>
              </View>
            ) : itemsPerPage >= 20 ? (
              <ScrollView style={styles.tableBody}>
                {currentVeterinarians.map((veterinarian) => (
                  <TouchableOpacity key={veterinarian.id} style={styles.tableRow} onPress={() => setSelectedVeterinarian(veterinarian)}>
                    <Text style={styles.cellName} numberOfLines={1}>{veterinarian.name}</Text>
                    <Text style={styles.cell} numberOfLines={1}>{veterinarian.specialization}</Text>
                    <Text style={styles.cell} numberOfLines={1}>{veterinarian.phone}</Text>
                    <Text style={styles.cell} numberOfLines={1}>{veterinarian.email}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              currentVeterinarians.map((veterinarian) => (
                <TouchableOpacity key={veterinarian.id} style={styles.tableRow} onPress={() => setSelectedVeterinarian(veterinarian)}>
                  <Text style={styles.cellName} numberOfLines={1}>{veterinarian.name}</Text>
                  <Text style={styles.cell} numberOfLines={1}>{veterinarian.specialization}</Text>
                  <Text style={styles.cell} numberOfLines={1}>{veterinarian.phone}</Text>
                  <Text style={styles.cell} numberOfLines={1}>{veterinarian.email}</Text>
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
        
        {selectedVeterinarian && (
          <View style={styles.tableContainer}>
            <View style={styles.tableTopRow}>
              <TouchableOpacity style={styles.returnButton} onPress={() => setSelectedVeterinarian(null)}>
                <Text style={styles.returnButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.formDetailTitle}>{selectedVeterinarian.name}</Text>
              <View style={styles.categoryActions}>
                <TouchableOpacity style={styles.editCategoryButton} onPress={() => {
                  setEditVetData({
                    name: selectedVeterinarian.name,
                    specialty: selectedVeterinarian.specialization,
                    contact: selectedVeterinarian.phone,
                    email: selectedVeterinarian.email,
                    license: selectedVeterinarian.license || ''
                  });
                  setShowEditVetDrawer(true);
                }}>
                  <Text style={styles.editCategoryButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteCategoryButton} onPress={() => handleDeleteVeterinarian(selectedVeterinarian?.id)}>
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
                <Text style={styles.detailCell}>Specialty</Text>
                <Text style={styles.detailCell}>{selectedVeterinarian.specialization || 'Not Available'}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>License Number</Text>
                <Text style={styles.detailCell}>{selectedVeterinarian.license || 'Not Available'}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Contact Number</Text>
                <Text style={styles.detailCell}>{selectedVeterinarian.phone || 'Not Available'}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Email Address</Text>
                <Text style={styles.detailCell}>{selectedVeterinarian.email || 'Not Available'}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Date Created</Text>
                <Text style={styles.detailCell}>{selectedVeterinarian.createdAt ? new Date(selectedVeterinarian.createdAt.seconds * 1000).toLocaleDateString() : 'Not Available'}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Actions</Text>
                <View style={styles.detailCell}>
                  <TouchableOpacity 
                    style={[styles.generatePasswordButton, isGeneratingPassword && styles.disabledButton]} 
                    disabled={isGeneratingPassword}
                    onPress={async () => {
                      // Prevent spamming - check if password was generated in last 30 seconds
                      const now = new Date().getTime();
                      if (lastPasswordGenerated && (now - lastPasswordGenerated) < 30000) {
                        Alert.alert('Please Wait', 'Please wait at least 30 seconds before generating a new password again.');
                        return;
                      }
                      
                      setIsGeneratingPassword(true);
                      const newPassword = generateSecurePassword();
                      
                      try {
                        // Update tenant password in database
                        const { query, where, getDocs, updateDoc, doc, collection } = require('firebase/firestore');
                        const { db } = require('../../lib/config/firebaseConfig');
                        
                        const tenantQuery = query(
                          collection(db, 'tenants'),
                          where('email', '==', selectedVeterinarian.email)
                        );
                        const tenantSnapshot = await getDocs(tenantQuery);
                        
                        if (!tenantSnapshot.empty) {
                          const tenantDoc = tenantSnapshot.docs[0];
                          await updateDoc(doc(db, 'tenants', tenantDoc.id), {
                            password: newPassword,
                            updatedAt: new Date()
                          });
                          console.log('Tenant password updated successfully');
                        }
                        
                        // Send new credentials via EmailJS
                        const emailResult = await sendStaffCredentialsViaEmailJS(
                          selectedVeterinarian.email,
                          newPassword,
                          selectedVeterinarian.name
                        );
                        
                        setLastPasswordGenerated(now);
                        
                        if (emailResult.success) {
                          Alert.alert('✅ Password Generated Successfully!', `New password has been generated and sent to ${selectedVeterinarian.email}\n\n🔑 New Login Details:\nEmail: ${selectedVeterinarian.email}\nPassword: ${newPassword}\n\n📧 The veterinarian will receive an email with the new credentials.`);
                        } else {
                          Alert.alert('⚠️ Password Generated', `New password generated successfully!\n\n📧 Email sending failed. Please share these credentials manually:\n\nEmail: ${selectedVeterinarian.email}\nPassword: ${newPassword}`);
                        }
                      } catch (error) {
                        console.error('Error generating new password:', error);
                        Alert.alert('⚠️ Password Generated', `New password generated successfully!\n\n📧 Email sending failed. Please share these credentials manually:\n\nEmail: ${selectedVeterinarian.email}\nPassword: ${newPassword}`);
                      } finally {
                        setIsGeneratingPassword(false);
                      }
                    }}>
                    <Text style={styles.generatePasswordText}>
                      {isGeneratingPassword ? 'Generating...' : 'Generate New Password'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </View>
      
      {/* Add Veterinarian Drawer */}
      {showAddDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Veterinarian</Text>
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
                    value={newVeterinarian.surname}
                    onChangeText={(text) => setNewVeterinarian({...newVeterinarian, surname: text})}
                  />
                  
                  <Text style={styles.fieldLabel}>First Name *</Text>
                  <TextInput
                    style={styles.drawerInput}
                    placeholder="Enter first name"
                    value={newVeterinarian.firstname}
                    onChangeText={(text) => setNewVeterinarian({...newVeterinarian, firstname: text})}
                  />
                  
                  <Text style={styles.fieldLabel}>Middle Name</Text>
                  <TextInput
                    style={styles.drawerInput}
                    placeholder="Enter middle name (optional)"
                    value={newVeterinarian.middlename}
                    onChangeText={(text) => setNewVeterinarian({...newVeterinarian, middlename: text})}
                  />
                  
                  <Text style={styles.fieldLabel}>Specialty *</Text>
                  <TextInput
                    style={styles.drawerInput}
                    placeholder="Enter specialty"
                    value={newVeterinarian.specialty}
                    onChangeText={(text) => setNewVeterinarian({...newVeterinarian, specialty: text})}
                  />
                  
                  <Text style={styles.fieldLabel}>Contact Number *</Text>
                  <TextInput
                    style={styles.drawerInput}
                    placeholder="Enter contact number"
                    keyboardType="phone-pad"
                    value={newVeterinarian.contact}
                    onChangeText={(text) => setNewVeterinarian({...newVeterinarian, contact: text})}
                  />
                  
                  <Text style={styles.fieldLabel}>Email Address *</Text>
                  <TextInput
                    style={styles.drawerInput}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={newVeterinarian.email}
                    onChangeText={(text) => setNewVeterinarian({...newVeterinarian, email: text})}
                  />
                  
                  <Text style={styles.fieldLabel}>License Number *</Text>
                  <TextInput
                    style={styles.drawerInput}
                    placeholder="Enter license number"
                    value={newVeterinarian.license}
                    onChangeText={(text) => setNewVeterinarian({...newVeterinarian, license: text})}
                  />
                  
                  <View style={styles.accountSection}>
                    <Text style={styles.accountNote}>
                      A login account will be automatically created for this veterinarian. Login credentials will be sent to the provided email address.
                    </Text>
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
                <TouchableOpacity style={styles.drawerSaveButton} onPress={handleAddVeterinarian}>
                  <Text style={styles.drawerSaveText}>Add Veterinarian</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
      

      
      {/* Edit Veterinarian Drawer */}
      {showEditVetDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: editSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Edit: {selectedVeterinarian?.name}</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(editSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowEditVetDrawer(false));
                }}>
                  <Image source={require('@/assets/Vector (1).png')} style={styles.drawerCloseIcon} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter full name"
                  value={editVetData.name}
                  onChangeText={(text) => setEditVetData({...editVetData, name: text})}
                />
                
                <Text style={styles.fieldLabel}>Specialty *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter specialty"
                  value={editVetData.specialty}
                  onChangeText={(text) => setEditVetData({...editVetData, specialty: text})}
                />
                
                <Text style={styles.fieldLabel}>Contact Number *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter contact number"
                  keyboardType="phone-pad"
                  value={editVetData.contact}
                  onChangeText={(text) => setEditVetData({...editVetData, contact: text})}
                />
                
                <Text style={styles.fieldLabel}>Email Address *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={editVetData.email}
                  onChangeText={(text) => setEditVetData({...editVetData, email: text})}
                />
                
                <Text style={styles.fieldLabel}>License Number</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter license number"
                  value={editVetData.license}
                  onChangeText={(text) => setEditVetData({...editVetData, license: text})}
                />
                

              </ScrollView>
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  Animated.timing(editSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowEditVetDrawer(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={async () => {
                  if (editVetData.name && editVetData.specialty && editVetData.contact && editVetData.email) {
                    try {
                      const updateData = {
                        name: editVetData.name,
                        specialization: editVetData.specialty,
                        phone: editVetData.contact,
                        email: editVetData.email,
                        license: editVetData.license
                      };
                      
                      await updateVeterinarian(selectedVeterinarian.id, updateData, userEmail);
                      
                      // Update local state
                      const updatedVets = veterinarians.map(vet => 
                        vet.id === selectedVeterinarian.id ? { ...vet, ...updateData } : vet
                      );
                      setVeterinarians(updatedVets);
                      setVeterinarianList(updatedVets);
                      setSelectedVeterinarian({ ...selectedVeterinarian, ...updateData });
                      
                      Alert.alert('Success', 'Veterinarian updated successfully!');
                      
                      Animated.timing(editSlideAnim, {
                        toValue: -350,
                        duration: 200,
                        useNativeDriver: false,
                      }).start(() => setShowEditVetDrawer(false));
                    } catch (error) {
                      console.error('Error updating veterinarian:', error);
                      Alert.alert('Error', 'Failed to update veterinarian');
                    }
                  }
                }}>
                  <Text style={styles.drawerSaveText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
      
      {/* Admin Details Modal */}
      {showAdminDetails && selectedAdmin && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.detailModalOverlay}>
            <View style={styles.adminModalContent}>
              <View style={styles.adminModalHeader}>
                <TouchableOpacity style={styles.returnButton} onPress={() => setShowAdminDetails(false)}>
                  <Text style={styles.returnButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.adminModalTitle}>Admin Details</Text>
              </View>
              <View style={styles.adminDetailContainer}>
                <View style={styles.adminDetailRow}>
                  <Text style={styles.adminDetailLabel}>Name:</Text>
                  <Text style={styles.adminDetailValue}>{selectedAdmin.name}</Text>
                </View>
                <View style={styles.adminDetailRow}>
                  <Text style={styles.adminDetailLabel}>Username:</Text>
                  <Text style={styles.adminDetailValue}>{selectedAdmin.username}</Text>
                </View>
                <View style={styles.adminDetailRow}>
                  <Text style={styles.adminDetailLabel}>Email:</Text>
                  <Text style={styles.adminDetailValue}>{selectedAdmin.email}</Text>
                </View>
                <View style={styles.adminDetailRow}>
                  <Text style={styles.adminDetailLabel}>Role:</Text>
                  <Text style={styles.adminDetailValue}>{selectedAdmin.role}</Text>
                </View>
                <View style={styles.adminDetailRow}>
                  <Text style={styles.adminDetailLabel}>Permissions:</Text>
                  <Text style={styles.adminDetailValue}>{selectedAdmin.permissions}</Text>
                </View>
                <View style={styles.adminDetailRow}>
                  <Text style={styles.adminDetailLabel}>Status:</Text>
                  <Text style={[styles.adminDetailValue, { color: selectedAdmin.status === 'Active' ? '#23C062' : '#dc3545' }]}>{selectedAdmin.status}</Text>
                </View>
                <View style={styles.adminDetailRow}>
                  <Text style={styles.adminDetailLabel}>Last Login:</Text>
                  <Text style={styles.adminDetailValue}>{selectedAdmin.lastLogin}</Text>
                </View>
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
  vetAddButton: {
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
  vetAddButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  vetSearchContainer: {
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
  vetSearchInput: {
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
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cellName: {
    flex: 2,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
    zIndex: 1001,
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
    fontSize: 6,
    color: '#666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 0,
    left: 40,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    zIndex: 1002,
    minWidth: 35,
    elevation: 10,
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
  tableBody: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 250,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '70%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#800000',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  modalForm: {
    padding: 20,
    maxHeight: 300,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  halfInput: {
    width: '48%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  vetCancelButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  vetCancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#23C062',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  detailTableContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
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
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  specialtyDropdownContainer: {
    position: 'relative',
    zIndex: 1001,
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
  drawerDropdownMenu: {
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
  },
  drawerDropdownOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  drawerDropdownOptionText: {
    fontSize: 12,
    color: '#333',
  },
  imageImportButton: {
    borderWidth: 2,
    borderColor: '#007BFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#f8f9ff',
    marginBottom: 20,
  },
  imageImportText: {
    fontSize: 12,
    color: '#007BFF',
    fontWeight: '500',
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'center',
  },
  staffAccountSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  staffAccountToggle: {
    marginBottom: 15,
  },
  staffAccountToggleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007BFF',
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
  staffAccountNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
    lineHeight: 16,
  },

  adminModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '60%',
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  adminModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  adminModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#800000',
    marginLeft: 15,
  },
  adminDetailContainer: {
    padding: 20,
  },
  adminDetailRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  adminDetailLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  adminDetailValue: {
    flex: 2,
    fontSize: 14,
    color: '#555',
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: 15,
    marginTop: 20,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  activeRoleButton: {
    borderColor: '#800000',
    backgroundColor: '#800000',
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  activeRoleButtonText: {
    color: '#fff',
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
  actionButtonsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  generatePasswordButton: {
    backgroundColor: '#007BFF',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    alignSelf: 'flex-start',
    minWidth: 150,
  },
  generatePasswordText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
});