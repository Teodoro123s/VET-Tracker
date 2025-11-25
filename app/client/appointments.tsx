import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { addAppointment, addMedicalRecord, addReasonOption, deleteAppointment, deleteReasonOption, getAppointments, getCustomers, getMedicalCategories, getMedicalForms, getPets, getReasonOptions, getVeterinarians, updateAppointment, updateReasonOption } from '../../lib/services/firebaseService';
import { sendAppointmentConfirmationEmail } from '../../lib/utils/emailService';

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
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending' | 'due';
  notes?: string;
  completedAt?: Date;
  veterinarianEmail?: string;
  assignedVet?: string;
  vetEmail?: string;
}

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const { userEmail } = useTenant();
  const router = useRouter();
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


  const [slideAnim] = useState(new Animated.Value(-350));
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [vetFilter, setVetFilter] = useState('all');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showVetFilter, setShowVetFilter] = useState(false);
  const [showMonthFilter, setShowMonthFilter] = useState(false);
  const [showYearFilter, setShowYearFilter] = useState(false);
  const [customYear, setCustomYear] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('pending');
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [recordSlideAnim] = useState(new Animated.Value(-350));
  const [categories, setCategories] = useState([]);
  const [formTemplates, setFormTemplates] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFormTemplateDropdown, setShowFormTemplateDropdown] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [newRecord, setNewRecord] = useState({
    category: '',
    formTemplate: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
    if (userEmail) {
      loadAppointments();
      loadCustomers();
      loadPets();
      loadVeterinarians();
      loadReasonOptions();
      loadRecordData();
      // Process notifications every 5 minutes
      const interval = setInterval(() => {
        processNotifications();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [userEmail]);
  
  // Refresh appointments when view mode changes to calendar
  useEffect(() => {
    if (viewMode === 'calendar' && userEmail) {
      loadAppointments();
    }
  }, [viewMode, statusFilter, vetFilter]);

  // Helper function to determine appointment status based on date and current status
  const determineAppointmentStatus = (appointment: any, currentTime: Date): 'completed' | 'cancelled' | 'due' | 'pending' => {
    // Keep completed/cancelled status unchanged
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return appointment.status;
    }
    
    const appointmentDateTime = parseAppointmentDate(appointment.appointmentDate);
    
    if (!appointmentDateTime || isNaN(appointmentDateTime.getTime())) {
      return 'pending';
    }
    
    // Smart status assignment: due = overdue, pending = future
    const timeDiff = appointmentDateTime.getTime() - currentTime.getTime();
    return timeDiff <= 0 ? 'due' : 'pending';
  };

  // Helper function to parse appointment date from various formats
  const parseAppointmentDate = (appointmentDate: any): Date | null => {
    if ((appointmentDate as any)?.seconds) {
      return new Date((appointmentDate as any).seconds * 1000);
    }
    return new Date(appointmentDate);
  };

  const loadAppointments = async () => {
    if (!userEmail) return;
    try {
      console.log('=== WEB APPOINTMENTS LOADING ===');
      console.log('Web user email:', userEmail);
      const appointmentsList = await getAppointments(userEmail);
      console.log('Web appointments loaded:', appointmentsList.length);
      const now = new Date();
      
      const smartSortedAppointments = appointmentsList.map(appointment => ({
        ...appointment,
        status: determineAppointmentStatus(appointment, now)
      })) as Appointment[];
      
      setAppointments(smartSortedAppointments);
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

  const loadRecordData = async () => {
    if (!user?.email) return;
    try {
      const [forms, cats] = await Promise.all([
        getMedicalForms(user.email),
        getMedicalCategories(user.email)
      ]);
      
      const formTemplatesList = forms.map(form => ({
        id: form.id,
        formName: form.formName || form.type || form.name,
        category: form.category || 'No Category'
      }));
      
      setFormTemplates(formTemplatesList);
      
      const categoryList = cats.map(cat => ({
        id: cat.id,
        name: cat.name || cat.category
      }));
      
      if (!categoryList.find(cat => cat.name === 'No Category')) {
        categoryList.unshift({ id: 'no-category', name: 'No Category' });
      }
      
      setCategories(categoryList);
    } catch (error) {
      console.error('Error loading record data:', error);
      setCategories([{ id: 'no-category', category: 'No Category' }]);
    }
  };

  const handleAddRecord = async () => {
    try {
      if (!newRecord.category) {
        Alert.alert('Error', 'Please select category');
        return;
      }
      if (!newRecord.formTemplate) {
        Alert.alert('Error', 'Please select form template');
        return;
      }
      
      // Navigate to medical record form screen
      const params = new URLSearchParams({
        appointmentId: selectedAppointment?.id || '',
        petName: selectedAppointment?.petName || '',
        customerName: selectedAppointment?.customerName || '',
        category: newRecord.category,
        formTemplate: newRecord.formTemplate
      });
      router.push(`/client/medical-record-detail?${params.toString()}` as any);
      
      // Close the drawer
      Animated.timing(recordSlideAnim, {
        toValue: -350,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowAddRecordModal(false));
    } catch (error) {
      Alert.alert('Error', 'Failed to navigate to form');
    }
  };

  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);

  const handleSubmitForm = async () => {
    if (isSubmittingRecord) return;
    
    setIsSubmittingRecord(true);
    try {
      // Find the actual pet ID from the pets array
      const pet = pets.find(p => p.name === selectedAppointment?.petName);
      
      const recordData = {
        petId: pet?.id || selectedAppointment?.petName || 'Unknown Pet',
        petName: selectedAppointment?.petName || 'Unknown Pet',
        category: newRecord.category,
        formTemplate: newRecord.formTemplate,
        formData,
        date: new Date().toISOString().split('T')[0],
        diagnosis: (formData as any).diagnosis || 'N/A',
        treatment: (formData as any).treatment || 'N/A',
        notes: (formData as any).notes || Object.values(formData).join(', ') || 'N/A'
      };
      
      await addMedicalRecord(recordData, user.email);
      
      // Close modals and reset form
      setShowFormModal(false);
      Animated.timing(recordSlideAnim, {
        toValue: -350,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowAddRecordModal(false));
      setNewRecord({ category: '', formTemplate: '' });
      setFormData({});
      
      // Show success alert
      Alert.alert('Success', 'Medical record saved successfully! You can now mark this appointment as done.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save medical record');
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  const formatDate = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    } else if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const formatNumber = (text: string): string => {
    return text.replace(/[^0-9.]/g, '').replace(/(\.)(?=.*\1)/g, '');
  };

  const renderFormField = (field: any) => {
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
              const formatted = formatDate(text);
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
              const formatted = formatNumber(text);
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

  const processNotifications = async () => {
    if (!user?.email) return;
    try {
      // Process notifications logic can be added here
      console.log('Processing notifications for:', user.email);
    } catch (error) {
      console.error('Failed to process notifications:', error);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAppointment = async () => {
    if (isSubmitting) return;
    
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

    // Validate appointment date and time is not in the past
    const appointmentDateTime = new Date(`${newAppointment.appointmentDate}T${newAppointment.appointmentTime}`);
    const now = new Date();
    
    if (appointmentDateTime <= now) {
      Alert.alert(
        'Invalid Date/Time', 
        'Cannot book appointments in the past. Please select a future date and time.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Adding appointment:', newAppointment);
      
      const appointmentData = {
        ...newAppointment,
        appointmentDate: new Date(`${newAppointment.appointmentDate}T${newAppointment.appointmentTime}`),
        createdAt: new Date()
      };

      console.log('Appointment data to save:', appointmentData);
      
      await addAppointment(user.email, appointmentData);
      console.log('Appointment saved successfully');
      
      // Send email notification to customer
      try {
        const emailResult = await sendAppointmentConfirmationEmail({
          customerEmail: newAppointment.customerEmail,
          customerName: newAppointment.customerName,
          petName: newAppointment.petName,
          appointmentDate: appointmentData.appointmentDate,
          reason: newAppointment.reason,
          veterinarian: newAppointment.veterinarian
        });
        
        if (emailResult.success) {
          Alert.alert('Success', 'Appointment added successfully and confirmation email sent to customer!');
        } else {
          Alert.alert('Success', 'Appointment added successfully, but failed to send confirmation email.');
        }
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        Alert.alert('Success', 'Appointment added successfully, but failed to send confirmation email.');
      }
      
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!user?.email) return;
    try {
      await deleteAppointment(user.email, appointmentId);
      await loadAppointments();
      setSelectedAppointment(null);
      Alert.alert('Success', 'Appointment deleted successfully');
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      Alert.alert('Error', 'Failed to delete appointment');
    }
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
    return pets.filter(pet => pet.ownerId === selectedCustomer.id || pet.owner === selectedCustomer.id);
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
    return Array.from({length: 10}, (_, i) => currentYear - 5 + i);
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

  const handleNavigation = async (route: string | null) => {
    if (!route) return;
    try {
      router.push(route as any);
    } catch (error) {
      console.error(`Navigation error to ${route}:`, error);
      alert('Failed to navigate. Please try again.');
    }
  };

  // Filter appointments by active status and search term with smart sorting
  const filteredAppointments = appointments
    .filter(appointment => {
      const matchesSearch = appointment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.reason.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = appointment.status === activeStatusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let dateA, dateB;
      
      if ((a.appointmentDate as any)?.seconds) {
        dateA = new Date((a.appointmentDate as any).seconds * 1000);
      } else {
        dateA = new Date(a.appointmentDate);
      }
      
      if ((b.appointmentDate as any)?.seconds) {
        dateB = new Date((b.appointmentDate as any).seconds * 1000);
      } else {
        dateB = new Date(b.appointmentDate);
      }
      
      // Smart sorting based on status
      if (activeStatusFilter === 'pending') {
        // Pending: Sort by date ascending (earliest first)
        return dateA.getTime() - dateB.getTime();
      } else if (activeStatusFilter === 'due') {
        // Due: Sort by urgency (overdue first, then by time)
        const now = new Date();
        const isAOverdue = dateA.getTime() < now.getTime();
        const isBOverdue = dateB.getTime() < now.getTime();
        
        if (isAOverdue && !isBOverdue) return -1;
        if (!isAOverdue && isBOverdue) return 1;
        
        // Both overdue or both upcoming, sort by time
        return dateA.getTime() - dateB.getTime();
      } else {
        // Completed: Sort by completion date descending (most recent first)
        return dateB.getTime() - dateA.getTime();
      }
    });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage);

  const formatDateTime = (date: any) => {
    try {
      if (!date) return { date: 'No Date', time: '' };
      
      let dateObj;
      if ((date as any).seconds) {
        // Firestore timestamp
        dateObj = new Date((date as any).seconds * 1000);
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

  const renderAddRecordModal = () => (
    <Modal visible={showAddRecordModal} transparent animationType="none">
      <View style={styles.drawerOverlay}>
        <Animated.View style={[styles.drawer, { left: recordSlideAnim }]}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Add Medical Record</Text>
            <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
              Animated.timing(recordSlideAnim, {
                toValue: -350,
                duration: 200,
                useNativeDriver: false,
              }).start(() => setShowAddRecordModal(false));
            }}>
              <Text style={styles.drawerCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.drawerForm}>
            <Text style={styles.fieldLabel}>Category *</Text>
            <View style={[styles.dropdownContainer, { zIndex: 3000 }]}>
              <TouchableOpacity 
                style={styles.petDropdown}
                onPress={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowFormTemplateDropdown(false);
                }}
              >
                <Text style={styles.petDropdownText}>
                  {newRecord.category || 'Select Category'}
                </Text>
                <Text style={styles.petDropdownArrow}>▼</Text>
              </TouchableOpacity>
              {showCategoryDropdown && (
                <View style={styles.dropdownMenu}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {categories.map((category) => (
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
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <Text style={styles.fieldLabel}>Form Template *</Text>
            <View style={[styles.dropdownContainer, { zIndex: 2000 }]}>
              <TouchableOpacity 
                style={[styles.petDropdown, !newRecord.category && styles.disabledDropdown]}
                onPress={() => {
                  if (newRecord.category) {
                    setShowFormTemplateDropdown(!showFormTemplateDropdown);
                    setShowCategoryDropdown(false);
                  }
                }}
              >
                <Text style={[styles.petDropdownText, !newRecord.category && styles.disabledText]}>
                  {!newRecord.category ? 'Select category first' : (newRecord.formTemplate || 'Select Form Template')}
                </Text>
                <Text style={styles.petDropdownArrow}>▼</Text>
              </TouchableOpacity>
              {showFormTemplateDropdown && (
                <View style={styles.dropdownMenu}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {(() => {
                      const filtered = formTemplates.filter(template => {
                        if (!newRecord.category) return true;
                        return template.category === newRecord.category;
                      });
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
                            setShowFormTemplateDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>{template.formName}</Text>
                        </TouchableOpacity>
                      ));
                    })()
                    }
                  </ScrollView>
                </View>
              )}
            </View>
          </ScrollView>
          <View style={styles.drawerButtons}>
            <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
              Animated.timing(recordSlideAnim, {
                toValue: -350,
                duration: 200,
                useNativeDriver: false,
              }).start(() => setShowAddRecordModal(false));
            }}>
              <Text style={styles.drawerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerSaveButton} onPress={handleAddRecord}>
              <Text style={styles.drawerSaveText}>Create Record</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderFormModal = () => (
    <Modal visible={showFormModal} animationType="slide">
      <View style={styles.formPreviewModalOverlay}>
        <View style={styles.formPreviewHeader}>
          <TouchableOpacity style={styles.formPreviewBackButton} onPress={() => setShowFormModal(false)}>
            <Text style={styles.formPreviewBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.formPreviewHeaderTitle}>{newRecord.formTemplate}</Text>
          <TouchableOpacity 
            style={[styles.formPreviewSaveHeaderButton, isSubmittingRecord && styles.disabledButton]} 
            onPress={handleSubmitForm}
            disabled={isSubmittingRecord}
          >
            <Text style={styles.formPreviewSaveHeaderText}>
              {isSubmittingRecord ? 'Saving...' : 'Save Record'}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.formPreviewScrollView}>
          <Text style={styles.formFieldsInfo}>
            Form Fields: {formFields.length} loaded
          </Text>
          {formFields.length === 0 ? (
            <View style={styles.noFormFieldsContainer}>
              <Text style={styles.noFormFieldsText}>No form fields available</Text>
            </View>
          ) : (
            formFields.map((field) => (
              <View key={field.id} style={styles.formPreviewField}>
                <Text style={styles.formPreviewFieldLabel}>
                  {field.label}{field.required && ' *'}
                </Text>
                {renderFormField(field)}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  if (selectedAppointment) {
    return (
      <AdminLayout>
        <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Appointments</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.tableContainer}>

            <ScrollView style={styles.detailTable} showsVerticalScrollIndicator={false}>
              <View style={[styles.subHeader, { justifyContent: 'space-between' }]}>
                <View style={styles.filterTabs}>
                  <TouchableOpacity onPress={() => setSelectedAppointment(null)} style={styles.returnButton}>
                    <Text style={styles.returnIcon}>←</Text>
                  </TouchableOpacity>
                  <View style={styles.filterTab}>
                    <Text style={styles.appointmentDetailsText}>Appointment Details</Text>
                  </View>
                </View>
                <View style={styles.categoryActions}>
                  <TouchableOpacity style={styles.addRecordButton} onPress={() => {
                    Animated.timing(recordSlideAnim, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: false,
                    }).start(() => setShowAddRecordModal(true));
                  }}>
                    <Text style={styles.addRecordButtonText}>Add Record</Text>
                  </TouchableOpacity>
                  {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'due') && (
                    <TouchableOpacity style={styles.doneCategoryButton} onPress={async () => {
                      try {
                        await updateAppointment(user.email, selectedAppointment.id, { 
                          status: 'completed',
                          completedAt: new Date()
                        });
                        await loadAppointments();
                        setSelectedAppointment(null);
                      } catch (error) {
                        console.error('Failed to update appointment:', error);
                      }
                    }}>
                      <Text style={styles.doneCategoryButtonText}>Done</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.deleteCategoryButton} onPress={() => setShowDeleteModal(true)}>
                    <Text style={styles.deleteCategoryButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.formContainer}>
                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.formLabel}>Customer</Text>
                    <View style={styles.formValue}>
                      <Text style={styles.formValueText}>{selectedAppointment.customerName}</Text>
                    </View>
                  </View>
                  <View style={styles.formColumn}>
                    <Text style={styles.formLabel}>Pet</Text>
                    <View style={styles.formValue}>
                      <Text style={styles.formValueText}>{selectedAppointment.petName}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.formLabel}>Date</Text>
                    <View style={styles.formValue}>
                      <Text style={styles.formValueText}>{formatDateTime(selectedAppointment.appointmentDate).date}</Text>
                    </View>
                  </View>
                  <View style={styles.formColumn}>
                    <Text style={styles.formLabel}>Time</Text>
                    <View style={styles.formValue}>
                      <Text style={styles.formValueText}>{formatDateTime(selectedAppointment.appointmentDate).time}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.formLabel}>Veterinarian</Text>
                    <View style={styles.formValue}>
                      <Text style={styles.formValueText}>{selectedAppointment.veterinarian || 'Not assigned'}</Text>
                    </View>
                  </View>
                  <View style={styles.formColumn}>
                    <Text style={styles.formLabel}>Status</Text>
                    <View style={styles.formValue}>
                      <Text style={styles.formValueText}>{selectedAppointment.status}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Reason</Text>
                  <View style={styles.formValue}>
                    <Text style={styles.formValueText}>{selectedAppointment.reason}</Text>
                  </View>
                </View>
                
                {selectedAppointment.notes && (
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Notes</Text>
                    <View style={styles.formValue}>
                      <Text style={styles.formValueText}>{selectedAppointment.notes}</Text>
                    </View>
                  </View>
                )}
                
                {selectedAppointment.completedAt && (
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Completed At</Text>
                    <View style={styles.formValue}>
                      <Text style={styles.formValueText}>{formatDateTime(selectedAppointment.completedAt).date} at {formatDateTime(selectedAppointment.completedAt).time}</Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
        </View>
        {renderAddRecordModal()}
        {renderFormModal()}
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <Modal transparent={true} visible={showDeleteModal} animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.reasonModal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Delete Appointment</Text>
                  <TouchableOpacity 
                    style={styles.exitButton}
                    onPress={() => setShowDeleteModal(false)}
                  >
                    <Text style={styles.exitText}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.reasonInputContainer}>
                  <Text style={styles.deleteConfirmText}>
                    Are you sure you want to delete this appointment?
                  </Text>
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowDeleteModal(false)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.confirmButton, { backgroundColor: '#dc3545' }]}
                    onPress={async () => {
                      setShowDeleteModal(false);
                      await handleDeleteAppointment(selectedAppointment.id);
                    }}
                  >
                    <Text style={styles.confirmText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Appointments</Text>
        <View style={styles.headerActions}>
          {viewMode === 'table' && (
            <TouchableOpacity 
              style={styles.calendarButton}
              onPress={() => setViewMode('calendar')}
            >
              <Ionicons name="calendar" size={18} color="#7F1D1F" style={{ marginRight: 8 }} />
              <Text style={styles.calendarButtonText}>Calendar</Text>
            </TouchableOpacity>
          )}
          

          
          {viewMode === 'table' && (
            <>
              <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor="rgba(153, 153, 153, 0.8)"
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
                <View style={styles.searchIconContainer}>
                  <Ionicons name="search" size={14} color="#fff" />
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {viewMode === 'calendar' ? (
          <>
            <View style={styles.returnRow}>
              <TouchableOpacity style={styles.returnIconButton} onPress={() => setViewMode('table')}>
                <Text style={styles.returnIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.returnLabel}>Appointment table</Text>
              <View style={styles.returnRowVetFilter}>
                <View style={[styles.filterDropdown, styles.vetFilterDropdown]}>
                  <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => setShowVetFilter(!showVetFilter)}
                  >
                    <Text style={styles.filterText}>{vetFilter === 'all' ? 'All Vets' : vetFilter}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showVetFilter && (
                    <View style={[styles.filterMenu, { zIndex: 99999999, elevation: 100 }]}>
                      <ScrollView showsVerticalScrollIndicator={false}>
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
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.calendarViewContainer}>
            <View style={styles.calendarContainer}>
              <View style={styles.calendarFilters}>
                <View style={styles.filterDropdown}>
                  <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => setShowMonthFilter(!showMonthFilter)}
                  >
                    <Text style={styles.filterText}>{calendarDate.toLocaleDateString('en-US', { month: 'long' })}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showMonthFilter && (
                    <View style={styles.filterMenu}>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {getMonths().map((month) => (
                          <TouchableOpacity
                            key={month.value}
                            style={styles.filterOption}
                            onPress={() => {
                              const newDate = new Date(calendarDate);
                              newDate.setMonth(month.value - 1);
                              setCalendarDate(newDate);
                              setShowMonthFilter(false);
                            }}
                          >
                            <Text style={styles.filterOptionText}>{month.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <View style={styles.filterDropdown}>
                  <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => setShowYearFilter(!showYearFilter)}
                  >
                    <Text style={styles.filterText}>{calendarDate.getFullYear()}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showYearFilter && (
                    <View style={styles.filterMenu}>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {getYears().map((year) => (
                          <TouchableOpacity
                            key={year}
                            style={styles.filterOption}
                            onPress={() => {
                              const newDate = new Date(calendarDate);
                              newDate.setFullYear(year);
                              setCalendarDate(newDate);
                              setShowYearFilter(false);
                            }}
                          >
                            <Text style={styles.filterOptionText}>{year}</Text>
                          </TouchableOpacity>
                        ))}
                        <View style={styles.customYearContainer}>
                          <TextInput
                            style={styles.customYearInput}
                            placeholder="Custom year"
                            value={customYear}
                            onChangeText={setCustomYear}
                            keyboardType="numeric"
                            onSubmitEditing={() => {
                              const year = parseInt(customYear);
                              if (year && year > 1900 && year < 2100) {
                                const newDate = new Date(calendarDate);
                                newDate.setFullYear(year);
                                setCalendarDate(newDate);
                                setCustomYear('');
                                setShowYearFilter(false);
                              }
                            }}
                          />
                          <TouchableOpacity
                            style={styles.customYearButton}
                            onPress={() => {
                              const year = parseInt(customYear);
                              if (year && year > 1900 && year < 2100) {
                                const newDate = new Date(calendarDate);
                                newDate.setFullYear(year);
                                setCalendarDate(newDate);
                                setCustomYear('');
                                setShowYearFilter(false);
                              }
                            }}
                          >
                            <Text style={styles.customYearButtonText}>Go</Text>
                          </TouchableOpacity>
                        </View>
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#dc3545' }]} />
                    <Text style={styles.legendText}>Due</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#28a745' }]} />
                    <Text style={styles.legendText}>Pending</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#007bff' }]} />
                    <Text style={styles.legendText}>Done</Text>
                  </View>
                </View>
              </View>
              
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
                  
                  for (let i = 0; i < firstDay; i++) {
                    days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
                  }
                  
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dayDate = new Date(year, month, day);
                    const today = new Date();
                    const isToday = dayDate.toDateString() === today.toDateString();
                    const isSelected = selectedDate.toDateString() === dayDate.toDateString();
                    
                    const dayAppointments = appointments.filter(apt => {
                      try {
                        let aptDate;
                        if ((apt.appointmentDate as any)?.seconds) {
                          aptDate = new Date((apt.appointmentDate as any).seconds * 1000);
                        } else {
                          aptDate = new Date(apt.appointmentDate);
                        }
                        
                        if (isNaN(aptDate.getTime())) return false;
                        
                        if (aptDate.toDateString() !== dayDate.toDateString()) return false;
                        
                        if (vetFilter !== 'all' && apt.veterinarian !== vetFilter) return false;
                        
                        return true;
                      } catch (error) {
                        return false;
                      }
                    });
                    

                    
                    const hasAppointments = dayAppointments.length > 0;
                    
                    days.push(
                      <TouchableOpacity 
                        key={day} 
                        style={[
                          styles.calendarDay, 
                          isSelected && styles.selectedCalendarDay,
                          isToday && styles.todayCalendarDay,
                          hasAppointments && styles.dayWithAppointments
                        ]}
                        onPress={() => setSelectedDate(dayDate)}
                      >
                        <Text style={[
                          styles.dayNumber, 
                          isSelected && styles.selectedDayNumber,
                          isToday && styles.todayDayNumber
                        ]}>{day}</Text>
                        <View style={styles.appointmentDots}>
                          {(() => {
                            const uniqueStatuses = new Set();
                            dayAppointments.forEach(apt => {
                              let normalizedStatus;
                              if (apt.status === 'completed') {
                                normalizedStatus = 'Done';
                              } else if (apt.status === 'due') {
                                normalizedStatus = 'Due';
                              } else {
                                normalizedStatus = 'Pending';
                              }
                              uniqueStatuses.add(normalizedStatus);
                            });
                            return Array.from(uniqueStatuses).slice(0, 3).map((status) => {
                              const getStatusColor = () => {
                                switch(status) {
                                  case 'Done': return '#007bff';
                                  case 'Pending': return '#28a745';
                                  case 'Due': return '#dc3545';
                                  default: return '#007bff';
                                }
                              };
                              return (
                                <View
                                  key={String(status)}
                                  style={[styles.appointmentDot, { backgroundColor: getStatusColor() }]}
                                />
                              );
                            });
                          })()}
                        </View>
                      </TouchableOpacity>
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
            
            <View style={styles.appointmentListContainer}>
              <Text style={styles.listTitle}>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
              <ScrollView style={styles.appointmentList} showsVerticalScrollIndicator={true}>
                {(() => {
                  const filteredAppointments = appointments
                    .filter(apt => {
                      try {
                        let aptDate;
                        if ((apt.appointmentDate as any)?.seconds) {
                          aptDate = new Date((apt.appointmentDate as any).seconds * 1000);
                        } else {
                          aptDate = new Date(apt.appointmentDate);
                        }
                        
                        if (isNaN(aptDate.getTime())) return false;
                        
                        const dateMatch = aptDate.toDateString() === selectedDate.toDateString();
                        const vetMatch = vetFilter === 'all' || apt.veterinarian === vetFilter;
                        
                        return dateMatch && vetMatch;
                      } catch (error) {
                        return false;
                      }
                    })
                    .sort((a, b) => {
                      try {
                        let dateA = (a.appointmentDate as any)?.seconds ? new Date((a.appointmentDate as any).seconds * 1000) : new Date(a.appointmentDate);
                        let dateB = (b.appointmentDate as any)?.seconds ? new Date((b.appointmentDate as any).seconds * 1000) : new Date(b.appointmentDate);
                        return dateA.getTime() - dateB.getTime();
                      } catch {
                        return 0;
                      }
                    });
                  

                  
                  if (filteredAppointments.length === 0) {
                    return (
                      <View style={styles.noAppointmentsContainer}>
                        <Text style={styles.noAppointmentsText}>No appointments scheduled for this day</Text>
                      </View>
                    );
                  }
                  
                  return filteredAppointments.map((appointment) => (
                    <TouchableOpacity 
                      key={appointment.id} 
                      style={styles.appointmentCard}
                      onPress={() => setSelectedAppointment(appointment)}
                    >
                      <View style={[styles.statusIcon, { backgroundColor: appointment.status === 'pending' ? '#28a745' : appointment.status === 'due' ? '#dc3545' : appointment.status === 'completed' ? '#007bff' : '#6c757d' }]}>
                        <Text style={styles.statusIconText}>
                          {appointment.status === 'pending' ? '⏳' : appointment.status === 'due' ? '⚠️' : appointment.status === 'completed' ? '✅' : '⏳'}
                        </Text>
                      </View>
                      <View style={styles.appointmentContent}>
                        <Text style={styles.patientName}>{appointment.customerName}</Text>
                        <Text style={styles.petInfo}>{appointment.petName} - {appointment.reason}</Text>
                        <Text style={styles.appointmentTime}>
                          {formatDateTime(appointment.appointmentDate).date} {formatDateTime(appointment.appointmentDate).time}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ));
                })()}
              </ScrollView>
            </View>
            </View>
          </>
        ) : (
        <View style={styles.tableContainer}>
          <View style={styles.table}>
            <View style={styles.subHeader}>
              <View style={styles.filterTabs}>
                {['Pending', 'Due', 'Done'].map((filter) => {
                  const filterValue = filter === 'Due' ? 'due' : filter === 'Done' ? 'completed' : 'pending';
                  const count = appointments.filter(apt => apt.status === filterValue).length;
                  
                  return (
                    <TouchableOpacity
                      key={filter}
                      style={[styles.filterTab, activeStatusFilter === filterValue && styles.activeFilterTab]}
                      onPress={() => {
                        setActiveStatusFilter(filterValue);
                        setCurrentPage(1);
                      }}
                    >
                      <Text style={[styles.filterTabText, activeStatusFilter === filterValue && styles.activeFilterTabText]}>
                        {filter} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.dateTimeHeader]}>Date & Time</Text>
              <Text style={[styles.headerCell, styles.customerHeader]}>Customer</Text>
              <Text style={[styles.headerCell, styles.petHeader]}>Pet</Text>
              <Text style={[styles.headerCell, styles.reasonHeader]}>Reason</Text>
              {(activeStatusFilter === 'pending' || activeStatusFilter === 'due' || activeStatusFilter === 'completed') && (
                <Text style={[styles.headerCell, styles.actionHeader]}>Action</Text>
              )}
            </View>
            
            <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={true}>
              {paginatedAppointments.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No appointments found</Text>
                </View>
              ) : (
                paginatedAppointments.map((appointment) => {
                  return (
                  <TouchableOpacity 
                    key={appointment.id} 
                    style={styles.tableRow}
                    onPress={() => setSelectedAppointment(appointment)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.cell, styles.dateTimeCell]}>
                      <Text style={[styles.dateTimeText, appointment.status === 'due' && styles.dueDateTime]}>
                        {formatDateTime(appointment.appointmentDate).date} {formatDateTime(appointment.appointmentDate).time}
                      </Text>
                    </View>
                    <Text style={[styles.cellText, styles.customerCell]}>{appointment.customerName}</Text>
                    <Text style={[styles.cellText, styles.petCell]}>{appointment.petName}</Text>
                    <Text style={[styles.cellText, styles.reasonCell]}>{appointment.reason}</Text>
                    {(activeStatusFilter === 'pending' || activeStatusFilter === 'due') && (
                      <View style={styles.actionCell}>
                        <TouchableOpacity 
                          style={styles.doneButton}
                          onPress={async () => {
                            try {
                              await updateAppointment(user.email, appointment.id, { 
                                status: 'completed',
                                completedAt: new Date()
                              });
                              await loadAppointments();
                            } catch (error) {
                              console.error('Failed to update appointment:', error);
                            }
                          }}
                        >
                          <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {activeStatusFilter === 'completed' && (
                      <View style={styles.actionCell}>
                        <Text style={styles.completedText}>Done</Text>
                      </View>
                    )}
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
                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
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
                          <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                            {customers.length === 0 ? (
                              <View style={styles.dropdownOption}>
                                <Text style={[styles.dropdownOptionText, {fontStyle: 'italic', color: '#999'}]}>
                                  No customers found
                                </Text>
                              </View>
                            ) : (
                              customers.map((customer) => (
                                <TouchableOpacity
                                  key={customer.id}
                                  style={styles.dropdownOption}
                                  onPress={() => selectCustomer(customer)}
                                >
                                  <Text style={styles.dropdownOptionText}>
                                    {`${customer.firstname || ''} ${customer.surname || ''}`.trim() || customer.email || 'Unknown'}
                                  </Text>
                                </TouchableOpacity>
                              ))
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.formColumn}>
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
                          <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                            {getCustomerPets().map((pet) => (
                              <TouchableOpacity
                                key={pet.id}
                                style={styles.dropdownOption}
                                onPress={() => selectPet(pet)}
                              >
                                <Text style={styles.dropdownOptionText}>
                                  {pet.name} ({pet.species || 'Unknown'})
                                </Text>
                              </TouchableOpacity>
                            ))}
                            {getCustomerPets().length === 0 && (
                              <View style={styles.dropdownOption}>
                                <Text style={[styles.dropdownOptionText, {fontStyle: 'italic', color: '#999'}]}>
                                  No pets found for this customer
                                </Text>
                              </View>
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
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
                  </View>

                  <View style={styles.formColumn}>
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
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <Text style={styles.fieldLabel}>Veterinarian (Optional)</Text>
                    <View style={styles.vetSelector}>
                      <TouchableOpacity 
                        style={styles.dropdownButton}
                        onPress={() => setShowVetDropdown(!showVetDropdown)}
                      >
                        <Text style={styles.selectedCustomer}>
                          {newAppointment.veterinarian || 'Select Veterinarian (Optional)'}
                        </Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                      </TouchableOpacity>
                      {showVetDropdown && (
                        <View style={styles.dropdownMenu}>
                          <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                            {veterinarians.map((vet) => (
                              <TouchableOpacity
                                key={vet.id}
                                style={styles.dropdownOption}
                                onPress={() => selectVeterinarian(vet)}
                              >
                                <Text style={styles.dropdownOptionText}>
                                  {`${vet.firstname || ''} ${vet.surname || ''}`.trim() || vet.name || 'Unknown'}
                                </Text>
                              </TouchableOpacity>
                            ))}
                            {veterinarians.length === 0 && (
                              <View style={styles.dropdownOption}>
                                <Text style={[styles.dropdownOptionText, {fontStyle: 'italic', color: '#999'}]}>
                                  No veterinarians found
                                </Text>
                              </View>
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.formColumn}>
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
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={[styles.drawerInput, styles.notesInput]}
                  value={newAppointment.notes}
                  onChangeText={(text) => setNewAppointment({...newAppointment, notes: text})}
                  placeholder="Additional notes"
                  placeholderTextColor="rgba(153, 153, 153, 0.8)"
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
                <TouchableOpacity 
                  style={[styles.drawerSaveButton, isSubmitting && styles.disabledButton]} 
                  onPress={handleAddAppointment}
                  disabled={isSubmitting}
                >
                  <Text style={styles.drawerSaveText}>
                    {isSubmitting ? 'Adding...' : 'Add Appointment'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal transparent={true} visible={showDatePicker} animationType="fade">
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
                        <Text style={[styles.dateTimeText, selectedDay === day && styles.selectedDateText]}>
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
                        <Text style={[styles.dateTimeText, selectedMonth === month.value && styles.selectedDateText]}>
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
                        <Text style={[styles.dateTimeText, selectedYear === year && styles.selectedDateText]}>
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
                    
                    // Validate selected date is not in the past
                    const selectedDateTime = new Date(selectedDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (selectedDateTime < today) {
                      Alert.alert(
                        'Invalid Date', 
                        'Cannot select a past date. Please choose today or a future date.',
                        [{ text: 'OK' }]
                      );
                      return;
                    }
                    
                    setNewAppointment({...newAppointment, appointmentDate: selectedDate});
                    setShowDatePicker(false);
                    
                    // Check for conflicts if time and vet are already selected
                    if (newAppointment.appointmentTime && newAppointment.veterinarian) {
                      checkAppointmentConflict(selectedDate, newAppointment.appointmentTime, newAppointment.veterinarian);
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
        <Modal transparent={true} visible={showTimePicker} animationType="fade">
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
                        <Text style={[styles.dateTimeText, selectedHour === hour && styles.selectedTimeText]}>
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
                        <Text style={[styles.dateTimeText, selectedMinute === minute && styles.selectedTimeText]}>
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
                        <Text style={[styles.dateTimeText, selectedAMPM === period && styles.selectedTimeText]}>
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
                    
                    // Validate time is not in the past if date is today
                    if (newAppointment.appointmentDate) {
                      const appointmentDateTime = new Date(`${newAppointment.appointmentDate}T${selectedTime}`);
                      const now = new Date();
                      
                      if (appointmentDateTime <= now) {
                        Alert.alert(
                          'Invalid Time', 
                          'Cannot select a past time. Please choose a future time.',
                          [{ text: 'OK' }]
                        );
                        return;
                      }
                    }
                    
                    setNewAppointment({...newAppointment, appointmentTime: selectedTime});
                    setShowTimePicker(false);
                    
                    // Check for conflicts if date and vet are already selected
                    if (newAppointment.appointmentDate && newAppointment.veterinarian) {
                      checkAppointmentConflict(newAppointment.appointmentDate, selectedTime, newAppointment.veterinarian);
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
        <Modal transparent={true} visible={showAddReasonModal} animationType="fade">
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
                  placeholder="Enter custom reason"
                  placeholderTextColor="rgba(153, 153, 153, 0.8)"
                  autoFocus={true}
                  editable={true}
                  selectTextOnFocus={true}
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
        <Modal transparent={true} visible={showEditReasonModal} animationType="fade">
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

      {renderAddRecordModal()}
      
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    fontSize: 30,
    fontWeight: 'bold',
    color: '#800000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  addButton: {
    backgroundColor: '#7F1D1F',
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(127, 29, 31, 0.3)',
    borderRadius: 8,
    paddingLeft: 10,
    width: 265.798,
    height: 32,
    flexShrink: 0,
    backgroundColor: 'rgba(250, 250, 250, 0.00)',
    shadowColor: 'rgba(31, 61, 89, 0.04)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  searchIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#7F1D1F',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 20,
  },
  tableContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  table: {
    // backgroundColor: '#fff',
    flex: 1,
    borderRadius: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
    minHeight: 60,
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
    fontWeight: '600',
    fontSize: 14,
    color: '#374151',
    letterSpacing: 0.5,
  },
  dateTimeHeader: {
    flex: 1.2,
    textAlign: 'center',
    marginRight: 10,
  },
  customerHeader: {
    flex: 1.2,
    textAlign: 'left',
  },
  petHeader: {
    flex: 1,
    textAlign: 'left',
  },
  reasonHeader: {
    flex: 1.3,
    textAlign: 'left',
  },
  actionHeader: {
    flex: 0.8,
    textAlign: 'center',
  },
  cell: {
    // fontSize and color moved to cellText style
  },
  dateTimeCell: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  customerCell: {
    flex: 1.2,
    textAlign: 'left',
  },
  petCell: {
    flex: 1,
    textAlign: 'left',
  },
  reasonCell: {
    flex: 1.3,
    textAlign: 'left',
  },
  actionCell: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  dueDateTime: {
    color: '#dc3545',
  },
  tableBody: {
    flex: 1,
    backgroundColor: '#fff',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    padding: 12,
  },
  dropdownText: {
    fontSize: 10,
    marginRight: 4,
  },
  dropdownArrow: {
    fontSize: 6,
    color: '#666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    zIndex: 10000,
    maxHeight: 200,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
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
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  drawer: {
    width: '95%',
    maxWidth: 600,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  drawerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerCloseText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  drawerForm: {
    maxHeight: '70%',
    padding: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  drawerInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    padding: 12,
    fontSize: 12,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  customerSelector: {
    position: 'relative',
    zIndex: 4000,
  },
  petSelector: {
    position: 'relative',
    zIndex: 3000,
  },
  vetSelector: {
    position: 'relative',
    zIndex: 2000,
  },
  reasonSelector: {
    position: 'relative',
    zIndex: 1000,
  },
  selectedCustomer: {
    fontSize: 12,
    color: 'rgba(51, 51, 51, 0.8)',
    flex: 1,
  },
  dropdownScroll: {
    maxHeight: 140,
  },
  disabledDropdown: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  drawerButtons: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
    gap: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  drawerCancelButton: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    flex: 1,
  },
  drawerCancelText: {
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  formColumn: {
    flex: 1,
  },
  drawerSaveButton: {
    backgroundColor: '#800000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  drawerSaveText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '95%',
    maxWidth: 600,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
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
  customerList: {
    maxHeight: 140,
  },
  customerOptionText: {
    fontSize: 12,
    color: '#333',
    padding: 8,
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
    backgroundColor: '#fff',
    color: '#333',
    // outlineStyle removed for React Native
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
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 8,
  },
  deleteCategoryButton: {
    backgroundColor: '#dc3545',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCategoryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  doneCategoryButton: {
    backgroundColor: '#28a745',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  doneCategoryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  addRecordButton: {
    backgroundColor: '#23C062',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  addRecordButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  categoryDropdownContainer: {
    position: 'relative',
    zIndex: 3001,
  },
  drawerDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  drawerDropdownText: {
    fontSize: 14,
    color: '#333',
  },
  categoryDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 3002,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    maxHeight: 200,
  },
  categoryDropdownScroll: {
    maxHeight: 200,
  },
  completedText: {
    color: '#28a745',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  calendarCompletedBadge: {
    backgroundColor: '#28a745',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 10,
  },
  calendarCompletedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  detailCell: {
    flex: 1,
    fontSize: 12,
    color: '#555',
    overflow: 'hidden',
    // web-only properties removed for React Native
  },

  cellText: {
    fontSize: 13,
    color: '#6B7280',
  },
  calendarButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 32,
    flexShrink: 0,
    shadowColor: '#070707',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7F1D1F',
  },
  calendarButtonText: {
    color: '#7F1D1F',
    fontWeight: '600',
    fontSize: 16,
  },
  calendarFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    position: 'relative',
    zIndex: 1,
  },
  filterDropdown: {
    position: 'relative',
    zIndex: 999999,
  },
  vetFilterDropdown: {
    zIndex: 1000000,
  },
  legend: {
    flexDirection: 'row',
    gap: 15,
    marginLeft: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#333',
  },
  customYearContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    gap: 5,
  },
  customYearInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 10,
  },
  customYearButton: {
    backgroundColor: '#800000',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  customYearButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
    zIndex: 1000001,
    elevation: 50,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
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
  calendarViewContainer: {
    flexDirection: 'row',
    flex: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    position: 'relative',
    zIndex: 1,
    overflow: 'hidden',
  },
  calendarContainer: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    position: 'relative',
    zIndex: 1,
  },
  appointmentListContainer: {
    flex: 1,
    zIndex: 1,
  },
  selectedCalendarDay: {
    backgroundColor: '#800000',
  },
  selectedDayNumber: {
    color: '#fff',
    fontWeight: 'bold',
  },
  todayCalendarDay: {
    backgroundColor: 'rgba(128, 0, 32, 0.2)',
    borderWidth: 1,
    borderColor: '#800020',
  },
  todayDayNumber: {
    color: '#000',
    fontWeight: 'bold',
  },
  dayWithAppointments: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
  },
  returnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    overflow: 'visible',
    zIndex: 10000000,
  },
  returnIconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#800000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  returnIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  returnLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#800000',
    marginLeft: 15,
    flex: 1,
  },
  returnRowVetFilter: {
    marginLeft: 'auto',
    zIndex: 9999999,
    position: 'relative',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#800000',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  appointmentList: {
    flex: 1,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 0,
    padding: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    height: 80,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconText: {
    fontSize: 16,
    color: '#000',
  },
  appointmentContent: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
    overflow: 'hidden',
    // web-only properties removed for React Native
  },
  petInfo: {
    fontSize: 15,
    color: '#666',
    overflow: 'hidden',
    // web-only properties removed for React Native
  },
  appointmentTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    overflow: 'hidden',
  },
  doneButton: {
    backgroundColor: '#28a745',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  calendarDoneButton: {
    backgroundColor: '#28a745',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 10,
  },
  calendarDoneButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 5,
  },
  calendarDeleteButton: {
    backgroundColor: '#dc3545',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  calendarDeleteButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
    height: 50,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: 4,
    alignItems: 'center',
  },
  emptyDay: {
    width: '14.28%',
    height: 50,
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
  noAppointmentsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAppointmentsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  moreCount: {
    fontSize: 8,
    color: '#666',
    fontWeight: 'bold',
  },
  subHeader: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'flex-start',
    marginRight: 5,
  },
  activeFilterTab: {
    backgroundColor: '#800000',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'left',
  },
  activeFilterTabText: {
    color: '#fff',
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
  disabledText: {
    color: '#999',
  },
  formPreviewModalOverlay: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formPreviewModalContent: {
    flex: 1,
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
  },
  formPreviewBackButton: {
    backgroundColor: '#800000',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
    flex: 1,
    textAlign: 'center',
  },
  formPreviewSaveHeaderButton: {
    backgroundColor: '#23C062',
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
    fontSize: 12,
    backgroundColor: '#fafafa',
    maxWidth: 300,
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formValue: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  formValueText: {
    fontSize: 14,
    color: '#555',
  },
  appointmentDetailsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'left',
  },
  deleteConfirmText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  formFieldsInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  noFormFieldsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noFormFieldsText: {
    fontSize: 16,
    color: '#999',
  },
  formPreviewScrollView: {
    flex: 1,
    padding: 20,
  },
});