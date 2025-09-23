import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Image, Animated } from 'react-native';
import SearchableDropdown from '@/components/SearchableDropdown';
import { getCustomers, getPets, addCustomer, addPet, addMedicalRecord, deleteCustomerWithPets, getMedicalCategories, getMedicalForms, getMedicalRecords, getFormFields } from '../lib/firebaseService';
import { useTenant } from '../contexts/TenantContext';

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
  
  const [petMedicalHistory, setPetMedicalHistory] = useState({
    1: [
      { 
        id: 1, 
        formType: 'Dog Vaccination Form',
        date: 'Dec 10, 2023', 
        treatment: 'Vaccination', 
        veterinarian: 'Dr. Smith', 
        formData: {
          vaccineType: 'DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)',
          administrationDate: 'Dec 10, 2023',
          nextDueDate: 'Dec 10, 2024',
          veterinarian: 'Dr. Smith',
          notes: 'Annual vaccines updated - dog showed no adverse reactions'
        },
        diagnosis: 'Preventive Care', 
        symptoms: 'None', 
        medications: 'DHPP vaccine', 
        followUp: 'Next vaccination in 1 year', 
        cost: '$95.00' 
      }
    ]
  });
  
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
  const [customerPetsList, setCustomerPetsList] = useState(customerPets);
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
                <TouchableOpacity style={styles.addButton}>
                  <Image source={require('@/assets/ic_round-plus.png')} style={styles.addIcon} />
                  <Text style={styles.addButtonText}>Add Pet</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tableContainer}>
                <View style={styles.petsTable}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.headerCellId}>Order</Text>
                    <Text style={styles.headerCellName}>Name</Text>
                    <Text style={styles.headerCell}>Type</Text>
                    <Text style={styles.headerCell}>Breed</Text>
                  </View>
                  {(customerPetsList[selectedCustomer.id] || []).map((pet, petIndex) => (
                    <TouchableOpacity key={pet.id} style={styles.tableRow} onPress={() => setSelectedPetDetail(pet)}>
                      <Text style={styles.cellId}>{petIndex + 1}</Text>
                      <Text style={styles.cellName}>{pet.name}</Text>
                      <Text style={styles.cell}>{pet.type}</Text>
                      <Text style={styles.cell}>{pet.breed}</Text>
                    </TouchableOpacity>
                  ))}
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
              </View>
            </View>
            
            <View style={styles.petsSection}>
              <View style={styles.petsHeader}>
                <Text style={styles.sectionTitle}>Medical History</Text>
                <TouchableOpacity style={styles.addButton}>
                  <Image source={require('@/assets/ic_round-plus.png')} style={styles.addIcon} />
                  <Text style={styles.addButtonText}>Add Record</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tableContainer}>
                <View style={styles.petsTable}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.headerCellId}>Order</Text>
                    <Text style={styles.headerCellName}>Date</Text>
                    <Text style={styles.headerCell}>Treatment</Text>
                    <Text style={styles.headerCell}>Veterinarian</Text>
                    <Text style={styles.headerCell}>Diagnosis</Text>
                  </View>
                  {(petMedicalHistory[selectedPetDetail.id] || []).map((record, recordIndex) => (
                    <TouchableOpacity key={record.id} style={styles.tableRow} onPress={() => setSelectedMedicalRecord(record)}>
                      <Text style={styles.cellId}>{recordIndex + 1}</Text>
                      <Text style={styles.cellName}>{record.date}</Text>
                      <Text style={styles.cell}>{record.treatment}</Text>
                      <Text style={styles.cell}>{record.veterinarian}</Text>
                      <Text style={styles.cell}>{record.diagnosis}</Text>
                    </TouchableOpacity>
                  ))}
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
});