import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Animated, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { addAppointment, getAppointments, deleteAppointment, getCustomers } from '../../lib/services/firebaseService';
import { notificationService } from '../../lib/services/notificationService';

interface Appointment {
  id?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  petName: string;
  appointmentDate: Date;
  appointmentTime: string;
  reason: string;
  veterinarian: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-350));
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    petName: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    veterinarian: '',
    status: 'scheduled' as const,
    notes: ''
  });

  useEffect(() => {
    if (user?.email) {
      loadAppointments();
      loadCustomers();
      // Process notifications every 5 minutes
      const interval = setInterval(() => {
        processNotifications();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadAppointments = async () => {
    if (!user?.email) return;
    try {
      const appointmentsList = await getAppointments(user.email);
      setAppointments(appointmentsList);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  };

  const loadCustomers = async () => {
    if (!user?.email) return;
    try {
      const customersList = await getCustomers(user.email);
      setCustomers(customersList);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const processNotifications = async () => {
    if (!user?.email) return;
    try {
      await notificationService.processAppointmentNotifications(user.email, user.email);
    } catch (error) {
      console.error('Failed to process notifications:', error);
    }
  };

  const handleAddAppointment = async () => {
    if (!user?.email) return;
    
    if (!newAppointment.customerId || !newAppointment.appointmentDate || !newAppointment.appointmentTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const appointmentData = {
        ...newAppointment,
        appointmentDate: new Date(`${newAppointment.appointmentDate}T${newAppointment.appointmentTime}`),
        createdAt: new Date()
      };

      await addAppointment(user.email, appointmentData);
      
      // Reset form
      setNewAppointment({
        customerId: '',
        customerName: '',
        customerEmail: '',
        petName: '',
        appointmentDate: '',
        appointmentTime: '',
        reason: '',
        veterinarian: '',
        status: 'scheduled',
        notes: ''
      });

      // Close modal
      Animated.timing(slideAnim, {
        toValue: -350,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowAddModal(false));

      // Reload appointments
      await loadAppointments();
      
      Alert.alert('Success', 'Appointment added successfully');
    } catch (error) {
      console.error('Failed to add appointment:', error);
      Alert.alert('Error', 'Failed to add appointment');
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!user?.email) return;
    
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAppointment(user.email, appointmentId);
              await loadAppointments();
              Alert.alert('Success', 'Appointment deleted successfully');
            } catch (error) {
              console.error('Failed to delete appointment:', error);
              Alert.alert('Error', 'Failed to delete appointment');
            }
          }
        }
      ]
    );
  };

  const openAddModal = () => {
    setShowAddModal(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const selectCustomer = (customer: any) => {
    setNewAppointment({
      ...newAppointment,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email
    });
  };

  // Filter and paginate appointments
  const filteredAppointments = appointments.filter(appointment =>
    appointment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Appointments</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>+ Add Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.notifyButton} 
            onPress={processNotifications}
          >
            <Text style={styles.notifyButtonText}>🤖 AI Process Notifications</Text>
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search appointments..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.tableContainer}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 1.5 }]}>Customer</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Pet</Text>
              <Text style={[styles.headerCell, { flex: 1.5 }]}>Date & Time</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Reason</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Status</Text>
              <Text style={[styles.headerCell, { flex: 0.5 }]}>Actions</Text>
            </View>
            
            <ScrollView style={styles.tableBody}>
              {paginatedAppointments.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No appointments found</Text>
                </View>
              ) : (
                paginatedAppointments.map((appointment) => (
                  <View key={appointment.id} style={styles.tableRow}>
                    <View style={styles.rowContent}>
                      <Text style={[styles.cell, { flex: 1.5 }]}>{appointment.customerName}</Text>
                      <Text style={[styles.cell, { flex: 1 }]}>{appointment.petName}</Text>
                      <Text style={[styles.cell, { flex: 1.5 }]}>
                        {formatDateTime(appointment.appointmentDate)}
                      </Text>
                      <Text style={[styles.cell, { flex: 1 }]}>{appointment.reason}</Text>
                      <Text style={[styles.cell, { flex: 1 }]}>{appointment.status}</Text>
                    </View>
                    <View style={styles.actionsCell}>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => appointment.id && handleDeleteAppointment(appointment.id)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>

          {/* Pagination */}
          <View style={styles.pagination}>
            <View style={styles.paginationControls}>
              <Text style={styles.paginationLabel}>Rows per page:</Text>
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowDropdown(!showDropdown)}
                >
                  <Text style={styles.dropdownText}>{itemsPerPage}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {showDropdown && (
                  <View style={styles.dropdownMenu}>
                    {[5, 10, 25, 50].map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setItemsPerPage(size);
                          setCurrentPage(1);
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>{size}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.pageBtn}
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <Text style={styles.pageBtnText}>‹</Text>
              </TouchableOpacity>
              
              <Text style={styles.pageOf}>
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAppointments.length)} of {filteredAppointments.length}
              </Text>
              
              <TouchableOpacity
                style={styles.pageBtn}
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <Text style={styles.pageBtnText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Add Appointment Modal */}
      {showAddModal && (
        <Modal transparent={true} visible={showAddModal} animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: slideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Appointment</Text>
                <TouchableOpacity
                  style={styles.drawerCloseButton}
                  onPress={() => {
                    Animated.timing(slideAnim, {
                      toValue: -350,
                      duration: 200,
                      useNativeDriver: false,
                    }).start(() => setShowAddModal(false));
                  }}
                >
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Customer *</Text>
                <View style={styles.customerSelector}>
                  <Text style={styles.selectedCustomer}>
                    {newAppointment.customerName || 'Select Customer'}
                  </Text>
                  <ScrollView style={styles.customerList}>
                    {customers.map((customer) => (
                      <TouchableOpacity
                        key={customer.id}
                        style={styles.customerOption}
                        onPress={() => selectCustomer(customer)}
                      >
                        <Text style={styles.customerOptionText}>
                          {customer.firstName} {customer.lastName} - {customer.email}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <Text style={styles.fieldLabel}>Pet Name *</Text>
                <TextInput
                  style={styles.drawerInput}
                  value={newAppointment.petName}
                  onChangeText={(text) => setNewAppointment({...newAppointment, petName: text})}
                  placeholder="Enter pet name"
                />

                <Text style={styles.fieldLabel}>Date *</Text>
                <TextInput
                  style={styles.drawerInput}
                  value={newAppointment.appointmentDate}
                  onChangeText={(text) => setNewAppointment({...newAppointment, appointmentDate: text})}
                  placeholder="YYYY-MM-DD"
                />

                <Text style={styles.fieldLabel}>Time *</Text>
                <TextInput
                  style={styles.drawerInput}
                  value={newAppointment.appointmentTime}
                  onChangeText={(text) => setNewAppointment({...newAppointment, appointmentTime: text})}
                  placeholder="HH:MM"
                />

                <Text style={styles.fieldLabel}>Reason</Text>
                <TextInput
                  style={styles.drawerInput}
                  value={newAppointment.reason}
                  onChangeText={(text) => setNewAppointment({...newAppointment, reason: text})}
                  placeholder="Reason for visit"
                />

                <Text style={styles.fieldLabel}>Veterinarian</Text>
                <TextInput
                  style={styles.drawerInput}
                  value={newAppointment.veterinarian}
                  onChangeText={(text) => setNewAppointment({...newAppointment, veterinarian: text})}
                  placeholder="Veterinarian name"
                />

                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={[styles.drawerInput, styles.notesInput]}
                  value={newAppointment.notes}
                  onChangeText={(text) => setNewAppointment({...newAppointment, notes: text})}
                  placeholder="Additional notes"
                  multiline
                />
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  Animated.timing(slideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddModal(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={handleAddAppointment}>
                  <Text style={styles.drawerSaveText}>Add Appointment</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
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
    gap: 15,
  },
  addButton: {
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
  notifyButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  notifyButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  searchContainer: {
    borderWidth: 2,
    borderColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    width: 150,
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
    alignItems: 'center',
  },
  rowContent: {
    flexDirection: 'row',
    flex: 1,
  },
  actionsCell: {
    flex: 0.5,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  cell: {
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
  pageOf: {
    fontSize: 10,
    color: '#666',
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
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  customerSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    maxHeight: 150,
  },
  selectedCustomer: {
    padding: 12,
    fontSize: 12,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  customerList: {
    maxHeight: 100,
  },
  customerOption: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerOptionText: {
    fontSize: 11,
    color: '#555',
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
});