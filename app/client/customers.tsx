import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Image, Animated } from 'react-native';
import SearchableDropdown from '@/components/SearchableDropdown';
import { getCustomers, getPets, addCustomer, addPet, addMedicalRecord, deleteCustomerWithPets, getMedicalCategories, getMedicalForms, getMedicalRecords, getFormFields } from '../../lib/services/firebaseService';
import { useTenant } from '../../contexts/TenantContext';

export default function CustomersScreen() {
  const { userEmail } = useTenant();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const [customersData, petsData, categoriesData, formsData, recordsData] = await Promise.all([
        getCustomers(userEmail),
        getPets(userEmail),
        getMedicalCategories(userEmail),
        getMedicalForms(userEmail),
        getMedicalRecords(userEmail)
      ]);
      setCustomers(customersData);
      setFirebaseMedicalCategories(categoriesData);
      setFirebaseMedicalForms(formsData);
      
      // Group pets by owner
      const petsByOwner = {};
      petsData.forEach(pet => {
        if (!petsByOwner[pet.owner]) {
          petsByOwner[pet.owner] = [];
        }
        petsByOwner[pet.owner].push(pet);
      });
      setCustomerPetsList(petsByOwner);
      
      // Group medical records by pet
      const recordsByPet = {};
      recordsData.forEach(record => {
        if (!recordsByPet[record.petId]) {
          recordsByPet[record.petId] = [];
        }
        recordsByPet[record.petId].push(record);
      });
      setPetMedicalHistory(recordsByPet);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const customerPets = {
    1: [{ id: 1, name: 'Max', type: 'Dog', breed: 'Golden Retriever' }, { id: 2, name: 'Bella', type: 'Cat', breed: 'Persian' }],
    2: [{ id: 3, name: 'Luna', type: 'Cat', breed: 'Siamese' }],
    3: [
      { id: 4, name: 'Charlie', type: 'Dog', breed: 'Labrador' },
      { id: 5, name: 'Milo', type: 'Cat', breed: 'Maine Coon' },
      { id: 6, name: 'Rocky', type: 'Dog', breed: 'Bulldog' }
    ],
    4: [{ id: 7, name: 'Whiskers', type: 'Cat', breed: 'Tabby' }],
    5: [{ id: 8, name: 'Buddy', type: 'Dog', breed: 'Beagle' }, { id: 9, name: 'Shadow', type: 'Cat', breed: 'Black Cat' }],
  };
  
  const [petMedicalHistory, setPetMedicalHistory] = useState({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    surname: '',
    firstname: '',
    middlename: '',
    pets: '',
    contact: '',
    email: '',
    address: ''
  });
  const [customerList, setCustomerList] = useState([]);
  
  useEffect(() => {
    setCustomerList(customers);
  }, [customers]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedPetDetail, setSelectedPetDetail] = useState(null);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState(null);
  const [petsSearchTerm, setPetsSearchTerm] = useState('');
  const [petsCurrentPage, setPetsCurrentPage] = useState(1);
  const [petsItemsPerPage, setPetsItemsPerPage] = useState(10);
  const [showPetsDropdown, setShowPetsDropdown] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [drawerAnimation] = useState(new Animated.Value(-350));
  const [editCustomer, setEditCustomer] = useState({});
  const [medicalHistoryCurrentPage, setMedicalHistoryCurrentPage] = useState(1);
  const [medicalHistoryItemsPerPage, setMedicalHistoryItemsPerPage] = useState(10);
  const [medicalHistorySearchTerm, setMedicalHistorySearchTerm] = useState('');
  const [showMedicalHistoryDropdown, setShowMedicalHistoryDropdown] = useState(false);
  const [showAddPetDrawer, setShowAddPetDrawer] = useState(false);
  const [addPetDrawerAnimation] = useState(new Animated.Value(-350));
  const [newPet, setNewPet] = useState({
    name: '',
    type: '',
    breed: ''
  });
  const [showAnimalTypeDropdown, setShowAnimalTypeDropdown] = useState(false);
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [customerPetsList, setCustomerPetsList] = useState({});
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [addDrawerAnimation] = useState(new Animated.Value(-350));
  const [showAddRecordDrawer, setShowAddRecordDrawer] = useState(false);
  const [addRecordDrawerAnimation] = useState(new Animated.Value(-350));
  const [newMedicalRecord, setNewMedicalRecord] = useState({
    category: '',
    formTemplate: ''
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFormDropdown, setShowFormDropdown] = useState(false);
  const [selectedMedicalForm, setSelectedMedicalForm] = useState(null);
  const [firebaseMedicalCategories, setFirebaseMedicalCategories] = useState([]);
  const [firebaseMedicalForms, setFirebaseMedicalForms] = useState([]);
  const [formFieldValues, setFormFieldValues] = useState({});
  
  const [animalTypes, setAnimalTypes] = useState([
    { id: 1, name: 'Dog' },
    { id: 2, name: 'Cat' },
    { id: 3, name: 'Bird' },
    { id: 4, name: 'Rabbit' }
  ]);
  
  const [breedsByType, setBreedsByType] = useState({
    'Dog': ['Golden Retriever', 'Labrador', 'German Shepherd', 'Bulldog', 'Beagle'],
    'Cat': ['Persian', 'Siamese', 'Maine Coon', 'British Shorthair', 'Ragdoll'],
    'Bird': ['Budgerigar', 'Cockatiel', 'Canary', 'Lovebird', 'Conure'],
    'Rabbit': ['Holland Lop', 'Netherland Dwarf', 'Mini Rex', 'Lionhead', 'Flemish Giant']
  });
  
  const filteredCustomers = customerList.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
    setShowDropdown(false);
  };
  
  const dropdownOptions = [10, 20, 50, 100];

  const handleAddCustomer = async () => {
    if (newCustomer.surname && newCustomer.firstname && newCustomer.contact && newCustomer.email && newCustomer.address) {
      try {
        const fullName = newCustomer.middlename 
          ? `${newCustomer.surname}, ${newCustomer.firstname} ${newCustomer.middlename}`
          : `${newCustomer.surname}, ${newCustomer.firstname}`;
        
        const customer = {
          name: fullName,
          contact: newCustomer.contact,
          email: newCustomer.email,
          address: newCustomer.address,
          city: 'Not specified',
          pets: 0
        };
        
        const savedCustomer = await addCustomer(customer, userEmail);
        setCustomerList([...customerList, savedCustomer]);
        
        setNewCustomer({ surname: '', firstname: '', middlename: '', pets: '', contact: '', email: '', address: '' });
        setShowModal(false);
      } catch (error) {
        console.error('Error adding customer:', error);
        alert('Error adding customer');
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Customers</Text>
          {!selectedCustomer && !selectedPetDetail && (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.addButton} onPress={() => {
            setShowAddDrawer(true);
            Animated.timing(addDrawerAnimation, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }).start();
          }}>
                <Image source={require('@/assets/ic_round-plus.png')} style={styles.addIcon} />
                <Text style={styles.addButtonText}>Add Customers</Text>
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
          )}
        </View>
        <View style={styles.content}>
        {!selectedPetDetail && !selectedCustomer ? (
          <View style={styles.tableContainer}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.headerCellId}>Order</Text>
                <Text style={styles.headerCellName}>Name</Text>
                <Text style={styles.headerCell}>Pets</Text>
                <Text style={styles.headerCell}>Contact</Text>
                <Text style={styles.headerCell}>Email</Text>
              </View>
              {currentCustomers.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No customers found</Text>
                </View>
              ) : (
                currentCustomers.map((customer, index) => (
                  <TouchableOpacity key={customer.id} style={styles.tableRow} onPress={() => setSelectedCustomer(customer)}>
                    <Text style={styles.cellId} numberOfLines={1}>{startIndex + index + 1}</Text>
                    <Text style={styles.cellName} numberOfLines={1}>{customer.name}</Text>
                    <Text style={styles.cell} numberOfLines={1}>{(customerPetsList[customer.id] || []).length}</Text>
                    <Text style={styles.cell} numberOfLines={1}>{customer.contact}</Text>
                    <Text style={styles.cell} numberOfLines={1}>{customer.email}</Text>
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
        ) : selectedPetDetail ? (
          <ScrollView style={styles.detailScrollView}>
            <View style={styles.tableContainer}>
              <View style={styles.detailTable}>
                <View style={styles.tableTopRow}>
                  <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.returnButton} onPress={() => setSelectedPetDetail(null)}>
                      <Image source={require('@/assets/return-arrow.svg')} style={styles.returnIcon} />
                    </TouchableOpacity>
                    <Text style={styles.detailTitle}>Pet Details</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.editButton}>
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton}>
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.tableHeader}>
                  <Text style={styles.headerCellName}>Field</Text>
                  <Text style={styles.headerCellName}>Value</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Pet Name</Text>
                  <Text style={styles.cellName}>{selectedPetDetail.name}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Animal Type</Text>
                  <Text style={styles.cellName}>{selectedPetDetail.type}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Breed</Text>
                  <Text style={styles.cellName}>{selectedPetDetail.breed}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Owner</Text>
                  <Text style={styles.cellName}>{selectedCustomer?.name || 'N/A'}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Status</Text>
                  <Text style={styles.cellName}>Active</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Registration Date</Text>
                  <Text style={styles.cellName}>Jan 15, 2023</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.petsSection}>
              <View style={styles.petsHeader}>
                <Text style={styles.sectionTitle}>Medical History</Text>
                <View style={styles.petsHeaderActions}>
                  <TouchableOpacity style={styles.addButton} onPress={() => {
                    setShowAddRecordDrawer(true);
                    Animated.timing(addRecordDrawerAnimation, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: false,
                    }).start();
                  }}>
                    <Image source={require('@/assets/ic_round-plus.png')} style={styles.addIcon} />
                    <Text style={styles.addButtonText}>Add Record</Text>
                  </TouchableOpacity>
                  <View style={styles.searchContainer}>
                    <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
                    <TextInput 
                      style={styles.searchInput}
                      placeholder="Search records..."
                      placeholderTextColor="#999"
                      value={medicalHistorySearchTerm}
                      onChangeText={setMedicalHistorySearchTerm}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.tableContainer}>
                <View style={styles.petsTable}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.headerCellId}>Order</Text>
                    <Text style={styles.headerCellName}>Date</Text>
                    <Text style={styles.headerCell}>Category</Text>
                    <Text style={styles.headerCell}>Form Name</Text>
                  </View>
                  {(petMedicalHistory[selectedPetDetail.id] || []).map((record, recordIndex) => (
                    <TouchableOpacity key={record.id} style={styles.tableRow} onPress={() => setSelectedMedicalRecord(record)}>
                      <Text style={styles.cellId}>{recordIndex + 1}</Text>
                      <Text style={styles.cellName}>{record.date || 'N/A'}</Text>
                      <Text style={styles.cell}>{record.category || 'No Category'}</Text>
                      <Text style={styles.cell}>{record.formType || 'N/A'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        ) : selectedCustomer ? (
          <ScrollView style={styles.detailScrollView}>
            <View style={styles.tableContainer}>
              <View style={styles.detailTable}>
                <View style={styles.tableTopRow}>
                  <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.returnButton} onPress={() => setSelectedCustomer(null)}>
                      <Image source={require('@/assets/return-arrow.svg')} style={styles.returnIcon} />
                    </TouchableOpacity>
                    <Text style={styles.detailTitle}>Customer Details</Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.editButton}>
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton}>
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.tableHeader}>
                  <Text style={styles.headerCellName}>Field</Text>
                  <Text style={styles.headerCellName}>Value</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>First Name</Text>
                  <Text style={styles.cellName}>{selectedCustomer.name.split(', ')[1]?.split(' ')[0] || 'N/A'}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Last Name</Text>
                  <Text style={styles.cellName}>{selectedCustomer.name.split(', ')[0] || 'N/A'}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Number of Pets</Text>
                  <Text style={styles.cellName}>{(customerPetsList[selectedCustomer.id] || []).length}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Contact Number</Text>
                  <Text style={styles.cellName}>{selectedCustomer.contact}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Email Address</Text>
                  <Text style={styles.cellName}>{selectedCustomer.email}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Address</Text>
                  <Text style={styles.cellName}>{selectedCustomer.address || 'Not Available'}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.petsSection}>
              <View style={styles.petsHeader}>
                <Text style={styles.sectionTitle}>Pets</Text>
                <View style={styles.petsHeaderActions}>
                  <TouchableOpacity style={styles.addButton} onPress={() => {
                    setShowAddPetDrawer(true);
                    Animated.timing(addPetDrawerAnimation, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: false,
                    }).start();
                  }}>
                    <Image source={require('@/assets/ic_round-plus.png')} style={styles.addIcon} />
                    <Text style={styles.addButtonText}>Add Pet</Text>
                  </TouchableOpacity>
                  <View style={styles.searchContainer}>
                    <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
                    <TextInput 
                      style={styles.searchInput}
                      placeholder="Search pets..."
                      placeholderTextColor="#999"
                      value={petsSearchTerm}
                      onChangeText={setPetsSearchTerm}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.tableContainer}>
                <View style={styles.petsTable}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.headerCellId}>Order</Text>
                    <Text style={styles.headerCellName}>Name</Text>
                    <Text style={styles.headerCell}>Type</Text>
                    <Text style={styles.headerCell}>Breed</Text>
                  </View>
                  {(() => {
                    const pets = customerPetsList[selectedCustomer.id] || [];
                    const filteredPets = pets.filter(pet =>
                      pet.name.toLowerCase().includes(petsSearchTerm.toLowerCase()) ||
                      pet.type.toLowerCase().includes(petsSearchTerm.toLowerCase()) ||
                      pet.breed.toLowerCase().includes(petsSearchTerm.toLowerCase())
                    );
                    
                    return filteredPets.length === 0 ? (
                      <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>{petsSearchTerm ? 'No pets match your search' : 'No pets found'}</Text>
                      </View>
                    ) : (
                      filteredPets.map((pet, petIndex) => (
                        <TouchableOpacity key={pet.id} style={styles.tableRow} onPress={() => {
                          console.log('Pet clicked:', pet);
                          setSelectedPetDetail(pet);
                        }}>
                          <Text style={styles.cellId}>{petIndex + 1}</Text>
                          <Text style={styles.cellName}>{pet.name}</Text>
                          <Text style={styles.cell}>{pet.type}</Text>
                          <Text style={styles.cell}>{pet.breed}</Text>
                        </TouchableOpacity>
                      ))
                    );
                  })()}
                </View>
              </View>
            </View>
          </ScrollView>

        ) : selectedPetDetail ? (
          <ScrollView style={styles.detailScrollView}>
            <View style={styles.tableContainer}>
              <View style={styles.detailTable}>
                <View style={styles.tableTopRow}>
                  <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.returnButton} onPress={() => setSelectedPetDetail(null)}>
                      <Image source={require('@/assets/return-arrow.svg')} style={styles.returnIcon} />
                    </TouchableOpacity>
                    <Text style={styles.detailTitle}>Pet Details</Text>
                  </View>
                  <TouchableOpacity style={styles.editButton}>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tableHeader}>
                  <Text style={styles.headerCellName}>Field</Text>
                  <Text style={styles.headerCellName}>Value</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Pet Name</Text>
                  <Text style={styles.cellName}>{selectedPetDetail.name}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Animal Type</Text>
                  <Text style={styles.cellName}>{selectedPetDetail.type}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Breed</Text>
                  <Text style={styles.cellName}>{selectedPetDetail.breed}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Owner</Text>
                  <Text style={styles.cellName}>{selectedCustomer?.name || 'N/A'}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Status</Text>
                  <Text style={styles.cellName}>Active</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Registration Date</Text>
                  <Text style={styles.cellName}>Jan 15, 2023</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.petsSection}>
              <View style={styles.petsHeader}>
                <Text style={styles.sectionTitle}>Medical History</Text>
                <View style={styles.petsHeaderActions}>
                  <TouchableOpacity style={styles.addButton} onPress={() => {
                    setShowAddRecordDrawer(true);
                    Animated.timing(addRecordDrawerAnimation, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: false,
                    }).start();
                  }}>
                    <Image source={require('@/assets/ic_round-plus.png')} style={styles.addIcon} />
                    <Text style={styles.addButtonText}>Add Record</Text>
                  </TouchableOpacity>
                  <View style={styles.searchContainer}>
                    <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
                    <TextInput 
                      style={styles.searchInput}
                      placeholder="Search records..."
                      placeholderTextColor="#999"
                      value={medicalHistorySearchTerm}
                      onChangeText={setMedicalHistorySearchTerm}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.tableContainer}>
                <View style={styles.petsTable}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.headerCellId}>Order</Text>
                    <Text style={styles.headerCellName}>Date</Text>
                    <Text style={styles.headerCell}>Category</Text>
                    <Text style={styles.headerCell}>Form Name</Text>
                  </View>
                  {(() => {
                    const records = petMedicalHistory[selectedPetDetail.id] || [];
                    const filteredRecords = records.filter(record =>
                      (record.date || '').toLowerCase().includes(medicalHistorySearchTerm.toLowerCase()) ||
                      (record.category || '').toLowerCase().includes(medicalHistorySearchTerm.toLowerCase()) ||
                      (record.formType || '').toLowerCase().includes(medicalHistorySearchTerm.toLowerCase())
                    );
                    
                    return filteredRecords.length === 0 ? (
                      <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>{medicalHistorySearchTerm ? 'No records match your search' : 'No medical records found'}</Text>
                      </View>
                    ) : (
                      filteredRecords.map((record, recordIndex) => (
                        <TouchableOpacity key={record.id} style={styles.tableRow} onPress={() => setSelectedMedicalRecord(record)}>
                          <Text style={styles.cellId}>{recordIndex + 1}</Text>
                          <Text style={styles.cellName}>{record.date || 'N/A'}</Text>
                          <Text style={styles.cell}>{record.category || 'No Category'}</Text>
                          <Text style={styles.cell}>{record.formType || 'N/A'}</Text>
                        </TouchableOpacity>
                      ))
                    );
                  })()}
                </View>
              </View>
            </View>
          </ScrollView>
        ) : null}
        </View>
      </ScrollView>
      
      {showAddDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addDrawerAnimation }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Customer</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(addDrawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowAddDrawer(false));
                }}>
                  <Image source={require('@/assets/Vector (1).png')} style={styles.drawerCloseIcon} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Surname *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter surname"
                  placeholderTextColor="#ccc"
                  value={newCustomer.surname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, surname: text})}
                />
                
                <Text style={styles.fieldLabel}>First Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter first name"
                  placeholderTextColor="#ccc"
                  value={newCustomer.firstname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, firstname: text})}
                />
                
                <Text style={styles.fieldLabel}>Contact Number *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter contact number"
                  placeholderTextColor="#ccc"
                  keyboardType="phone-pad"
                  value={newCustomer.contact}
                  onChangeText={(text) => setNewCustomer({...newCustomer, contact: text})}
                />
                
                <Text style={styles.fieldLabel}>Email Address *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter email address"
                  placeholderTextColor="#ccc"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={newCustomer.email}
                  onChangeText={(text) => setNewCustomer({...newCustomer, email: text})}
                />
                
                <Text style={styles.fieldLabel}>Complete Address *</Text>
                <TextInput
                  style={[styles.modalInput, styles.addressInput]}
                  placeholder="Enter complete address"
                  placeholderTextColor="#ccc"
                  multiline
                  numberOfLines={3}
                  value={newCustomer.address}
                  onChangeText={(text) => setNewCustomer({...newCustomer, address: text})}
                />
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  Animated.timing(addDrawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowAddDrawer(false));
                }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddCustomer}>
                  <Text style={styles.saveButtonText}>Add Customer</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
      
      {showAddRecordDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addRecordDrawerAnimation }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add Medical Record</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(addRecordDrawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowAddRecordDrawer(false));
                }}>
                  <Image source={require('@/assets/Vector (1).png')} style={styles.drawerCloseIcon} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm} showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Category *</Text>
                <View style={styles.categoryDropdownContainer}>
                  <TouchableOpacity style={styles.drawerDropdown} onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}>
                    <Text style={styles.drawerDropdownText}>{newMedicalRecord.category || 'Select Category'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showCategoryDropdown && (
                    <View style={styles.categoryDropdownMenu}>
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                        {firebaseMedicalCategories.map((category) => (
                          <TouchableOpacity
                            key={category.id}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewMedicalRecord({...newMedicalRecord, category: category.name, formTemplate: ''});
                              setShowCategoryDropdown(false);
                              setShowFormDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{category.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Form Template *</Text>
                <View style={styles.formDropdownContainer}>
                  <TouchableOpacity 
                    style={[styles.drawerDropdown, !newMedicalRecord.category && styles.disabledDropdown]} 
                    onPress={() => newMedicalRecord.category && setShowFormDropdown(!showFormDropdown)}
                  >
                    <Text style={styles.drawerDropdownText}>{newMedicalRecord.formTemplate || 'Select Form Template'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showFormDropdown && newMedicalRecord.category && (
                    <View style={styles.formDropdownMenu}>
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                        {(() => {
                          const filteredForms = firebaseMedicalForms.filter(form => {
                            return form.category === newMedicalRecord.category ||
                                   form.categoryName === newMedicalRecord.category ||
                                   (form.category && form.category.name === newMedicalRecord.category);
                          });
                          
                          if (filteredForms.length === 0) {
                            return (
                              <TouchableOpacity style={styles.dropdownOption}>
                                <Text style={styles.dropdownOptionText}>No forms for this category</Text>
                              </TouchableOpacity>
                            );
                          }
                          
                          return filteredForms.map((form) => (
                            <TouchableOpacity
                              key={form.id}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setNewMedicalRecord({...newMedicalRecord, formTemplate: form.name || form.formName});
                                setShowFormDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{form.name || form.formName}</Text>
                            </TouchableOpacity>
                          ));
                        })()}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  Animated.timing(addRecordDrawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowAddRecordDrawer(false));
                }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, (!newMedicalRecord.category || !newMedicalRecord.formTemplate) && styles.disabledButton]} 
                  onPress={async () => {
                    if (newMedicalRecord.category && newMedicalRecord.formTemplate) {
                      try {
                        const formFields = await getFormFields(newMedicalRecord.formTemplate, userEmail);
                        
                        const initialFormData = {};
                        if (selectedPetDetail && selectedCustomer) {
                          const petNameField = formFields.find(f => f.label?.toLowerCase().includes('pet name') || f.label?.toLowerCase().includes('name'));
                          if (petNameField) initialFormData[petNameField.id] = selectedPetDetail.name;
                          
                          const ownerNameField = formFields.find(f => f.label?.toLowerCase().includes('owner'));
                          if (ownerNameField) initialFormData[ownerNameField.id] = selectedCustomer.name;
                        }
                        
                        setFormFieldValues(initialFormData);
                        setSelectedMedicalForm({
                          formTemplate: newMedicalRecord.formTemplate,
                          fields: formFields
                        });
                        setNewMedicalRecord({ category: '', formTemplate: '' });
                        Animated.timing(addRecordDrawerAnimation, {
                          toValue: -350,
                          duration: 300,
                          useNativeDriver: false,
                        }).start(() => setShowAddRecordDrawer(false));
                      } catch (error) {
                        console.error('Error fetching form fields:', error);
                        alert('Error loading form fields');
                      }
                    }
                  }}
                >
                  <Text style={styles.saveButtonText}>Open Form</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
      
      {showAddPetDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addPetDrawerAnimation }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Pet</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(addPetDrawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowAddPetDrawer(false));
                }}>
                  <Image source={require('@/assets/Vector (1).png')} style={styles.drawerCloseIcon} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Pet Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter pet name"
                  placeholderTextColor="#ccc"
                  value={newPet.name}
                  onChangeText={(text) => setNewPet({...newPet, name: text})}
                />
                
                <Text style={styles.fieldLabel}>Animal Type *</Text>
                <View style={styles.categoryDropdownContainer}>
                  <TouchableOpacity style={styles.drawerDropdown} onPress={() => setShowAnimalTypeDropdown(!showAnimalTypeDropdown)}>
                    <Text style={styles.drawerDropdownText}>{newPet.type || 'Select Animal Type'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showAnimalTypeDropdown && (
                    <View style={styles.categoryDropdownMenu}>
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                        {animalTypes.map((type) => (
                          <TouchableOpacity
                            key={type.id}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewPet({...newPet, type: type.name, breed: breedsByType[type.name] ? breedsByType[type.name][0] : ''});
                              setShowAnimalTypeDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{type.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Breed *</Text>
                <View style={styles.formDropdownContainer}>
                  <TouchableOpacity 
                    style={[styles.drawerDropdown, !newPet.type && styles.disabledDropdown]} 
                    onPress={() => newPet.type && setShowBreedDropdown(!showBreedDropdown)}
                  >
                    <Text style={styles.drawerDropdownText}>{newPet.breed || 'Select Breed'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showBreedDropdown && newPet.type && (
                    <View style={styles.formDropdownMenu}>
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                        {(breedsByType[newPet.type] || []).map((breed, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewPet({...newPet, breed: breed});
                              setShowBreedDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{breed}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  Animated.timing(addPetDrawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowAddPetDrawer(false));
                }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={async () => {
                  if (newPet.name && newPet.type && newPet.breed && selectedCustomer) {
                    try {
                      const pet = {
                        name: newPet.name,
                        type: newPet.type,
                        breed: newPet.breed,
                        owner: selectedCustomer.id
                      };
                      
                      const savedPet = await addPet(pet, userEmail);
                      
                      const updatedPetsList = {
                        ...customerPetsList,
                        [selectedCustomer.id]: [...(customerPetsList[selectedCustomer.id] || []), savedPet]
                      };
                      setCustomerPetsList(updatedPetsList);
                      setNewPet({ name: '', type: '', breed: '' });
                      
                      Animated.timing(addPetDrawerAnimation, {
                        toValue: -350,
                        duration: 300,
                        useNativeDriver: false,
                      }).start(() => setShowAddPetDrawer(false));
                    } catch (error) {
                      console.error('Error adding pet:', error);
                      alert('Error adding pet');
                    }
                  }
                }}>
                  <Text style={styles.saveButtonText}>Add Pet</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
      
      {selectedMedicalForm && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.floatingModalOverlay}>
            <View style={styles.floatingModal}>
              <View style={styles.floatingModalHeader}>
                <Text style={styles.floatingModalTitle}>{selectedMedicalForm.formTemplate}</Text>
                <TouchableOpacity style={styles.floatingModalCloseButton} onPress={() => setSelectedMedicalForm(null)}>
                  <Text style={styles.floatingModalCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.previewScrollView} showsVerticalScrollIndicator={false}>
                {selectedMedicalForm.fields.map((field) => (
                  <View key={field.id} style={styles.previewFieldContainer}>
                    <Text style={styles.previewFieldLabel}>{field.label} {field.required && '*'}</Text>
                    {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                      <TextInput
                        style={styles.previewInput}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        placeholderTextColor="#999"
                        value={formFieldValues[field.id] || ''}
                        onChangeText={(text) => setFormFieldValues({...formFieldValues, [field.id]: text})}
                        keyboardType={field.type === 'email' ? 'email-address' : field.type === 'number' ? 'numeric' : 'default'}
                        autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
                      />
                    ) : field.type === 'textarea' ? (
                      <TextInput
                        style={[styles.previewInput, styles.previewTextarea]}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        placeholderTextColor="#999"
                        value={formFieldValues[field.id] || ''}
                        onChangeText={(text) => setFormFieldValues({...formFieldValues, [field.id]: text})}
                        multiline
                        numberOfLines={3}
                      />
                    ) : field.type === 'select' ? (
                      <View style={styles.categoryDropdownContainer}>
                        <TouchableOpacity style={styles.previewDropdown} onPress={() => {
                          const dropdownKey = `dropdown_${field.id}`;
                          setFormFieldValues({...formFieldValues, [dropdownKey]: !formFieldValues[dropdownKey]});
                        }}>
                          <Text style={styles.previewPlaceholder}>{formFieldValues[field.id] || field.placeholder || 'Select option'}</Text>
                          <Text style={styles.previewDropdownArrow}>▼</Text>
                        </TouchableOpacity>
                        {formFieldValues[`dropdown_${field.id}`] && (
                          <View style={styles.categoryDropdownMenu}>
                            <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                              {field.options?.map((option, index) => (
                                <TouchableOpacity
                                  key={index}
                                  style={styles.dropdownOption}
                                  onPress={() => {
                                    setFormFieldValues({
                                      ...formFieldValues, 
                                      [field.id]: option,
                                      [`dropdown_${field.id}`]: false
                                    });
                                  }}
                                >
                                  <Text style={styles.dropdownOptionText}>{option}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    ) : field.type === 'date' ? (
                      <TextInput
                        style={styles.previewInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#999"
                        value={formFieldValues[field.id] || ''}
                        onChangeText={(text) => setFormFieldValues({...formFieldValues, [field.id]: text})}
                      />
                    ) : null}
                  </View>
                ))}
              </ScrollView>
              
              <View style={styles.floatingModalButtons}>
                <TouchableOpacity style={styles.floatingCancelButton} onPress={() => setSelectedMedicalForm(null)}>
                  <Text style={styles.floatingCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.floatingSaveButton} onPress={async () => {
                  try {
                    // Filter out empty values from formFieldValues
                    const filteredFormData = {};
                    Object.entries(formFieldValues).forEach(([key, value]) => {
                      if (value && value.toString().trim() !== '' && !key.startsWith('dropdown_')) {
                        filteredFormData[key] = value;
                      }
                    });
                    
                    const recordData = {
                      petId: selectedPetDetail.id,
                      formType: selectedMedicalForm.formTemplate,
                      date: new Date().toLocaleDateString(),
                      formData: filteredFormData,
                    };
                    
                    // Only add these fields if they have values
                    if (formFieldValues.treatment && formFieldValues.treatment.trim()) {
                      recordData.treatment = formFieldValues.treatment;
                    }
                    if (formFieldValues.veterinarian && formFieldValues.veterinarian.trim()) {
                      recordData.veterinarian = formFieldValues.veterinarian;
                    }
                    if (formFieldValues.diagnosis && formFieldValues.diagnosis.trim()) {
                      recordData.diagnosis = formFieldValues.diagnosis;
                    }
                    
                    const savedRecord = await addMedicalRecord(recordData, userEmail);
                    
                    const updatedHistory = {
                      ...petMedicalHistory,
                      [selectedPetDetail.id]: [...(petMedicalHistory[selectedPetDetail.id] || []), savedRecord]
                    };
                    setPetMedicalHistory(updatedHistory);
                    
                    setFormFieldValues({});
                    setSelectedMedicalForm(null);
                    alert('Medical record saved successfully!');
                  } catch (error) {
                    console.error('Error saving medical record:', error);
                    alert('Error saving medical record');
                  }
                }}>
                  <Text style={styles.floatingSaveButtonText}>Save Record</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      
      {selectedMedicalRecord && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.floatingModalOverlay}>
            <View style={styles.floatingModal}>
              <View style={styles.floatingModalHeader}>
                <Text style={styles.floatingModalTitle}>{selectedMedicalRecord.formType}</Text>
                <TouchableOpacity style={styles.floatingModalCloseButton} onPress={() => setSelectedMedicalRecord(null)}>
                  <Text style={styles.floatingModalCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.previewScrollView} showsVerticalScrollIndicator={false}>
                {selectedMedicalRecord.formData && Object.entries(selectedMedicalRecord.formData).map(([key, value]) => (
                  <View key={key} style={styles.previewFieldContainer}>
                    <Text style={styles.previewFieldLabel}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</Text>
                    <View style={styles.readOnlyField}>
                      <Text style={styles.readOnlyText}>{value}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
              
              <View style={styles.floatingModalButtons}>
                <TouchableOpacity style={[styles.floatingCancelButton, { flex: 1 }]} onPress={() => setSelectedMedicalRecord(null)}>
                  <Text style={styles.floatingCancelButtonText}>Close</Text>
                </TouchableOpacity>
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
  scrollContainer: {
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
    minHeight: 400,
  },
  detailTable: {
    backgroundColor: '#fff',
    minHeight: 'auto',
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
  headerCellId: {
    width: 50,
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
  cellId: {
    width: 50,
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
  dropdownContainer: {
    position: 'relative',
    zIndex: 1001,
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
  returnIcon: {
    width: 16,
    height: 16,
    tintColor: '#ffffff',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  editButton: {
    backgroundColor: '#007BFF',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteButton: {
    backgroundColor: '#DC3545',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  petsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#800000',
  },
  petsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  petsHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  detailScrollView: {
    flex: 1,
  },
  petsTable: {
    backgroundColor: '#fff',
    height: 300,
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
  addressInput: {
    height: 80,
    textAlignVertical: 'top',
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 300,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  formDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#800000',
    marginTop: 20,
    marginBottom: 10,
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
    fontSize: 12,
    color: '#333',
  },
  categoryDropdownContainer: {
    position: 'relative',
    zIndex: 3000,
  },
  formDropdownContainer: {
    position: 'relative',
    zIndex: 2000,
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
    zIndex: 3001,
    elevation: 30,
    maxHeight: 150,
  },
  formDropdownMenu: {
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
  },
  disabledDropdown: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  drawerCloseIcon: {
    width: 16,
    height: 16,
    tintColor: '#800000',
  },
  formFieldContainer: {
    marginBottom: 20,
  },
  readOnlyField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
  },
  readOnlyText: {
    fontSize: 12,
    color: '#333',
  },

  previewScrollView: {
    maxHeight: 500,
  },
  previewFieldContainer: {
    marginBottom: 15,
  },
  previewFieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  previewInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff',
    fontSize: 11,
    color: '#333',
  },
  previewTextarea: {
    height: 60,
  },
  previewDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff',
  },
  previewDropdownArrow: {
    fontSize: 10,
    color: '#666',
  },
  previewPlaceholder: {
    fontSize: 11,
    color: '#333',
  },
  floatingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  floatingModal: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 20,
    maxHeight: 600,
    width: '95%',
    maxWidth: 800,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 15,
  },
  floatingModalHeader: {
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingModalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#800000',
    textAlign: 'center',
    flex: 1,
  },
  floatingModalCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingModalCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  floatingModalButtons: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  floatingCancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  floatingCancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 12,
  },
  floatingSaveButton: {
    flex: 1,
    backgroundColor: '#23C062',
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  floatingSaveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});