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
import { getCustomers, addCustomer, getPets, getMedicalRecords, addPet, addMedicalRecord, getAnimalTypes, addAnimalType, getBreeds, addBreed, deleteAnimalType, deleteBreed, getMedicalCategories, getMedicalForms, getFormFields } from '@/lib/services/firebaseService';
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
  const [formFields, setFormFields] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    firstname: '',
    surname: '',
    email: '',
    contact: '',
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
    petId: ''
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formTemplates, setFormTemplates] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState({});
  
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
    setTenantEmail(user.email);
  };
  
  useEffect(() => {
    if (selectedCustomer && tenantEmail) {
      loadCustomerPets();
    }
  }, [selectedCustomer, tenantEmail]);
  
  const loadCustomerPets = async () => {
    try {
      const allPets = await getPets(tenantEmail);
      console.log('VET MOBILE - All pets:', allPets);
      console.log('VET MOBILE - Selected customer:', selectedCustomer);
      
      const customerName = selectedCustomer.name || `${selectedCustomer.firstname || ''} ${selectedCustomer.surname || ''}`.trim();
      const customerPetsList = allPets.filter(pet => 
        pet.owner === customerName || 
        pet.owner === selectedCustomer.name ||
        pet.owner === selectedCustomer.id ||
        pet.ownerId === selectedCustomer.id
      );
      
      console.log('VET MOBILE - Customer pets found:', customerPetsList);
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
  
  useEffect(() => {
    if (selectedMedicalRecord && tenantEmail) {
      loadFormFields();
    }
  }, [selectedMedicalRecord, tenantEmail]);
  
  const loadFormFields = async () => {
    try {
      const { getFormFields } = await import('@/lib/services/firebaseService');
      const formName = selectedMedicalRecord.formType || selectedMedicalRecord.formTemplate;
      if (formName) {
        const fields = await getFormFields(formName, tenantEmail);
        setFormFields(fields);
      }
    } catch (error) {
      console.error('Error loading form fields:', error);
      setFormFields([]);
    }
  };

  const loadMedicalRecords = async () => {
    try {
      console.log('VET MOBILE - Loading medical records for pet:', selectedPet);
      console.log('VET MOBILE - Using tenantEmail:', tenantEmail);
      const allRecords = await getMedicalRecords(tenantEmail);
      console.log('VET MOBILE - All medical records found:', allRecords.length, allRecords);
      
      // Filter records for this pet (show all records, not just from current vet)
      const petRecords = allRecords.filter(record => {
        const matchesId = record.petId === selectedPet.id;
        const matchesName = record.petName === selectedPet.name;
        console.log('VET MOBILE - Checking record:', record);
        console.log('VET MOBILE - Pet ID match:', matchesId, 'Pet name match:', matchesName);
        console.log('VET MOBILE - Record petId:', record.petId, 'Selected pet id:', selectedPet.id);
        console.log('VET MOBILE - Record petName:', record.petName, 'Selected pet name:', selectedPet.name);
        return matchesId || matchesName;
      });
      console.log('VET MOBILE - Filtered pet records:', petRecords.length, petRecords);
      setMedicalRecords(petRecords);
    } catch (error) {
      console.error('Error loading medical records:', error);
      setMedicalRecords([]);
    }
  };

  const loadCustomers = async () => {
    console.log('VET MOBILE - Loading customers with tenantEmail:', tenantEmail);
    console.log('VET MOBILE - User email:', user?.email);
    try {
      const [customersData, animalTypesData, breedsData, allPets, categoriesData, formsData] = await Promise.all([
        getCustomers(tenantEmail),
        getAnimalTypes(tenantEmail),
        getBreeds(tenantEmail),
        getPets(tenantEmail),
        getMedicalCategories(tenantEmail),
        getMedicalForms(tenantEmail)
      ]);
      
      // Load categories and form templates
      const mappedCategories = categoriesData.map(cat => ({ id: cat.id, name: cat.name || cat.category }));
      if (!mappedCategories.find(cat => cat.name === 'No Category')) {
        mappedCategories.unshift({ id: 'no-category', name: 'No Category' });
      }
      setCategories(mappedCategories);
      
      const formTemplatesList = formsData.map(form => ({
        id: form.id,
        formName: form.formName || form.type || form.name,
        category: form.category || 'No Category'
      }));
      setFormTemplates(formTemplatesList);
      
      // Update customer pet counts
      const customersWithPetCounts = customersData.map(customer => {
        const customerName = customer.name || `${customer.firstname || ''} ${customer.surname || ''}`.trim();
        const petCount = allPets.filter(pet => 
          pet.owner === customerName || 
          pet.owner === customer.name ||
          pet.owner === customer.id ||
          pet.ownerId === customer.id
        ).length;
        return { ...customer, pets: petCount };
      });
      
      console.log('VET MOBILE - Customers loaded:', customersWithPetCounts.length, customersWithPetCounts);
      console.log('VET MOBILE - First customer data:', customersWithPetCounts[0]);
      console.log('VET MOBILE - Animal types loaded:', animalTypesData);
      console.log('VET MOBILE - Breeds loaded:', breedsData);
      setCustomers(customersWithPetCounts);
      
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
    if (!newCustomer.firstname || !newCustomer.surname) {
      Alert.alert('Error', 'Please fill in first name and surname');
      return;
    }

    try {
      await addCustomer(newCustomer, tenantEmail);
      setNewCustomer({ firstname: '', surname: '', email: '', contact: '', address: '' });
      await loadCustomers();
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
      const ownerName = selectedCustomer.name || `${selectedCustomer.firstname || ''} ${selectedCustomer.surname || ''}`.trim();
      const pet = {
        name: newPet.name,
        species: newPet.type,
        breed: newPet.breed,
        owner: ownerName,
        ownerId: selectedCustomer.id,
        createdAt: new Date()
      };

      console.log('VET MOBILE - Adding pet with owner:', ownerName, 'ownerId:', selectedCustomer.id);
      await addPet(pet, tenantEmail);
      await loadCustomerPets();
      await loadCustomers(); // Refresh customer list to update pet counts
      setNewPet({ name: '', type: '', breed: '' });
      setShowAddPetModal(false);
      Alert.alert('Success', 'Pet added successfully');
    } catch (error) {
      console.error('Error adding pet:', error);
      Alert.alert('Error', 'Failed to add pet');
    }
  };
  
  const handleAddRecord = () => {
    setNewRecord({
      category: '',
      formTemplate: '',
      petId: selectedPet.id
    });
    setShowAddRecordModal(true);
  };
  
  const handleSaveRecord = async () => {
    try {
      if (!newRecord.category) {
        Alert.alert('Error', 'Please select category');
        return;
      }
      if (!newRecord.formTemplate) {
        Alert.alert('Error', 'Please select form template');
        return;
      }
      
      // Fetch form fields and show form modal
      const fields = await getFormFields(newRecord.formTemplate, tenantEmail);
      setFormFields(fields);
      setFormData({});
      setShowFormModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load form fields');
    }
  };
  
  const handleSubmitForm = async () => {
    try {
      // Map form data using field labels as keys
      const mappedFormData = {};
      formFields.forEach(field => {
        mappedFormData[field.label] = formData[field.id] || '';
      });
      
      const recordData = {
        petId: selectedPet.id,
        petName: selectedPet.name,
        category: newRecord.category,
        formTemplate: newRecord.formTemplate,
        formType: newRecord.formTemplate,
        formData: mappedFormData,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
        veterinarian: user?.email,
        createdBy: user?.email,
        diagnosis: mappedFormData.diagnosis || 'N/A',
        treatment: mappedFormData.treatment || 'N/A',
        notes: mappedFormData.notes || Object.values(mappedFormData).join(', ') || 'N/A'
      };
      
      await addMedicalRecord(recordData, tenantEmail);
      setShowFormModal(false);
      setShowAddRecordModal(false);
      await loadMedicalRecords();
      
      Alert.alert('Success', 'Medical record added successfully');
    } catch (error) {
      console.error('Error submitting form:', error);
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

  const renderFormField = (field) => {
    switch (field.type) {
      case 'text':
        return (
          <TextInput
            key={field.id}
            style={styles.formInput}
            placeholder={`Enter ${field.label}`}
            value={formData[field.id] || ''}
            onChangeText={(text) => setFormData({...formData, [field.id]: text})}
          />
        );
      case 'date':
        return (
          <TextInput
            key={field.id}
            style={styles.formInput}
            placeholder="MM/DD/YYYY"
            value={formData[field.id] || ''}
            keyboardType="numeric"
            maxLength={10}
            onChangeText={(text) => {
              const cleaned = text.replace(/\D/g, '');
              let formatted = cleaned;
              if (cleaned.length >= 4) {
                formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
              } else if (cleaned.length >= 2) {
                formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
              }
              setFormData({...formData, [field.id]: formatted});
            }}
          />
        );
      case 'number':
        return (
          <TextInput
            key={field.id}
            style={styles.formInput}
            placeholder={`Enter ${field.label}`}
            keyboardType="numeric"
            value={formData[field.id] || ''}
            onChangeText={(text) => {
              const formatted = text.replace(/[^0-9.]/g, '').replace(/(\.)(?=.*\1)/g, '');
              setFormData({...formData, [field.id]: formatted});
            }}
          />
        );
      default:
        return (
          <TextInput
            key={field.id}
            style={styles.formInput}
            placeholder={`Enter ${field.label}`}
            value={formData[field.id] || ''}
            onChangeText={(text) => setFormData({...formData, [field.id]: text})}
          />
        );
    }
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

  const filteredCustomers = customers.filter(customer => {
    const name = customer.name || customer.firstname || `${customer.firstname} ${customer.surname}` || 'Unknown';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  console.log('VET MOBILE - Filtered customers:', filteredCustomers.length, filteredCustomers);

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
                {console.log('VET MOBILE - Selected pet data:', selectedPet)}
                {[
                  { label: 'Name', value: selectedPet.name || 'N/A' },
                  { label: 'Type', value: selectedPet.type || selectedPet.species || 'N/A' },
                  { label: 'Breed', value: selectedPet.breed || 'N/A' },
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
              {console.log('VET MOBILE - Rendering medical view with records:', medicalRecords)}
              {medicalRecords.filter(record => {
                const searchTerm = medicalSearchTerm.toLowerCase();
                return !searchTerm || 
                  record.formType?.toLowerCase().includes(searchTerm) ||
                  record.diagnosis?.toLowerCase().includes(searchTerm) ||
                  record.notes?.toLowerCase().includes(searchTerm) ||
                  record.date?.toLowerCase().includes(searchTerm);
              }).map((record, index) => (
                <TouchableOpacity key={record.id || index} style={styles.medicalRow} onPress={() => {
                  router.push(`/veterinarian/vet-medical-record-detail?id=${record.id}`);
                }}>
                  <Text style={styles.medicalType}>{record.formType || record.diagnosis || 'Medical Record'}</Text>
                  <Text style={styles.medicalDate}>{record.date || 'No Date'}</Text>
                </TouchableOpacity>
              ))}
              {medicalRecords.length === 0 && (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>No medical records found for this pet</ThemedText>
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
                {/* Basic Info */}
                <View style={styles.medicalSection}>
                  <Text style={styles.medicalSectionTitle}>Record Information</Text>
                  {[
                    { label: 'Date & Time Created', value: selectedMedicalRecord.createdAt ? new Date(selectedMedicalRecord.createdAt.seconds * 1000).toLocaleString() : selectedMedicalRecord.date },
                    { label: 'Category', value: selectedMedicalRecord.category || 'N/A' },
                    { label: 'Form Template', value: selectedMedicalRecord.formType || selectedMedicalRecord.formTemplate || 'N/A' }
                  ].map((item, index) => (
                    <View key={index} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{item.label}</Text>
                      <Text style={styles.detailValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>

                {/* Form Fields */}
                <View style={styles.medicalSection}>
                  <Text style={styles.medicalSectionTitle}>Form Fields</Text>
                  {formFields.map((field, index) => {
                    const fieldValue = selectedMedicalRecord.formData?.[field.label] || 'No data entered';
                    return (
                      <View key={index} style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{field.label}</Text>
                        <Text style={styles.detailValue}>{fieldValue}</Text>
                      </View>
                    );
                  })}
                  {formFields.length === 0 && (
                    <Text style={styles.detailValue}>No form fields found</Text>
                  )}
                </View>
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
                <Text style={styles.customerName}>
                  {customer.name || `${customer.firstname || ''} ${customer.surname || ''}`.trim() || 'Unknown Customer'}
                </Text>
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
          <Ionicons name="document-text" size={24} color="#fff" />
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
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.firstname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, firstname: text})}
                  placeholder="Enter first name"
                />
              </View>

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
                <Text style={styles.inputLabel}>Email</Text>
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
                <Text style={styles.inputLabel}>Contact</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.contact}
                  onChangeText={(text) => setNewCustomer({...newCustomer, contact: text})}
                  placeholder="Enter contact number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.address}
                  onChangeText={(text) => setNewCustomer({...newCustomer, address: text})}
                  placeholder="Enter address"
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
              <View style={[styles.inputGroup, { zIndex: 10000 }]}>
                <Text style={styles.inputLabel}>Category *</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowCategoryDropdown(!showCategoryDropdown);
                      setShowTemplateDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>
                      {newRecord.category || 'Select Category'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showCategoryDropdown && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {categories.length === 0 ? (
                          <View style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>No categories available</Text>
                          </View>
                        ) : (
                          categories.map((category) => (
                            <TouchableOpacity
                              key={category.id}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setNewRecord({...newRecord, category: category.name, formTemplate: ''});
                                setShowCategoryDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{category.name}</Text>
                            </TouchableOpacity>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              <View style={[styles.inputGroup, { zIndex: 5000 }]}>
                <Text style={styles.inputLabel}>Form Template *</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity 
                    style={[styles.dropdownButton, !newRecord.category && styles.disabledDropdown]}
                    onPress={() => {
                      if (newRecord.category) {
                        setShowTemplateDropdown(!showTemplateDropdown);
                        setShowCategoryDropdown(false);
                      }
                    }}
                  >
                    <Text style={[styles.dropdownText, !newRecord.category && styles.disabledText]}>
                      {!newRecord.category ? 'Select category first' : (newRecord.formTemplate || 'Select Form Template')}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showTemplateDropdown && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {(() => {
                          const filtered = formTemplates.filter(template => {
                            if (!newRecord.category) return true;
                            return template.category === newRecord.category;
                          });
                          
                          if (formTemplates.length === 0) {
                            return [
                              <View key="no-templates" style={styles.dropdownOption}>
                                <Text style={styles.dropdownOptionText}>No form templates available</Text>
                              </View>
                            ];
                          }
                          
                          if (filtered.length === 0 && newRecord.category) {
                            return [
                              <View key="no-forms" style={styles.dropdownOption}>
                                <Text style={styles.dropdownOptionText}>No forms available for this category</Text>
                              </View>
                            ];
                          }
                          
                          return filtered
                            .sort((a, b) => a.formName.localeCompare(b.formName))
                            .map((template) => (
                            <TouchableOpacity
                              key={template.id}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setNewRecord({...newRecord, formTemplate: template.formName});
                                setShowTemplateDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{template.formName}</Text>
                            </TouchableOpacity>
                          ));
                        })()}
                      </ScrollView>
                    </View>
                  )}
                </View>
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
                onPress={handleSaveRecord}
              >
                <Text style={styles.saveButtonText}>Create Record</Text>
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

      {/* Form Modal */}
      {showFormModal && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.formPreviewModalOverlay}>
            <View style={styles.formPreviewModalContent}>
              <View style={styles.formPreviewHeader}>
                <TouchableOpacity style={styles.formPreviewBackButton} onPress={() => setShowFormModal(false)}>
                  <Text style={styles.formPreviewBackText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.formPreviewHeaderTitle}>{newRecord.formTemplate}</Text>
                <TouchableOpacity style={styles.formPreviewSaveHeaderButton} onPress={handleSubmitForm}>
                  <Text style={styles.formPreviewSaveHeaderText}>Save Record</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.formPreviewBody} showsVerticalScrollIndicator={false}>
                <View style={styles.formPreviewDisplayArea}>
                  <View style={styles.formPreviewFieldsContainer}>
                    {formFields.map((field) => (
                      <View key={field.id} style={styles.formPreviewField}>
                        <Text style={styles.formPreviewFieldLabel}>
                          {field.label}{field.required && ' *'}
                        </Text>
                        {renderFormField(field)}
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

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
    backgroundColor: '#28a745',
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
    backgroundColor: '#28a745',
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
    backgroundColor: '#28a745',
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
  medicalSection: {
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  medicalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  addRecordButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#28a745',
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
    backgroundColor: '#28a745',
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
  dropdownContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 150,
    zIndex: 9999,
    elevation: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  disabledDropdown: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  disabledText: {
    color: '#999',
  },
  formPreviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formPreviewModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  formPreviewHeader: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  formPreviewBackButton: {
    backgroundColor: '#800020',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  formPreviewBackText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  formPreviewHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#800020',
    flex: 1,
    textAlign: 'center',
  },
  formPreviewSaveHeaderButton: {
    backgroundColor: '#28a745',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  formPreviewSaveHeaderText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  formPreviewBody: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formPreviewDisplayArea: {
    padding: 20,
  },
  formPreviewFieldsContainer: {
    gap: 15,
  },
  formPreviewField: {
    marginBottom: 15,
  },
  formPreviewFieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
});