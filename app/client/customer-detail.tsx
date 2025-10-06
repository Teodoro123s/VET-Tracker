import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, Animated } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getCustomerById, getPets, updateCustomer, deleteCustomerWithPets, addPet, getAnimalTypes, getBreeds } from '@/lib/services/firebaseService';
import { useTenant } from '@/contexts/TenantContext';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams();
  const { userEmail } = useTenant();
  const [customer, setCustomer] = useState(null);
  const [pets, setPets] = useState([]);
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [petSearchTerm, setPetSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'species' or 'breed'
  const [customValue, setCustomValue] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editSlideAnim] = useState(new Animated.Value(-350));
  const [petSlideAnim] = useState(new Animated.Value(-350));
  const [editCustomer, setEditCustomer] = useState({
    firstname: '',
    surname: '',
    email: '',
    contact: '',
    address: ''
  });
  const [newPet, setNewPet] = useState({
    name: '',
    species: '',
    breed: '',
    age: '',
    owner: id as string
  });

  useEffect(() => {
    if (id && userEmail) {
      loadData();
    }
  }, [id, userEmail]);

  const loadData = async () => {
    try {
      const [customerData, allPets, speciesData, breedsData] = await Promise.all([
        getCustomerById(userEmail, id as string),
        getPets(userEmail),
        getAnimalTypes(userEmail),
        getBreeds(userEmail)
      ]);
      setCustomer(customerData);
      setPets(allPets.filter(pet => pet.owner === id || pet.ownerId === id));
      setSpecies(speciesData);
      setBreeds(breedsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPets = pets.filter(pet => 
    pet.name.toLowerCase().includes(petSearchTerm.toLowerCase()) ||
    (pet.species && pet.species.toLowerCase().includes(petSearchTerm.toLowerCase())) ||
    (pet.breed && pet.breed.toLowerCase().includes(petSearchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredPets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPets = filteredPets.slice(startIndex, endIndex);

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

  const handleEdit = () => {
    // Parse name field if it exists in "surname, firstname" format
    let firstname = customer.firstname || '';
    let surname = customer.surname || '';
    
    if (customer.name && !firstname && !surname) {
      const nameParts = customer.name.split(', ');
      if (nameParts.length === 2) {
        surname = nameParts[0];
        firstname = nameParts[1];
      } else {
        // If not in expected format, put entire name in firstname
        firstname = customer.name;
      }
    }
    
    setEditCustomer({
      firstname: firstname,
      surname: surname,
      email: customer.email || '',
      contact: customer.contact || '',
      address: customer.address || ''
    });
    setShowEditModal(true);
    editSlideAnim.setValue(-350);
    Animated.timing(editSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSaveEdit = async () => {
    try {
      if (!editCustomer.firstname || !editCustomer.surname) {
        Alert.alert('Error', 'Please fill in first name and surname');
        return;
      }
      
      await updateCustomer(id as string, editCustomer, userEmail);
      
      // Update local customer state immediately
      setCustomer(prev => ({ ...prev, ...editCustomer }));
      
      Animated.timing(editSlideAnim, {
        toValue: -350,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowEditModal(false));
      
      Alert.alert('Success', 'Customer updated successfully');
    } catch (error) {
      console.error('Error updating customer:', error);
      Alert.alert('Error', 'Failed to update customer');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Customer',
      'Are you sure you want to delete this customer and all their pets? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete }
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      await deleteCustomerWithPets(id as string, userEmail);
      Alert.alert('Success', 'Customer deleted successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete customer');
    }
  };

  const handleAddPet = () => {
    setShowAddPetModal(true);
    petSlideAnim.setValue(-350);
    Animated.timing(petSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSavePet = async () => {
    try {
      if (!newPet.name) {
        Alert.alert('Error', 'Please enter pet name');
        return;
      }
      
      await addPet(newPet, userEmail);
      Animated.timing(petSlideAnim, {
        toValue: -350,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowAddPetModal(false));
      setNewPet({ name: '', species: '', breed: '', age: '', owner: id as string });
      loadData();
      Alert.alert('Success', 'Pet added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add pet');
    }
  };



  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading customer details...</Text>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.container}>
        <Text>Customer not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Customer Details</Text>
        <View style={styles.headerActions}>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.tableContainer}>
          <View style={styles.table}>
            <View style={styles.returnRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.returnButton}>
                <Text style={styles.returnIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.returnText}></Text>
              <Text style={styles.returnText}></Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Field</Text>
              <Text style={styles.headerCell}>Value</Text>
            </View>
            
            <View style={styles.tableBody}>
              <View style={styles.tableRow}>
                <Text style={styles.cell}>Name</Text>
                <Text style={styles.cell}>{customer.name || `${customer.firstname || ''} ${customer.surname || ''}`}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.cell}>Contact</Text>
                <Text style={styles.cell}>{customer.contact || 'N/A'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.cell}>Email</Text>
                <Text style={styles.cell}>{customer.email || 'N/A'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.cell}>Address</Text>
                <Text style={styles.cell}>{customer.address || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.petsSection}>
          <View style={styles.petsHeader}>
            <Text style={styles.petsTitle}>Pets</Text>
            <View style={styles.petsHeaderActions}>
              <TouchableOpacity style={styles.addPetButton} onPress={handleAddPet}>
                <Text style={styles.addPetButtonText}>+ Add Pet</Text>
              </TouchableOpacity>
              <View style={styles.petSearchContainer}>
                <TextInput 
                  style={styles.petSearchInput}
                  placeholder="Search pets..."
                  value={petSearchTerm}
                  onChangeText={(text) => {
                    setPetSearchTerm(text);
                    setCurrentPage(1);
                  }}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.tableContainer}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.headerCell}>Name</Text>
                <Text style={styles.headerCell}>Species</Text>
                <Text style={styles.headerCell}>Breed</Text>
              </View>
              
              {filteredPets.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>
                  {pets.length === 0 ? 'No pets registered' : 'No pets found'}
                </Text>
                </View>
              ) : itemsPerPage >= 20 ? (
                <ScrollView style={styles.tableBody}>
                  {currentPets.map((pet) => (
                    <TouchableOpacity 
                      key={pet.id} 
                      style={styles.tableRow} 
                      activeOpacity={0.7}
                      onPress={() => router.push(`/client/pet-detail?id=${pet.id}`)}
                    >
                      <Text style={styles.cell}>{pet.name}</Text>
                      <Text style={styles.cell}>{pet.species || 'N/A'}</Text>
                      <Text style={styles.cell}>{pet.breed || 'N/A'}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                currentPets.map((pet) => (
                  <TouchableOpacity 
                    key={pet.id} 
                    style={styles.tableRow} 
                    activeOpacity={0.7}
                    onPress={() => router.push(`/client/pet-detail?id=${pet.id}`)}
                  >
                    <Text style={styles.cell}>{pet.name}</Text>
                    <Text style={styles.cell}>{pet.species || 'N/A'}</Text>
                    <Text style={styles.cell}>{pet.breed || 'N/A'}</Text>
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
      </View>

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
                <TouchableOpacity style={styles.drawerSaveButton} onPress={handleSaveEdit}>
                  <Text style={styles.drawerSaveText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {showAddPetModal && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: petSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Pet</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(petSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddPetModal(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Pet Name *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter pet name"
                  value={newPet.name}
                  onChangeText={(text) => setNewPet({...newPet, name: text})}
                />
                
                <Text style={styles.fieldLabel}>Species</Text>
                <View style={[styles.dropdownContainer, { zIndex: 3000 }]}>
                  <TouchableOpacity 
                    style={styles.petDropdown}
                    onPress={() => {
                      setShowSpeciesDropdown(!showSpeciesDropdown);
                      setShowBreedDropdown(false);
                    }}
                  >
                    <Text style={styles.petDropdownText}>{newPet.species || 'Select species'}</Text>
                    <Text style={styles.petDropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showSpeciesDropdown && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {species.sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
                          <TouchableOpacity 
                            key={item.id}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewPet({...newPet, species: item.name});
                              setShowSpeciesDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{item.name}</Text>
                            <View style={styles.optionActions}>
                              <TouchableOpacity 
                                style={styles.editIcon}
                                onPress={() => {
                                  setEditingItem(item);
                                  setEditValue(item.name);
                                  setModalType('species');
                                  setShowSpeciesDropdown(false);
                                  setShowEditItemModal(true);
                                }}
                              >
                                <Text style={styles.iconText}>✏</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.deleteIcon}>
                                <Text style={styles.iconText}>🗑</Text>
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity 
                          style={styles.customOption}
                          onPress={() => {
                            setModalType('species');
                            setCustomValue('');
                            setShowSpeciesDropdown(false);
                            setShowCustomModal(true);
                          }}
                        >
                          <Text style={styles.customOptionText}>+ Add Custom Species</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Breed</Text>
                <View style={[styles.dropdownContainer, { zIndex: 2000 }]}>
                  <TouchableOpacity 
                    style={styles.petDropdown}
                    onPress={() => {
                      setShowBreedDropdown(!showBreedDropdown);
                      setShowSpeciesDropdown(false);
                    }}
                  >
                    <Text style={styles.petDropdownText}>{newPet.breed || 'Select breed'}</Text>
                    <Text style={styles.petDropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showBreedDropdown && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {breeds.sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
                          <TouchableOpacity 
                            key={item.id}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewPet({...newPet, breed: item.name});
                              setShowBreedDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{item.name}</Text>
                            <View style={styles.optionActions}>
                              <TouchableOpacity 
                                style={styles.editIcon}
                                onPress={() => {
                                  setEditingItem(item);
                                  setEditValue(item.name);
                                  setModalType('breed');
                                  setShowBreedDropdown(false);
                                  setShowEditItemModal(true);
                                }}
                              >
                                <Text style={styles.iconText}>✏</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.deleteIcon}>
                                <Text style={styles.iconText}>🗑</Text>
                              </TouchableOpacity>
                            </View>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity 
                          style={styles.customOption}
                          onPress={() => {
                            setModalType('breed');
                            setCustomValue('');
                            setShowBreedDropdown(false);
                            setShowCustomModal(true);
                          }}
                        >
                          <Text style={styles.customOptionText}>+ Add Custom Breed</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </View>
                

              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  Animated.timing(petSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddPetModal(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={handleSavePet}>
                  <Text style={styles.drawerSaveText}>Add Pet</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {showCustomModal && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.floatingModalOverlay}>
            <View style={styles.floatingModal}>
              <Text style={styles.floatingModalTitle}>Add Custom {modalType === 'species' ? 'Species' : 'Breed'}</Text>
              <TextInput
                style={styles.floatingModalInput}
                placeholder={`Enter ${modalType} name`}
                value={customValue}
                onChangeText={setCustomValue}
                autoFocus
              />
              <View style={styles.floatingModalButtons}>
                <TouchableOpacity 
                  style={styles.floatingModalCancel}
                  onPress={() => setShowCustomModal(false)}
                >
                  <Text style={styles.floatingModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.floatingModalSave}
                  onPress={() => {
                    if (customValue.trim()) {
                      if (modalType === 'species') {
                        setNewPet({...newPet, species: customValue.trim()});
                      } else {
                        setNewPet({...newPet, breed: customValue.trim()});
                      }
                    }
                    setShowCustomModal(false);
                  }}
                >
                  <Text style={styles.floatingModalSaveText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showEditItemModal && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.floatingModalOverlay}>
            <View style={styles.floatingModal}>
              <Text style={styles.floatingModalTitle}>Edit {modalType === 'species' ? 'Species' : 'Breed'}</Text>
              <TextInput
                style={styles.floatingModalInput}
                placeholder={`Enter ${modalType} name`}
                value={editValue}
                onChangeText={setEditValue}
                autoFocus
              />
              <View style={styles.floatingModalButtons}>
                <TouchableOpacity 
                  style={styles.floatingModalCancel}
                  onPress={() => setShowEditItemModal(false)}
                >
                  <Text style={styles.floatingModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.floatingModalSave}
                  onPress={() => {
                    // Here you would typically update the item in Firebase
                    // For now, just close the modal
                    setShowEditItemModal(false);
                  }}
                >
                  <Text style={styles.floatingModalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  scrollContent: {
    flexGrow: 1,
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
  },
  backButton: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
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
  petsSection: {
    marginTop: 20,
  },
  petsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  petsHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  petSearchContainer: {
    borderWidth: 2,
    borderColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  petSearchInput: {
    width: 150,
    fontSize: 12,
  },
  petsTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#800000',
  },
  addPetButton: {
    backgroundColor: '#23C062',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addPetButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  returnRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  returnButton: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  returnIcon: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  returnText: {
    flex: 1,
  },
  actionButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007bff',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  actionButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
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

  dropdownContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  petDropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  petDropdownText: {
    fontSize: 12,
    color: '#555',
  },
  petDropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 150,
    zIndex: 3001,
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 5,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  optionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editIcon: {
    padding: 4,
  },
  deleteIcon: {
    padding: 4,
  },
  iconText: {
    fontSize: 12,
  },
  customOption: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  customOptionText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: 'bold',
  },
  floatingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  floatingModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  floatingModalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
    marginBottom: 20,
  },
  floatingModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  floatingModalCancel: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  floatingModalCancelText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  floatingModalSave: {
    flex: 1,
    backgroundColor: '#23C062',
    paddingVertical: 12,
    borderRadius: 8,
  },
  floatingModalSaveText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});