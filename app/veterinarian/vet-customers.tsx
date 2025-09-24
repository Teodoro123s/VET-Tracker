import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { getCustomers, addCustomer } from '@/lib/services/firebaseService';
import { useTenant } from '../../contexts/TenantContext';
import { useRouter } from 'expo-router';
import { useCustomer } from '../_layout';

export default function VetCustomers() {
  const { userEmail } = useTenant();
  const router = useRouter();
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
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [petsSearchTerm, setPetsSearchTerm] = useState('');
  const [customerPets, setCustomerPets] = useState([]);
  const [medicalSearchTerm, setMedicalSearchTerm] = useState('');
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    loadCustomers();
    // Reset navigation states to show customer list by default
    setSelectedCustomer(null);
    setShowPetsView(false);
    setSelectedPet(null);
    setShowMedicalView(false);
    setSelectedMedicalRecord(null);
  }, []);
  
  useEffect(() => {
    if (selectedCustomer) {
      // Load pets for selected customer
      const mockPets = [
        { id: 1, name: 'Max', type: 'Dog', breed: 'Golden Retriever' },
        { id: 2, name: 'Bella', type: 'Cat', breed: 'Persian' }
      ];
      setCustomerPets(mockPets);
    }
  }, [selectedCustomer]);
  
  useEffect(() => {
    if (selectedPet) {
      // Load medical records for selected pet
      const mockRecords = [
        { 
          id: 1, 
          formType: 'Vaccination Record', 
          date: 'Dec 10, 2023',
          formData: {
            vaccineType: 'DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)',
            administrationDate: 'Dec 10, 2023',
            nextDueDate: 'Dec 10, 2024',
            veterinarian: 'Dr. Smith',
            notes: 'Annual vaccines updated - pet showed no adverse reactions'
          }
        },
        { 
          id: 2, 
          formType: 'Health Checkup', 
          date: 'Nov 15, 2023',
          formData: {
            weight: '25 kg',
            temperature: '38.5°C',
            heartRate: '120 bpm',
            veterinarian: 'Dr. Johnson',
            findings: 'Pet is in excellent health',
            recommendations: 'Continue current diet and exercise routine'
          }
        }
      ];
      setMedicalRecords(mockRecords);
    }
  }, [selectedPet]);

  const loadCustomers = async () => {
    try {
      const customersData = await getCustomers(userEmail);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.firstname || !newCustomer.lastname || !newCustomer.phone) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      const customer = {
        name: `${newCustomer.lastname}, ${newCustomer.firstname}`,
        contact: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address,
        city: 'Not specified',
        pets: 0
      };

      const savedCustomer = await addCustomer(customer, userEmail);
      await loadCustomers(); // Refresh the list from database
      setNewCustomer({ firstname: '', lastname: '', phone: '', email: '', address: '' });
      setShowAddModal(false);
      Alert.alert('Success', 'Customer added successfully');
    } catch (error) {
      console.error('Error adding customer:', error);
      Alert.alert('Error', 'Failed to add customer');
    }
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

      <View style={styles.listContainer}>
        <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText>Loading customers...</ThemedText>
            </View>
          ) : selectedPet && !showMedicalView && !selectedMedicalRecord ? (
            <View style={styles.petDetailsView}>
              {console.log('SHOWING PET DETAILS VIEW - selectedPet:', selectedPet, 'showMedicalView:', showMedicalView)}
              <View style={styles.detailTable}>
                {[
                  { label: 'Name', value: selectedPet.name },
                  { label: 'Type', value: selectedPet.type },
                  { label: 'Breed', value: selectedPet.breed },
                  { label: 'Age', value: '3 years' },
                  { label: 'Weight', value: '25 kg' },
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
            </View>
          ) : showPetsView ? (
            <View style={styles.petsView}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search pets..."
                  value={petsSearchTerm}
                  onChangeText={setPetsSearchTerm}
                />
              </View>
              
              <View style={styles.petsList}>
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
              </View>
            </View>
          ) : showMedicalView ? (
            <View style={styles.medicalView}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search medical records..."
                  value={medicalSearchTerm}
                  onChangeText={setMedicalSearchTerm}
                />
              </View>
              
              <View style={styles.medicalList}>
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
              </View>
            </View>
          ) : selectedCustomer && !showPetsView && !selectedPet ? (
            <View style={styles.customerDetailsView}>
              <View style={styles.detailTable}>
                {[
                  { label: 'Name', value: selectedCustomer.name },
                  { label: 'Phone', value: selectedCustomer.contact },
                  { label: 'Email', value: selectedCustomer.email || 'Not provided' },
                  { label: 'Address', value: selectedCustomer.address || 'Not provided' },
                  { label: 'City', value: selectedCustomer.city || 'Not specified' },
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
            </View>
          ) : selectedMedicalRecord ? (
            <View style={styles.customerDetailsView}>
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
            </View>
          ) : filteredCustomers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No customers found</ThemedText>
            </View>
          ) : (
            filteredCustomers.map((customer, index) => (
              <TouchableOpacity 
                key={customer.id || index} 
                style={styles.customerRow}
                onPress={() => setSelectedCustomer(customer)}
              >
                <Text style={styles.customerName}>{customer.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
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
          onPress={() => {}}
        >
          <Ionicons name="paw" size={24} color="#fff" />
        </TouchableOpacity>
      )}
      
      {showMedicalView && (
        <TouchableOpacity 
          style={styles.addRecordButton}
          onPress={() => {}}
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
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.firstname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, firstname: text})}
                  placeholder="Enter first name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.lastname}
                  onChangeText={(text) => setNewCustomer({...newCustomer, lastname: text})}
                  placeholder="Enter last name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomer.phone}
                  onChangeText={(text) => setNewCustomer({...newCustomer, phone: text})}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
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
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newCustomer.address}
                  onChangeText={(text) => setNewCustomer({...newCustomer, address: text})}
                  placeholder="Enter address"
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


});