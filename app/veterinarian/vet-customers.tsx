/**
 * MOBILE VERSION - VETERINARIAN FOLDER
 * This is the MOBILE/ANDROID interface for veterinarian customers management
 * Used on mobile devices (Android/iOS)
 * Path: /app/veterinarian/vet-customers.tsx
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { getCustomers, addCustomer, getPets, getMedicalRecords, addPet, addMedicalRecord, getAnimalTypes, addAnimalType, getBreeds, addBreed, deleteAnimalType, deleteBreed } from '@/lib/services/firebaseService';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useCustomer } from '../_layout';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/config/firebaseConfig';

export default function VetCustomers() {
  const { user } = useAuth();
  const router = useRouter();
  const [tenantEmail, setTenantEmail] = useState('');
  const { 
    selectedCustomer, setSelectedCustomer, 
    showPetsView, setShowPetsView, 
    selectedPet, setSelectedPet, 
    showMedicalView, setShowMedicalView,
    selectedMedicalRecord, setSelectedMedicalRecord
  } = useCustomer();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [showCustomTypeModal, setShowCustomTypeModal] = useState(false);
  const [showCustomBreedModal, setShowCustomBreedModal] = useState(false);
  const [customType, setCustomType] = useState('');
  const [customBreed, setCustomBreed] = useState('');
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [petsSearchTerm, setPetsSearchTerm] = useState('');
  const [customerPets, setCustomerPets] = useState([]);
  const [medicalSearchTerm, setMedicalSearchTerm] = useState('');
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    surname: '',
    firstname: '',
    middlename: '',
    contact: '',
    email: '',
    address: ''
  });
  const [newPet, setNewPet] = useState({
    name: '',
    type: '',
    breed: ''
  });
  const [newRecord, setNewRecord] = useState({
    category: '',
    formTemplate: '',
    date: new Date().toLocaleDateString(),
    veterinarian: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    medications: '',
    followUp: '',
    cost: ''
  });
  
  const [animalTypes, setAnimalTypes] = useState([]);
  const [breedsByType, setBreedsByType] = useState({});
  
  const getBreedsByType = (type) => {
    return breedsByType[type] || [];
  };

  useEffect(() => {
    fetchTenantEmail();
    // Reset navigation states to show customer list by default
    setSelectedCustomer(null);
    setShowPetsView(false);
    setSelectedPet(null);
    setShowMedicalView(false);
    setSelectedMedicalRecord(null);
  }, [user]);
  
  useEffect(() => {
    if (tenantEmail) {
      loadCustomers();
    }
  }, [tenantEmail]);
  
  const fetchTenantEmail = async () => {
    if (!user?.email) return;
    
    try {
      const vetQuery = query(
        collection(db, 'veterinarians'),
        where('email', '==', user.email)
      );
      
      const vetSnapshot = await getDocs(vetQuery);
      
      if (!vetSnapshot.empty) {
        const vetData = vetSnapshot.docs[0].data();
        setTenantEmail(vetData.tenantEmail || user.email);
      } else {
        setTenantEmail(user.email);
      }
    } catch (error) {
      console.error('Error fetching tenant email:', error);
      setTenantEmail(user.email);
    }
  };
  
  useEffect(() => {
    if (selectedCustomer && tenantEmail) {
      loadCustomerPets();
    }
  }, [selectedCustomer, tenantEmail]);
  
  const loadCustomerPets = async () => {
    try {
      const allPets = await getPets(tenantEmail);
      const customerPetsList = allPets.filter(pet => pet.owner === selectedCustomer.name);
      setCustomerPets(customerPetsList);
    } catch (error) {
      console.error('Error loading pets:', error);
      setCustomerPets([]);
    }
  };
  
  useEffect(() => {
    if (selectedPet && tenantEmail) {
      loadMedicalRecords();
    }
  }, [selectedPet, tenantEmail]);
  
  const loadMedicalRecords = async () => {
    try {
      const allRecords = await getMedicalRecords(tenantEmail);
      const petRecords = allRecords.filter(record => record.petId === selectedPet.id || record.petName === selectedPet.name);
      setMedicalRecords(petRecords);
    } catch (error) {
      console.error('Error loading medical records:', error);
      setMedicalRecords([]);
    }
  };

  const loadCustomers = async () => {
    try {
      const [customersData, animalTypesData, breedsData] = await Promise.all([
        getCustomers(tenantEmail),
        getAnimalTypes(tenantEmail),
        getBreeds(tenantEmail)
      ]);
      
      setCustomers(customersData);
      
      // Load animal types from Firebase or initialize with defaults
      if (animalTypesData.length === 0) {
        const defaultTypes = [
          { name: 'Dog' },
          { name: 'Cat' },
          { name: 'Bird' },
          { name: 'Rabbit' }
        ];
        for (const type of defaultTypes) {
          await addAnimalType(type, tenantEmail);
        }
        const updatedTypes = await getAnimalTypes(tenantEmail);
        setAnimalTypes(updatedTypes);
      } else {
        setAnimalTypes(animalTypesData);
      }
      
      // Load breeds from Firebase or initialize with defaults
      if (breedsData.length === 0) {
        const defaultBreeds = [
          { animalType: 'Dog', name: 'Golden Retriever' },
          { animalType: 'Dog', name: 'Labrador' },
          { animalType: 'Dog', name: 'German Shepherd' },
          { animalType: 'Dog', name: 'Bulldog' },
          { animalType: 'Dog', name: 'Beagle' },
          { animalType: 'Cat', name: 'Persian' },
          { animalType: 'Cat', name: 'Siamese' },
          { animalType: 'Cat', name: 'Maine Coon' },
          { animalType: 'Cat', name: 'British Shorthair' },
          { animalType: 'Cat', name: 'Ragdoll' },
          { animalType: 'Bird', name: 'Budgerigar' },
          { animalType: 'Bird', name: 'Cockatiel' },
          { animalType: 'Bird', name: 'Canary' },
          { animalType: 'Bird', name: 'Lovebird' },
          { animalType: 'Bird', name: 'Conure' },
          { animalType: 'Rabbit', name: 'Holland Lop' },
          { animalType: 'Rabbit', name: 'Netherland Dwarf' },
          { animalType: 'Rabbit', name: 'Mini Rex' },
          { animalType: 'Rabbit', name: 'Lionhead' },
          { animalType: 'Rabbit', name: 'Flemish Giant' }
        ];
        for (const breed of defaultBreeds) {
          await addBreed(breed, tenantEmail);
        }
        const updatedBreeds = await getBreeds(tenantEmail);
        const breedsByTypeObj = {};
        updatedBreeds.forEach(breed => {
          if (!breedsByTypeObj[breed.animalType]) {
            breedsByTypeObj[breed.animalType] = [];
          }
          breedsByTypeObj[breed.animalType].push(breed.name);
        });
        setBreedsByType(breedsByTypeObj);
      } else {
        const breedsByTypeObj = {};
        breedsData.forEach(breed => {
          if (!breedsByTypeObj[breed.animalType]) {
            breedsByTypeObj[breed.animalType] = [];
          }
          breedsByTypeObj[breed.animalType].push(breed.name);
        });
        setBreedsByType(breedsByTypeObj);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.surname || !newCustomer.firstname || !newCustomer.contact || !newCustomer.email || !newCustomer.address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

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

      const savedCustomer = await addCustomer(customer, tenantEmail);
      await loadCustomers();
      setNewCustomer({ surname: '', firstname: '', middlename: '', contact: '', email: '', address: '' });
      setShowAddModal(false);
      Alert.alert('Success', 'Customer added successfully');
    } catch (error) {
      console.error('Error adding customer:', error);
      Alert.alert('Error', 'Failed to add customer');
    }
  };
  
  const handleAddPet = async () => {
    if (!newPet.name || !newPet.type) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      const pet = {
        name: newPet.name,
        type: newPet.type,
        breed: newPet.breed,
        owner: selectedCustomer.name
      };

      await addPet(pet, tenantEmail);
      await loadCustomerPets();
      setNewPet({ name: '', type: '', breed: '' });
      setShowAddPetModal(false);
      Alert.alert('Success', 'Pet added successfully');
    } catch (error) {
      console.error('Error adding pet:', error);
      Alert.alert('Error', 'Failed to add pet');
    }
  };
  
  const handleAddRecord = async () => {
    if (!newRecord.formTemplate || !newRecord.treatment || !newRecord.diagnosis) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      const record = {
        formType: newRecord.formTemplate,
        category: newRecord.category,
        date: newRecord.date,
        veterinarian: newRecord.veterinarian || user?.email,
        symptoms: newRecord.symptoms,
        diagnosis: newRecord.diagnosis,
        treatment: newRecord.treatment,
        medications: newRecord.medications,
        followUp: newRecord.followUp,
        cost: newRecord.cost,
        petId: selectedPet.id,
        petName: selectedPet.name,
        formData: {
          symptoms: newRecord.symptoms,
          diagnosis: newRecord.diagnosis,
          treatment: newRecord.treatment,
          medications: newRecord.medications,
          followUp: newRecord.followUp,
          cost: newRecord.cost,
          veterinarian: newRecord.veterinarian || user?.email,
          date: newRecord.date
        }
      };

      await addMedicalRecord(record, tenantEmail);
      await loadMedicalRecords();
      setNewRecord({ 
        category: '', 
        formTemplate: '', 
        date: new Date().toLocaleDateString(), 
        veterinarian: '', 
        symptoms: '', 
        diagnosis: '', 
        treatment: '', 
        medications: '', 
        followUp: '', 
        cost: '' 
      });
      setShowAddRecordModal(false);
      Alert.alert('Success', 'Medical record added successfully');
    } catch (error) {
      console.error('Error adding medical record:', error);
      Alert.alert('Error', 'Failed to add medical record');
    }
  };

  const handleDeleteAnimalType = async (typeId, typeName) => {
    Alert.alert(
      'Delete Animal Type',
      `Are you sure you want to delete "${typeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnimalType(typeId, tenantEmail);
              setAnimalTypes(animalTypes.filter(type => type.id !== typeId));
              const updatedBreeds = { ...breedsByType };
              delete updatedBreeds[typeName];
              setBreedsByType(updatedBreeds);
              Alert.alert('Success', 'Animal type deleted successfully');
            } catch (error) {
              console.error('Error deleting animal type:', error);
              Alert.alert('Error', 'Failed to delete animal type');
            }
          }
        }
      ]
    );
  };

  const handleDeleteBreed = async (breedName, animalType) => {
    Alert.alert(
      'Delete Breed',
      `Are you sure you want to delete "${breedName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const breedsData = await getBreeds(tenantEmail);
              const breedToDelete = breedsData.find(breed => breed.name === breedName && breed.animalType === animalType);
              
              if (breedToDelete) {
                await deleteBreed(breedToDelete.id, tenantEmail);
                const updatedBreeds = { ...breedsByType };
                updatedBreeds[animalType] = updatedBreeds[animalType].filter(breed => breed !== breedName);
                setBreedsByType(updatedBreeds);
                Alert.alert('Success', 'Breed deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting breed:', error);
              Alert.alert('Error', 'Failed to delete breed');
            }
          }
        }
      ]
    );
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ThemedView style={styles.container}>
      {!selectedCustomer && !selectedPet && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      )}

      {showPetsView && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pets..."
            value={petsSearchTerm}
            onChangeText={setPetsSearchTerm}
          />
        </View>
      )}
      
      {showMedicalView && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medical records..."
            value={medicalSearchTerm}
            onChangeText={setMedicalSearchTerm}
          />
        </View>
      )}

      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ThemedText>Loading customers...</ThemedText>
          </View>
        ) : selectedPet && !showMedicalView && !selectedMedicalRecord ? (
          <View style={styles.petDetailsView}>
            {console.log('SHOWING PET DETAILS VIEW - selectedPet:', selectedPet, 'showMedicalView:', showMedicalView)}
            <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={false}>
              <View style={styles.detailTable}>
                {[
                  { label: 'Name', value: selectedPet.name },
                  { label: 'Type', value: selectedPet.type },
                  { label: 'Breed', value: selectedPet.breed },
                  { label: 'See Medical History', value: 'View Records', isAction: true }
                ].map((item, index) => (
                  <View key={index} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    {item.isAction ? (
                      <TouchableOpacity onPress={() => setShowMedicalView(true)}>
                        <Text style={styles.detailActionValue}>{item.value}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.detailValue}>{item.value}</Text>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : showPetsView ? (
          <View style={styles.petsView}>
            <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={false}>
              {customerPets.filter(pet => 
                pet.name.toLowerCase().includes(petsSearchTerm.toLowerCase())
              ).map((pet, index) => (
                <TouchableOpacity key={pet.id || index} style={styles.petRow} onPress={() => {
                  setSelectedPet(pet);
                  setShowPetsView(false);
                }}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petDetails}>{pet.type} - {pet.breed}</Text>
                </TouchableOpacity>
              ))}
              {customerPets.length === 0 && (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>No pets found</ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        ) : showMedicalView ? (
          <View style={styles.medicalView}>
            <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={false}>
              {medicalRecords.filter(record => 
                record.formType.toLowerCase().includes(medicalSearchTerm.toLowerCase())
              ).map((record, index) => (
                <TouchableOpacity key={record.id || index} style={styles.medicalRow} onPress={() => {
                  setSelectedMedicalRecord(record);
                  setShowMedicalView(false);
                }}>
                  <Text style={styles.medicalType}>{record.formType}</Text>
                  <Text style={styles.medicalDate}>{record.date}</Text>
                </TouchableOpacity>
              ))}
              {medicalRecords.length === 0 && (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>No medical records found</ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        ) : selectedCustomer && !showPetsView && !selectedPet ? (
          <View style={styles.customerDetailsView}>
            <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={false}>
              <View style={styles.detailTable}>
                {[
                  { label: 'Name', value: selectedCustomer.name },
                  { label: 'Phone', value: selectedCustomer.contact },
                  { label: 'Email', value: selectedCustomer.email || 'Not provided' },
                  { label: 'Address', value: selectedCustomer.address || 'Not provided' },
                  { label: 'Number of Pets', value: selectedCustomer.pets?.toString() || '0' },
                  { label: 'See Pets', value: 'View Pet Details', isAction: true }
                ].map((item, index) => (
                  <View key={index} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    {item.isAction ? (
                      <TouchableOpacity onPress={() => setShowPetsView(true)}>
                        <Text style={styles.detailActionValue}>{item.value}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.detailValue}>{item.value}</Text>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : selectedMedicalRecord ? (
          <View style={styles.customerDetailsView}>
            <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={false}>
              <View style={styles.detailTable}>
                {[
                  { label: 'Form Type', value: selectedMedicalRecord.formType },
                  { label: 'Date', value: selectedMedicalRecord.date },
                  ...Object.entries(selectedMedicalRecord.formData || {}).map(([key, value]) => ({
                    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                    value: value
                  }))
                ].map((item, index) => (
                  <View key={index} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : filteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No customers found</ThemedText>
          </View>
        ) : (
          <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={false}>
            {filteredCustomers.map((customer, index) => (
              <TouchableOpacity 
                key={customer.id || index} 
                style={styles.customerRow}
                onPress={() => setSelectedCustomer(customer)}
              >
                <Text style={styles.customerName}>{customer.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {!selectedCustomer && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}
      
      {showPetsView && (
        <TouchableOpacity 
          style={styles.addPetButton}
          onPress={() => setShowAddPetModal(true)}
        >
          <Ionicons name="paw" size={24} color="#fff" />
        </TouchableOpacity>
      )}
      
      {showMedicalView && (
        <TouchableOpacity 
          style={styles.addRecordButton}
          onPress={() => setShowAddRecordModal(true)}
        >
          <Ionicons name="medical" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Add New Customer</ThemedText>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Surname *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.surname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, surname: text})}
                  placeholder="Enter surname"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.firstname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, firstname: text})}
                  placeholder="Enter first name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Middle Name</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.middlename}
                  onChangeText={(text) => setNewCustomer({...newCustomer, middlename: text})}
                  placeholder="Enter middle name (optional)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Number *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.contact}
                  onChangeText={(text) => setNewCustomer({...newCustomer, contact: text})}
                  placeholder="Enter contact number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.email}
                  onChangeText={(text) => setNewCustomer({...newCustomer, email: text})}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Complete Address *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newCustomer.address}
                  onChangeText={(text) => setNewCustomer({...newCustomer, address: text})}
                  placeholder="Enter complete address"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleAddCustomer}
              >
                <Text style={styles.saveButtonText}>Add Customer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Pet Modal */}
      <Modal
        visible={showAddPetModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddPetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Add New Pet</ThemedText>
              <TouchableOpacity onPress={() => setShowAddPetModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pet Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newPet.name}
                  onChangeText={(text) => setNewPet({...newPet, name: text})}
                  placeholder="Enter pet name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Type *</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                >
                  <Text style={styles.dropdownText}>{newPet.type || 'Select animal type'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {showTypeDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                      <TouchableOpacity
                        style={[styles.dropdownItem, styles.addNewItem]}
                        onPress={() => {
                          setShowTypeDropdown(false);
                          setShowCustomTypeModal(true);
                        }}
                      >
                        <Text style={styles.addNewText}>+ Add New Type</Text>
                      </TouchableOpacity>
                      {animalTypes.map((type) => (
                        <View key={type.id} style={styles.dropdownItemWithDelete}>
                          <TouchableOpacity
                            style={styles.dropdownItemMain}
                            onPress={() => {
                              setNewPet({...newPet, type: type.name, breed: ''});
                              setShowTypeDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{type.name}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteAnimalType(type.id, type.name)}
                          >
                            <Text style={styles.deleteButtonText}>×</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Breed</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => setShowBreedDropdown(!showBreedDropdown)}
                  disabled={!newPet.type}
                >
                  <Text style={[styles.dropdownText, !newPet.type && styles.disabledText]}>
                    {newPet.breed || 'Select breed'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                {showBreedDropdown && newPet.type && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                      <TouchableOpacity
                        style={[styles.dropdownItem, styles.addNewItem]}
                        onPress={() => {
                          setShowBreedDropdown(false);
                          setShowCustomBreedModal(true);
                        }}
                      >
                        <Text style={styles.addNewText}>+ Add New Breed</Text>
                      </TouchableOpacity>
                      {getBreedsByType(newPet.type).map((breed) => (
                        <View key={breed} style={styles.dropdownItemWithDelete}>
                          <TouchableOpacity
                            style={styles.dropdownItemMain}
                            onPress={() => {
                              setNewPet({...newPet, breed});
                              setShowBreedDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{breed}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteBreed(breed, newPet.type)}
                          >
                            <Text style={styles.deleteButtonText}>×</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>


            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddPetModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleAddPet}
              >
                <Text style={styles.saveButtonText}>Add Pet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Medical Record Modal */}
      <Modal
        visible={showAddRecordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddRecordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Add Medical Record</ThemedText>
              <TouchableOpacity onPress={() => setShowAddRecordModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={newRecord.category}
                  onChangeText={(text) => setNewRecord({...newRecord, category: text})}
                  placeholder="Enter category"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Form Template *</Text>
                <TextInput
                  style={styles.input}
                  value={newRecord.formTemplate}
                  onChangeText={(text) => setNewRecord({...newRecord, formTemplate: text})}
                  placeholder="Vaccination, Checkup, Surgery, etc."
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={newRecord.date}
                  onChangeText={(text) => setNewRecord({...newRecord, date: text})}
                  placeholder="Enter date"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Veterinarian</Text>
                <TextInput
                  style={styles.input}
                  value={newRecord.veterinarian}
                  onChangeText={(text) => setNewRecord({...newRecord, veterinarian: text})}
                  placeholder="Enter veterinarian name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Symptoms</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newRecord.symptoms}
                  onChangeText={(text) => setNewRecord({...newRecord, symptoms: text})}
                  placeholder="Enter symptoms"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Diagnosis *</Text>
                <TextInput
                  style={styles.input}
                  value={newRecord.diagnosis}
                  onChangeText={(text) => setNewRecord({...newRecord, diagnosis: text})}
                  placeholder="Enter diagnosis"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Treatment *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newRecord.treatment}
                  onChangeText={(text) => setNewRecord({...newRecord, treatment: text})}
                  placeholder="Enter treatment"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Medications</Text>
                <TextInput
                  style={styles.input}
                  value={newRecord.medications}
                  onChangeText={(text) => setNewRecord({...newRecord, medications: text})}
                  placeholder="Enter medications"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Follow Up</Text>
                <TextInput
                  style={styles.input}
                  value={newRecord.followUp}
                  onChangeText={(text) => setNewRecord({...newRecord, followUp: text})}
                  placeholder="Enter follow up instructions"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cost</Text>
                <TextInput
                  style={styles.input}
                  value={newRecord.cost}
                  onChangeText={(text) => setNewRecord({...newRecord, cost: text})}
                  placeholder="Enter cost"
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddRecordModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleAddRecord}
              >
                <Text style={styles.saveButtonText}>Add Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Type Modal */}
      <Modal
        visible={showCustomTypeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomTypeModal(false)}
      >
        <View style={styles.customModalOverlay}>
          <View style={styles.customModalContent}>
            <Text style={styles.customModalTitle}>Add New Animal Type</Text>
            <TextInput
              style={styles.customInput}
              value={customType}
              onChangeText={setCustomType}
              placeholder="Enter new animal type"
              autoFocus={true}
            />
            <View style={styles.customModalButtons}>
              <TouchableOpacity 
                style={styles.customCancelButton}
                onPress={() => {
                  setShowCustomTypeModal(false);
                  setCustomType('');
                }}
              >
                <Text style={styles.customCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.customSaveButton}
                onPress={async () => {
                  if (customType.trim()) {
                    try {
                      const newTypeData = { name: customType.trim() };
                      const savedType = await addAnimalType(newTypeData, tenantEmail);
                      setAnimalTypes([...animalTypes, savedType]);
                      setNewPet({...newPet, type: customType.trim(), breed: ''});
                      setShowCustomTypeModal(false);
                      setCustomType('');
                      Alert.alert('Success', 'Animal type added successfully');
                    } catch (error) {
                      console.error('Error adding animal type:', error);
                      Alert.alert('Error', 'Failed to add animal type');
                    }
                  }
                }}
              >
                <Text style={styles.customSaveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Breed Modal */}
      <Modal
        visible={showCustomBreedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomBreedModal(false)}
      >
        <View style={styles.customModalOverlay}>
          <View style={styles.customModalContent}>
            <Text style={styles.customModalTitle}>Add New Breed</Text>
            <TextInput
              style={styles.customInput}
              value={customBreed}
              onChangeText={setCustomBreed}
              placeholder="Enter new breed"
              autoFocus={true}
            />
            <View style={styles.customModalButtons}>
              <TouchableOpacity 
                style={styles.customCancelButton}
                onPress={() => {
                  setShowCustomBreedModal(false);
                  setCustomBreed('');
                }}
              >
                <Text style={styles.customCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.customSaveButton}
                onPress={async () => {
                  if (customBreed.trim() && newPet.type) {
                    try {
                      const newBreedData = { animalType: newPet.type, name: customBreed.trim() };
                      await addBreed(newBreedData, tenantEmail);
                      
                      const updatedBreeds = { ...breedsByType };
                      if (!updatedBreeds[newPet.type]) {
                        updatedBreeds[newPet.type] = [];
                      }
                      updatedBreeds[newPet.type].push(customBreed.trim());
                      setBreedsByType(updatedBreeds);
                      setNewPet({...newPet, breed: customBreed.trim()});
                      setShowCustomBreedModal(false);
                      setCustomBreed('');
                      Alert.alert('Success', 'Breed added successfully');
                    } catch (error) {
                      console.error('Error adding breed:', error);
                      Alert.alert('Error', 'Failed to add breed');
                    }
                  }
                }}
              >
                <Text style={styles.customSaveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addPetButton: {
    position: 'absolute',
    bottom: 35,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollableList: {
    flex: 1,
    paddingBottom: 80,
  },
  customerRow: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalForm: {
    padding: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  customerDetailsView: {
    flex: 1,
    backgroundColor: 'white',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detailSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  detailSearchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  detailTable: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: 120,
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  detailActionValue: {
    fontSize: 16,
    color: '#2196F3',
    flex: 1,
    textDecorationLine: 'underline',
  },
  petsView: {
    flex: 1,
    backgroundColor: 'white',
  },
  petsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  petsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  petsList: {
    flex: 1,
    paddingBottom: 100,
  },
  petRow: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  petName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  petDetailsView: {
    flex: 1,
    backgroundColor: 'white',
  },
  medicalView: {
    flex: 1,
    backgroundColor: 'white',
  },
  medicalList: {
    flex: 1,
    paddingBottom: 100,
  },
  medicalRow: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  medicalType: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  medicalDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addRecordButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  disabledText: {
    color: '#999',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 4,
    maxHeight: 150,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  addNewItem: {
    backgroundColor: '#f8f9fa',
  },
  addNewText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  customModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  customModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    width: '100%',
    marginBottom: 20,
  },
  customModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  customCancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  customCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  customSaveButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  customSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemWithDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemMain: {
    flex: 1,
    padding: 12,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});