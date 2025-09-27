import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Alert, Animated, Image } from 'react-native';
import { getCustomers, addCustomer, deleteCustomer, updateCustomer, getPets, addPet, getMedicalCategories, getMedicalForms, getFormFields, addMedicalRecord, getMedicalRecords } from '@/lib/services/firebaseService';
import { useTenant } from '@/contexts/TenantContext';

export default function CustomersScreen() {
  const { userEmail } = useTenant();
  const [customers, setCustomers] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadCustomers();
  }, []);
  
  const loadCustomers = async () => {
    try {
      const [customersData, petsData, categoriesData, formsData, recordsData] = await Promise.all([
        getCustomers(userEmail),
        getPets(userEmail),
        getMedicalCategories(userEmail),
        getMedicalForms(userEmail),
        getMedicalRecords(userEmail)
      ]);
      setCustomers(customersData);
      setPets(petsData);
      setMedicalCategories(categoriesData);
      setMedicalForms(formsData);
      setMedicalRecords(recordsData);
      console.log('Loaded categories:', categoriesData);
      console.log('Loaded forms:', formsData);
      console.log('Loaded medical records:', recordsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [petSearchTerm, setPetSearchTerm] = useState('');
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [addSlideAnim] = useState(new Animated.Value(-350));
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddPetDrawer, setShowAddPetDrawer] = useState(false);
  const [addPetSlideAnim] = useState(new Animated.Value(-350));
  const [newPet, setNewPet] = useState({
    name: '',
    type: '',
    breed: ''
  });
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customModalType, setCustomModalType] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [petTypes, setPetTypes] = useState(['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster']);
  const [petBreeds, setPetBreeds] = useState(['Labrador', 'Golden Retriever', 'Persian', 'Siamese', 'Bulldog', 'Poodle']);
  const [medicalSearchTerm, setMedicalSearchTerm] = useState('');
  const [showMedicalDrawer, setShowMedicalDrawer] = useState(false);
  const [medicalSlideAnim] = useState(new Animated.Value(-350));
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [medicalCategories, setMedicalCategories] = useState([]);
  const [medicalForms, setMedicalForms] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [formFields, setFormFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [medicalCurrentPage, setMedicalCurrentPage] = useState(1);
  const [medicalItemsPerPage, setMedicalItemsPerPage] = useState(5);
  const [showMedicalDropdown, setShowMedicalDropdown] = useState(false);
  
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
  
  useEffect(() => {
    if (showAddPetDrawer) {
      addPetSlideAnim.setValue(-350);
      Animated.timing(addPetSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showAddPetDrawer]);
  
  useEffect(() => {
    if (showMedicalDrawer) {
      medicalSlideAnim.setValue(-350);
      Animated.timing(medicalSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showMedicalDrawer]);
  const [newCustomer, setNewCustomer] = useState({
    surname: '',
    firstname: '',
    middlename: '',
    contact: '',
    email: '',
    address: ''
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  
  const filteredCustomers = customers.filter(customer => {
    const displayName = customer.name || `${customer.surname || ''} ${customer.firstname || ''} ${customer.middlename || ''}`;
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  
  const handleAddCustomer = async () => {
    if (!newCustomer.surname || !newCustomer.firstname || !newCustomer.contact || !newCustomer.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    try {
      const fullName = newCustomer.middlename 
        ? `${newCustomer.surname}, ${newCustomer.firstname} ${newCustomer.middlename}`
        : `${newCustomer.surname}, ${newCustomer.firstname}`;
      
      const customer = {
        name: fullName,
        surname: newCustomer.surname,
        firstname: newCustomer.firstname,
        middlename: newCustomer.middlename,
        contact: newCustomer.contact,
        email: newCustomer.email,
        address: newCustomer.address,
        city: 'Not specified',
        pets: 0,
        createdBy: userEmail,
        createdAt: editingCustomer ? editingCustomer.createdAt : new Date()
      };
      
      if (editingCustomer) {
        const updatedCustomer = await updateCustomer(editingCustomer.id, customer, userEmail);
        setCustomers(customers.map(c => c.id === editingCustomer.id ? updatedCustomer : c));
        setSelectedCustomer(updatedCustomer);
        Alert.alert('Success', 'Customer updated successfully!');
      } else {
        const savedCustomer = await addCustomer(customer, userEmail);
        setCustomers([...customers, savedCustomer]);
        Alert.alert('Success', 'Customer added successfully!');
      }
      
      setNewCustomer({ 
        surname: '', 
        firstname: '', 
        middlename: '', 
        contact: '', 
        email: '', 
        address: ''
      });
      setEditingCustomer(null);
      
      Animated.timing(addSlideAnim, {
        toValue: -350,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setShowAddDrawer(false));
      
    } catch (error) {
      console.error('Error saving customer:', error);
      Alert.alert('Error', `Failed to save customer: ${error.message}`);
    }
  };
  
  const handleDeleteCustomer = async (customerId) => {
    console.log('=== HANDLE DELETE CUSTOMER ===');
    console.log('Customer ID received:', customerId);
    console.log('User email:', userEmail);
    
    if (!customerId) {
      console.error('No customer ID provided to handleDeleteCustomer');
      Alert.alert('Error', 'Invalid customer ID');
      return;
    }
    
    console.log('Showing confirmation alert...');
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this customer and all their pets?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('Delete cancelled by user')
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            console.log('=== DELETE CONFIRMED ===');
            console.log('Starting deletion process for customer:', customerId);
            
            try {
              // Get pets for this customer before deletion
              const customerPets = pets.filter(pet => pet.customerId === customerId);
              console.log('Found pets to delete:', customerPets.length, 'pets');
              console.log('Pet details:', customerPets);
              
              console.log('Calling deleteCustomer function...');
              // Delete customer and all their pets
              await deleteCustomer(customerId, userEmail);
              console.log('deleteCustomer function completed');
              
              console.log('Reloading customers from Firebase...');
              // Reload data from Firebase to ensure consistency
              await loadCustomers();
              console.log('Data reloaded successfully');
              
              setSelectedCustomer(null);
              console.log('Selected customer cleared');
              
              console.log('=== DELETE PROCESS COMPLETED ===');
              Alert.alert('Success', 'Customer and all pets deleted successfully');
            } catch (error) {
              console.error('=== DELETE ERROR ===');
              console.error('Error details:', error);
              console.error('Error message:', error.message);
              console.error('Error stack:', error.stack);
              Alert.alert('Error', `Failed to delete customer: ${error.message}`);
            }
          }
        }
      ]
    );
    console.log('Alert.alert called, waiting for user response...');
  };
  
  const handleAddPet = async () => {
    if (!newPet.name || !newPet.type || !newPet.breed) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    try {
      const pet = {
        name: newPet.name,
        type: newPet.type,
        breed: newPet.breed,
        age: 'N/A',
        customerId: selectedCustomer.id,
        owner: selectedCustomer.name,
        createdBy: userEmail,
        createdAt: new Date()
      };
      
      const savedPet = await addPet(pet, userEmail);
      setPets([...pets, savedPet]);
      
      setNewPet({ name: '', type: '', breed: '' });
      
      Animated.timing(addPetSlideAnim, {
        toValue: -350,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setShowAddPetDrawer(false));
      Alert.alert('Success', 'Pet added successfully!');
      
    } catch (error) {
      console.error('Error adding pet:', error);
      Alert.alert('Error', `Failed to add pet: ${error.message}`);
    }
  };

  if (selectedPet) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.detailScrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Customers</Text>
          </View>
          <View style={styles.content}>
            <View style={styles.detailTableContainer}>
              <View style={styles.tableTopRow}>
                <View style={styles.leftSection}>
                  <TouchableOpacity style={styles.returnButton} onPress={() => setSelectedPet(null)}>
                    <Text style={styles.returnButtonText}>←</Text>
                  </TouchableOpacity>
                  <Text style={styles.formDetailTitle}>Pet Details</Text>
                </View>
              </View>
              <View style={styles.detailTable}>
                <View style={styles.detailTableHeader}>
                  <Text style={styles.detailHeaderCell}>Field</Text>
                  <Text style={styles.detailHeaderCell}>Value</Text>
                </View>
                <ScrollView style={styles.detailTableBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailCell}>Pet Name</Text>
                    <Text style={styles.detailCell}>{selectedPet.name || 'Not Available'}</Text>
                  </View>
                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailCell}>Type</Text>
                    <Text style={styles.detailCell}>{selectedPet.type || 'Not Available'}</Text>
                  </View>
                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailCell}>Breed</Text>
                    <Text style={styles.detailCell}>{selectedPet.breed || 'Not Available'}</Text>
                  </View>
                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailCell}>Owner</Text>
                    <Text style={styles.detailCell}>{selectedPet.owner || 'Not Available'}</Text>
                  </View>
                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailCell}>Date Added</Text>
                    <Text style={styles.detailCell}>{selectedPet.createdAt ? new Date(selectedPet.createdAt.seconds * 1000).toLocaleDateString() : 'Not Available'}</Text>
                  </View>
                </ScrollView>
              </View>
            </View>
            
            <View style={styles.petsActionsHeader}>
              <TouchableOpacity style={styles.addButton} onPress={() => {
                console.log('Add Medical Record button clicked');
                console.log('showMedicalDrawer before:', showMedicalDrawer);
                setShowMedicalDrawer(true);
                console.log('showMedicalDrawer after:', true);
              }}>
                <Text style={styles.addButtonText}>+ Add Medical Record</Text>
              </TouchableOpacity>
              <View style={styles.searchContainer}>
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Search medical records..."
                  placeholderTextColor="#999"
                  value={medicalSearchTerm}
                  onChangeText={setMedicalSearchTerm}
                />
              </View>
            </View>
            <View style={styles.petsSection}>
              <View style={styles.petsSectionHeader}>
                <Text style={styles.sectionTitle}>Medical History</Text>
              </View>
              <View style={styles.petsTable}>
                <View style={styles.detailTableHeader}>
                  <Text style={styles.detailHeaderCell}>Date</Text>
                  <Text style={styles.detailHeaderCell}>Category</Text>
                  <Text style={styles.detailHeaderCell}>Template</Text>
                </View>
                {(() => {
                  const filteredRecords = medicalRecords.filter(record => record.petId === selectedPet.id);
                  const totalPages = Math.ceil(filteredRecords.length / medicalItemsPerPage);
                  const startIndex = (medicalCurrentPage - 1) * medicalItemsPerPage;
                  const currentRecords = filteredRecords.slice(startIndex, startIndex + medicalItemsPerPage);
                  
                  return medicalItemsPerPage >= 10 ? (
                    <ScrollView style={styles.detailTableBody} showsVerticalScrollIndicator={false}>
                      {currentRecords.length === 0 ? (
                        <View style={styles.noDataContainer}>
                          <Text style={styles.noDataText}>No medical history found</Text>
                        </View>
                      ) : (
                        currentRecords.map((record) => (
                          <View key={record.id} style={styles.detailTableRow}>
                            <Text style={styles.detailCell}>{record.createdAt ? new Date(record.createdAt.seconds * 1000).toLocaleDateString() : record.date}</Text>
                            <Text style={styles.detailCell}>{record.category}</Text>
                            <Text style={styles.detailCell}>{record.template}</Text>
                          </View>
                        ))
                      )}
                    </ScrollView>
                  ) : (
                    <View style={styles.detailTableBody}>
                      {currentRecords.length === 0 ? (
                        <View style={styles.noDataContainer}>
                          <Text style={styles.noDataText}>No medical history found</Text>
                        </View>
                      ) : (
                        currentRecords.map((record) => (
                          <View key={record.id} style={styles.detailTableRow}>
                            <Text style={styles.detailCell}>{record.createdAt ? new Date(record.createdAt.seconds * 1000).toLocaleDateString() : record.date}</Text>
                            <Text style={styles.detailCell}>{record.category}</Text>
                            <Text style={styles.detailCell}>{record.template}</Text>
                          </View>
                        ))
                      )}
                    </View>
                  );
                })()}
              </View>
              
              <View style={styles.pagination}>
                <View style={styles.paginationControls}>
                  <Text style={styles.paginationLabel}>Show:</Text>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity style={styles.dropdown} onPress={() => setShowMedicalDropdown(!showMedicalDropdown)}>
                      <Text style={styles.dropdownText}>{medicalItemsPerPage}</Text>
                      <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>
                    {showMedicalDropdown && (
                      <View style={styles.dropdownMenu}>
                        {[5, 10, 20].map(option => (
                          <TouchableOpacity 
                            key={option} 
                            style={styles.dropdownOption}
                            onPress={() => {
                              setMedicalItemsPerPage(option);
                              setMedicalCurrentPage(1);
                              setShowMedicalDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{option}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                  <Text style={styles.paginationLabel}>entries</Text>
                  
                  <TouchableOpacity style={styles.pageBtn} onPress={() => setMedicalCurrentPage(Math.max(1, medicalCurrentPage - 1))}>
                    <Text style={styles.pageBtnText}>Prev</Text>
                  </TouchableOpacity>
                  <TextInput 
                    style={styles.pageInput}
                    value={medicalCurrentPage.toString()}
                    keyboardType="numeric"
                    onChangeText={(text) => {
                      const pageNum = parseInt(text);
                      const totalPages = Math.ceil(medicalRecords.filter(record => record.petId === selectedPet.id).length / medicalItemsPerPage);
                      if (pageNum >= 1 && pageNum <= totalPages) {
                        setMedicalCurrentPage(pageNum);
                      }
                    }}
                  />
                  <Text style={styles.pageOf}>of {Math.ceil(medicalRecords.filter(record => record.petId === selectedPet.id).length / medicalItemsPerPage)}</Text>
                  <TouchableOpacity style={styles.pageBtn} onPress={() => {
                    const totalPages = Math.ceil(medicalRecords.filter(record => record.petId === selectedPet.id).length / medicalItemsPerPage);
                    setMedicalCurrentPage(Math.min(totalPages, medicalCurrentPage + 1));
                  }}>
                    <Text style={styles.pageBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Medical Record Drawer */}
        <Modal visible={showMedicalDrawer} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: medicalSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add Medical Record</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  setSelectedCategory('');
                  setSelectedTemplate('');
                  Animated.timing(medicalSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowMedicalDrawer(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Category *</Text>
                <View style={[styles.dropdownContainer, {zIndex: 2000}]}>
                  <TouchableOpacity style={styles.petDropdown} onPress={() => {
                    console.log('Category dropdown clicked');
                    console.log('Medical categories:', medicalCategories);
                    console.log('Current showCategoryDropdown:', showCategoryDropdown);
                    setShowTemplateDropdown(false);
                    setShowCategoryDropdown(!showCategoryDropdown);
                  }}>
                    <Text style={styles.petDropdownText}>{selectedCategory || 'Select category'}</Text>
                    <Text style={styles.petDropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showCategoryDropdown && (
                    <View style={styles.petDropdownMenu}>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {medicalCategories.length === 0 ? (
                          <View style={styles.petDropdownOption}>
                            <Text style={styles.petDropdownOptionText}>No categories found</Text>
                          </View>
                        ) : (
                          medicalCategories.map(category => (
                            <TouchableOpacity key={category.id} style={styles.petDropdownOption} onPress={() => {
                              console.log('Selected category:', category.name);
                              setSelectedCategory(category.name);
                              setSelectedTemplate('');
                              setShowCategoryDropdown(false);
                            }}>
                              <Text style={styles.petDropdownOptionText}>{category.name}</Text>
                            </TouchableOpacity>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Form Template *</Text>
                <View style={[styles.dropdownContainer, {zIndex: 1500}]}>
                  <TouchableOpacity 
                    style={[styles.petDropdown, !selectedCategory && {opacity: 0.5}]} 
                    disabled={!selectedCategory}
                    onPress={() => {
                      if (selectedCategory) {
                        console.log('Template dropdown clicked');
                        console.log('Medical forms:', medicalForms);
                        console.log('Filtered forms:', medicalForms.filter(form => form.category === selectedCategory));
                        setShowCategoryDropdown(false);
                        setShowTemplateDropdown(!showTemplateDropdown);
                      }
                    }}
                  >
                    <Text style={styles.petDropdownText}>{selectedTemplate || (selectedCategory ? 'Select template' : 'Select category first')}</Text>
                    <Text style={styles.petDropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showTemplateDropdown && selectedCategory && (
                    <View style={styles.petDropdownMenu}>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {medicalForms.filter(form => form.category === selectedCategory).length === 0 ? (
                          <View style={styles.petDropdownOption}>
                            <Text style={styles.petDropdownOptionText}>No forms found</Text>
                          </View>
                        ) : (
                          medicalForms.filter(form => form.category === selectedCategory).map(form => (
                            <TouchableOpacity key={form.id} style={styles.petDropdownOption} onPress={async () => {
                              console.log('Selected template:', form.formName);
                              setSelectedTemplate(form.formName);
                              setShowTemplateDropdown(false);
                              
                              // Load form fields for the selected template
                              setLoadingFields(true);
                              try {
                                const fields = await getFormFields(form.formName, userEmail);
                                console.log('Loaded form fields:', fields);
                                setFormFields(fields);
                              } catch (error) {
                                console.error('Error loading form fields:', error);
                                setFormFields([]);
                              } finally {
                                setLoadingFields(false);
                              }
                            }}>
                              <Text style={styles.petDropdownOptionText}>{form.formName}</Text>
                            </TouchableOpacity>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  setSelectedCategory('');
                  setSelectedTemplate('');
                  Animated.timing(medicalSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowMedicalDrawer(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.drawerSaveButton, (!selectedCategory || !selectedTemplate) && {opacity: 0.5}]} 
                  disabled={!selectedCategory || !selectedTemplate}
                  onPress={() => setShowFormModal(true)}
                >
                  <Text style={styles.drawerSaveText}>Open Form</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
        
        {/* Medical Form Modal */}
        <Modal visible={showFormModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.customModal, {width: '90%', maxWidth: 600, height: '80%'}]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>{selectedTemplate} - {selectedCategory}</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => setShowFormModal(false)}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                {loadingFields ? (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>Loading form fields...</Text>
                  </View>
                ) : formFields.length === 0 ? (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No fields found for this form template</Text>
                    <Text style={styles.petDropdownOptionText}>Add fields to this form template to start collecting data</Text>
                  </View>
                ) : (
                  formFields.map((field) => (
                    <View key={field.id} style={{marginBottom: 15}}>
                      <Text style={styles.fieldLabel}>
                        {field.label}{field.required && ' *'}
                      </Text>
                      {field.type === 'text' && (
                        <TextInput
                          style={styles.drawerInput}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          value={formData[field.id] || ''}
                          onChangeText={(text) => setFormData({...formData, [field.id]: text})}
                        />
                      )}
                      {field.type === 'number' && (
                        <TextInput
                          style={styles.drawerInput}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          keyboardType="numeric"
                          value={formData[field.id] || ''}
                          onChangeText={(text) => setFormData({...formData, [field.id]: text})}
                        />
                      )}
                      {field.type === 'date' && (
                        <TextInput
                          style={styles.drawerInput}
                          placeholder={field.dateFormat === 'Timestamp' ? 'MM/DD/YYYY HH:MM AM/PM' : 'MM/DD/YYYY'}
                          value={formData[field.id] || ''}
                          onChangeText={(text) => {
                            if (field.dateFormat !== 'Timestamp') {
                              const cleaned = text.replace(/\D/g, '');
                              let formatted = '';
                              if (cleaned.length >= 2) {
                                formatted = cleaned.substring(0, 2);
                                if (cleaned.length >= 4) {
                                  formatted += '/' + cleaned.substring(2, 4);
                                  if (cleaned.length >= 8) {
                                    formatted += '/' + cleaned.substring(4, 8);
                                  } else if (cleaned.length > 4) {
                                    formatted += '/' + cleaned.substring(4);
                                  }
                                } else if (cleaned.length > 2) {
                                  formatted += '/' + cleaned.substring(2);
                                }
                              } else {
                                formatted = cleaned;
                              }
                              setFormData({...formData, [field.id]: formatted});
                            } else {
                              setFormData({...formData, [field.id]: text});
                            }
                          }}
                          keyboardType="numeric"
                          maxLength={field.dateFormat === 'Timestamp' ? 22 : 10}
                        />
                      )}
                      {(field.type === 'dropdown' || field.type === 'veterinarian_dropdown') && (
                        <View style={[styles.dropdownContainer, {zIndex: 1000 - formFields.indexOf(field)}]}>
                          <TouchableOpacity style={styles.petDropdown} onPress={() => {
                            // Toggle dropdown for this field
                            const dropdownKey = `dropdown_${field.id}`;
                            setFormData(prev => ({
                              ...prev,
                              [dropdownKey]: !prev[dropdownKey]
                            }));
                          }}>
                            <Text style={styles.petDropdownText}>
                              {formData[field.id] || (field.type === 'veterinarian_dropdown' ? 'Select Veterinarian' : 'Select Option')}
                            </Text>
                            <Text style={styles.petDropdownArrow}>▼</Text>
                          </TouchableOpacity>
                          {formData[`dropdown_${field.id}`] && (
                            <View style={styles.petDropdownMenu}>
                              <ScrollView showsVerticalScrollIndicator={false}>
                                {field.type === 'veterinarian_dropdown' ? (
                                  ['Dr. Smith', 'Dr. Johnson', 'Dr. Brown', 'Dr. Davis'].map((vet, index) => (
                                    <TouchableOpacity
                                      key={index}
                                      style={styles.petDropdownOption}
                                      onPress={() => {
                                        setFormData(prev => ({
                                          ...prev,
                                          [field.id]: vet,
                                          [`dropdown_${field.id}`]: false
                                        }));
                                      }}
                                    >
                                      <Text style={styles.petDropdownOptionText}>{vet}</Text>
                                    </TouchableOpacity>
                                  ))
                                ) : (
                                  (field.options || []).map((option, index) => (
                                    <TouchableOpacity
                                      key={index}
                                      style={styles.petDropdownOption}
                                      onPress={() => {
                                        setFormData(prev => ({
                                          ...prev,
                                          [field.id]: option,
                                          [`dropdown_${field.id}`]: false
                                        }));
                                      }}
                                    >
                                      <Text style={styles.petDropdownOptionText}>{option}</Text>
                                    </TouchableOpacity>
                                  ))
                                )}
                              </ScrollView>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  setShowFormModal(false);
                  setFormData({});
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={async () => {
                  try {
                    const recordData = {
                      petId: selectedPet.id,
                      petName: selectedPet.name,
                      ownerId: selectedPet.customerId,
                      ownerName: selectedPet.owner,
                      category: selectedCategory,
                      template: selectedTemplate,
                      formData: formData,
                      createdAt: new Date(),
                      createdBy: userEmail
                    };
                    
                    const savedRecord = await addMedicalRecord(recordData, userEmail);
                    
                    const newRecord = {
                      id: savedRecord.id,
                      date: new Date().toLocaleDateString(),
                      treatment: selectedTemplate,
                      veterinarian: formData.veterinarian || 'Not specified',
                      ...recordData
                    };
                    setMedicalRecords([...medicalRecords, newRecord]);
                    
                    setShowFormModal(false);
                    setShowMedicalDrawer(false);
                    setSelectedCategory('');
                    setSelectedTemplate('');
                    setFormData({});
                    setFormFields([]);
                    Alert.alert('Success', 'Medical record saved successfully!');
                  } catch (error) {
                    console.error('Error saving medical record:', error);
                    Alert.alert('Error', 'Failed to save medical record');
                  }
                }}>
                  <Text style={styles.drawerSaveText}>Save Record</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (selectedCustomer) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.detailScrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Customers</Text>
          </View>
          <View style={styles.content}>
          <View style={styles.detailTableContainer}>
              <View style={styles.tableTopRow}>
                <View style={styles.leftSection}>
                  <TouchableOpacity style={styles.returnButton} onPress={() => setSelectedCustomer(null)}>
                    <Text style={styles.returnButtonText}>←</Text>
                  </TouchableOpacity>
                  <Text style={styles.formDetailTitle}>Customer Detail</Text>
                </View>
                <View style={styles.categoryActions}>
                  <TouchableOpacity style={styles.editCategoryButton} onPress={() => {
                    console.log('Edit button clicked for customer:', selectedCustomer);
                    setEditingCustomer(selectedCustomer);
                    const customerData = {
                      surname: selectedCustomer.surname || '',
                      firstname: selectedCustomer.firstname || '',
                      middlename: selectedCustomer.middlename || '',
                      contact: selectedCustomer.contact || '',
                      email: selectedCustomer.email || '',
                      address: selectedCustomer.address || ''
                    };
                    console.log('Setting form data:', customerData);
                    setNewCustomer(customerData);
                    console.log('Opening drawer...');
                    setShowAddDrawer(true);
                  }}>
                    <Text style={styles.editCategoryButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteCategoryButton} onPress={() => {
                    console.log('=== DELETE BUTTON CLICKED ===');
                    console.log('Selected customer:', selectedCustomer);
                    console.log('Customer ID:', selectedCustomer?.id);
                    console.log('User email:', userEmail);
                    console.log('Current customers count:', customers.length);
                    console.log('Current pets count:', pets.length);
                    
                    if (!selectedCustomer?.id) {
                      console.error('No customer ID found!');
                      Alert.alert('Error', 'No customer selected');
                      return;
                    }
                    
                    handleDeleteCustomer(selectedCustomer.id);
                  }}>
                    <Text style={styles.deleteCategoryButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.detailTable}>
                <View style={styles.detailTableHeader}>
                  <Text style={styles.detailHeaderCell}>Field</Text>
                  <Text style={styles.detailHeaderCell}>Value</Text>
                </View>
                <ScrollView style={styles.detailTableBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailCell}>Name</Text>
                    <Text style={styles.detailCell}>{selectedCustomer.name || `${selectedCustomer.firstname} ${selectedCustomer.surname}` || 'Not Available'}</Text>
                  </View>
                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailCell}>Contact Number</Text>
                    <Text style={styles.detailCell}>{selectedCustomer.contact || 'Not Available'}</Text>
                  </View>
                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailCell}>Email Address</Text>
                    <Text style={styles.detailCell}>{selectedCustomer.email || 'Not Available'}</Text>
                  </View>
                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailCell}>Address</Text>
                    <Text style={styles.detailCell}>{selectedCustomer.address || 'Not Available'}</Text>
                  </View>
                  <View style={styles.detailTableRow}>
                    <Text style={styles.detailCell}>Date Created</Text>
                    <Text style={styles.detailCell}>{selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt.seconds * 1000).toLocaleDateString() : 'Not Available'}</Text>
                  </View>
                </ScrollView>
              </View>
            </View>
          
            <View style={styles.petsActionsHeader}>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowAddPetDrawer(true)}>
                <Text style={styles.addButtonText}>+ Add Pet</Text>
              </TouchableOpacity>
              <View style={styles.searchContainer}>
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Search pets..."
                  placeholderTextColor="#999"
                  value={petSearchTerm}
                  onChangeText={setPetSearchTerm}
                />
              </View>
            </View>
            <View style={styles.petsSection}>
              <View style={styles.petsSectionHeader}>
                <Text style={styles.sectionTitle}>Pets</Text>
              </View>
              <View style={styles.petsTable}>
                <View style={styles.detailTableHeader}>
                  <Text style={styles.detailHeaderCell}>Pet Name</Text>
                  <Text style={styles.detailHeaderCell}>Type</Text>
                  <Text style={styles.detailHeaderCell}>Breed</Text>
                </View>
                <ScrollView style={styles.detailTableBody} showsVerticalScrollIndicator={false}>
                  {pets.filter(pet => 
                    pet.customerId === selectedCustomer.id && 
                    pet.name.toLowerCase().includes(petSearchTerm.toLowerCase())
                  ).length === 0 ? (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>No pets found for this customer</Text>
                    </View>
                  ) : (
                    pets.filter(pet => 
                      pet.customerId === selectedCustomer.id && 
                      pet.name.toLowerCase().includes(petSearchTerm.toLowerCase())
                    ).map((pet) => (
                      <TouchableOpacity key={pet.id} style={styles.detailTableRow} onPress={() => setSelectedPet(pet)}>
                        <Text style={styles.detailCell} numberOfLines={1}>{pet.name}</Text>
                        <Text style={styles.detailCell} numberOfLines={1}>{pet.type}</Text>
                        <Text style={styles.detailCell} numberOfLines={1}>{pet.breed}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Edit Customer Drawer - Detail View */}
        {showAddDrawer && (
          <Modal visible={true} transparent animationType="none">
            <View style={styles.drawerOverlay}>
              <Animated.View style={[styles.drawer, { left: addSlideAnim }]}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</Text>
                  {console.log('Drawer opened - editingCustomer:', editingCustomer, 'newCustomer:', newCustomer)}
                  <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                    setEditingCustomer(null);
                    setNewCustomer({ surname: '', firstname: '', middlename: '', contact: '', email: '', address: '' });
                    Animated.timing(addSlideAnim, {
                      toValue: -350,
                      duration: 200,
                      useNativeDriver: false,
                    }).start(() => setShowAddDrawer(false));
                  }}>
                    <Text style={styles.drawerCloseText}>×</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.drawerForm}>
                  <Text style={styles.fieldLabel}>Surname *</Text>
                  <TextInput
                    style={styles.drawerInput}
                    placeholder="Enter surname"
                    placeholderTextColor="#ccc"
                    value={newCustomer.surname}
                    onChangeText={(text) => setNewCustomer({...newCustomer, surname: text})}
                  />
                  
                  <Text style={styles.fieldLabel}>First Name *</Text>
                  <TextInput
                    style={styles.drawerInput}
                    placeholder="Enter first name"
                    value={newCustomer.firstname}
                    onChangeText={(text) => setNewCustomer({...newCustomer, firstname: text})}
                  />
                  
                  <Text style={styles.fieldLabel}>Middle Name</Text>
                  <TextInput
                    style={styles.drawerInput}
                    placeholder="Enter middle name (optional)"
                    value={newCustomer.middlename}
                    onChangeText={(text) => setNewCustomer({...newCustomer, middlename: text})}
                  />
                  
                  <Text style={styles.fieldLabel}>Contact Number *</Text>
                  <TextInput
                    style={styles.drawerInput}
                    placeholder="Enter contact number"
                    keyboardType="phone-pad"
                    value={newCustomer.contact}
                    onChangeText={(text) => setNewCustomer({...newCustomer, contact: text})}
                  />
                  
                  <Text style={styles.fieldLabel}>Email Address *</Text>
                  <TextInput
                    style={styles.drawerInput}
                    placeholder="Enter email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={newCustomer.email}
                    onChangeText={(text) => setNewCustomer({...newCustomer, email: text})}
                  />
                  
                  <Text style={styles.fieldLabel}>Address</Text>
                  <TextInput
                    style={[styles.drawerInput, styles.addressInput]}
                    placeholder="Enter address"
                    multiline
                    numberOfLines={3}
                    value={newCustomer.address}
                    onChangeText={(text) => setNewCustomer({...newCustomer, address: text})}
                  />
                </ScrollView>
                
                <View style={styles.drawerButtons}>
                  <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                    setEditingCustomer(null);
                    setNewCustomer({ surname: '', firstname: '', middlename: '', contact: '', email: '', address: '' });
                    Animated.timing(addSlideAnim, {
                      toValue: -350,
                      duration: 200,
                      useNativeDriver: false,
                    }).start(() => setShowAddDrawer(false));
                  }}>
                    <Text style={styles.drawerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.drawerSaveButton} onPress={handleAddCustomer}>
                    <Text style={styles.drawerSaveText}>{editingCustomer ? 'Update Customer' : 'Add Customer'}</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </Modal>
        )}
        
        {/* Add Pet Drawer - Detail View */}
        {showAddPetDrawer && (
          <Modal visible={true} transparent animationType="none">
            <View style={styles.drawerOverlay}>
              <Animated.View style={[styles.drawer, { left: addPetSlideAnim }]}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Add New Pet</Text>
                  <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                    setNewPet({ name: '', type: '', breed: '' });
                    Animated.timing(addPetSlideAnim, {
                      toValue: -350,
                      duration: 200,
                      useNativeDriver: false,
                    }).start(() => setShowAddPetDrawer(false));
                  }}>
                    <Text style={styles.drawerCloseText}>×</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.drawerForm}>
                  <Text style={styles.fieldLabel}>Pet Name *</Text>
                  <TextInput
                    style={styles.drawerInput}
                    placeholder="Enter pet name"
                    placeholderTextColor="#ccc"
                    value={newPet.name}
                    onChangeText={(text) => setNewPet({...newPet, name: text})}
                  />
                  
                  <Text style={styles.fieldLabel}>Type *</Text>
                  <View style={[styles.dropdownContainer, {zIndex: 2000}]}>
                    <TouchableOpacity style={styles.petDropdown} onPress={() => {
                      setShowBreedDropdown(false);
                      setShowTypeDropdown(!showTypeDropdown);
                    }}>
                      <Text style={styles.petDropdownText}>{newPet.type || 'Select pet type'}</Text>
                      <Text style={styles.petDropdownArrow}>▼</Text>
                    </TouchableOpacity>
                    {showTypeDropdown && (
                      <View style={styles.petDropdownMenu}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                          {petTypes.map(type => (
                            <View key={type} style={styles.petDropdownOptionContainer}>
                              <TouchableOpacity style={styles.petDropdownOptionMain} onPress={() => {
                                setNewPet({...newPet, type});
                                setShowTypeDropdown(false);
                              }}>
                                <Text style={styles.petDropdownOptionText}>{type}</Text>
                              </TouchableOpacity>
                              {!['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster'].includes(type) && (
                                <TouchableOpacity style={styles.deleteOptionButton} onPress={() => {
                                  setPetTypes(petTypes.filter(t => t !== type));
                                }}>
                                  <Text style={styles.deleteOptionText}>×</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                          <TouchableOpacity style={styles.petDropdownOption} onPress={() => {
                            setCustomModalType('type');
                            setShowCustomModal(true);
                            setShowTypeDropdown(false);
                          }}>
                            <Text style={[styles.petDropdownOptionText, {color: '#007bff'}]}>+ Add Custom Type</Text>
                          </TouchableOpacity>
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.fieldLabel}>Breed *</Text>
                  <View style={[styles.dropdownContainer, {zIndex: 1500}]}>
                    <TouchableOpacity 
                      style={[styles.petDropdown, !newPet.type && {opacity: 0.5}]} 
                      disabled={!newPet.type}
                      onPress={() => {
                        if (newPet.type) {
                          setShowTypeDropdown(false);
                          setShowBreedDropdown(!showBreedDropdown);
                        }
                      }}
                    >
                      <Text style={styles.petDropdownText}>{newPet.breed || (newPet.type ? 'Select breed' : 'Select type first')}</Text>
                      <Text style={styles.petDropdownArrow}>▼</Text>
                    </TouchableOpacity>
                    {showBreedDropdown && newPet.type && (
                      <View style={styles.petDropdownMenu}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                          {petBreeds.map(breed => (
                            <View key={breed} style={styles.petDropdownOptionContainer}>
                              <TouchableOpacity style={styles.petDropdownOptionMain} onPress={() => {
                                setNewPet({...newPet, breed});
                                setShowBreedDropdown(false);
                              }}>
                                <Text style={styles.petDropdownOptionText}>{breed}</Text>
                              </TouchableOpacity>
                              {!['Labrador', 'Golden Retriever', 'Persian', 'Siamese', 'Bulldog', 'Poodle'].includes(breed) && (
                                <TouchableOpacity style={styles.deleteOptionButton} onPress={() => {
                                  setPetBreeds(petBreeds.filter(b => b !== breed));
                                }}>
                                  <Text style={styles.deleteOptionText}>×</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                          <TouchableOpacity style={styles.petDropdownOption} onPress={() => {
                            setCustomModalType('breed');
                            setShowCustomModal(true);
                            setShowBreedDropdown(false);
                          }}>
                            <Text style={[styles.petDropdownOptionText, {color: '#007bff'}]}>+ Add Custom Breed</Text>
                          </TouchableOpacity>
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  

                </ScrollView>
                
                <View style={styles.drawerButtons}>
                  <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                    setNewPet({ name: '', type: '', breed: '', age: '' });
                    Animated.timing(addPetSlideAnim, {
                      toValue: -350,
                      duration: 200,
                      useNativeDriver: false,
                    }).start(() => setShowAddPetDrawer(false));
                  }}>
                    <Text style={styles.drawerCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.drawerSaveButton} onPress={handleAddPet}>
                    <Text style={styles.drawerSaveText}>Add Pet</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </Modal>
        )}
        
        {/* Custom Type/Breed Modal */}
        {showCustomModal && (
          <Modal visible={true} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.customModal}>
                <Text style={styles.customModalTitle}>Add Custom {customModalType === 'type' ? 'Type' : 'Breed'}</Text>
                <TextInput
                  style={styles.customModalInput}
                  placeholder={`Enter new ${customModalType}`}
                  value={customValue}
                  onChangeText={setCustomValue}
                  autoFocus
                />
                <View style={styles.customModalButtons}>
                  <TouchableOpacity style={styles.customModalCancel} onPress={() => {
                    setShowCustomModal(false);
                    setCustomValue('');
                  }}>
                    <Text style={styles.customModalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.customModalAdd} onPress={() => {
                    if (customValue.trim()) {
                      const newValue = customValue.trim();
                      if (customModalType === 'type') {
                        setPetTypes([...petTypes, newValue]);
                      } else {
                        setPetBreeds([...petBreeds, newValue]);
                      }
                      setNewPet({...newPet, [customModalType]: newValue});
                      setShowCustomModal(false);
                      setCustomValue('');
                    }
                  }}>
                    <Text style={styles.customModalAddText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Customers</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setShowAddDrawer(true)}
          >
            <Text style={styles.addButtonText}>+ Add Customer</Text>
          </TouchableOpacity>
          <View style={styles.searchContainer}>
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
              <Text style={styles.headerCellName}>Name</Text>
              <Text style={styles.headerCell}>Contact</Text>
              <Text style={styles.headerCell}>Email</Text>
              <Text style={styles.headerCell}>Address</Text>
            </View>
            {currentCustomers.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No customers found</Text>
              </View>
            ) : itemsPerPage >= 20 ? (
              <ScrollView style={styles.tableBody}>
                {currentCustomers.map((customer) => (
                  <TouchableOpacity key={customer.id} style={styles.tableRow} onPress={() => setSelectedCustomer(customer)}>
                    <Text style={styles.cellName} numberOfLines={1}>{customer.name || `${customer.surname}, ${customer.firstname} ${customer.middlename || ''}`.trim()}</Text>
                    <Text style={styles.cell} numberOfLines={1}>{customer.contact}</Text>
                    <Text style={styles.cell} numberOfLines={1}>{customer.email}</Text>
                    <Text style={styles.cell} numberOfLines={1}>{customer.address || 'N/A'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              currentCustomers.map((customer) => (
                <TouchableOpacity key={customer.id} style={styles.tableRow} onPress={() => setSelectedCustomer(customer)}>
                  <Text style={styles.cellName} numberOfLines={1}>{customer.name || `${customer.surname}, ${customer.firstname} ${customer.middlename || ''}`.trim()}</Text>
                  <Text style={styles.cell} numberOfLines={1}>{customer.contact}</Text>
                  <Text style={styles.cell} numberOfLines={1}>{customer.email}</Text>
                  <Text style={styles.cell} numberOfLines={1}>{customer.address || 'N/A'}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
          
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
                    {[10, 20, 50, 100].map(option => (
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
              
              <TouchableOpacity style={styles.pageBtn} onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}>
                <Text style={styles.pageBtnText}>Prev</Text>
              </TouchableOpacity>
              <TextInput 
                style={styles.pageInput}
                value={currentPage.toString()}
                keyboardType="numeric"
                onChangeText={(text) => {
                  const pageNum = parseInt(text);
                  if (pageNum >= 1 && pageNum <= totalPages) {
                    setCurrentPage(pageNum);
                  }
                }}
              />
              <Text style={styles.pageOf}>of {totalPages}</Text>
              <TouchableOpacity style={styles.pageBtn} onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>
                <Text style={styles.pageBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>


      </View>
      
      {/* Add Customer Drawer */}
      {showAddDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</Text>
                {console.log('Drawer opened - editingCustomer:', editingCustomer, 'newCustomer:', newCustomer)}
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  setEditingCustomer(null);
                  setNewCustomer({ surname: '', firstname: '', middlename: '', contact: '', email: '', address: '' });
                  Animated.timing(addSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddDrawer(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Surname *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter surname"
                  placeholderTextColor="#ccc"
                  value={newCustomer.surname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, surname: text})}
                />
                
                <Text style={styles.fieldLabel}>First Name *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter first name"
                  value={newCustomer.firstname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, firstname: text})}
                />
                
                <Text style={styles.fieldLabel}>Middle Name</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter middle name (optional)"
                  value={newCustomer.middlename}
                  onChangeText={(text) => setNewCustomer({...newCustomer, middlename: text})}
                />
                
                <Text style={styles.fieldLabel}>Contact Number *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter contact number"
                  keyboardType="phone-pad"
                  value={newCustomer.contact}
                  onChangeText={(text) => setNewCustomer({...newCustomer, contact: text})}
                />
                
                <Text style={styles.fieldLabel}>Email Address *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={newCustomer.email}
                  onChangeText={(text) => setNewCustomer({...newCustomer, email: text})}
                />
                
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput
                  style={[styles.drawerInput, styles.addressInput]}
                  placeholder="Enter address"
                  multiline
                  numberOfLines={3}
                  value={newCustomer.address}
                  onChangeText={(text) => setNewCustomer({...newCustomer, address: text})}
                />
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  setEditingCustomer(null);
                  setNewCustomer({ surname: '', firstname: '', middlename: '', contact: '', email: '', address: '' });
                  Animated.timing(addSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddDrawer(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={handleAddCustomer}>
                  <Text style={styles.drawerSaveText}>{editingCustomer ? 'Update Customer' : 'Add Customer'}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
      
      {/* Add Pet Drawer */}
      {showAddPetDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addPetSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Pet</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  setNewPet({ name: '', type: '', breed: '', age: '' });
                  Animated.timing(addPetSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddPetDrawer(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Pet Name *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter pet name"
                  placeholderTextColor="#ccc"
                  value={newPet.name}
                  onChangeText={(text) => setNewPet({...newPet, name: text})}
                />
                
                <Text style={styles.fieldLabel}>Type *</Text>
                <View style={[styles.dropdownContainer, {zIndex: 2000}]}>
                  <TouchableOpacity style={styles.petDropdown} onPress={() => {
                    setShowBreedDropdown(false);
                    setShowTypeDropdown(!showTypeDropdown);
                  }}>
                    <Text style={styles.petDropdownText}>{newPet.type || 'Select pet type'}</Text>
                    <Text style={styles.petDropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showTypeDropdown && (
                    <View style={styles.petDropdownMenu}>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {petTypes.map(type => (
                          <View key={type} style={styles.petDropdownOptionContainer}>
                            <TouchableOpacity style={styles.petDropdownOptionMain} onPress={() => {
                              setNewPet({...newPet, type});
                              setShowTypeDropdown(false);
                            }}>
                              <Text style={styles.petDropdownOptionText}>{type}</Text>
                            </TouchableOpacity>
                            {!['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster'].includes(type) && (
                              <TouchableOpacity style={styles.deleteOptionButton} onPress={() => {
                                setPetTypes(petTypes.filter(t => t !== type));
                              }}>
                                <Text style={styles.deleteOptionText}>×</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                        <TouchableOpacity style={styles.petDropdownOption} onPress={() => {
                          setCustomModalType('type');
                          setShowCustomModal(true);
                          setShowTypeDropdown(false);
                        }}>
                          <Text style={[styles.petDropdownOptionText, {color: '#007bff'}]}>+ Add Custom Type</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Breed *</Text>
                <View style={[styles.dropdownContainer, {zIndex: 1500}]}>
                  <TouchableOpacity 
                    style={[styles.petDropdown, !newPet.type && {opacity: 0.5}]} 
                    disabled={!newPet.type}
                    onPress={() => {
                      if (newPet.type) {
                        setShowTypeDropdown(false);
                        setShowBreedDropdown(!showBreedDropdown);
                      }
                    }}
                  >
                    <Text style={styles.petDropdownText}>{newPet.breed || (newPet.type ? 'Select breed' : 'Select type first')}</Text>
                    <Text style={styles.petDropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showBreedDropdown && newPet.type && (
                    <View style={styles.petDropdownMenu}>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {petBreeds.map(breed => (
                          <View key={breed} style={styles.petDropdownOptionContainer}>
                            <TouchableOpacity style={styles.petDropdownOptionMain} onPress={() => {
                              setNewPet({...newPet, breed});
                              setShowBreedDropdown(false);
                            }}>
                              <Text style={styles.petDropdownOptionText}>{breed}</Text>
                            </TouchableOpacity>
                            {!['Labrador', 'Golden Retriever', 'Persian', 'Siamese', 'Bulldog', 'Poodle'].includes(breed) && (
                              <TouchableOpacity style={styles.deleteOptionButton} onPress={() => {
                                setPetBreeds(petBreeds.filter(b => b !== breed));
                              }}>
                                <Text style={styles.deleteOptionText}>×</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                        <TouchableOpacity style={styles.petDropdownOption} onPress={() => {
                          setCustomModalType('breed');
                          setShowCustomModal(true);
                          setShowBreedDropdown(false);
                        }}>
                          <Text style={[styles.petDropdownOptionText, {color: '#007bff'}]}>+ Add Custom Breed</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </View>
                

              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  setNewPet({ name: '', type: '', breed: '' });
                  Animated.timing(addPetSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddPetDrawer(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={handleAddPet}>
                  <Text style={styles.drawerSaveText}>Add Pet</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#800000',
  },
  tableActionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 20,
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
  dropdownContainer: {
    position: 'relative',
    zIndex: 1001,
    overflow: 'visible',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
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
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  formDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
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
    height: 390,
  },
  petsTable: {
    backgroundColor: '#fff',
    height: 390,
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
  addressInput: {
    height: 80,
    textAlignVertical: 'top',
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
  detailTableContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  detailTableBody: {
    flex: 1,
  },
  petsSection: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  petsSectionHeader: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  petsHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  petsActionsHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 15,
  },
  detailScrollContainer: {
    flex: 1,
  },
  petDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  petDropdownText: {
    fontSize: 12,
    color: '#333',
  },
  petDropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  petDropdownMenu: {
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
  petDropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  petDropdownOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  petDropdownOptionMain: {
    flex: 1,
    padding: 12,
  },
  petDropdownOptionText: {
    fontSize: 12,
    color: '#333',
  },
  deleteOptionButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteOptionText: {
    fontSize: 16,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customModal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: 300,
    maxWidth: '90%',
  },
  customModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: 15,
    textAlign: 'center',
  },
  customModalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  customModalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  customModalCancel: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  customModalCancelText: {
    color: '#666',
    fontWeight: 'bold',
  },
  customModalAdd: {
    flex: 1,
    backgroundColor: '#23C062',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  customModalAddText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});