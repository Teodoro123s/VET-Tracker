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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCustomer } from '../_layout';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/config/firebaseConfig';
interface Customer {
  id: string;
  name?: string;
  firstname?: string;
  surname?: string;
  email?: string;
  contact?: string;
  address?: string;
}
interface Pet {
  id: string;
  name: string;
  species?: string;
  breed?: string;
  owner?: string;
  ownerId?: string;
}
interface MedicalRecord {
  id: string;
  petId?: string;
  petName?: string;
  formType?: string;
  formTemplate?: string;
  diagnosis?: string;
  notes?: string;
  date?: string;
  category?: string;
  createdAt?: { seconds: number };
}
interface Breed {
  id: string;
  name: string;
  animalType: string;
}

export default function VetCustomers() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [tenantEmail, setTenantEmail] = useState('');
  const { 
    selectedCustomer, setSelectedCustomer, 
    showPetsView, setShowPetsView, 
    selectedPet, setSelectedPet, 
    showMedicalView, setShowMedicalView,
    selectedMedicalRecord, setSelectedMedicalRecord
  } = useCustomer();
  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [customerPets, setCustomerPets] = useState<Pet[]>([]);
  const [medicalSearchTerm, setMedicalSearchTerm] = useState('');
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [formFields, setFormFields] = useState<{ label: string }[]>([]);
  const [newCustomer, setNewCustomer] = useState({
    firstname: '',
    surname: '',
    email: '',
    contact: '',
    address: ''
  });
  const [newPet, setNewPet] = useState({
    name: '',
    species: '',
    breed: ''
  });
  const [newRecord, setNewRecord] = useState({
    category: '',
    formTemplate: '',
    petId: ''
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [formTemplates, setFormTemplates] = useState<{ id: string; formName: string; category: string }[]>([]);

  
  const [animalTypes, setAnimalTypes] = useState<{ id: string; name?: string }[]>([]);
  const [breedsByType, setBreedsByType] = useState<Record<string, string[]>>({});
  
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
  
  // Handle navigation from medical record form
  useEffect(() => {
    if (params.showMedicalHistory === 'true' && params.customerName && params.petName && tenantEmail) {
      // Find and set the customer
      const customer = customers.find(c => {
        const customerName = c.name || `${c.firstname || ''} ${c.surname || ''}`.trim();
        return customerName === params.customerName;
      });
      
      if (customer) {
        setSelectedCustomer(customer);
        // Find and set the pet
        const pet = customerPets.find(p => p.name === params.petName);
        if (pet) {
          setSelectedPet(pet);
          setShowMedicalView(true);
        }
      }
    }
  }, [params, customers, customerPets, tenantEmail]);
  
  useEffect(() => {
    if (tenantEmail) {
      loadCustomers();
    }
  }, [tenantEmail]);
  
  // Load customer pets when navigating from medical record form
  useEffect(() => {
    if (params.showMedicalHistory === 'true' && selectedCustomer && tenantEmail && !customerPets.length) {
      loadCustomerPets();
    }
  }, [params, selectedCustomer, tenantEmail, customerPets.length]);
  
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
      const allPets = await getPets(tenantEmail) as Pet[];
      console.log('VET MOBILE - All pets:', allPets);
      console.log('VET MOBILE - Selected customer:', selectedCustomer);
      
      const customerName = selectedCustomer.name || `${selectedCustomer.firstname || ''} ${selectedCustomer.surname || ''}`.trim();
      const customerPetsList = allPets.filter((pet: Pet) => 
        pet.owner === customerName || 
        pet.owner === selectedCustomer?.name ||
        pet.owner === selectedCustomer?.id ||
        pet.ownerId === selectedCustomer?.id
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
      const formName = selectedMedicalRecord.formType || selectedMedicalRecord.formTemplate;
        if (formName) {
        const fields = await getFormFields(formName, tenantEmail) as any;
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
      const allRecords = await getMedicalRecords(tenantEmail) as MedicalRecord[];
      console.log('VET MOBILE - All medical records found:', allRecords.length, allRecords);
      
      // Filter records for this pet (show all records, not just from current vet)
      const petRecords = allRecords.filter((record: MedicalRecord) => {
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
      const customersData = await getCustomers(tenantEmail) as Customer[];
      const animalTypesData = await getAnimalTypes(tenantEmail) as { id: string; name?: string }[];
      const breedsData = await getBreeds(tenantEmail) as Breed[];
      const allPets = await getPets(tenantEmail) as Pet[];
      const categoriesData = await getMedicalCategories(tenantEmail) as { id: string; name?: string; category?: string }[];
      const formsData = await getMedicalForms(tenantEmail) as any[];
      
      // Load categories and form templates
      const mappedCategories = categoriesData.map((cat: { id: string; name?: string; category?: string }) => ({ id: cat.id, name: cat.name || cat.category }));
      if (!mappedCategories.find(cat => cat.name === 'No Category')) {
        mappedCategories.unshift({ id: 'no-category', name: 'No Category' });
      }
      setCategories(mappedCategories);
      
      const formTemplatesList = formsData.map((form: { id: string; formName?: string; type?: string; name?: string; category?: string }) => ({
        id: form.id,
        formName: form.formName || form.type || form.name,
        category: form.category || 'No Category'
      }));
      setFormTemplates(formTemplatesList);
      
      // Update customer pet counts
        const customersWithPetCounts = customersData.map((customer: Customer) => {
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
        const updatedBreeds = await getBreeds(tenantEmail) as Breed[];
        const breedsByTypeObj: Record<string, string[]> = {};
        updatedBreeds.forEach((breed: Breed) => {
          if (!breedsByTypeObj[breed.animalType]) {
            breedsByTypeObj[breed.animalType] = [];
          }
          breedsByTypeObj[breed.animalType].push(breed.name);
        });
        setBreedsByType(breedsByTypeObj);
      } else {
        const breedsByTypeObj: Record<string, string[]> = {};
        breedsData.forEach((breed: Breed) => {
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
    if (!newPet.name || !newPet.species) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      const ownerName = selectedCustomer.name || `${selectedCustomer.firstname || ''} ${selectedCustomer.surname || ''}`.trim();
      const pet = {
        name: newPet.name,
        species: newPet.species,
        breed: newPet.breed,
        owner: ownerName,
        ownerId: selectedCustomer.id,
        createdAt: new Date()
      };

      console.log('VET MOBILE - Adding pet with owner:', ownerName, 'ownerId:', selectedCustomer.id);
      await addPet(pet, tenantEmail);
      await loadCustomerPets();
      await loadCustomers(); // Refresh customer list to update pet counts
      setNewPet({ name: '', species: '', breed: '' });
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
    console.log('=== DEBUG handleSaveRecord START ===');
    console.log('selectedCustomer:', selectedCustomer);
    console.log('selectedPet:', selectedPet);
    console.log('newRecord:', newRecord);
    
    try {
      if (!newRecord.category) {
        console.log('ERROR: No category selected');
        Alert.alert('Error', 'Please select category');
        return;
      }
      if (!newRecord.formTemplate) {
        console.log('ERROR: No form template selected');
        Alert.alert('Error', 'Please select form template');
        return;
      }
      
      if (!selectedCustomer) {
        console.log('ERROR: selectedCustomer is null/undefined');
        Alert.alert('Error', 'Missing customer information');
        return;
      }
      
      if (!selectedPet) {
        console.log('ERROR: selectedPet is null/undefined');
        Alert.alert('Error', 'Missing pet information');
        return;
      }
      
      console.log('All validations passed, constructing customerName...');
      const customerName = selectedCustomer.name || `${selectedCustomer.firstname || ''} ${selectedCustomer.surname || ''}`.trim() || 'Unknown Customer';
      console.log('customerName constructed:', customerName);
      
      const navigationParams = {
        appointmentId: selectedPet.id,
        petName: selectedPet.name,
        customerName,
        category: newRecord.category,
        formTemplate: newRecord.formTemplate
      };
      
      console.log('Navigation params:', navigationParams);
      
      // Navigate to medical record form screen
      console.log('Attempting navigation...');
      router.push({
        pathname: '/veterinarian/medical-record-form',
        params: navigationParams
      });
      
      console.log('Navigation successful, closing modal...');
      setShowAddRecordModal(false);
      console.log('=== DEBUG handleSaveRecord END ===');
    } catch (error) {
      console.error('=== DEBUG ERROR in handleSaveRecord ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      Alert.alert('Error', 'Failed to navigate to form: ' + error.message);
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
              const breedsData = await getBreeds(tenantEmail) as Breed[];
              const breedToDelete = breedsData.find((breed: Breed) => breed.name === breedName && breed.animalType === animalType);
              
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
          <Ionicons name="search" size={20} color="#7B2C2C" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor="#7B2C2C"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      )}

      {showPetsView && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7B2C2C" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pets..."
            placeholderTextColor="#7B2C2C"
            value={petsSearchTerm}
            onChangeText={setPetsSearchTerm}
          />
        </View>
      )}
      
      {showMedicalView && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7B2C2C" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medical records..."
            placeholderTextColor="#7B2C2C"
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
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>

              <View style={{ padding: 20 }}>
                <View style={styles.detailCard}>
                  <View style={styles.detailProfileContainer}>
                    <Ionicons name="paw" size={60} color="#7B2C2C" />
                  </View>
                  <View style={styles.detailInfoContainer}>
                    <View style={styles.detailFieldRow}>
                      <Text style={styles.detailFieldTitle}>Name: </Text>
                      <Text style={styles.detailName}>
                        {selectedPet.name || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.detailFieldRow}>
                      <Text style={styles.detailFieldTitle}>Species: </Text>
                      <Text style={styles.detailEmail}>
                        {selectedPet.species || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.detailFieldRow}>
                      <Text style={styles.detailFieldTitle}>Breed: </Text>
                      <Text style={styles.detailContact}>
                        {selectedPet.breed || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Medical Records Section */}
                <View style={{ backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.05)', marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 }}>
                  <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#800020' }}>Medical Records</Text>
                      <TouchableOpacity
                        style={{ backgroundColor: '#7B2C2C', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}
                        onPress={() => setShowMedicalView(true)}
                      >
                        <Ionicons name="document-text" size={16} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#fff', fontWeight: '600' }}>View Records</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={{ padding: 16, alignItems: 'center' }}>
                    <Text style={{ color: '#666', fontStyle: 'italic' }}>Tap "View Records" to see medical history</Text>
                  </View>
                </View>
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
                  <Text style={styles.petDetails}>{pet.species || 'N/A'} - {pet.breed}</Text>
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
              {medicalRecords && medicalRecords.length > 0 ? (
                medicalRecords.filter(record => {
                  const searchTerm = medicalSearchTerm.toLowerCase();
                  return !searchTerm || 
                    record.formType?.toLowerCase().includes(searchTerm) ||
                    record.formTemplate?.toLowerCase().includes(searchTerm) ||
                    record.diagnosis?.toLowerCase().includes(searchTerm) ||
                    record.notes?.toLowerCase().includes(searchTerm) ||
                    record.date?.toLowerCase().includes(searchTerm) ||
                    record.category?.toLowerCase().includes(searchTerm);
                }).map((record, index) => {
                  const displayDate = record.date || 
                    (record.createdAt?.seconds ? new Date(record.createdAt.seconds * 1000).toLocaleDateString() : 'No Date');
                  const displayTitle = record.formType || record.formTemplate || 'Medical Record';
                  
                  return (
                    <TouchableOpacity key={record.id || `record-${index}`} style={styles.medicalRow} onPress={() => {
                      if (record.id) {
                        router.push(`/veterinarian/vet-medical-record-detail?id=${record.id}`);
                      }
                    }}>
                      <Text style={styles.medicalType}>{displayTitle}</Text>
                      <Text style={styles.medicalDate}>{displayDate}</Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>No medical records found for this pet</ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        ) : selectedCustomer && !showPetsView && !selectedPet ? (
          <View style={styles.customerDetailsView}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>

              <View style={{ padding: 20 }}>
                <View style={styles.detailCard}>
                  <View style={styles.detailProfileContainer}>
                    <Ionicons name="person-circle" size={60} color="#7B2C2C" />
                  </View>
                  <View style={styles.detailInfoContainer}>
                    <View style={styles.detailFieldRow}>
                      <Text style={styles.detailFieldTitle}>Name: </Text>
                      <Text style={styles.detailName}>
                        {selectedCustomer?.name || `${selectedCustomer?.firstname || ''} ${selectedCustomer?.surname || ''}`.trim() || 'Unknown Customer'}
                      </Text>
                    </View>
                    <View style={styles.detailFieldRow}>
                      <Text style={styles.detailFieldTitle}>Email: </Text>
                      <Text style={styles.detailEmail}>
                        {selectedCustomer?.email || 'No email provided'}
                      </Text>
                    </View>
                    <View style={styles.detailFieldRow}>
                      <Text style={styles.detailFieldTitle}>Number: </Text>
                      <Text style={styles.detailContact}>
                        {selectedCustomer?.contact || 'No contact provided'}
                      </Text>
                    </View>
                    <View style={styles.detailFieldRow}>
                      <Text style={styles.detailFieldTitle}>Address: </Text>
                      <Text style={styles.detailAddress}>
                        {selectedCustomer?.address || 'No address provided'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Pets Summary Section */}
                <View style={{ backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.05)', marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 }}>
                  <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#800020' }}>Pets ({customerPets.length})</Text>
                      <TouchableOpacity 
                        style={{ backgroundColor: '#7B2C2C', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}
                        onPress={() => {
                          setShowPetsView(true);
                          loadCustomerPets();
                        }}
                      >
                        <Ionicons name="paw" size={16} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#fff', fontWeight: '600' }}>View All Pets</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {customerPets.length > 0 ? (
                    <View style={{ padding: 16 }}>
                      {customerPets.slice(0, 3).map((pet, index) => (
                        <TouchableOpacity 
                          key={pet.id || index} 
                          style={{ 
                            flexDirection: 'row', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            paddingVertical: 12,
                            borderBottomWidth: index < customerPets.slice(0, 3).length - 1 ? 1 : 0,
                            borderBottomColor: '#f0f0f0'
                          }}
                          onPress={() => {
                            setSelectedPet(pet);
                            setShowPetsView(false);
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>{pet.name}</Text>
                            <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>{pet.species || 'N/A'} - {pet.breed || 'N/A'}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, color: '#7B2C2C', marginRight: 8 }}>View Details</Text>
                            <Ionicons name="chevron-forward" size={16} color="#7B2C2C" />
                          </View>
                        </TouchableOpacity>
                      ))}
                      {customerPets.length > 3 && (
                        <TouchableOpacity 
                          style={{ paddingVertical: 12, alignItems: 'center' }}
                          onPress={() => {
                            setShowPetsView(true);
                            loadCustomerPets();
                          }}
                        >
                          <Text style={{ color: '#7B2C2C', fontWeight: '600' }}>View {customerPets.length - 3} more pets...</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <View style={{ padding: 16, alignItems: 'center' }}>
                      <Text style={{ color: '#666', fontStyle: 'italic' }}>No pets found for this customer</Text>
                    </View>
                  )}
                </View>
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
                <View style={styles.profileImageContainer}>
                  <Ionicons name="person-circle" size={50} color="#7B2C2C" />
                </View>
                <View style={styles.customerInfo}>
                  <View style={styles.customerField}>
                    <Text style={styles.fieldTitle}>Name:</Text>
                    <Text style={styles.customerName}>
                      {customer.name || `${customer.firstname || ''} ${customer.surname || ''}`.trim() || 'Unknown Customer'}
                    </Text>
                  </View>
                  <View style={styles.customerField}>
                    <Text style={styles.fieldTitle}>Email:</Text>
                    <Text style={styles.customerEmail}>
                      {customer.email || 'No email provided'}
                    </Text>
                  </View>
                  <View style={styles.customerField}>
                    <Text style={styles.fieldTitle}>Pets:</Text>
                    <Text style={styles.customerPets}>
                      {customer.pets || 0}
                    </Text>
                  </View>
                </View>
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
      


      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#7B2C2C" />
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
                  placeholderTextColor="rgba(123, 44, 44, 0.5)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Surname *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.surname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, surname: text})}
                  placeholder="Enter surname"
                  placeholderTextColor="rgba(123, 44, 44, 0.5)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.email}
                  onChangeText={(text) => setNewCustomer({...newCustomer, email: text})}
                  placeholder="Enter email address"
                  placeholderTextColor="rgba(123, 44, 44, 0.5)"
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
                  placeholderTextColor="rgba(123, 44, 44, 0.5)"
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
                  placeholderTextColor="rgba(123, 44, 44, 0.5)"
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
                activeOpacity={1}
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
              <Text style={styles.modalTitle}>Add New Pet</Text>
              <TouchableOpacity onPress={() => setShowAddPetModal(false)}>
                <Ionicons name="close" size={24} color="#7B2C2C" />
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
                  placeholderTextColor="rgba(123, 44, 44, 0.5)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Species *</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                >
                  <Text style={styles.dropdownText}>{newPet.species || 'Select species'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#7B2C2C" />
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
                        <Text style={styles.addNewText}>+ Add New Species</Text>
                      </TouchableOpacity>
                      {animalTypes.map((type) => (
                        <View key={type.id} style={styles.dropdownItemWithDelete}>
                          <TouchableOpacity
                            style={styles.dropdownItemMain}
                            onPress={() => {
                              setNewPet({...newPet, species: type.name, breed: ''});
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
                  disabled={!newPet.species}
                >
                  <Text style={[styles.dropdownText, !newPet.species && styles.disabledText]}>
                    {newPet.breed || 'Select breed'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#7B2C2C" />
                </TouchableOpacity>
                {showBreedDropdown && newPet.species && (
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
                      {getBreedsByType(newPet.species).map((breed) => (
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
                            onPress={() => handleDeleteBreed(breed, newPet.species)}
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
              <Text style={styles.modalTitle}>Add Medical Record</Text>
              <TouchableOpacity onPress={() => {
                setShowAddRecordModal(false);
                setShowMedicalView(true);
              }}>
                <Ionicons name="close" size={24} color="#7B2C2C" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={[styles.inputGroup, { zIndex: 2000 }]}>
                <Text style={styles.inputLabel}>Category *</Text>
                <TouchableOpacity 
                  style={[styles.dropdownButton, showCategoryDropdown && styles.dropdownButtonActive]}
                  onPress={() => {
                    setShowCategoryDropdown(!showCategoryDropdown);
                    setShowTemplateDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownText, !newRecord.category && styles.placeholderText]}>
                    {newRecord.category || 'Select Category'}
                  </Text>
                  <Ionicons 
                    name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#7B2C2C" 
                  />
                </TouchableOpacity>
                {showCategoryDropdown && (
                  <View style={styles.categoryDropdownMenu}>
                    <ScrollView 
                      style={styles.dropdownScroll} 
                      nestedScrollEnabled 
                      showsVerticalScrollIndicator={true}
                      persistentScrollbar={true}
                    >
                      {categories.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.dropdownOption,
                            newRecord.category === category.name && styles.selectedOption
                          ]}
                          onPress={() => {
                            setNewRecord({...newRecord, category: category.name, formTemplate: ''});
                            setShowCategoryDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.dropdownOptionText,
                            newRecord.category === category.name && styles.selectedOptionText
                          ]}>
                            {category.name}
                          </Text>
                          {newRecord.category === category.name && (
                            <Ionicons name="checkmark" size={16} color="#28a745" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={[styles.inputGroup, { zIndex: 1000 }]}>
                <Text style={styles.inputLabel}>Form Template *</Text>
                <TouchableOpacity 
                  style={[
                    styles.dropdownButton, 
                    !newRecord.category && styles.disabledDropdown,
                    showTemplateDropdown && styles.dropdownButtonActive
                  ]}
                  onPress={() => {
                    if (newRecord.category) {
                      setShowTemplateDropdown(!showTemplateDropdown);
                      setShowCategoryDropdown(false);
                    }
                  }}
                >
                  <Text style={[
                    styles.dropdownText, 
                    !newRecord.category && styles.disabledText,
                    !newRecord.formTemplate && newRecord.category && styles.placeholderText
                  ]}>
                    {!newRecord.category ? 'Select category first' : (newRecord.formTemplate || 'Select Form Template')}
                  </Text>
                  <Ionicons 
                    name={showTemplateDropdown ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={!newRecord.category ? '#ccc' : '#7B2C2C'} 
                  />
                </TouchableOpacity>
                {showTemplateDropdown && newRecord.category && (
                  <View style={styles.templateDropdownMenu}>
                    <ScrollView 
                      style={styles.dropdownScroll} 
                      nestedScrollEnabled 
                      showsVerticalScrollIndicator={true}
                      persistentScrollbar={true}
                    >
                      {formTemplates
                        .filter(template => template.category === newRecord.category)
                        .map((template) => (
                        <TouchableOpacity
                          key={template.id}
                          style={[
                            styles.dropdownOption,
                            newRecord.formTemplate === template.formName && styles.selectedOption
                          ]}
                          onPress={() => {
                            setNewRecord({...newRecord, formTemplate: template.formName});
                            setShowTemplateDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.dropdownOptionText,
                            newRecord.formTemplate === template.formName && styles.selectedOptionText
                          ]}>
                            {template.formName}
                          </Text>
                          {newRecord.formTemplate === template.formName && (
                            <Ionicons name="checkmark" size={16} color="#28a745" />
                          )}
                        </TouchableOpacity>
                      ))}
                      {formTemplates.filter(template => template.category === newRecord.category).length === 0 && (
                        <View style={styles.emptyDropdownOption}>
                          <Text style={styles.emptyDropdownText}>No templates available for this category</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalButtonsFixed}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddRecordModal(false);
                  setShowMedicalView(true);
                }}
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
            <Text style={styles.customModalTitle}>Add New Species</Text>
            <TextInput
              style={styles.customInput}
              value={customType}
              onChangeText={setCustomType}
              placeholder="Enter new species"
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
                      setNewPet({...newPet, species: customType.trim(), breed: ''});
                      setShowCustomTypeModal(false);
                      setCustomType('');
                      Alert.alert('Success', 'Species added successfully');
                    } catch (error) {
                      console.error('Error adding animal type:', error);
                      Alert.alert('Error', 'Failed to add species');
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
                  if (customBreed.trim() && newPet.species) {
                    try {
                      const newBreedData = { animalType: newPet.species, name: customBreed.trim() };
                      await addBreed(newBreedData, tenantEmail);
                      
                      const updatedBreeds = { ...breedsByType };
                      if (!updatedBreeds[newPet.species]) {
                        updatedBreeds[newPet.species] = [];
                      }
                      updatedBreeds[newPet.species].push(customBreed.trim());
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
    backgroundColor: '#FAFAFF',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7B2C2C',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7B2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addPetButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7B2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 14,
    paddingHorizontal: 18,
    paddingBottom: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#FAFAFF',
  },
  scrollableList: {
    flex: 1,
    paddingBottom: 100,
  },
  customerRow: {
    backgroundColor: '#FAFAFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginHorizontal: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  profileImageContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B2C2C',
    width: 50,
  },
  customerName: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  customerEmail: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  customerPets: {
    fontSize: 14,
    color: '#7B2C2C',
    fontWeight: '500',
    flex: 1,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailProfileContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfoContainer: {
    flex: 1,
  },
  detailFieldRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailFieldTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B2C2C',
  },
  detailName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  detailContact: {
    fontSize: 14,
    color: '#666',
  },
  detailEmail: {
    fontSize: 14,
    color: '#666',
  },
  detailAddress: {
    fontSize: 14,
    color: '#666',
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
    color: '#9CA3AF',
    marginTop: 16,
    fontWeight: '500',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    color: '#7B2C2C',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
    color: '#374151',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  modalButtonsFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#7B2C2C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
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
  returnButton: {
    backgroundColor: '#7B2C2C',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  returnIcon: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  headerSpacer: {
    width: 40,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B2C2C',
    flex: 1,
    textAlign: 'center',
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
    borderBottomColor: 'rgba(123, 44, 44, 0.1)',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2C2C',
    width: 120,
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  detailActionValue: {
    fontSize: 16,
    color: '#7B2C2C',
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
    color: '#7B2C2C',
    marginLeft: 16,
  },
  petsList: {
    flex: 1,
    paddingBottom: 100,
  },
  petRow: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 3,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  petName: {
    fontSize: 17,
    color: '#374151',
    fontWeight: '600',
  },
  petDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
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
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 3,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  medicalType: {
    fontSize: 17,
    color: '#374151',
    fontWeight: '600',
  },
  medicalDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
  },
  medicalNotes: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
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
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7B2C2C',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F9FAFB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  dropdownText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  disabledText: {
    color: '#D1D5DB',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginTop: 4,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  dropdownScroll: {
    maxHeight: 200,
    flexGrow: 0,
  }, // Removed duplicate property
  addNewItem: {
    backgroundColor: '#f8f9fa',
  },
  addNewText: {
    fontSize: 16,
    color: '#7B2C2C',
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
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  customModalTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 18,
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  customCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  customSaveButton: {
    flex: 1,
    backgroundColor: '#7B2C2C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B2C2C',
  },
  customSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(123, 44, 44, 0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#7B2C2C',
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
  categoryDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#7B2C2C',
    borderRadius: 12,
    maxHeight: 200,
    zIndex: 20000,
    elevation: 25,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    marginTop: 4,
  },
  templateDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#7B2C2C',
    borderRadius: 12,
    maxHeight: 200,
    zIndex: 10000,
    elevation: 20,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    marginTop: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(123, 44, 44, 0.1)',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedOption: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
  },
  selectedOptionText: {
    color: '#28a745',
    fontWeight: '600',
  },
  emptyDropdownOption: {
    padding: 16,
    alignItems: 'center',
  },
  emptyDropdownText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  dropdownButtonActive: {
    borderColor: '#7B2C2C',
    borderWidth: 1,
    backgroundColor: '#fafafa',
  },
  placeholderText: {
    color: '#999',
    fontStyle: 'italic',
  },
  disabledDropdown: {
    backgroundColor: '#f5f5f5',
    borderColor: 'rgba(123, 44, 44, 0.1)',
    opacity: 0.6,
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
    backgroundColor: '#7B2C2C',
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

