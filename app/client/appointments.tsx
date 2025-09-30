import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Animated, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { addAppointment, getAppointments, deleteAppointment, getCustomers, getPets, getVeterinarians, getReasonOptions, addReasonOption, updateReasonOption, deleteReasonOption } from '../../lib/services/firebaseService';
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
  const [pets, setPets] = useState<any[]>([]);
  const [veterinarians, setVeterinarians] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const [showVetDropdown, setShowVetDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAMPM, setSelectedAMPM] = useState('AM');
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reasonOptions, setReasonOptions] = useState<any[]>([]);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [showAddReasonModal, setShowAddReasonModal] = useState(false);
  const [showEditReasonModal, setShowEditReasonModal] = useState(false);
  const [newReasonText, setNewReasonText] = useState('');
  const [editingReason, setEditingReason] = useState<any>(null);
  const [showServiceTypeDropdown, setShowServiceTypeDropdown] = useState(false);
  
  const serviceTypes = [
    { id: 1, name: 'Checkup', duration: 30, icon: '🩺' },
    { id: 2, name: 'Vaccination', duration: 15, icon: '💉' },
    { id: 3, name: 'Surgery', duration: 120, icon: '🔪' },
    { id: 4, name: 'Dental', duration: 60, icon: '🦷' },
    { id: 5, name: 'Emergency', duration: 45, icon: '🚨' },
    { id: 6, name: 'Grooming', duration: 90, icon: '✂️' },
  ];
  const [slideAnim] = useState(new Animated.Value(-350));
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [vetFilter, setVetFilter] = useState('all');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showVetFilter, setShowVetFilter] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    petName: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    serviceType: '',
    duration: 30,
    veterinarian: '',
    status: 'scheduled' as const,
    notes: ''
  });

  useEffect(() => {
    if (user?.email) {
      loadAppointments();
      loadCustomers();
      loadPets();
      loadVeterinarians();
      loadReasonOptions();
      // Process notifications every 5 minutes
      const interval = setInterval(() => {
        processNotifications();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [user]);
  
  // Refresh appointments when view mode changes to calendar
  useEffect(() => {
    if (viewMode === 'calendar' && user?.email) {
      loadAppointments();
    }
  }, [viewMode, statusFilter, vetFilter]);

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

  const loadPets = async () => {
    if (!user?.email) return;
    try {
      const petsList = await getPets(user.email);
      setPets(petsList);
    } catch (error) {
      console.error('Failed to load pets:', error);
    }
  };

  const loadVeterinarians = async () => {
    if (!user?.email) return;
    try {
      const vetsList = await getVeterinarians(user.email);
      setVeterinarians(vetsList);
    } catch (error) {
      console.error('Failed to load veterinarians:', error);
    }
  };

  const loadReasonOptions = async () => {
    if (!user?.email) return;
    try {
      const reasonsList = await getReasonOptions(user.email);
      setReasonOptions(reasonsList);
    } catch (error) {
      console.error('Failed to load reason options:', error);
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
    if (!user?.email) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    
    if (!newAppointment.customerId || !newAppointment.appointmentDate || !newAppointment.appointmentTime || !newAppointment.petName) {
      console.log('Missing fields:', {
        customerId: newAppointment.customerId,
        appointmentDate: newAppointment.appointmentDate,
        appointmentTime: newAppointment.appointmentTime,
        petName: newAppointment.petName
      });
      Alert.alert('Error', 'Please fill in all required fields (Customer, Pet, Date, Time)');
      return;
    }

    try {
      console.log('Adding appointment:', newAppointment);
      
      const appointmentData = {
        ...newAppointment,
        appointmentDate: new Date(`${newAppointment.appointmentDate}T${newAppointment.appointmentTime}`),
        serviceType: newAppointment.serviceType,
        duration: newAppointment.duration,
        createdAt: new Date()
      };

      console.log('Appointment data to save:', appointmentData);
      
      await addAppointment(user.email, appointmentData);
      console.log('Appointment saved successfully');
      
      // Show success alert first
      Alert.alert('Success', 'Appointment added successfully');
      
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
      setSelectedCustomer(null);

      // Close modal
      Animated.timing(slideAnim, {
        toValue: -350,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowAddModal(false));

      // Reload appointments
      await loadAppointments();
      
    } catch (error) {
      console.error('Failed to add appointment:', error);
      Alert.alert('Error', `Failed to add appointment: ${error.message || error}`);
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
    setSelectedCustomer(customer);
    const firstName = customer.firstname || '';
    const lastName = customer.surname || '';
    const fullName = `${firstName} ${lastName}`.trim() || customer.email || 'Unknown Customer';
    
    setNewAppointment({
      ...newAppointment,
      customerId: customer.id,
      customerName: fullName,
      customerEmail: customer.email || '',
      petName: '' // Reset pet selection when customer changes
    });
    setShowCustomerDropdown(false);
  };

  const selectPet = (pet: any) => {
    setNewAppointment({
      ...newAppointment,
      petName: pet.name
    });
    setShowPetDropdown(false);
  };

  const selectVeterinarian = (vet: any) => {
    const vetName = `${vet.firstname || ''} ${vet.surname || ''}`.trim() || vet.name || 'Unknown';
    setNewAppointment({
      ...newAppointment,
      veterinarian: vetName
    });
    setShowVetDropdown(false);
    
    // Check for conflicts if date and time are already selected
    if (newAppointment.appointmentDate && newAppointment.appointmentTime) {
      checkAppointmentConflict(newAppointment.appointmentDate, newAppointment.appointmentTime, vetName);
    }
  };

  const checkAppointmentConflict = (date: string, time: string, veterinarian: string) => {
    const conflictingAppointment = appointments.find(apt => {
      try {
        const aptDate = new Date(apt.appointmentDate);
        if (isNaN(aptDate.getTime())) return false; // Skip invalid dates
        
        const aptDateStr = aptDate.toISOString().split('T')[0];
        const aptTime = aptDate.toTimeString().slice(0, 5);
        return aptDateStr === date && aptTime === time && apt.veterinarian === veterinarian;
      } catch (error) {
        return false; // Skip appointments with invalid dates
      }
    });
    
    if (conflictingAppointment) {
      Alert.alert(
        '🤖 AI Conflict Detection',
        `Dr. ${veterinarian} already has an appointment at ${time} on ${date} with ${conflictingAppointment.customerName}. Please select a different time or veterinarian.`,
        [{ text: 'OK' }]
      );
    }
  };

  // Get pets for selected customer
  const getCustomerPets = () => {
    if (!selectedCustomer) return [];
    return pets.filter(pet => pet.owner === selectedCustomer.id);
  };

  // Generate calendar options
  const getDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({length: daysInMonth}, (_, i) => i + 1);
  };
  
  const getMonths = () => [
    {value: 1, name: 'Jan'}, {value: 2, name: 'Feb'}, {value: 3, name: 'Mar'},
    {value: 4, name: 'Apr'}, {value: 5, name: 'May'}, {value: 6, name: 'Jun'},
    {value: 7, name: 'Jul'}, {value: 8, name: 'Aug'}, {value: 9, name: 'Sep'},
    {value: 10, name: 'Oct'}, {value: 11, name: 'Nov'}, {value: 12, name: 'Dec'}
  ];
  
  const getYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({length: 5}, (_, i) => currentYear + i);
  };
  
  const formatSelectedDate = () => {
    return `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
  };

  // Generate simple options
  const getHours = () => Array.from({length: 12}, (_, i) => i + 1);
  const getMinutes = () => [0, 10, 20, 30, 40, 50];
  
  const formatSelectedTime = () => {
    const hour24 = selectedAMPM === 'AM' ? 
      (selectedHour === 12 ? 0 : selectedHour) : 
      (selectedHour === 12 ? 12 : selectedHour + 12);
    return `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
  };
  
  const formatDisplayTime = () => {
    return `${selectedHour}:${selectedMinute.toString().padStart(2, '0')} ${selectedAMPM}`;
  };

  const handleAddReason = async () => {
    if (!user?.email || !newReasonText.trim()) return;
    try {
      await addReasonOption({ text: newReasonText.trim() }, user.email);
      await loadReasonOptions();
      setShowAddReasonModal(false);
      setNewReasonText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add reason');
    }
  };

  const handleEditReason = async () => {
    if (!user?.email || !newReasonText.trim() || !editingReason) return;
    try {
      await updateReasonOption(editingReason.id, { text: newReasonText.trim() }, user.email);
      await loadReasonOptions();
      setShowEditReasonModal(false);
      setNewReasonText('');
      setEditingReason(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update reason');
    }
  };

  const handleDeleteReason = async (reasonId: string) => {
    if (!user?.email) return;
    Alert.alert(
      'Delete Reason',
      'Are you sure you want to delete this reason?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReasonOption(reasonId, user.email);
              await loadReasonOptions();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete reason');
            }
          }
        }
      ]
    );
  };

  // Filter and paginate appointments with status priority
  const filteredAppointments = appointments.filter(appointment =>
    appointment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.reason.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const statusPriority = { 'due': 1, 'pending': 2, 'scheduled': 3, 'completed': 4, 'cancelled': 5 };
    return (statusPriority[a.status] || 3) - (statusPriority[b.status] || 3);
  });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  const formatDateTime = (date: any) => {
    try {
      if (!date) return { date: 'No Date', time: '' };
      
      let dateObj;
      if (date.seconds) {
        // Firestore timestamp
        dateObj = new Date(date.seconds * 1000);
      } else {
        dateObj = new Date(date);
      }
      
      if (isNaN(dateObj.getTime())) {
        return { date: 'Invalid Date', time: '' };
      }
      
      const dateStr = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      const timeStr = dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      return { date: dateStr, time: timeStr };
    } catch (error) {
      return { date: 'Invalid Date', time: '' };
    }
  };

  if (selectedAppointment) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Appointments</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.tableContainer}>
            <View style={styles.tableTopRow}>
              <TouchableOpacity style={styles.returnButton} onPress={() => setSelectedAppointment(null)}>
                <Text style={styles.returnButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.formDetailTitle}>Appointment Details</Text>
              <View style={styles.categoryActions}>
                <TouchableOpacity 
                  style={styles.deleteCategoryButton} 
                  onPress={() => handleDeleteAppointment(selectedAppointment.id)}
                >
                  <Text style={styles.deleteCategoryButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.detailTable} showsVerticalScrollIndicator={false}>
              <View style={styles.detailTableHeader}>
                <Text style={styles.detailHeaderCell}>Field</Text>
                <Text style={styles.detailHeaderCell}>Value</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Customer</Text>
                <Text style={styles.detailCell}>{selectedAppointment.customerName}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Pet</Text>
                <Text style={styles.detailCell}>{selectedAppointment.petName}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Date</Text>
                <Text style={styles.detailCell}>{formatDateTime(selectedAppointment.appointmentDate).date}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Time</Text>
                <Text style={styles.detailCell}>{formatDateTime(selectedAppointment.appointmentDate).time}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Service Type</Text>
                <Text style={styles.detailCell}>{selectedAppointment.serviceType || 'Not specified'}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Duration</Text>
                <Text style={styles.detailCell}>{selectedAppointment.duration || 30} minutes</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Reason</Text>
                <Text style={styles.detailCell}>{selectedAppointment.reason}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Veterinarian</Text>
                <Text style={styles.detailCell}>{selectedAppointment.veterinarian || 'Not assigned'}</Text>
              </View>
              <View style={styles.detailTableRow}>
                <Text style={styles.detailCell}>Status</Text>
                <Text style={styles.detailCell}>{selectedAppointment.status}</Text>
              </View>
              {selectedAppointment.notes && (
                <View style={styles.detailTableRow}>
                  <Text style={styles.detailCell}>Notes</Text>
                  <Text style={styles.detailCell}>{selectedAppointment.notes}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Appointments</Text>
        <View style={styles.headerActions}>
          <View style={styles.viewToggle}>
            <TouchableOpacity 
              style={[styles.toggleButton, viewMode === 'table' && styles.activeToggle]}
              onPress={() => setViewMode('table')}
            >
              <Text style={[styles.toggleText, viewMode === 'table' && styles.activeToggleText]}>📋 Table</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, viewMode === 'calendar' && styles.activeToggle]}
              onPress={() => setViewMode('calendar')}
            >
              <Text style={[styles.toggleText, viewMode === 'calendar' && styles.activeToggleText]}>📅 Calendar</Text>
            </TouchableOpacity>
          </View>
          
          {viewMode === 'calendar' && (
            <View style={styles.calendarFilters}>
              <View style={styles.filterDropdown}>
                <TouchableOpacity 
                  style={styles.filterButton}
                  onPress={() => setShowStatusFilter(!showStatusFilter)}
                >
                  <Text style={styles.filterText}>{statusFilter === 'all' ? 'All Status' : statusFilter}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {showStatusFilter && (
                  <View style={styles.filterMenu}>
                    {['all', 'pending', 'scheduled', 'completed', 'cancelled'].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={styles.filterOption}
                        onPress={() => {
                          setStatusFilter(status);
                          setShowStatusFilter(false);
                        }}
                      >
                        <Text style={styles.filterOptionText}>{status === 'all' ? 'All Status' : status}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              <View style={styles.filterDropdown}>
                <TouchableOpacity 
                  style={styles.filterButton}
                  onPress={() => setShowVetFilter(!showVetFilter)}
                >
                  <Text style={styles.filterText}>{vetFilter === 'all' ? 'All Vets' : vetFilter}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {showVetFilter && (
                  <View style={styles.filterMenu}>
                    <TouchableOpacity
                      style={styles.filterOption}
                      onPress={() => {
                        setVetFilter('all');
                        setShowVetFilter(false);
                      }}
                    >
                      <Text style={styles.filterOptionText}>All Vets</Text>
                    </TouchableOpacity>
                    {veterinarians.map((vet) => (
                      <TouchableOpacity
                        key={vet.id}
                        style={styles.filterOption}
                        onPress={() => {
                          setVetFilter(vet.name || `${vet.firstname} ${vet.surname}`);
                          setShowVetFilter(false);
                        }}
                      >
                        <Text style={styles.filterOptionText}>{vet.name || `${vet.firstname} ${vet.surname}`}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
          
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
          
          {viewMode === 'table' && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {viewMode === 'calendar' ? (
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity 
                style={styles.navButton}
                onPress={() => {
                  const newDate = new Date(calendarDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCalendarDate(newDate);
                }}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
              
              <Text style={styles.calendarTitle}>
                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              
              <TouchableOpacity 
                style={styles.navButton}
                onPress={() => {
                  const newDate = new Date(calendarDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCalendarDate(newDate);
                }}
              >
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.calendarGrid}>
              <View style={styles.weekHeader}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} style={styles.weekDay}>{day}</Text>
                ))}
              </View>
              
              {(() => {
                const year = calendarDate.getFullYear();
                const month = calendarDate.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const days = [];
                
                // Empty cells for days before month starts
                for (let i = 0; i < firstDay; i++) {
                  days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
                }
                
                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const dayDate = new Date(year, month, day);
                  const dayAppointments = appointments.filter(apt => {
                    try {
                      let aptDate;
                      if (apt.appointmentDate?.seconds) {
                        aptDate = new Date(apt.appointmentDate.seconds * 1000);
                      } else {
                        aptDate = new Date(apt.appointmentDate);
                      }
                      
                      if (isNaN(aptDate.getTime())) return false;
                      
                      // Check if same day
                      if (aptDate.toDateString() !== dayDate.toDateString()) return false;
                      
                      // Apply filters
                      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
                      if (vetFilter !== 'all' && apt.veterinarian !== vetFilter) return false;
                      
                      return true;
                    } catch (error) {
                      return false;
                    }
                  });
                  
                  days.push(
                    <View key={day} style={styles.calendarDay}>
                      <Text style={styles.dayNumber}>{day}</Text>
                      <View style={styles.appointmentDots}>
                        {dayAppointments.slice(0, 3).map((apt, idx) => {
                          const getStatusColor = () => {
                            switch(apt.status) {
                              case 'completed': return '#28a745';
                              case 'cancelled': return '#dc3545';
                              case 'pending': return '#ffc107';
                              default: return '#007bff';
                            }
                          };
                          return (
                            <TouchableOpacity
                              key={idx}
                              style={[styles.appointmentDot, { backgroundColor: getStatusColor() }]}
                              onPress={() => setSelectedAppointment(apt)}
                            />
                          );
                        })}
                        {dayAppointments.length > 3 && (
                          <Text style={styles.moreCount}>+{dayAppointments.length - 3}</Text>
                        )}
                      </View>
                    </View>
                  );
                }
                
                return (
                  <View style={styles.calendarDays}>
                    {days}
                  </View>
                );
              })()}
            </View>
          </View>
        ) : (
        <View style={styles.tableContainer}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 0.8, textAlign: 'center', marginLeft: -10, marginRight: 15 }]}>Date & Time</Text>
              <Text style={[styles.headerCell, { flex: 1.9, textAlign: 'left' }]}>Customer</Text>
              <Text style={[styles.headerCell, { flex: 1, textAlign: 'left' }]}>Pet</Text>
              <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'left' }]}>Reason</Text>
              <Text style={[styles.headerCell, { flex: 0.8 }]}>Status</Text>
            </View>
            
            <ScrollView style={styles.tableBody}>
              {paginatedAppointments.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No appointments found</Text>
                </View>
              ) : (
                paginatedAppointments.map((appointment) => {
                  const getStatusColor = () => {
                    switch(appointment.status) {
                      case 'completed': return '#e8f5e8';
                      case 'cancelled': return '#ffe6e6';
                      case 'due': return '#fff3cd';
                      case 'pending': return '#e3f2fd';
                      default: return '#ffffff';
                    }
                  };
                  
                  const getServiceIcon = () => {
                    if (appointment.serviceType?.includes('Checkup')) return '🩺';
                    if (appointment.serviceType?.includes('Vaccination')) return '💉';
                    if (appointment.serviceType?.includes('Surgery')) return '🔪';
                    if (appointment.serviceType?.includes('Emergency')) return '🚨';
                    if (appointment.serviceType?.includes('Dental')) return '🦷';
                    if (appointment.serviceType?.includes('Grooming')) return '✂️';
                    return '📋';
                  };
                  
                  return (
                  <TouchableOpacity 
                    key={appointment.id} 
                    style={[styles.tableRow, { backgroundColor: getStatusColor() }]}
                    onPress={() => setSelectedAppointment(appointment)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.cell, { flex: 0.8, alignItems: 'center', justifyContent: 'center', marginLeft: -10, marginRight: 15 }]}>
                      <Text style={[styles.dateText]}>
                        {formatDateTime(appointment.appointmentDate).date}
                      </Text>
                      <Text style={[styles.timeText]}>
                        {formatDateTime(appointment.appointmentDate).time}
                      </Text>
                    </View>
                    <Text style={[styles.cell, { flex: 1.9, textAlign: 'left' }]}>{appointment.customerName}</Text>
                    <Text style={[styles.cell, { flex: 1, textAlign: 'left' }]}>{appointment.petName}</Text>
                    <View style={[styles.cell, { flex: 1.2, flexDirection: 'row', alignItems: 'center' }]}>
                      <Text style={styles.serviceIcon}>{getServiceIcon()}</Text>
                      <Text style={[styles.cellText, { marginLeft: 5 }]}>{appointment.reason}</Text>
                    </View>
                    <Text style={[styles.cell, { flex: 0.8 }]}>{appointment.status}</Text>
                  </TouchableOpacity>
                  );
                })
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
        )}
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
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  >
                    <Text style={styles.selectedCustomer}>
                      {newAppointment.customerName || 'Select Customer'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showCustomerDropdown && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.customerList} showsVerticalScrollIndicator={false}>
                        {customers.map((customer) => (
                          <TouchableOpacity
                            key={customer.id}
                            style={styles.customerOption}
                            onPress={() => selectCustomer(customer)}
                          >
                            <Text style={styles.customerOptionText}>
                              {`${customer.firstname || ''} ${customer.surname || ''}`.trim() || customer.email || 'Unknown'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <Text style={styles.fieldLabel}>Pet *</Text>
                <View style={styles.petSelector}>
                  <TouchableOpacity 
                    style={[styles.dropdownButton, !selectedCustomer && styles.disabledDropdown]}
                    onPress={() => selectedCustomer && setShowPetDropdown(!showPetDropdown)}
                    disabled={!selectedCustomer}
                  >
                    <Text style={styles.selectedCustomer}>
                      {newAppointment.petName || 'Select Pet'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showPetDropdown && selectedCustomer && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.customerList} showsVerticalScrollIndicator={false}>
                        {getCustomerPets().map((pet) => (
                          <TouchableOpacity
                            key={pet.id}
                            style={styles.customerOption}
                            onPress={() => selectPet(pet)}
                          >
                            <Text style={styles.customerOptionText}>
                              {pet.name} ({pet.species || 'Unknown'})
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {getCustomerPets().length === 0 && (
                          <View style={styles.customerOption}>
                            <Text style={[styles.customerOptionText, {fontStyle: 'italic', color: '#999'}]}>
                              No pets found for this customer
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <Text style={styles.fieldLabel}>Date *</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {newAppointment.appointmentDate ? 
                      new Date(newAppointment.appointmentDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'Select Date'}
                  </Text>
                  <Text style={styles.dropdownArrow}>📅</Text>
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>Time *</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {newAppointment.appointmentTime ? 
                      (() => {
                        const [hour, minute] = newAppointment.appointmentTime.split(':');
                        const h = parseInt(hour);
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
                        return `${h12}:${minute} ${ampm}`;
                      })()
                      : 'Select Time'}
                  </Text>
                  <Text style={styles.dropdownArrow}>🕐</Text>
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>Veterinarian</Text>
                <View style={styles.vetSelector}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => setShowVetDropdown(!showVetDropdown)}
                  >
                    <Text style={styles.selectedCustomer}>
                      {newAppointment.veterinarian || 'Select Veterinarian'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showVetDropdown && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.customerList} showsVerticalScrollIndicator={false}>
                        {veterinarians.map((vet) => (
                          <TouchableOpacity
                            key={vet.id}
                            style={styles.customerOption}
                            onPress={() => selectVeterinarian(vet)}
                          >
                            <Text style={styles.customerOptionText}>
                              {`${vet.firstname || ''} ${vet.surname || ''}`.trim() || vet.name || 'Unknown'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {veterinarians.length === 0 && (
                          <View style={styles.customerOption}>
                            <Text style={[styles.customerOptionText, {fontStyle: 'italic', color: '#999'}]}>
                              No veterinarians found
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <Text style={styles.fieldLabel}>Service Type</Text>
                <View style={styles.serviceTypeSelector}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => setShowServiceTypeDropdown(!showServiceTypeDropdown)}
                  >
                    <Text style={styles.selectedCustomer}>
                      {newAppointment.serviceType || 'Select Service Type'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showServiceTypeDropdown && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.customerList} showsVerticalScrollIndicator={false}>
                        {serviceTypes.map((service) => (
                          <TouchableOpacity
                            key={service.id}
                            style={styles.customerOption}
                            onPress={() => {
                              setNewAppointment({...newAppointment, serviceType: service.name, duration: service.duration});
                              setShowServiceTypeDropdown(false);
                            }}
                          >
                            <Text style={styles.customerOptionText}>
                              {service.icon} {service.name} ({service.duration}min)
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <Text style={styles.fieldLabel}>Reason</Text>
                <View style={styles.reasonSelector}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => setShowReasonDropdown(!showReasonDropdown)}
                  >
                    <Text style={styles.selectedCustomer}>
                      {newAppointment.reason || 'Select Reason'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showReasonDropdown && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.customerList} showsVerticalScrollIndicator={false}>
                        {reasonOptions.map((reason) => (
                          <View key={reason.id} style={styles.reasonOptionRow}>
                            <TouchableOpacity
                              style={styles.reasonOption}
                              onPress={() => {
                                setNewAppointment({...newAppointment, reason: reason.text});
                                setShowReasonDropdown(false);
                              }}
                            >
                              <Text style={styles.customerOptionText}>{reason.text}</Text>
                            </TouchableOpacity>
                            <View style={styles.reasonActions}>
                              <TouchableOpacity
                                style={styles.editIcon}
                                onPress={() => {
                                  setEditingReason(reason);
                                  setNewReasonText(reason.text);
                                  setShowEditReasonModal(true);
                                }}
                              >
                                <Text style={styles.iconText}>✏️</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.deleteIcon}
                                onPress={() => handleDeleteReason(reason.id)}
                              >
                                <Text style={styles.iconText}>🗑️</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                        <TouchableOpacity
                          style={styles.addReasonOption}
                          onPress={() => setShowAddReasonModal(true)}
                        >
                          <Text style={styles.addReasonText}>+ Add Custom Reason</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </View>

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

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal transparent={true} visible={showDatePicker} animationType="scale">
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity 
                  style={styles.exitButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.exitText}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateSelector}>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateLabel}>Day</Text>
                  <ScrollView style={styles.dateScroll} contentContainerStyle={styles.dateScrollContent} showsVerticalScrollIndicator={false}>
                    {getDays().map(day => (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dateItem, selectedDay === day && styles.selectedDate]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <Text style={[styles.dateText, selectedDay === day && styles.selectedDateText]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateLabel}>Month</Text>
                  <ScrollView style={styles.dateScroll} contentContainerStyle={styles.dateScrollContent} showsVerticalScrollIndicator={false}>
                    {getMonths().map(month => (
                      <TouchableOpacity
                        key={month.value}
                        style={[styles.dateItem, selectedMonth === month.value && styles.selectedDate]}
                        onPress={() => {
                          setSelectedMonth(month.value);
                          if (selectedDay > new Date(selectedYear, month.value, 0).getDate()) {
                            setSelectedDay(1);
                          }
                        }}
                      >
                        <Text style={[styles.dateText, selectedMonth === month.value && styles.selectedDateText]}>
                          {month.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.dateColumn}>
                  <Text style={styles.dateLabel}>Year</Text>
                  <ScrollView style={styles.dateScroll} contentContainerStyle={styles.dateScrollContent} showsVerticalScrollIndicator={false}>
                    {getYears().map(year => (
                      <TouchableOpacity
                        key={year}
                        style={[styles.dateItem, selectedYear === year && styles.selectedDate]}
                        onPress={() => setSelectedYear(year)}
                      >
                        <Text style={[styles.dateText, selectedYear === year && styles.selectedDateText]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={() => {
                    const selectedDate = formatSelectedDate();
                    setNewAppointment({...newAppointment, appointmentDate: selectedDate});
                    setShowDatePicker(false);
                    
                    // Check for conflicts if time and vet are already selected
                    if (newAppointment.appointmentTime && newAppointment.veterinarian) {
                      checkAppointmentConflict(selectedDate, newAppointment.appointmentTime, newAppointment.veterinarian, newAppointment.duration);
                    }
                  }}
                >
                  <Text style={styles.confirmText}>Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <Modal transparent={true} visible={showTimePicker} animationType="scale">
          <View style={styles.modalOverlay}>
            <View style={styles.timePickerModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Time</Text>
                <TouchableOpacity 
                  style={styles.exitButton}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.exitText}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timeSelector}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Hour</Text>
                  <ScrollView style={styles.timeScroll} contentContainerStyle={styles.timeScrollContent} showsVerticalScrollIndicator={false}>
                    {getHours().map(hour => (
                      <TouchableOpacity
                        key={hour}
                        style={[styles.timeItem, selectedHour === hour && styles.selectedTime]}
                        onPress={() => setSelectedHour(hour)}
                      >
                        <Text style={[styles.timeText, selectedHour === hour && styles.selectedTimeText]}>
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Minute</Text>
                  <ScrollView style={styles.timeScroll} contentContainerStyle={styles.timeScrollContent} showsVerticalScrollIndicator={false}>
                    {getMinutes().map(minute => (
                      <TouchableOpacity
                        key={minute}
                        style={[styles.timeItem, selectedMinute === minute && styles.selectedTime]}
                        onPress={() => setSelectedMinute(minute)}
                      >
                        <Text style={[styles.timeText, selectedMinute === minute && styles.selectedTimeText]}>
                          {minute.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Period</Text>
                  <View style={styles.ampmContainer}>
                    {['AM', 'PM'].map(period => (
                      <TouchableOpacity
                        key={period}
                        style={[styles.timeItem, selectedAMPM === period && styles.selectedTime]}
                        onPress={() => setSelectedAMPM(period)}
                      >
                        <Text style={[styles.timeText, selectedAMPM === period && styles.selectedTimeText]}>
                          {period}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={() => {
                    const selectedTime = formatSelectedTime();
                    setNewAppointment({...newAppointment, appointmentTime: selectedTime});
                    setShowTimePicker(false);
                    
                    // Check for conflicts if date and vet are already selected
                    if (newAppointment.appointmentDate && newAppointment.veterinarian) {
                      checkAppointmentConflict(newAppointment.appointmentDate, selectedTime, newAppointment.veterinarian, newAppointment.duration);
                    }
                  }}
                >
                  <Text style={styles.confirmText}>Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Add Reason Modal */}
      {showAddReasonModal && (
        <Modal transparent={true} visible={showAddReasonModal} animationType="scale">
          <View style={styles.modalOverlay}>
            <View style={styles.reasonModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Reason</Text>
                <TouchableOpacity 
                  style={styles.exitButton}
                  onPress={() => {
                    setShowAddReasonModal(false);
                    setNewReasonText('');
                  }}
                >
                  <Text style={styles.exitText}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.reasonInputContainer}>
                <TextInput
                  style={styles.reasonTextInput}
                  value={newReasonText}
                  onChangeText={setNewReasonText}
                  placeholder="Enter reason"
                  autoFocus
                />
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddReasonModal(false);
                    setNewReasonText('');
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={handleAddReason}
                >
                  <Text style={styles.confirmText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Reason Modal */}
      {showEditReasonModal && (
        <Modal transparent={true} visible={showEditReasonModal} animationType="scale">
          <View style={styles.modalOverlay}>
            <View style={styles.reasonModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Reason</Text>
                <TouchableOpacity 
                  style={styles.exitButton}
                  onPress={() => {
                    setShowEditReasonModal(false);
                    setNewReasonText('');
                    setEditingReason(null);
                  }}
                >
                  <Text style={styles.exitText}>×</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.reasonInputContainer}>
                <TextInput
                  style={styles.reasonTextInput}
                  value={newReasonText}
                  onChangeText={setNewReasonText}
                  placeholder="Enter reason"
                  autoFocus
                />
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowEditReasonModal(false);
                    setNewReasonText('');
                    setEditingReason(null);
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={handleEditReason}
                >
                  <Text style={styles.confirmText}>Save</Text>
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
  dateText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
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
    position: 'relative',
    zIndex: 1001,
  },
  dropdownButton: {
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
  dropdownMenu: {
    position: 'absolute',
    top: 25,
    left: 0,
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
    paddingLeft: 30,
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
    position: 'relative',
    zIndex: 1000,
  },
  petSelector: {
    position: 'relative',
    zIndex: 999,
  },
  vetSelector: {
    position: 'relative',
    zIndex: 998,
  },
  reasonSelector: {
    position: 'relative',
    zIndex: 997,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    padding: 12,
  },
  disabledDropdown: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
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
    zIndex: 1001,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCustomer: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  customerList: {
    maxHeight: 140,
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
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    padding: 12,
  },
  dateTimeText: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '60%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  timePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '40%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    padding: 15,
    paddingLeft: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
  },

  dateSelector: {
    flexDirection: 'row',
    padding: 15,
    height: 140,
    gap: 5,
    justifyContent: 'center',
  },
  dateColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: 8,
  },
  dateScroll: {
    flex: 1,
    width: '100%',
  },
  dateScrollContent: {
    alignItems: 'center',
  },
  dateItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginVertical: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    width: '90%',
  },
  selectedDate: {
    backgroundColor: '#800000',
    borderColor: '#800000',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedDateText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeSelector: {
    flexDirection: 'row',
    padding: 15,
    height: 140,
    gap: 5,
    justifyContent: 'center',
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: 8,
  },
  timeScroll: {
    flex: 1,
    width: '100%',
  },
  timeScrollContent: {
    alignItems: 'center',
  },
  timeItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginVertical: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    width: '90%',
  },
  selectedTime: {
    backgroundColor: '#800000',
    borderColor: '#800000',
  },
  timeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedTimeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  ampmContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  confirmButton: {
    backgroundColor: '#800000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  confirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelText: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
  },
  exitButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  reasonOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reasonOption: {
    flex: 1,
    padding: 8,
  },
  reasonActions: {
    flexDirection: 'row',
    paddingRight: 8,
  },
  editIcon: {
    padding: 4,
    marginRight: 4,
  },
  deleteIcon: {
    padding: 4,
  },
  iconText: {
    fontSize: 12,
  },
  addReasonOption: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  addReasonText: {
    color: '#800000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  reasonInputContainer: {
    padding: 20,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  reasonModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '50%',
    maxHeight: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  reasonTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    width: '100%',
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
  formDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
    flex: 1,
    textAlign: 'center',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteCategoryButton: {
    backgroundColor: '#dc3545',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  deleteCategoryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  detailTable: {
    backgroundColor: '#fff',
  },
  detailTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  detailTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  detailCell: {
    flex: 1,
    fontSize: 12,
    color: '#555',
  },
  serviceTypeSelector: {
    position: 'relative',
    zIndex: 996,
  },
  serviceIcon: {
    fontSize: 14,
  },
  cellText: {
    fontSize: 12,
    color: '#555',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 3,
  },
  activeToggle: {
    backgroundColor: '#800000',
  },
  toggleText: {
    fontSize: 11,
    color: '#666',
    fontWeight: 'bold',
  },
  activeToggleText: {
    color: '#fff',
  },
  calendarFilters: {
    flexDirection: 'row',
    gap: 10,
  },
  filterDropdown: {
    position: 'relative',
    zIndex: 1003,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 80,
  },
  filterText: {
    fontSize: 11,
    color: '#333',
    marginRight: 5,
  },
  filterMenu: {
    position: 'absolute',
    top: 35,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    zIndex: 1004,
    elevation: 10,
    maxHeight: 150,
  },
  filterOption: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterOptionText: {
    fontSize: 11,
    color: '#333',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  navButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#800000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#800000',
  },
  calendarGrid: {
    padding: 10,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    paddingVertical: 5,
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    height: 60,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: 4,
    alignItems: 'center',
  },
  emptyDay: {
    width: '14.28%',
    height: 60,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  appointmentDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
  },
  appointmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreCount: {
    fontSize: 8,
    color: '#666',
    fontWeight: 'bold',
  },
});