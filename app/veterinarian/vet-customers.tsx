import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { getCustomers, addCustomer } from '@/lib/services/firebaseService';
import { useTenant } from '../../contexts/TenantContext';
import { useRouter } from 'expo-router';

export default function VetCustomers() {
  const { userEmail } = useTenant();
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2c5aa0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customers</Text>
        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#2c5aa0" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#2c5aa0" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <View style={styles.listContainer}>
        <ScrollView style={styles.scrollableList} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText>Loading customers...</ThemedText>
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

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

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

      {/* Customer Detail Modal */}
      <Modal
        visible={!!selectedCustomer}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedCustomer(null)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <ThemedText type="subtitle" style={styles.detailTitle}>Customer Details</ThemedText>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.detailSearchContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.detailSearchInput}
                placeholder="Search customer info..."
                value={detailSearchTerm}
                onChangeText={setDetailSearchTerm}
              />
            </View>

            <ScrollView style={styles.detailTable}>
              {selectedCustomer && [
                { label: 'Name', value: selectedCustomer.name },
                { label: 'Phone', value: selectedCustomer.contact },
                { label: 'Email', value: selectedCustomer.email || 'Not provided' },
                { label: 'Address', value: selectedCustomer.address || 'Not provided' },
                { label: 'City', value: selectedCustomer.city || 'Not specified' },
                { label: 'Number of Pets', value: selectedCustomer.pets?.toString() || '0' }
              ].filter(item => 
                detailSearchTerm === '' || 
                item.label.toLowerCase().includes(detailSearchTerm.toLowerCase()) ||
                item.value.toLowerCase().includes(detailSearchTerm.toLowerCase())
              ).map((item, index) => (
                <View key={index} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{item.value}</Text>
                </View>
              ))}
            </ScrollView>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
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
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  detailModalContent: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    flex: 1,
    paddingHorizontal: 16,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});