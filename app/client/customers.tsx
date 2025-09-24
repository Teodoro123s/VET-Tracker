import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Image, Animated } from 'react-native';
import SearchableDropdown from '@/components/SearchableDropdown';
import { getCustomers, getPets, addCustomer, addPet, addMedicalRecord, deleteCustomerWithPets, getMedicalCategories, getMedicalForms, getMedicalRecords, getFormFields, getAnimalTypes, addAnimalType, getBreeds, addBreed, deleteAnimalType, deleteBreed, getVeterinarians } from '@/lib/services/firebaseService';
import { useTenant } from '@/contexts/TenantContext';

export default function CustomersScreen() {
  const { userEmail } = useTenant();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const customersData = await getCustomers(userEmail);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Customers</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Text>Customers loaded: {customers.length}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#800000',
  },
});