import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Modal, PanResponder, Animated } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import SearchableDropdown from '@/components/SearchableDropdown';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNotifications } from '@/contexts/NotificationContext';
import { getCustomers, getPets, getVeterinarians, getAppointments, addAppointment, updateAppointment, deleteAppointment, getMedicalCategories, getMedicalForms, getMedicalRecords, addMedicalRecord, getFormFields } from '../lib/firebaseService';
import { useTenant } from '../contexts/TenantContext';


export default function AppointmentsScreen() {
  const router = useRouter();
  const { openDrawer } = useLocalSearchParams();
  const { addNotification, checkAppointments } = useNotifications();
  const { userEmail } = useTenant();
  
  const [customers, setCustomers] = useState([]);
  const [customerPets, setCustomerPets] = useState({});
  const [veterinarians, setVeterinarians] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      const [customersData, petsData, vetsData, appointmentsData, categoriesData, formsData, recordsData] = await Promise.all([
        getCustomers(userEmail),
        getPets(userEmail),
        getVeterinarians(userEmail),
        getAppointments(userEmail),
        getMedicalCategories(userEmail),
        getMedicalForms(userEmail),
        getMedicalRecords(userEmail)
      ]);
      
      setCustomers(customersData);
      const vetNames = vetsData.filter(vet => vet.role !== 'staff').map(vet => vet.name);
      setVeterinarians(vetNames);
      setAppointments(appointmentsData);
      
      // Group pets by owner - try both ID and name
      const petsByOwner = {};
      console.log('DEBUG LOAD - Pets data:', petsData);
      console.log('DEBUG LOAD - Customers data:', customersData);
      
      petsData.forEach(pet => {
        const ownerId = pet.owner;
        console.log('DEBUG LOAD - Pet owner ID:', ownerId, 'Pet:', pet.name);
        
        // Find customer by ID
        const customer = customersData.find(c => c.id === ownerId);
        if (customer) {
          console.log('DEBUG LOAD - Found customer:', customer.name, 'for pet:', pet.name);
          
          // Group by customer name
          if (!petsByOwner[customer.name]) {
            petsByOwner[customer.name] = [];
          }
          petsByOwner[customer.name].push(pet);
          
          // Also group by customer ID as fallback
          if (!petsByOwner[customer.id]) {
            petsByOwner[customer.id] = [];
          }
          petsByOwner[customer.id].push(pet);
        } else {
          console.log('DEBUG LOAD - No customer found for pet owner ID:', ownerId);
        }
      });
      
      console.log('DEBUG LOAD - Final grouped pets:', petsByOwner);
      setCustomerPets(petsByOwner);
      setMedicalCategories(categoriesData);
      setMedicalForms(formsData);
      
      // Group medical records by pet
      const recordsByPet = {};
      recordsData.forEach(record => {
        if (!recordsByPet[record.petId]) {
          recordsByPet[record.petId] = [];
        }
        recordsByPet[record.petId].push(record);
      });
      setPetMedicalHistory(recordsByPet);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Pending');
  const [newAppointment, setNewAppointment] = useState({
    customer: '',
    pet: '',
    service: '',
    staff: '',
    date: '',
    time: '',
    status: 'Pending'
  });
  const [appointmentList, setAppointmentList] = useState([]);
  
  useEffect(() => {
    setAppointmentList(appointments);
    checkOverdueAppointments(appointments);
  }, [appointments]);
  
  const checkOverdueAppointments = async (appointmentsList) => {
    const today = new Date();
    const updatedAppointments = [];
    
    for (const appointment of appointmentsList) {
      if (appointment.status === 'Approved' && isAppointmentOverdue(appointment.dateTime, today)) {
        try {
          await updateAppointment(appointment.id, { status: 'Due' }, userEmail);
          updatedAppointments.push({ ...appointment, status: 'Due' });
        } catch (error) {
          console.error('Error updating overdue appointment:', error);
        }
      }
    }
    
    if (updatedAppointments.length > 0) {
      setAppointmentList(prev => prev.map(apt => {
        const updated = updatedAppointments.find(u => u.id === apt.id);
        return updated || apt;
      }));
    }
  };
  
  const isAppointmentOverdue = (dateTimeStr, currentDate) => {
    const today = currentDate.toDateString();
    
    if (dateTimeStr.includes('Today')) return true;
    if (dateTimeStr.includes('Yesterday')) return true;
    if (dateTimeStr.includes('days ago')) return true;
    
    // Check for specific dates
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < monthNames.length; i++) {
      if (dateTimeStr.includes(monthNames[i])) {
        const dayMatch = dateTimeStr.match(new RegExp(`${monthNames[i]} (\\d+)`));
        if (dayMatch) {
          const appointmentDate = new Date(currentDate.getFullYear(), i, parseInt(dayMatch[1]));
          return appointmentDate < currentDate;
        }
      }
    }
    
    return false;
  };

  useEffect(() => {
    checkAppointments();
  }, [appointmentList]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayView, setShowDayView] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [calendarStatusFilter, setCalendarStatusFilter] = useState('All');
  const [selectedVetFilter, setSelectedVetFilter] = useState('');
  const [showVetFilterDropdown, setShowVetFilterDropdown] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [drawerAnimation] = useState(new Animated.Value(-350));
  const [editAppointment, setEditAppointment] = useState({});
  const [showEditStatusDropdown, setShowEditStatusDropdown] = useState(false);
  const [showEditCustomerDropdown, setShowEditCustomerDropdown] = useState(false);
  const [showEditPetDropdown, setShowEditPetDropdown] = useState(false);
  const [editSelectedCustomer, setEditSelectedCustomer] = useState(null);
  const [showEditStaffDropdown, setShowEditStaffDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAddDatePicker, setShowAddDatePicker] = useState(false);
  const [showAddTimePicker, setShowAddTimePicker] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  
  const services = ['Checkup', 'Vaccination', 'Surgery', 'Grooming', 'Dental Care', 'Emergency Care'];
  const statuses = ['Pending', 'Approved', 'Due', 'Completed', 'Cancelled'];
  const [addDrawerAnimation] = useState(new Animated.Value(-350));
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showEditServiceDropdown, setShowEditServiceDropdown] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newService, setNewService] = useState('');
  const [medicalHistoryCurrentPage, setMedicalHistoryCurrentPage] = useState(1);
  const [medicalHistoryItemsPerPage, setMedicalHistoryItemsPerPage] = useState(10);
  const [medicalHistorySearchTerm, setMedicalHistorySearchTerm] = useState('');
  const [showMedicalHistoryDropdown, setShowMedicalHistoryDropdown] = useState(false);
  const [showAddRecordDrawer, setShowAddRecordDrawer] = useState(false);
  const [addRecordDrawerAnimation] = useState(new Animated.Value(-350));
  const [newMedicalRecord, setNewMedicalRecord] = useState({
    category: '',
    formTemplate: '',
    treatment: '',
    veterinarian: '',
    diagnosis: '',
    date: ''
  });
  const [showRecordCategoryDropdown, setShowRecordCategoryDropdown] = useState(false);
  const [showRecordFormDropdown, setShowRecordFormDropdown] = useState(false);
  const [showRecordVetDropdown, setShowRecordVetDropdown] = useState(false);
  const [showRecordDatePicker, setShowRecordDatePicker] = useState(false);
  const [medicalCategories, setMedicalCategories] = useState([]);
  const [medicalForms, setMedicalForms] = useState([]);
  const [selectedMedicalForm, setSelectedMedicalForm] = useState(null);
  const [formFieldValues, setFormFieldValues] = useState({});
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState(null);
  
  const formFieldsData = {
    'Dog Vaccination Form': [
      { id: 1, label: 'Pet Name', type: 'text', required: true },
      { id: 2, label: 'Owner Name', type: 'text', required: true },
      { id: 3, label: 'Vaccine Type', type: 'text', required: true },
      { id: 4, label: 'Batch Number', type: 'text', required: true }
    ],
    'Cat Vaccination Form': [
      { id: 1, label: 'Pet Name', type: 'text', required: true },
      { id: 2, label: 'Owner Name', type: 'text', required: true },
      { id: 3, label: 'Vaccine Type', type: 'text', required: true },
      { id: 4, label: 'Batch Number', type: 'text', required: true }
    ],
    'Head Surgery Report': [
      { id: 1, label: 'Pet Name', type: 'text', required: true },
      { id: 2, label: 'Owner Name', type: 'text', required: true },
      { id: 3, label: 'Surgery Type', type: 'text', required: true },
      { id: 4, label: 'Anesthesia Used', type: 'text', required: true },
      { id: 5, label: 'Duration', type: 'text', required: true }
    ],
    'Annual Wellness Exam': [
      { id: 1, label: 'Pet Name', type: 'text', required: true },
      { id: 2, label: 'Owner Name', type: 'text', required: true },
      { id: 3, label: 'Weight', type: 'number', required: true },
      { id: 4, label: 'Temperature', type: 'number', required: true },
      { id: 5, label: 'Heart Rate', type: 'number', required: true }
    ]
  };
  
  const medicalCategoriesData = [
    { id: 1, name: 'Vaccination Forms' },
    { id: 2, name: 'Surgery Forms' },
    { id: 3, name: 'General Checkup' },
    { id: 4, name: 'Emergency Care' },
    { id: 5, name: 'Dental Care' }
  ];
  
  const medicalFormTemplates = {
    'Vaccination Forms': [
      { id: 1, name: 'Dog Vaccination Form' },
      { id: 2, name: 'Cat Vaccination Form' },
      { id: 3, name: 'Bird Vaccination Form' }
    ],
    'Surgery Forms': [
      { id: 4, name: 'Head Surgery Report' },
      { id: 5, name: 'Knee Surgery Report' },
      { id: 6, name: 'Spay/Neuter Surgery' }
    ],
    'General Checkup': [
      { id: 7, name: 'Annual Wellness Exam' },
      { id: 8, name: 'Senior Pet Checkup' }
    ],
    'Emergency Care': [
      { id: 9, name: 'Emergency Intake Form' },
      { id: 10, name: 'Trauma Assessment' }
    ],
    'Dental Care': [
      { id: 11, name: 'Dental Cleaning Record' },
      { id: 12, name: 'Tooth Extraction Form' }
    ]
  };
  
  const [petMedicalHistory, setPetMedicalHistory] = useState({
    1: [
      { 
        id: 1, 
        formType: 'Dog Vaccination Form',
        date: 'Dec 10, 2023', 
        treatment: 'Vaccination', 
        veterinarian: 'Dr. Smith', 
        diagnosis: 'Preventive Care', 
        symptoms: 'None', 
        medications: 'DHPP vaccine', 
        followUp: 'Next vaccination in 1 year', 
        cost: '$95.00' 
      },
      { 
        id: 2, 
        formType: 'Dog Vaccination Form',
        date: 'Sep 15, 2023', 
        treatment: 'Vaccination', 
        veterinarian: 'Dr. Johnson', 
        diagnosis: 'Preventive Care', 
        symptoms: 'None', 
        medications: 'Rabies vaccine', 
        followUp: 'Next rabies vaccination in 3 years', 
        cost: '$45.00' 
      }
    ]
  });
  
  const downloadCSV = () => {
    const headers = ['Order ID', 'Customer Name', 'Pet Name', 'Service', 'Veterinarian', 'Date & Time', 'Status'];
    const csvData = [headers.join(',')];
    
    filteredAppointments.forEach(appointment => {
      const row = [
        appointment.order || 'N/A',
        `"${appointment.customerName || appointment.name || 'N/A'}"`,
        `"${appointment.petName || 'N/A'}"`,
        `"${appointment.service || 'N/A'}"`,
        `"${appointment.veterinarian || appointment.staff || 'N/A'}"`,
        `"${(appointment.dateTime || 'N/A').replace('\n', ' ')}"`,
        appointment.status || 'N/A'
      ];
      csvData.push(row.join(','));
    });
    
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `appointments_${activeFilter.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const animateTransition = (callback) => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(callback, 150);
  };
  
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 20 && Math.abs(gestureState.dx) < 100;
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 50) {
        // Swipe down - previous month
        animateTransition(() => {
          if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
          } else {
            setSelectedMonth(selectedMonth - 1);
          }
        });
      } else if (gestureState.dy < -50) {
        // Swipe up - next month
        animateTransition(() => {
          if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
          } else {
            setSelectedMonth(selectedMonth + 1);
          }
        });
      }
    },
  });
  
  const filteredAppointments = appointmentList.filter(appointment => {
    const name = appointment.customerName || appointment.name || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = appointment.status === activeFilter;
    return matchesSearch && matchesFilter;
  });
  
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);
  
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
  
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    setShowDropdown(false);
  };
  
  const dropdownOptions = [10, 20, 50, 100];
  
  const handleAddAppointment = async () => {
    if (newAppointment.customer && newAppointment.pet && newAppointment.service && newAppointment.staff && newAppointment.date && newAppointment.time) {
      try {
        const appointment = {
          order: `A${String(appointmentList.length + 1).padStart(3, '0')}`,
          customerName: newAppointment.customer,
          petName: newAppointment.pet,
          service: newAppointment.service,
          veterinarian: newAppointment.staff,
          dateTime: `${newAppointment.date}\n${newAppointment.time}`,
          status: 'Pending',
          notes: 'New appointment'
        };
        
        // Add to Firebase
        const savedAppointment = await addAppointment(appointment, userEmail);
        
        // Add to local state
        setAppointmentList([...appointmentList, savedAppointment]);
        
        addNotification({
          title: 'New Appointment Created',
          message: `${appointment.customerName}'s ${appointment.petName} - ${appointment.service} scheduled for ${appointment.dateTime.replace('\n', ' at ')}`,
          type: 'new',
          appointmentId: savedAppointment.id,
        });
        
        setNewAppointment({ customer: '', pet: '', service: '', staff: '', date: '', time: '', status: 'Pending' });
        setSelectedCustomer(null);
        Animated.timing(addDrawerAnimation, {
          toValue: -350,
          duration: 300,
          useNativeDriver: false,
        }).start(() => setShowAddDrawer(false));
      } catch (error) {
        console.error('Error adding appointment:', error);
        alert('Error adding appointment');
      }
    } else {
      alert('Please fill in all required fields');
    }
  };

  const appointmentColumns = [
    { key: 'customerName', title: 'Customer', render: (apt) => apt.customerName || apt.name },
    { key: 'petName', title: 'Pet' },
    { key: 'service', title: 'Service' },
    { key: 'veterinarian', title: 'Veterinarian', render: (apt) => apt.veterinarian || apt.staff },
    { key: 'dateTime', title: 'Schedule' },
    { key: 'status', title: 'Status' },
  ];

  return (
    <View style={styles.container}>


        <View style={styles.header}>
          <Text style={styles.headerText}>Appointments</Text>
          <View style={styles.headerActions}>
          {!showCalendar ? (
            <>
              <TouchableOpacity style={styles.appointmentAddButton} onPress={() => {
            setShowAddDrawer(true);
            Animated.timing(addDrawerAnimation, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }).start();
          }}>
                <Image source={require('@/assets/ic_round-plus.png')} style={styles.addIcon} />
                <Text style={styles.appointmentAddButtonText}>Add Appointment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calendarButton} onPress={() => setShowCalendar(true)}>
                <Text style={styles.calendarButtonText}>📅 Calendar</Text>
              </TouchableOpacity>

              <View style={styles.appointmentSearchContainer}>
                <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
                <TextInput 
                  style={styles.appointmentSearchInput}
                  placeholder="Search appointments..."
                  placeholderTextColor="#999"
                  value={searchTerm}
                  onChangeText={(text) => {
                    setSearchTerm(text);
                    setCurrentPage(1);
                  }}
                />
              </View>
            </>
          ) : (
            <TouchableOpacity style={styles.filterDropdown} onPress={() => setShowFilterDropdown(!showFilterDropdown)}>
              <Text style={styles.filterDropdownText}>📅 {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][selectedMonth]} {selectedYear}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          )}
          </View>
        </View>
      <View style={styles.content}>
        {!showCalendar && !selectedAppointment && !selectedMedicalRecord ? (


            <View style={styles.tableContainer}>
              <View style={styles.subHeader}>
                <View style={styles.filterTabs}>
                  {['Pending', 'Approved', 'Due', 'Completed', 'Cancelled'].map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[styles.filterTab, activeFilter === filter && styles.activeFilterTab]}
                      onPress={() => {
                        setActiveFilter(filter);
                        setCurrentPage(1);
                      }}
                    >
                      <Text style={[styles.filterTabText, activeFilter === filter && styles.activeFilterTabText]}>
                        {filter}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.downloadButton} onPress={downloadCSV}>
                  <Text style={styles.downloadButtonText}>Download CSV</Text>
                </TouchableOpacity>
              </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCellId}>Order</Text>
              <Text style={styles.headerCellName}>Name</Text>
              <Text style={styles.headerCellPet}>Pet Name</Text>
              <Text style={styles.headerCellService}>Service</Text>
              <Text style={styles.headerCellVet}>Veterinarian</Text>
              <Text style={styles.headerCellSchedule}>Schedule</Text>
              <Text style={styles.headerCellActions}>Actions</Text>
            </View>
            <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
              {currentAppointments.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No appointments found</Text>
                </View>
              ) : (
                currentAppointments.map((appointment, index) => (
                  <TouchableOpacity key={appointment.id} style={styles.tableRow} onPress={() => setSelectedAppointment(appointment)}>
                    <Text style={styles.cellId} numberOfLines={1}>{startIndex + index + 1}</Text>
                    <Text style={styles.cellName} numberOfLines={1}>{appointment.customerName || appointment.name}</Text>
                    <Text style={styles.cellPet} numberOfLines={1}>{appointment.petName}</Text>
                    <Text style={styles.cellService} numberOfLines={1}>{appointment.service}</Text>
                    <Text style={styles.cellVet} numberOfLines={1}>{appointment.veterinarian || appointment.staff}</Text>
                    <Text style={styles.cellSchedule} numberOfLines={1}>{appointment.dateTime}</Text>
                    <View style={styles.actionsCell}>
                    {appointment.status === 'Pending' && (
                      <>
                        <TouchableOpacity style={styles.actionButton} onPress={async (e) => {
                          e.stopPropagation();
                          try {
                            await updateAppointment(appointment.id, { status: 'Approved' }, userEmail);
                            const updatedList = appointmentList.map(apt => 
                              apt.id === appointment.id ? { ...apt, status: 'Approved' } : apt
                            );
                            setAppointmentList(updatedList);
                            addNotification({
                              title: 'Appointment Approved',
                              message: `${appointment.customerName || appointment.name}'s ${appointment.petName} - ${appointment.service} has been approved`,
                              type: 'due',
                              appointmentId: appointment.id,
                            });
                          } catch (error) {
                            console.error('Error approving appointment:', error);
                            alert('Error approving appointment');
                          }
                        }}>
                          <Text style={styles.actionButtonText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.cancelActionButton]} onPress={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete this appointment for ${appointment.customerName || appointment.name}?`)) {
                            try {
                              await deleteAppointment(appointment.id, userEmail);
                              const updatedList = appointmentList.filter(apt => apt.id !== appointment.id);
                              setAppointmentList(updatedList);
                              addNotification({
                                title: 'Appointment Deleted',
                                message: `${appointment.customerName || appointment.name}'s ${appointment.petName} - ${appointment.service} has been deleted`,
                                type: 'cancelled',
                                appointmentId: appointment.id,
                              });
                            } catch (error) {
                              console.error('Error deleting appointment:', error);
                              alert('Error deleting appointment');
                            }
                          }
                        }}>
                          <Text style={[styles.actionButtonText, styles.cancelActionButtonText]}>Decline</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {appointment.status === 'Approved' && (
                      <>
                        <TouchableOpacity style={[styles.actionButton, styles.doneActionButton]} onPress={async (e) => {
                          e.stopPropagation();
                          try {
                            await updateAppointment(appointment.id, { status: 'Completed' });
                            const updatedList = appointmentList.map(apt => 
                              apt.id === appointment.id ? { ...apt, status: 'Completed' } : apt
                            );
                            setAppointmentList(updatedList);
                            addNotification({
                              title: 'Appointment Completed',
                              message: `${appointment.customerName || appointment.name}'s ${appointment.petName} - ${appointment.service} has been completed`,
                              type: 'new',
                              appointmentId: appointment.id,
                            });
                          } catch (error) {
                            console.error('Error completing appointment:', error);
                            alert('Error completing appointment');
                          }
                        }}>
                          <Text style={[styles.actionButtonText, styles.doneActionButtonText]}>Done</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.cancelActionButton]} onPress={async (e) => {
                          e.stopPropagation();
                          try {
                            await updateAppointment(appointment.id, { status: 'Cancelled' });
                            const updatedList = appointmentList.map(apt => 
                              apt.id === appointment.id ? { ...apt, status: 'Cancelled' } : apt
                            );
                            setAppointmentList(updatedList);
                            addNotification({
                              title: 'Appointment Cancelled',
                              message: `${appointment.customerName || appointment.name}'s ${appointment.petName} - ${appointment.service} has been cancelled`,
                              type: 'cancelled',
                              appointmentId: appointment.id,
                            });
                          } catch (error) {
                            console.error('Error cancelling appointment:', error);
                            alert('Error cancelling appointment');
                          }
                        }}>
                          <Text style={[styles.actionButtonText, styles.cancelActionButtonText]}>Cancel</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {appointment.status === 'Due' && (
                      <>
                        <TouchableOpacity style={[styles.actionButton, styles.doneActionButton]} onPress={async (e) => {
                          e.stopPropagation();
                          try {
                            await updateAppointment(appointment.id, { status: 'Completed' });
                            const updatedList = appointmentList.map(apt => 
                              apt.id === appointment.id ? { ...apt, status: 'Completed' } : apt
                            );
                            setAppointmentList(updatedList);
                            addNotification({
                              title: 'Appointment Completed',
                              message: `${appointment.customerName || appointment.name}'s ${appointment.petName} - ${appointment.service} has been completed`,
                              type: 'new',
                              appointmentId: appointment.id,
                            });
                          } catch (error) {
                            console.error('Error completing appointment:', error);
                            alert('Error completing appointment');
                          }
                        }}>
                          <Text style={[styles.actionButtonText, styles.doneActionButtonText]}>Done</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.cancelActionButton]} onPress={async (e) => {
                          e.stopPropagation();
                          try {
                            await updateAppointment(appointment.id, { status: 'Cancelled' });
                            const updatedList = appointmentList.map(apt => 
                              apt.id === appointment.id ? { ...apt, status: 'Cancelled' } : apt
                            );
                            setAppointmentList(updatedList);
                            addNotification({
                              title: 'Appointment Cancelled',
                              message: `${appointment.customerName || appointment.name}'s ${appointment.petName} - ${appointment.service} has been cancelled`,
                              type: 'cancelled',
                              appointmentId: appointment.id,
                            });
                          } catch (error) {
                            console.error('Error cancelling appointment:', error);
                            alert('Error cancelling appointment');
                          }
                        }}>
                          <Text style={[styles.actionButtonText, styles.cancelActionButtonText]}>Cancel</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {appointment.status === 'Completed' && (
                      <TouchableOpacity style={[styles.actionButton, styles.viewActionButton]} onPress={(e) => e.stopPropagation()}>
                        <Text style={[styles.actionButtonText, styles.viewActionButtonText]}>View</Text>
                      </TouchableOpacity>
                    )}
                    {appointment.status === 'Cancelled' && (
                      <TouchableOpacity style={[styles.actionButton, styles.rescheduleActionButton]} onPress={(e) => e.stopPropagation()}>
                        <Text style={[styles.actionButtonText, styles.rescheduleActionButtonText]}>Reschedule</Text>
                      </TouchableOpacity>
                    )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

          </View>
          
          <View style={styles.pagination}>
            <View style={styles.paginationControls}>
              <Text style={styles.paginationLabel}>Show:</Text>
              <SearchableDropdown
                options={dropdownOptions.map(option => ({
                  id: option,
                  label: option.toString(),
                  value: option
                }))}
                selectedValue={itemsPerPage}
                onSelect={(option) => handleItemsPerPageChange(option.value)}
                style={{ minWidth: 35 }}
                zIndex={100}
              />
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
        ) : selectedAppointment && !showCalendar && !selectedMedicalRecord ? (
          <ScrollView style={styles.detailScrollView}>
            <View style={styles.tableContainer}>
              <View style={styles.detailTable}>
                <View style={styles.tableTopRow}>
                  <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.returnButton} onPress={() => setSelectedAppointment(null)}>
                      <Image source={require('@/assets/return-arrow.svg')} style={styles.returnIcon} />
                    </TouchableOpacity>
                    <Text style={styles.detailTitle}>Appointment Details</Text>
                  </View>
                  <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.calendarButton} onPress={() => {
                      // Parse appointment date and focus calendar on it
                      const [datePart] = selectedAppointment.dateTime.split('\n');
                      const today = new Date();
                      let targetMonth = today.getMonth();
                      let targetYear = today.getFullYear();
                      
                      if (datePart.includes('Jan')) targetMonth = 0;
                      else if (datePart.includes('Feb')) targetMonth = 1;
                      else if (datePart.includes('Mar')) targetMonth = 2;
                      else if (datePart.includes('Apr')) targetMonth = 3;
                      else if (datePart.includes('May')) targetMonth = 4;
                      else if (datePart.includes('Jun')) targetMonth = 5;
                      else if (datePart.includes('Jul')) targetMonth = 6;
                      else if (datePart.includes('Aug')) targetMonth = 7;
                      else if (datePart.includes('Sep')) targetMonth = 8;
                      else if (datePart.includes('Oct')) targetMonth = 9;
                      else if (datePart.includes('Nov')) targetMonth = 10;
                      else if (datePart.includes('Dec')) targetMonth = 11;
                      
                      setSelectedMonth(targetMonth);
                      setSelectedYear(targetYear);
                      setCalendarStatusFilter('All');
                      setSelectedVetFilter('');
                      setShowCalendar(true);
                    }}>
                      <Text style={styles.calendarButtonText}>📅 Calendar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editButton} onPress={() => {
                      const customer = customers.find(c => c.name === selectedAppointment.name);
                      const [datePart, timePart] = selectedAppointment.dateTime.split('\n');
                      setEditAppointment({
                        customer: selectedAppointment.name,
                        pet: selectedAppointment.petName,
                        service: selectedAppointment.service,
                        staff: selectedAppointment.staff,
                        date: datePart,
                        time: timePart,
                        status: selectedAppointment.status
                      });
                      setEditSelectedCustomer(customer);
                      setShowEditDrawer(true);
                      Animated.timing(drawerAnimation, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: false,
                      }).start();
                    }}>
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={async () => {
                      if (confirm(`Are you sure you want to delete this appointment for ${selectedAppointment.customerName || selectedAppointment.name}?`)) {
                        try {
                          await updateAppointment(selectedAppointment.id, { status: 'Cancelled' }, userEmail);
                          const updatedList = appointmentList.map(apt => 
                            apt.id === selectedAppointment.id ? { ...apt, status: 'Cancelled' } : apt
                          );
                          setAppointmentList(updatedList);
                          setSelectedAppointment({ ...selectedAppointment, status: 'Cancelled' });
                          addNotification({
                            title: 'Appointment Cancelled',
                            message: `${selectedAppointment.customerName || selectedAppointment.name}'s appointment has been cancelled`,
                            type: 'cancelled',
                            appointmentId: selectedAppointment.id,
                          });
                        } catch (error) {
                          console.error('Error deleting appointment:', error);
                          alert('Error deleting appointment');
                        }
                      }
                    }}>
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.tableHeader}>
                  <Text style={styles.headerCellName}>Field</Text>
                  <Text style={styles.headerCellName}>Value</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Order Number</Text>
                  <Text style={styles.cellName}>{selectedAppointment.order}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Owner Name</Text>
                  <Text style={styles.cellName}>{selectedAppointment.customerName || selectedAppointment.name}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Pet Name</Text>
                  <Text style={styles.cellName}>{selectedAppointment.petName}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Service</Text>
                  <Text style={styles.cellName}>{selectedAppointment.service}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Veterinarian Name</Text>
                  <Text style={styles.cellName}>{selectedAppointment.veterinarian || selectedAppointment.staff}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Date & Time</Text>
                  <Text style={styles.cellName}>{selectedAppointment.dateTime}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Status</Text>
                  <Text style={styles.cellName}>{selectedAppointment.status}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Created Date</Text>
                  <Text style={styles.cellName}>Jan 10, 2024</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.cellName}>Notes</Text>
                  <Text style={styles.cellName}>Regular checkup appointment</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.petsSection}>
              <View style={styles.petsHeader}>
                <Text style={styles.sectionTitle}>Medical History</Text>
                <View style={styles.petsActions}>
                  <TouchableOpacity style={styles.addButton} onPress={() => {
                    setShowAddRecordDrawer(true);
                    Animated.timing(addRecordDrawerAnimation, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: false,
                    }).start();
                  }}>
                    <Image source={require('@/assets/ic_round-plus.png')} style={styles.addIcon} />
                    <Text style={styles.addButtonText}>Add Record</Text>
                  </TouchableOpacity>
                  <View style={styles.searchContainer}>
                    <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
                    <TextInput 
                      style={styles.searchInput}
                      placeholder="Search records..."
                      placeholderTextColor="#999"
                      value={medicalHistorySearchTerm}
                      onChangeText={setMedicalHistorySearchTerm}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.tableContainer}>
                <View style={styles.petsTable}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.cellId}>Order</Text>
                    <Text style={styles.headerCellName}>Date</Text>
                    <Text style={styles.headerCell}>Treatment</Text>
                    <Text style={styles.headerCell}>Veterinarian</Text>
                  </View>
                  {(() => {
                    // Find the pet by name from the appointment
                    const pet = Object.values(customerPets).flat().find(p => {
                      // Extract pet name from appointment (remove owner name in parentheses)
                      const appointmentPetName = selectedAppointment?.petName?.split(' (')[0] || selectedAppointment?.petName;
                      return p.name === appointmentPetName;
                    });
                    const petId = pet?.id;
                    const historyData = petMedicalHistory[petId] || [];
                    const filteredHistory = historyData.filter(record =>
                      record.treatment.toLowerCase().includes(medicalHistorySearchTerm.toLowerCase()) ||
                      record.veterinarian.toLowerCase().includes(medicalHistorySearchTerm.toLowerCase())
                    );
                    const historyTotalPages = Math.ceil(filteredHistory.length / medicalHistoryItemsPerPage);
                    const historyStartIndex = (medicalHistoryCurrentPage - 1) * medicalHistoryItemsPerPage;
                    const historyEndIndex = historyStartIndex + medicalHistoryItemsPerPage;
                    const currentHistory = filteredHistory.slice(historyStartIndex, historyEndIndex);
                    
                    // Store filteredHistory for pagination
                    window.currentFilteredHistory = filteredHistory;
                    
                    if (currentHistory.length === 0) {
                      return (
                        <View style={styles.noDataContainer}>
                          <Text style={styles.noDataText}>No medical records found for this pet</Text>
                        </View>
                      );
                    } else if (medicalHistoryItemsPerPage >= 20) {
                      return (
                        <ScrollView style={styles.tableBody}>
                          {currentHistory.map((record, recordIndex) => (
                            <TouchableOpacity key={record.id} style={styles.tableRow} onPress={() => setSelectedMedicalRecord(record)}>
                              <Text style={styles.cellId}>{historyStartIndex + recordIndex + 1}</Text>
                              <Text style={styles.cellName}>{record.date}</Text>
                              <Text style={styles.cell}>{record.treatment}</Text>
                              <Text style={styles.cell}>{record.veterinarian}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      );
                    } else {
                      return currentHistory.map((record, recordIndex) => (
                        <TouchableOpacity key={record.id} style={styles.tableRow} onPress={() => setSelectedMedicalRecord(record)}>
                          <Text style={styles.cellId}>{historyStartIndex + recordIndex + 1}</Text>
                          <Text style={styles.cellName}>{record.date}</Text>
                          <Text style={styles.cell}>{record.treatment}</Text>
                          <Text style={styles.cell}>{record.veterinarian}</Text>
                        </TouchableOpacity>
                      ));
                    }
                  })()}
                </View>
                
                <View style={styles.pagination}>
                  <View style={styles.paginationControls}>
                    <Text style={styles.paginationLabel}>Show:</Text>
                    <View style={styles.dropdownContainer}>
                      <TouchableOpacity style={styles.dropdown} onPress={() => setShowMedicalHistoryDropdown(!showMedicalHistoryDropdown)}>
                        <Text style={styles.dropdownText}>{medicalHistoryItemsPerPage}</Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                      </TouchableOpacity>
                      {showMedicalHistoryDropdown && (
                        <View style={styles.dropdownMenu}>
                          {[10, 20, 50, 100].map((option) => (
                            <TouchableOpacity
                              key={option}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setMedicalHistoryItemsPerPage(option);
                                setMedicalHistoryCurrentPage(1);
                                setShowMedicalHistoryDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{option}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                    <Text style={styles.paginationLabel}>entries</Text>
                    
                    <TouchableOpacity style={styles.pageBtn} onPress={() => {
                      if (medicalHistoryCurrentPage > 1) setMedicalHistoryCurrentPage(medicalHistoryCurrentPage - 1);
                    }}>
                      <Text style={styles.pageBtnText}>Prev</Text>
                    </TouchableOpacity>
                    <TextInput 
                      style={styles.pageInput}
                      value={medicalHistoryCurrentPage.toString()}
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const pageNum = parseInt(text);
                        if (pageNum >= 1) {
                          setMedicalHistoryCurrentPage(pageNum);
                        }
                      }}
                    />
                    <Text style={styles.pageOf}>of {Math.ceil((window.currentFilteredHistory || []).length / medicalHistoryItemsPerPage) || 1}</Text>
                    <TouchableOpacity style={styles.pageBtn}>
                      <Text style={styles.pageBtnText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        ) : showCalendar && !selectedMedicalRecord ? (
        <View style={styles.newCalendarContainer}>
          <View style={styles.newCalendarHeader}>
            <TouchableOpacity style={styles.newBackBtn} onPress={() => {
              setShowCalendar(false);
              if (selectedAppointment) {
                // Keep appointment details open when returning from calendar
              }
            }}>
              <Text style={styles.newBackBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.newCalendarTitle}>Calendar - {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} {selectedYear}</Text>
          </View>
          
          <View style={styles.legendContainer}>
            <TouchableOpacity style={[styles.legendItem, calendarStatusFilter === 'All' && styles.activeLegendItem]} onPress={() => setCalendarStatusFilter('All')}>
              <View style={[styles.legendDot, {backgroundColor: '#666'}]} />
              <Text style={[styles.legendText, calendarStatusFilter === 'All' && styles.activeLegendText]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.legendItem, calendarStatusFilter === 'Pending' && styles.activeLegendItem]} onPress={() => setCalendarStatusFilter('Pending')}>
              <View style={[styles.legendDot, {backgroundColor: '#FFA500'}]} />
              <Text style={[styles.legendText, calendarStatusFilter === 'Pending' && styles.activeLegendText]}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.legendItem, calendarStatusFilter === 'Approved' && styles.activeLegendItem]} onPress={() => setCalendarStatusFilter('Approved')}>
              <View style={[styles.legendDot, {backgroundColor: '#23C062'}]} />
              <Text style={[styles.legendText, calendarStatusFilter === 'Approved' && styles.activeLegendText]}>Approved</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.legendItem, calendarStatusFilter === 'Due' && styles.activeLegendItem]} onPress={() => setCalendarStatusFilter('Due')}>
              <View style={[styles.legendDot, {backgroundColor: '#FF6B6B'}]} />
              <Text style={[styles.legendText, calendarStatusFilter === 'Due' && styles.activeLegendText]}>Due</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.legendItem, calendarStatusFilter === 'Completed' && styles.activeLegendItem]} onPress={() => setCalendarStatusFilter('Completed')}>
              <View style={[styles.legendDot, {backgroundColor: '#4ECDC4'}]} />
              <Text style={[styles.legendText, calendarStatusFilter === 'Completed' && styles.activeLegendText]}>Completed</Text>
            </TouchableOpacity>
            <View style={styles.vetFilterContainer}>
              <Text style={styles.vetFilterLabel}>Veterinarian:</Text>
              <TouchableOpacity style={styles.vetFilterDropdown} onPress={() => setShowVetFilterDropdown(!showVetFilterDropdown)}>
                <Text style={styles.vetFilterText}>{selectedVetFilter || 'All Veterinarians'}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              {showVetFilterDropdown && (
                <View style={styles.vetFilterMenu}>
                  <ScrollView style={styles.vetFilterScrollView} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity style={styles.vetFilterOption} onPress={() => { setSelectedVetFilter(''); setShowVetFilterDropdown(false); }}>
                      <Text style={styles.vetFilterOptionText}>All Veterinarians</Text>
                    </TouchableOpacity>
                    {veterinarians.map((vet, index) => (
                      <TouchableOpacity key={index} style={styles.vetFilterOption} onPress={() => { setSelectedVetFilter(vet); setShowVetFilterDropdown(false); }}>
                        <Text style={styles.vetFilterOptionText}>{vet}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
          
          {!showDayView ? (
            <Animated.View style={[styles.newCalendarContent, {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              }],
              opacity: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.7],
              }),
            }]} {...panResponder.panHandlers}>
              <View style={styles.newWeekHeader}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} style={styles.newWeekDay}>{day}</Text>
                ))}
              </View>
              <View style={styles.newDaysGrid}>
                {(() => {
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const selectedMonthName = monthNames[selectedMonth];
                  const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
                  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                  const daysInPrevMonth = new Date(selectedYear, selectedMonth, 0).getDate();
                  const totalCells = 42;
                  
                  const calendarDays = [];
                  
                  for (let i = firstDay - 1; i >= 0; i--) {
                    const day = daysInPrevMonth - i;
                    calendarDays.push({ day, isCurrentMonth: false, isPrevMonth: true });
                  }
                  
                  for (let day = 1; day <= daysInMonth; day++) {
                    calendarDays.push({ day, isCurrentMonth: true, isPrevMonth: false });
                  }
                  
                  const remainingCells = totalCells - calendarDays.length;
                  for (let day = 1; day <= remainingCells; day++) {
                    calendarDays.push({ day, isCurrentMonth: false, isPrevMonth: false });
                  }
                  
                  return calendarDays.map((dayObj, index) => {
                    const { day, isCurrentMonth } = dayObj;
                    const todayDate = new Date();
                    const currentDay = todayDate.getDate();
                    const currentMonth = todayDate.getMonth();
                    const currentYear = todayDate.getFullYear();
                    
                    const dayAppointments = isCurrentMonth ? appointmentList.filter(apt => {
                      const isCurrentMonthAppt = apt.dateTime.includes(`${selectedMonthName} ${day}`);
                      const isTodayAppt = day === currentDay && selectedMonth === currentMonth && selectedYear === currentYear && apt.dateTime.includes('Today');
                      const isTomorrow = day === (currentDay + 1) && selectedMonth === currentMonth && selectedYear === currentYear && apt.dateTime.includes('Tomorrow');
                      const isYesterday = day === (currentDay - 1) && selectedMonth === currentMonth && selectedYear === currentYear && apt.dateTime.includes('Yesterday');
                      const daysAgoMatch = apt.dateTime.match(/([0-9]+) days ago/);
                      const isDaysAgo = daysAgoMatch && day === (currentDay - parseInt(daysAgoMatch[1])) && selectedMonth === currentMonth && selectedYear === currentYear;
                      const matchesDate = isCurrentMonthAppt || isTodayAppt || isTomorrow || isYesterday || isDaysAgo;
                      const matchesStatus = calendarStatusFilter === 'All' || apt.status === calendarStatusFilter;
                      const matchesVet = !selectedVetFilter || apt.veterinarian === selectedVetFilter || apt.staff === selectedVetFilter;
                      const matchesPet = !selectedAppointment || apt.petName === selectedAppointment.petName;
                      return matchesDate && matchesStatus && matchesVet && matchesPet;
                    }) : [];
                    const hasAppointments = dayAppointments.length > 0;
                    const statusCounts = dayAppointments.reduce((acc, apt) => {
                      acc[apt.status] = (acc[apt.status] || 0) + 1;
                      return acc;
                    }, {});
                    
                    const isTodayBox = isCurrentMonth && day === todayDate.getDate() && selectedMonth === todayDate.getMonth() && selectedYear === todayDate.getFullYear();
                    
                    return (
                      <TouchableOpacity key={index} style={[styles.newDayBox, hasAppointments && styles.newDayWithAppt, isTodayBox && styles.todayBox, !isCurrentMonth && styles.otherMonthBox]} onPress={() => {
                        if (isCurrentMonth) {
                          setSelectedDay(day);
                          setShowDayView(true);
                        } else {
                          animateTransition(() => {
                            if (dayObj.isPrevMonth) {
                              if (selectedMonth === 0) {
                                setSelectedMonth(11);
                                setSelectedYear(selectedYear - 1);
                              } else {
                                setSelectedMonth(selectedMonth - 1);
                              }
                            } else {
                              if (selectedMonth === 11) {
                                setSelectedMonth(0);
                                setSelectedYear(selectedYear + 1);
                              } else {
                                setSelectedMonth(selectedMonth + 1);
                              }
                            }
                          });
                        }
                      }}>
                        <Text style={[styles.newDayText, isTodayBox && styles.todayText, !isCurrentMonth && styles.otherMonthText]}>{day}</Text>
                        {hasAppointments && (
                          <View style={styles.statusIndicators}>
                            {statusCounts.Pending && <View style={[styles.statusDot, {backgroundColor: '#FFA500'}]} />}
                            {statusCounts.Approved && <View style={[styles.statusDot, {backgroundColor: '#23C062'}]} />}
                            {statusCounts.Due && <View style={[styles.statusDot, {backgroundColor: '#FF6B6B'}]} />}
                            {statusCounts.Completed && <View style={[styles.statusDot, {backgroundColor: '#4ECDC4'}]} />}
                            {statusCounts.Cancelled && <View style={[styles.statusDot, {backgroundColor: '#6c757d'}]} />}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  });
                })()}
              </View>
            </Animated.View>
          ) : (
            <View style={styles.newDayViewContainer}>
              <View style={styles.newDayViewHeader}>
                <TouchableOpacity style={styles.newBackBtn} onPress={() => setShowDayView(false)}>
                  <Text style={styles.newBackBtnText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.newDayViewTitle}>{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} {selectedDay}, {selectedYear}</Text>
              </View>
              <ScrollView style={styles.newScheduleView}>
                {Array.from({length: 24}, (_, i) => {
                  const hour = i;
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const selectedMonthName = monthNames[selectedMonth];
                  const hourAppts = appointmentList.filter(apt => {
                    const currentDate = new Date();
                    const currentDay = currentDate.getDate();
                    const currentMonth = currentDate.getMonth();
                    const currentYear = currentDate.getFullYear();
                    const timeMatch = apt.dateTime.includes(`${hour}:`) || apt.dateTime.includes(`${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:`);
                    const isCurrentMonthAppt = apt.dateTime.includes(`${selectedMonthName} ${selectedDay}`);
                    const isToday = selectedDay === currentDay && selectedMonth === currentMonth && selectedYear === currentYear && apt.dateTime.includes('Today');
                    const isTomorrow = selectedDay === (currentDay + 1) && selectedMonth === currentMonth && selectedYear === currentYear && apt.dateTime.includes('Tomorrow');
                    const isYesterday = selectedDay === (currentDay - 1) && selectedMonth === currentMonth && selectedYear === currentYear && apt.dateTime.includes('Yesterday');
                    const daysAgoMatch = apt.dateTime.match(/([0-9]+) days ago/);
                    const isDaysAgo = daysAgoMatch && selectedDay === (currentDay - parseInt(daysAgoMatch[1])) && selectedMonth === currentMonth && selectedYear === currentYear;
                    const dayMatch = isCurrentMonthAppt || isToday || isTomorrow || isYesterday || isDaysAgo;
                    const matchesStatus = calendarStatusFilter === 'All' || apt.status === calendarStatusFilter;
                    const matchesPet = !selectedAppointment || apt.petName === selectedAppointment.petName;
                    return timeMatch && dayMatch && matchesStatus && matchesPet;
                  });
                  return (
                    <View key={hour} style={styles.newTimeSlot}>
                      <Text style={styles.newTimeLabel}>{hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}</Text>
                      <View style={styles.newApptSlot}>
                        {hourAppts.map((apt) => (
                          <TouchableOpacity key={apt.id} style={[styles.newApptCard, {
                            borderLeftColor: apt.status === 'Pending' ? '#FFA500' : 
                                           apt.status === 'Approved' ? '#23C062' :
                                           apt.status === 'Due' ? '#FF6B6B' :
                                           apt.status === 'Completed' ? '#4ECDC4' : '#6c757d'
                          }]} onPress={() => setSelectedAppointment(apt)}>
                            <View style={styles.apptHeader}>
                              <Text style={styles.newApptName}>{apt.name}</Text>
                              <View style={[styles.statusBadge, {
                                backgroundColor: apt.status === 'Pending' ? '#FFA500' : 
                                               apt.status === 'Approved' ? '#23C062' :
                                               apt.status === 'Due' ? '#FF6B6B' :
                                               apt.status === 'Completed' ? '#4ECDC4' : '#6c757d'
                              }]}>
                                <Text style={styles.statusBadgeText}>{apt.status}</Text>
                              </View>
                            </View>
                            <Text style={styles.newApptDetails}>{apt.petName} - {apt.service}</Text>
                            <Text style={styles.newApptStaff}>{apt.staff}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

        </View>
        ) : selectedMedicalRecord && !showCalendar ? (
          <ScrollView style={styles.detailScrollView}>
            <View style={styles.tableContainer}>
              <View style={styles.detailTable}>
                <View style={styles.tableTopRow}>
                  <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.returnButton} onPress={() => setSelectedMedicalRecord(null)}>
                      <Image source={require('@/assets/return-arrow.svg')} style={styles.returnIcon} />
                    </TouchableOpacity>
                    <Text style={styles.detailTitle}>Medical Record Details</Text>
                  </View>
                  <TouchableOpacity style={styles.editButton}>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.medicalRecordDetails}>
                  <View style={styles.medicalRecordRow}>
                    <Text style={styles.medicalRecordLabel}>Form Type:</Text>
                    <Text style={styles.medicalRecordValue}>{selectedMedicalRecord.formType}</Text>
                  </View>
                  <View style={styles.medicalRecordRow}>
                    <Text style={styles.medicalRecordLabel}>Date:</Text>
                    <Text style={styles.medicalRecordValue}>{selectedMedicalRecord.date}</Text>
                  </View>
                  <View style={styles.medicalRecordRow}>
                    <Text style={styles.medicalRecordLabel}>Treatment:</Text>
                    <Text style={styles.medicalRecordValue}>{selectedMedicalRecord.treatment}</Text>
                  </View>
                  <View style={styles.medicalRecordRow}>
                    <Text style={styles.medicalRecordLabel}>Veterinarian:</Text>
                    <Text style={styles.medicalRecordValue}>{selectedMedicalRecord.veterinarian}</Text>
                  </View>
                  
                  {selectedMedicalRecord.formData && Object.keys(selectedMedicalRecord.formData).length > 0 && (
                    <>
                      <Text style={styles.formDataTitle}>Form Data:</Text>
                      {Object.entries(selectedMedicalRecord.formData).map(([key, value]) => (
                        <View key={key} style={styles.medicalRecordRow}>
                          <Text style={styles.medicalRecordLabel}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:</Text>
                          <Text style={styles.medicalRecordValue}>{value}</Text>
                        </View>
                      ))}
                    </>
                  )}
                  
                  <View style={styles.medicalRecordRow}>
                    <Text style={styles.medicalRecordLabel}>Record Created:</Text>
                    <Text style={styles.medicalRecordValue}>Jan 15, 2024</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        ) : null}
      </View>
      
      {showAddDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addDrawerAnimation }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Appointment</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(addDrawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowAddDrawer(false));
                }}>
                  <Image source={require('@/assets/Vector (1).png')} style={styles.drawerCloseIcon} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Customer *</Text>
                <SearchableDropdown
                  options={customers.map(customer => ({
                    id: customer.id,
                    label: customer.name,
                    value: customer
                  }))}
                  placeholder="Select Customer"
                  selectedValue={selectedCustomer}
                  onSelect={(option) => {
                    setNewAppointment({...newAppointment, customer: option.label, pet: ''});
                    setSelectedCustomer(option.value);
                  }}
                  zIndex={3001}
                />
                
                <Text style={styles.fieldLabel}>Pet *</Text>
                <View style={styles.editPetDropdownContainer}>
                  <TouchableOpacity 
                    style={[styles.modalDropdown, !selectedCustomer && styles.disabledDropdown]} 
                    onPress={() => {
                      if (selectedCustomer) {
                        setShowCustomerDropdown(false);
                        setShowStaffDropdown(false);
                        setShowPetDropdown(!showPetDropdown);
                      }
                    }}
                    disabled={!selectedCustomer}
                  >
                    <Text style={styles.modalDropdownText}>{newAppointment.pet || 'Select Pet'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showPetDropdown && selectedCustomer && (
                    <View style={styles.modalDropdownMenu}>
                      <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={false}>
                        {(() => {
                          console.log('DEBUG - Selected customer:', selectedCustomer);
                          console.log('DEBUG - Customer pets object:', customerPets);
                          console.log('DEBUG - Pets for selected customer name:', customerPets[selectedCustomer.name]);
                          console.log('DEBUG - Pets for selected customer ID:', customerPets[selectedCustomer.id]);
                          
                          // Try both customer name and ID
                          const petsByName = customerPets[selectedCustomer.name] || [];
                          const petsById = customerPets[selectedCustomer.id] || [];
                          const availablePets = petsByName.length > 0 ? petsByName : petsById;
                          
                          console.log('DEBUG - Available pets:', availablePets);
                          return availablePets;
                        })().map((pet) => (
                          <TouchableOpacity
                            key={pet.id}
                            style={styles.modalDropdownOption}
                            onPress={() => {
                              setNewAppointment({...newAppointment, pet: pet.name});
                              setShowPetDropdown(false);
                            }}
                          >
                            <Text style={styles.modalDropdownOptionText} numberOfLines={1} ellipsizeMode="tail">{pet.name} ({pet.type})</Text>
                          </TouchableOpacity>
                        ))}
                        {(() => {
                          const petsByName = customerPets[selectedCustomer.name] || [];
                          const petsById = customerPets[selectedCustomer.id] || [];
                          const availablePets = petsByName.length > 0 ? petsByName : petsById;
                          return availablePets.length === 0;
                        })() && (
                          <View style={styles.modalDropdownOption}>
                            <Text style={[styles.modalDropdownOptionText, {fontStyle: 'italic', color: '#999'}]}>No pets found for this customer</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Service *</Text>
                <SearchableDropdown
                  options={[...services.map((service, index) => ({
                    id: index,
                    label: service,
                    value: service
                  })), {
                    id: 'add-new',
                    label: '+ Add New Service',
                    value: 'add-new'
                  }]}
                  placeholder="Select Service"
                  selectedValue={newAppointment.service}
                  onSelect={(option) => {
                    if (option.value === 'add-new') {
                      setShowAddServiceModal(true);
                    } else {
                      setNewAppointment({...newAppointment, service: option.value});
                    }
                  }}
                  zIndex={1751}
                />
                
                <Text style={styles.fieldLabel}>Veterinarian *</Text>
                <SearchableDropdown
                  options={veterinarians.map((vet, index) => ({
                    id: index,
                    label: vet,
                    value: vet
                  }))}
                  placeholder="Select Veterinarian"
                  selectedValue={newAppointment.staff}
                  onSelect={(option) => {
                    setNewAppointment({...newAppointment, staff: option.value});
                  }}
                  zIndex={1501}
                />
                
                <Text style={styles.fieldLabel}>Date & Time *</Text>
                <View style={styles.inputRow}>
                  <TouchableOpacity style={[styles.modalInput, styles.halfInput, styles.datePickerButton]} onPress={() => {
                    setShowCustomerDropdown(false);
                    setShowPetDropdown(false);
                    setShowStaffDropdown(false);
                    setShowAddDatePicker(true);
                  }}>
                    <Text style={styles.datePickerText}>{newAppointment.date || 'Select Date'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalInput, styles.halfInput, styles.datePickerButton]} onPress={() => {
                    setShowCustomerDropdown(false);
                    setShowPetDropdown(false);
                    setShowStaffDropdown(false);
                    setShowAddTimePicker(true);
                  }}>
                    <Text style={styles.datePickerText}>{newAppointment.time || 'Select Time'}</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  Animated.timing(addDrawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowAddDrawer(false));
                }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddAppointment}>
                  <Text style={styles.saveButtonText}>Add Appointment</Text>
                </TouchableOpacity>
              </View>
              </Animated.View>
          </View>
        </Modal>
      )}
      
      <Modal visible={showModal} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Appointment</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowModal(false)}>
                <Image source={require('@/assets/exit button.png')} style={styles.closeButtonIcon} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.customerDropdownContainer}>
                <TouchableOpacity style={styles.modalDropdown} onPress={() => setShowCustomerDropdown(!showCustomerDropdown)}>
                  <Text style={styles.modalDropdownText}>{newAppointment.customer || 'Select Customer *'}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {showCustomerDropdown && (
                  <View style={styles.modalDropdownMenu}>
                    {customers.map((customer) => (
                      <TouchableOpacity
                        key={customer.id}
                        style={styles.modalDropdownOption}
                        onPress={() => {
                          setNewAppointment({...newAppointment, customer: customer.name, pet: ''});
                          setSelectedCustomer(customer);
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <Text style={styles.modalDropdownOptionText}>{customer.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              <View style={styles.petDropdownContainer}>
                <TouchableOpacity 
                  style={[styles.modalDropdown, !selectedCustomer && styles.disabledDropdown]} 
                  onPress={() => selectedCustomer && setShowPetDropdown(!showPetDropdown)}
                  disabled={!selectedCustomer}
                >
                  <Text style={styles.modalDropdownText}>{newAppointment.pet || 'Select Pet *'}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {showPetDropdown && selectedCustomer && (
                  <View style={styles.modalDropdownMenu}>
                    {(customerPets[selectedCustomer.id] || []).map((pet) => (
                      <TouchableOpacity
                        key={pet.id}
                        style={styles.modalDropdownOption}
                        onPress={() => {
                          setNewAppointment({...newAppointment, pet: pet.name});
                          setShowPetDropdown(false);
                        }}
                      >
                        <Text style={styles.modalDropdownOptionText}>{pet.name} ({pet.type})</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Service *"
                value={newAppointment.service}
                onChangeText={(text) => setNewAppointment({...newAppointment, service: text})}
              />
              
              <View style={styles.staffDropdownContainer}>
                <TouchableOpacity style={styles.modalDropdown} onPress={() => setShowStaffDropdown(!showStaffDropdown)}>
                  <Text style={styles.modalDropdownText}>{newAppointment.staff || 'Select Veterinarian *'}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {showStaffDropdown && (
                  <View style={styles.modalDropdownMenu}>
                    <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={false}>
                      {veterinarians.map((vet, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.modalDropdownOption}
                          onPress={() => {
                            setNewAppointment({...newAppointment, staff: vet});
                            setShowStaffDropdown(false);
                          }}
                        >
                          <Text style={styles.modalDropdownOptionText}>{vet}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              
              <View style={styles.inputRow}>
                <TouchableOpacity style={[styles.modalInput, styles.halfInput, styles.datePickerButton]} onPress={() => setShowAddDatePicker(true)}>
                  <Text style={styles.datePickerText}>{newAppointment.date || 'Select Date *'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalInput, styles.halfInput, styles.datePickerButton]} onPress={() => setShowAddTimePicker(true)}>
                  <Text style={styles.datePickerText}>{newAppointment.time || 'Select Time *'}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.statusDropdownContainer}>
                <TouchableOpacity style={styles.modalDropdown} onPress={() => setShowStatusDropdown(!showStatusDropdown)}>
                  <Text style={styles.modalDropdownText}>{newAppointment.status || 'Select Status *'}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {showStatusDropdown && (
                  <View style={styles.modalDropdownMenu}>
                    <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={false}>
                      {['Pending', 'Approved', 'Due', 'Completed', 'Cancelled'].map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={styles.modalDropdownOption}
                          onPress={() => {
                            setNewAppointment({...newAppointment, status: status});
                            setShowStatusDropdown(false);
                          }}
                        >
                          <Text style={styles.modalDropdownOptionText}>{status}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddAppointment}>
                <Text style={styles.saveButtonText}>Add Appointment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {showFilterDropdown && (
        <Modal visible={true} transparent animationType="none">
          <TouchableOpacity style={styles.filterModalOverlay} onPress={() => setShowFilterDropdown(false)}>
            <View style={styles.filterDropdownMenu}>
              <View style={styles.filterHeader}>
                <Text style={styles.filterHeaderText}>Calendar Filter</Text>
              </View>
              <ScrollView style={styles.filterScrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Year</Text>
                  <View style={styles.yearGrid}>
                    {Array.from({length: 6}, (_, i) => 2023 + i).map((year) => (
                      <TouchableOpacity key={year} style={[styles.yearOption, selectedYear === year && styles.selectedYearOption]} onPress={() => { setSelectedYear(year); setShowFilterDropdown(false); }}>
                        <Text style={[styles.yearOptionText, selectedYear === year && styles.selectedYearText]}>{year}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Month</Text>
                  <View style={styles.monthGrid}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                      <TouchableOpacity key={month} style={[styles.monthOption, selectedMonth === index && styles.selectedMonthOption]} onPress={() => { setSelectedMonth(index); setShowFilterDropdown(false); }}>
                        <Text style={[styles.monthOptionText, selectedMonth === index && styles.selectedMonthText]}>{month}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
      
      {showEditDrawer && (
        <Modal visible={true} transparent animationType="none">
          <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={() => {
            Animated.timing(drawerAnimation, {
              toValue: -350,
              duration: 300,
              useNativeDriver: false,
            }).start(() => setShowEditDrawer(false));
          }}>
            <TouchableOpacity activeOpacity={1}>
              <Animated.View style={[styles.drawer, { left: drawerAnimation }]}>
                <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Edit Appointment</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(drawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowEditDrawer(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm} onTouchStart={() => {
                setShowEditCustomerDropdown(false);
                setShowEditPetDropdown(false);
                setShowEditStaffDropdown(false);
                setShowEditStatusDropdown(false);
              }}>
                <Text style={styles.fieldLabel}>Customer *</Text>
                <View style={styles.editCustomerDropdownContainer}>
                  <TouchableOpacity style={styles.modalDropdown} onPress={() => {
                    setShowEditPetDropdown(false);
                    setShowEditStaffDropdown(false);
                    setShowEditStatusDropdown(false);
                    setShowEditCustomerDropdown(!showEditCustomerDropdown);
                  }}>
                    <Text style={styles.modalDropdownText}>{editAppointment.customer || 'Select Customer'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showEditCustomerDropdown && (
                    <View style={styles.modalDropdownMenu}>
                      <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={false}>
                        {customers.map((customer) => (
                          <TouchableOpacity
                            key={customer.id}
                            style={styles.modalDropdownOption}
                            onPress={() => {
                              setEditAppointment({...editAppointment, customer: customer.name, pet: ''});
                              setEditSelectedCustomer(customer);
                              setShowEditCustomerDropdown(false);
                            }}
                          >
                            <Text style={styles.modalDropdownOptionText}>{customer.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Pet *</Text>
                <View style={styles.editPetDropdownContainer}>
                  <TouchableOpacity 
                    style={[styles.modalDropdown, !editSelectedCustomer && styles.disabledDropdown]} 
                    onPress={() => {
                      if (editSelectedCustomer) {
                        setShowEditCustomerDropdown(false);
                        setShowEditStaffDropdown(false);
                        setShowEditStatusDropdown(false);
                        setShowEditPetDropdown(!showEditPetDropdown);
                      }
                    }}
                    disabled={!editSelectedCustomer}
                  >
                    <Text style={styles.modalDropdownText}>{editAppointment.pet || 'Select Pet'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showEditPetDropdown && editSelectedCustomer && (
                    <View style={styles.modalDropdownMenu}>
                      <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={false}>
                        {(customerPets[editSelectedCustomer.name] || []).map((pet) => (
                          <TouchableOpacity
                            key={pet.id}
                            style={styles.modalDropdownOption}
                            onPress={() => {
                              setEditAppointment({...editAppointment, pet: pet.name});
                              setShowEditPetDropdown(false);
                            }}
                          >
                            <Text style={styles.modalDropdownOptionText} numberOfLines={1} ellipsizeMode="tail">{pet.name} ({pet.type})</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Service *</Text>
                <View style={styles.editServiceDropdownContainer}>
                  <TouchableOpacity style={styles.modalDropdown} onPress={() => {
                    setShowEditCustomerDropdown(false);
                    setShowEditPetDropdown(false);
                    setShowEditStaffDropdown(false);
                    setShowEditStatusDropdown(false);
                    setShowEditServiceDropdown(!showEditServiceDropdown);
                  }}>
                    <Text style={styles.modalDropdownText}>{editAppointment.service || 'Select Service'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showEditServiceDropdown && (
                    <View style={styles.modalDropdownMenu}>
                      <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={false}>
                        {services.map((service) => (
                          <TouchableOpacity
                            key={service}
                            style={styles.modalDropdownOption}
                            onPress={() => {
                              setEditAppointment({...editAppointment, service: service});
                              setShowEditServiceDropdown(false);
                            }}
                          >
                            <Text style={styles.modalDropdownOptionText}>{service}</Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.addServiceOption} onPress={() => {
                          setShowEditServiceDropdown(false);
                          setShowAddServiceModal(true);
                        }}>
                          <Text style={styles.addServiceText}>+ Add New Service</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Veterinarian *</Text>
                <View style={styles.editStaffDropdownContainer}>
                  <TouchableOpacity style={styles.modalDropdown} onPress={() => {
                    setShowEditCustomerDropdown(false);
                    setShowEditPetDropdown(false);
                    setShowEditStatusDropdown(false);
                    setShowEditStaffDropdown(!showEditStaffDropdown);
                  }}>
                    <Text style={styles.modalDropdownText}>{editAppointment.staff || 'Select Veterinarian'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showEditStaffDropdown && (
                    <View style={styles.modalDropdownMenu}>
                      <ScrollView style={styles.dropdownScrollView} showsVerticalScrollIndicator={false}>
                        {veterinarians.map((vet, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.modalDropdownOption}
                            onPress={() => {
                              setEditAppointment({...editAppointment, staff: vet});
                              setShowEditStaffDropdown(false);
                            }}
                          >
                            <Text style={styles.modalDropdownOptionText}>{vet}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Date & Time *</Text>
                <View style={styles.inputRow}>
                  <TouchableOpacity style={[styles.modalInput, styles.halfInput, styles.datePickerButton]} onPress={() => {
                    setShowEditCustomerDropdown(false);
                    setShowEditPetDropdown(false);
                    setShowEditStaffDropdown(false);
                    setShowEditStatusDropdown(false);
                    setShowDatePicker(true);
                  }}>
                    <Text style={styles.datePickerText}>{editAppointment.date || 'Select Date'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalInput, styles.halfInput, styles.datePickerButton]} onPress={() => {
                    setShowEditCustomerDropdown(false);
                    setShowEditPetDropdown(false);
                    setShowEditStaffDropdown(false);
                    setShowEditStatusDropdown(false);
                    setShowTimePicker(true);
                  }}>
                    <Text style={styles.datePickerText}>{editAppointment.time || 'Select Time'}</Text>
                  </TouchableOpacity>
                </View>
                

              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  Animated.timing(drawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowEditDrawer(false));
                }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={async () => {
                  try {
                    const updateData = {
                      customerName: editAppointment.customer,
                      petName: editAppointment.pet,
                      service: editAppointment.service,
                      veterinarian: editAppointment.staff,
                      dateTime: `${editAppointment.date}\n${editAppointment.time}`
                    };
                    
                    await updateAppointment(selectedAppointment.id, updateData, userEmail);
                    
                    const updatedAppointment = {
                      ...selectedAppointment,
                      ...updateData,
                      name: editAppointment.customer,
                      staff: editAppointment.staff
                    };
                    
                    const updatedList = appointmentList.map(appointment => 
                      appointment.id === selectedAppointment.id ? updatedAppointment : appointment
                    );
                    setAppointmentList(updatedList);
                    setSelectedAppointment(updatedAppointment);
                    
                    Animated.timing(drawerAnimation, {
                      toValue: -350,
                      duration: 300,
                      useNativeDriver: false,
                    }).start(() => setShowEditDrawer(false));
                  } catch (error) {
                    console.error('Error updating appointment:', error);
                    alert('Error updating appointment');
                  }
                }}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
              </Animated.View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
      
      {showDatePicker && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContent}>
              <View style={styles.newCalendarHeader}>
                <TouchableOpacity style={styles.newBackBtn} onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.newBackBtnText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.newCalendarTitle}>Select Date - {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} {selectedYear}</Text>
              </View>
              <View style={styles.newCalendarContent}>
                <View style={styles.newWeekHeader}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Text key={day} style={styles.newWeekDay}>{day}</Text>
                  ))}
                </View>
                <View style={styles.newDaysGrid}>
                  {(() => {
                    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
                    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                    const daysInPrevMonth = new Date(selectedYear, selectedMonth, 0).getDate();
                    const totalCells = 42;
                    const calendarDays = [];
                    
                    for (let i = firstDay - 1; i >= 0; i--) {
                      const day = daysInPrevMonth - i;
                      calendarDays.push({ day, isCurrentMonth: false });
                    }
                    
                    for (let day = 1; day <= daysInMonth; day++) {
                      calendarDays.push({ day, isCurrentMonth: true });
                    }
                    
                    const remainingCells = totalCells - calendarDays.length;
                    for (let day = 1; day <= remainingCells; day++) {
                      calendarDays.push({ day, isCurrentMonth: false });
                    }
                    
                    return calendarDays.map((dayObj, index) => {
                      const { day, isCurrentMonth } = dayObj;
                      const today = new Date();
                      const isToday = isCurrentMonth && day === today.getDate() && selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
                      
                      return (
                        <TouchableOpacity key={index} style={[styles.newDayBox, isToday && styles.todayBox, !isCurrentMonth && styles.otherMonthBox]} onPress={() => {
                          if (isCurrentMonth) {
                            const today = new Date();
                            const selectedDate = new Date(selectedYear, selectedMonth, day);
                            const diffTime = selectedDate - today;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            let dateString;
                            if (diffDays === 0) {
                              dateString = 'Today';
                            } else if (diffDays === 1) {
                              dateString = 'Tomorrow';
                            } else if (diffDays === -1) {
                              dateString = 'Yesterday';
                            } else if (diffDays > 1 && diffDays <= 7) {
                              dateString = `${diffDays} days from now`;
                            } else if (diffDays < -1 && diffDays >= -7) {
                              dateString = `${Math.abs(diffDays)} days ago`;
                            } else if (diffDays > 7 && diffDays <= 30) {
                              const weeks = Math.floor(diffDays / 7);
                              dateString = weeks === 1 ? '1 week from now' : `${weeks} weeks from now`;
                            } else if (diffDays < -7 && diffDays >= -30) {
                              const weeks = Math.floor(Math.abs(diffDays) / 7);
                              dateString = weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
                            } else {
                              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                              dateString = `${monthNames[selectedMonth]} ${day}`;
                            }
                            
                            setEditAppointment({...editAppointment, date: dateString});
                            setShowDatePicker(false);
                          }
                        }}>
                          <Text style={[styles.newDayText, isToday && styles.todayText, !isCurrentMonth && styles.otherMonthText]}>{day}</Text>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
      
      {showTimePicker && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.timePickerOverlay}>
            <View style={styles.timePickerContent}>
              <View style={styles.timePickerHeader}>
                <Text style={styles.timePickerTitle}>Select Time</Text>
                <TouchableOpacity style={styles.timePickerClose} onPress={() => setShowTimePicker(false)}>
                  <Image source={require('@/assets/exit button.png')} style={styles.timePickerCloseIcon} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.timeSlots}>
                {Array.from({length: 24}, (_, i) => {
                  const times = [];
                  for (let j = 0; j < 60; j += 30) {
                    const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
                    const period = i < 12 ? 'AM' : 'PM';
                    const minute = j === 0 ? '00' : '30';
                    const timeString = `${hour}:${minute} ${period}`;
                    times.push(timeString);
                  }
                  return times;
                }).flat().map((time) => (
                  <TouchableOpacity key={time} style={styles.timeSlot} onPress={() => {
                    setEditAppointment({...editAppointment, time: time});
                    setShowTimePicker(false);
                  }}>
                    <Text style={styles.timeSlotText}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      
      {showAddDatePicker && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContent}>
              <View style={styles.newCalendarHeader}>
                <TouchableOpacity style={styles.newBackBtn} onPress={() => setShowAddDatePicker(false)}>
                  <Text style={styles.newBackBtnText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.newCalendarTitle}>Select Date - {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} {selectedYear}</Text>
              </View>
              <View style={styles.newCalendarContent}>
                <View style={styles.newWeekHeader}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Text key={day} style={styles.newWeekDay}>{day}</Text>
                  ))}
                </View>
                <View style={styles.newDaysGrid}>
                  {(() => {
                    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
                    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                    const daysInPrevMonth = new Date(selectedYear, selectedMonth, 0).getDate();
                    const totalCells = 42;
                    const calendarDays = [];
                    
                    for (let i = firstDay - 1; i >= 0; i--) {
                      const day = daysInPrevMonth - i;
                      calendarDays.push({ day, isCurrentMonth: false });
                    }
                    
                    for (let day = 1; day <= daysInMonth; day++) {
                      calendarDays.push({ day, isCurrentMonth: true });
                    }
                    
                    const remainingCells = totalCells - calendarDays.length;
                    for (let day = 1; day <= remainingCells; day++) {
                      calendarDays.push({ day, isCurrentMonth: false });
                    }
                    
                    return calendarDays.map((dayObj, index) => {
                      const { day, isCurrentMonth } = dayObj;
                      const today = new Date();
                      const isToday = isCurrentMonth && day === today.getDate() && selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
                      
                      return (
                        <TouchableOpacity key={index} style={[styles.newDayBox, isToday && styles.todayBox, !isCurrentMonth && styles.otherMonthBox]} onPress={() => {
                          if (isCurrentMonth) {
                            const today = new Date();
                            const selectedDate = new Date(selectedYear, selectedMonth, day);
                            const diffTime = selectedDate - today;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            let dateString;
                            if (diffDays === 0) {
                              dateString = 'Today';
                            } else if (diffDays === 1) {
                              dateString = 'Tomorrow';
                            } else if (diffDays === -1) {
                              dateString = 'Yesterday';
                            } else if (diffDays > 1 && diffDays <= 7) {
                              dateString = `${diffDays} days from now`;
                            } else if (diffDays < -1 && diffDays >= -7) {
                              dateString = `${Math.abs(diffDays)} days ago`;
                            } else if (diffDays > 7 && diffDays <= 30) {
                              const weeks = Math.floor(diffDays / 7);
                              dateString = weeks === 1 ? '1 week from now' : `${weeks} weeks from now`;
                            } else if (diffDays < -7 && diffDays >= -30) {
                              const weeks = Math.floor(Math.abs(diffDays) / 7);
                              dateString = weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
                            } else {
                              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                              dateString = `${monthNames[selectedMonth]} ${day}`;
                            }
                            
                            setNewAppointment({...newAppointment, date: dateString});
                            setShowAddDatePicker(false);
                          }
                        }}>
                          <Text style={[styles.newDayText, isToday && styles.todayText, !isCurrentMonth && styles.otherMonthText]}>{day}</Text>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
      
      {showAddTimePicker && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.timePickerOverlay}>
            <View style={styles.timePickerContent}>
              <View style={styles.timePickerHeader}>
                <Text style={styles.timePickerTitle}>Select Time</Text>
                <TouchableOpacity style={styles.timePickerClose} onPress={() => setShowAddTimePicker(false)}>
                  <Image source={require('@/assets/exit button.png')} style={styles.timePickerCloseIcon} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.timeSlots}>
                {Array.from({length: 24}, (_, i) => {
                  const times = [];
                  for (let j = 0; j < 60; j += 30) {
                    const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
                    const period = i < 12 ? 'AM' : 'PM';
                    const minute = j === 0 ? '00' : '30';
                    const timeString = `${hour}:${minute} ${period}`;
                    times.push(timeString);
                  }
                  return times;
                }).flat().map((time) => (
                  <TouchableOpacity key={time} style={styles.timeSlot} onPress={() => {
                    setNewAppointment({...newAppointment, time: time});
                    setShowAddTimePicker(false);
                  }}>
                    <Text style={styles.timeSlotText}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      
      {showAddServiceModal && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.modalOverlay}>
            <View style={styles.addServiceModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Service</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setShowAddServiceModal(false)}>
                  <Image source={require('@/assets/exit button.png')} style={styles.closeButtonIcon} />
                </TouchableOpacity>
              </View>
              <View style={styles.addServiceForm}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Service Name *"
                  placeholderTextColor="#666"
                  value={newService}
                  onChangeText={setNewService}
                />
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  setNewService('');
                  setShowAddServiceModal(false);
                }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={() => {
                  if (newService.trim()) {
                    setServices([...services, newService.trim()]);
                    setNewService('');
                    setShowAddServiceModal(false);
                  }
                }}>
                  <Text style={styles.saveButtonText}>Add Service</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      
      {showAddRecordDrawer && (
        <Modal visible={true} transparent animationType="none">
          <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={() => {
            Animated.timing(addRecordDrawerAnimation, {
              toValue: -350,
              duration: 300,
              useNativeDriver: false,
            }).start(() => setShowAddRecordDrawer(false));
          }}>
            <TouchableOpacity activeOpacity={1}>
              <Animated.View style={[styles.drawer, { left: addRecordDrawerAnimation }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add Medical Record</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(addRecordDrawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowAddRecordDrawer(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm} showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Category *</Text>
                <View style={styles.categoryDropdownContainer}>
                  <TouchableOpacity style={styles.drawerDropdown} onPress={() => setShowRecordCategoryDropdown(!showRecordCategoryDropdown)}>
                    <Text style={styles.drawerDropdownText}>{newMedicalRecord.category || 'Select Category'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showRecordCategoryDropdown && (
                    <View style={styles.categoryDropdownMenu}>
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                        {medicalCategories.map((category) => (
                          <TouchableOpacity
                            key={category.id}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewMedicalRecord({...newMedicalRecord, category: category.name, formTemplate: ''});
                              setShowRecordCategoryDropdown(false);
                              setShowRecordFormDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{category.name}</Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                          style={styles.dropdownOption}
                          onPress={() => {
                            setNewMedicalRecord({...newMedicalRecord, category: 'No Category', formTemplate: ''});
                            setShowRecordCategoryDropdown(false);
                            setShowRecordFormDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>No Category</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Form Template *</Text>
                <View style={styles.formDropdownContainer}>
                  <TouchableOpacity 
                    style={[styles.drawerDropdown, !newMedicalRecord.category && styles.disabledDropdown]} 
                    onPress={() => newMedicalRecord.category && setShowRecordFormDropdown(!showRecordFormDropdown)}
                  >
                    <Text style={styles.drawerDropdownText}>{newMedicalRecord.formTemplate || 'Select Form Template'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showRecordFormDropdown && newMedicalRecord.category && (
                    <View style={styles.formDropdownMenu}>
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                        {(() => {
                          const filteredForms = medicalForms.filter(form => {
                            if (newMedicalRecord.category === 'No Category') {
                              return !form.category || form.category === '' || form.category === null || form.category === 'No Category';
                            }
                            return form.category === newMedicalRecord.category ||
                                   form.categoryName === newMedicalRecord.category ||
                                   (form.category && form.category.name === newMedicalRecord.category);
                          });
                          
                          if (filteredForms.length === 0) {
                            return (
                              <TouchableOpacity style={styles.dropdownOption}>
                                <Text style={styles.dropdownOptionText}>No forms for this category</Text>
                              </TouchableOpacity>
                            );
                          }
                          
                          return filteredForms.map((form) => (
                            <TouchableOpacity
                              key={form.id}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setNewMedicalRecord({...newMedicalRecord, formTemplate: form.name || form.formName});
                                setShowRecordFormDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{form.name || form.formName}</Text>
                            </TouchableOpacity>
                          ));
                        })()}
                      </ScrollView>
                    </View>
                  )}
                </View>
                

              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  Animated.timing(addRecordDrawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowAddRecordDrawer(false));
                }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, (!newMedicalRecord.category || !newMedicalRecord.formTemplate) && styles.disabledButton]} 
                  onPress={async () => {
                    if (newMedicalRecord.category && newMedicalRecord.formTemplate) {
                      try {
                        const formFields = await getFormFields(newMedicalRecord.formTemplate, userEmail);
                        
                        // Pre-fill form with pet and owner data
                        const initialFormData = {};
                        const pet = Object.values(customerPets).flat().find(p => {
                          const appointmentPetName = selectedAppointment?.petName?.split(' (')[0] || selectedAppointment?.petName;
                          return p.name === appointmentPetName;
                        });
                        const customer = customers.find(c => c.name === selectedAppointment?.customerName || c.name === selectedAppointment?.name);
                        if (pet && customer) {
                          // Find pet name field and pre-fill
                          const petNameField = formFields.find(f => f.label?.toLowerCase().includes('pet name') || f.label?.toLowerCase().includes('name'));
                          if (petNameField) initialFormData[petNameField.id] = pet.name;
                          
                          // Find owner name field and pre-fill
                          const ownerNameField = formFields.find(f => f.label?.toLowerCase().includes('owner'));
                          if (ownerNameField) initialFormData[ownerNameField.id] = customer.name;
                          

                        }
                        
                        setFormFieldValues(initialFormData);
                        setSelectedMedicalForm({
                          formTemplate: newMedicalRecord.formTemplate,
                          fields: formFields
                        });
                        setNewMedicalRecord({ category: '', formTemplate: '' });
                        Animated.timing(addRecordDrawerAnimation, {
                          toValue: -350,
                          duration: 300,
                          useNativeDriver: false,
                        }).start(() => setShowAddRecordDrawer(false));
                      } catch (error) {
                        console.error('Error fetching form fields:', error);
                        alert('Error loading form fields');
                      }
                    }
                  }}
                >
                  <Text style={styles.saveButtonText}>Open Form</Text>
                </TouchableOpacity>
              </View>
              </Animated.View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
      
      {selectedMedicalForm && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedMedicalForm.formTemplate}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedMedicalForm(null)}>
                  <Image source={require('@/assets/exit button.png')} style={styles.closeButtonIcon} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalForm}>
                <View style={styles.formPreviewFieldsContainer}>
                  {selectedMedicalForm.fields.map((field) => (
                    <View key={field.id} style={styles.formPreviewField}>
                      <Text style={styles.formPreviewFieldLabel}>
                        {field.label}{field.required && ' *'}
                      </Text>
                      {field.type === 'text' && (
                        <TextInput
                          style={styles.formPreviewFieldInput}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          placeholderTextColor="#ccc"
                          value={formFieldValues[field.id] || ''}
                          onChangeText={(text) => setFormFieldValues({...formFieldValues, [field.id]: text})}
                        />
                      )}
                      {field.type === 'number' && (
                        <TextInput
                          style={styles.formPreviewFieldInput}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          placeholderTextColor="#ccc"
                          value={formFieldValues[field.id] || ''}
                          keyboardType="numeric"
                          onChangeText={(text) => setFormFieldValues({...formFieldValues, [field.id]: text})}
                        />
                      )}
                      {field.type === 'veterinarian_dropdown' && (
                        <View style={styles.previewDropdownContainer}>
                          <TouchableOpacity 
                            style={styles.formPreviewFieldDropdown}
                            onPress={() => setShowRecordVetDropdown(!showRecordVetDropdown)}
                          >
                            <Text style={styles.formPreviewFieldDropdownText}>
                              {formFieldValues[field.id] || 'Select Veterinarian'}
                            </Text>
                            <Text style={styles.dropdownArrow}>▼</Text>
                          </TouchableOpacity>
                          {showRecordVetDropdown && (
                            <View style={styles.previewDropdownMenu}>
                              <ScrollView style={styles.previewDropdownScroll} showsVerticalScrollIndicator={false}>
                                {veterinarians.map((vet, index) => (
                                  <TouchableOpacity
                                    key={index}
                                    style={styles.dropdownOption}
                                    onPress={() => {
                                      setFormFieldValues({...formFieldValues, [field.id]: vet});
                                      setShowRecordVetDropdown(false);
                                    }}
                                  >
                                    <Text style={styles.dropdownOptionText}>{vet}</Text>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>
                          )}
                        </View>
                      )}
                      {field.type === 'date' && (
                        <TouchableOpacity style={styles.formPreviewFieldDatePicker} onPress={() => {
                          setShowRecordDatePicker(true);
                        }}>
                          <Text style={styles.formPreviewFieldDateText}>{formFieldValues[field.id] || 'Select Date'}</Text>
                          <Text style={styles.dropdownArrow}>📅</Text>
                        </TouchableOpacity>
                      )}
                      {field.type === 'dropdown' && (
                        <View style={styles.previewDropdownContainer}>
                          <TouchableOpacity 
                            style={styles.formPreviewFieldDropdown}
                            onPress={() => setShowRecordVetDropdown(!showRecordVetDropdown)}
                          >
                            <Text style={styles.formPreviewFieldDropdownText}>
                              {formFieldValues[field.id] || 'Select Option'}
                            </Text>
                            <Text style={styles.dropdownArrow}>▼</Text>
                          </TouchableOpacity>
                          {showRecordVetDropdown && (
                            <View style={styles.previewDropdownMenu}>
                              <ScrollView style={styles.previewDropdownScroll} showsVerticalScrollIndicator={false}>
                                {(field.options || []).map((option, index) => (
                                  <TouchableOpacity
                                    key={index}
                                    style={styles.dropdownOption}
                                    onPress={() => {
                                      setFormFieldValues({...formFieldValues, [field.id]: option});
                                      setShowRecordVetDropdown(false);
                                    }}
                                  >
                                    <Text style={styles.dropdownOptionText}>{option}</Text>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedMedicalForm(null)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={() => {
                  const requiredFields = selectedMedicalForm.fields.filter(f => f.required);
                  const missingFields = requiredFields.filter(f => !formFieldValues[f.id]);
                  
                  if (missingFields.length === 0) {
                    const pet = Object.values(customerPets).flat().find(p => p.name === selectedAppointment?.petName);
                    const petId = pet?.id;
                    
                    if (petId) {
                      const recordData = {
                        petId: petId,
                        formType: selectedMedicalForm.formTemplate,
                        ...formFieldValues
                      };
                      
                      addMedicalRecord(recordData, userEmail).then(savedRecord => {
                        setPetMedicalHistory(prev => ({
                          ...prev,
                          [petId]: [...(prev[petId] || []), savedRecord]
                        }));
                        alert('Medical record added successfully!');
                        setSelectedMedicalForm(null);
                        setFormFieldValues({});
                      }).catch(error => {
                        alert('Error adding medical record');
                      });
                    } else {
                      alert('Pet not found');
                    }
                  } else {
                    alert('Please fill in all required fields');
                  }
                }}>
                  <Text style={styles.saveButtonText}>Save Record</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      
      {showRecordDatePicker && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContent}>
              <View style={styles.newCalendarHeader}>
                <TouchableOpacity style={styles.newBackBtn} onPress={() => setShowRecordDatePicker(false)}>
                  <Text style={styles.newBackBtnText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.newCalendarTitle}>Select Date - {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} {selectedYear}</Text>
              </View>
              <View style={styles.newCalendarContent}>
                <View style={styles.newWeekHeader}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Text key={day} style={styles.newWeekDay}>{day}</Text>
                  ))}
                </View>
                <View style={styles.newDaysGrid}>
                  {(() => {
                    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
                    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                    const daysInPrevMonth = new Date(selectedYear, selectedMonth, 0).getDate();
                    const totalCells = 42;
                    const calendarDays = [];
                    
                    for (let i = firstDay - 1; i >= 0; i--) {
                      const day = daysInPrevMonth - i;
                      calendarDays.push({ day, isCurrentMonth: false });
                    }
                    
                    for (let day = 1; day <= daysInMonth; day++) {
                      calendarDays.push({ day, isCurrentMonth: true });
                    }
                    
                    const remainingCells = totalCells - calendarDays.length;
                    for (let day = 1; day <= remainingCells; day++) {
                      calendarDays.push({ day, isCurrentMonth: false });
                    }
                    
                    return calendarDays.map((dayObj, index) => {
                      const { day, isCurrentMonth } = dayObj;
                      const today = new Date();
                      const isToday = isCurrentMonth && day === today.getDate() && selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
                      
                      return (
                        <TouchableOpacity key={index} style={[styles.newDayBox, isToday && styles.todayBox, !isCurrentMonth && styles.otherMonthBox]} onPress={() => {
                          if (isCurrentMonth) {
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const dateString = `${monthNames[selectedMonth]} ${day}, ${selectedYear}`;
                            if (selectedMedicalForm) {
                              const dateField = selectedMedicalForm.fields.find(f => f.label.toLowerCase().includes('date'));
                              if (dateField) {
                                setFormFieldValues({...formFieldValues, [dateField.id]: dateString});
                              }
                            } else {
                              setNewMedicalRecord({...newMedicalRecord, date: dateString});
                            }
                            setShowRecordDatePicker(false);
                          }
                        }}>
                          <Text style={[styles.newDayText, isToday && styles.todayText, !isCurrentMonth && styles.otherMonthText]}>{day}</Text>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  header: {
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 20,
    marginTop: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
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
  appointmentAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23C062',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  appointmentAddButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  appointmentSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  appointmentSearchInput: {
    width: 150,
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 20,
    overflow: 'visible',
  },
  tableContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  table: {
    backgroundColor: '#fff',
    minHeight: 400,
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
  headerCellId: {
    width: 50,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  headerCellPet: {
    width: 120,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  headerCellService: {
    width: 100,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  headerCellVet: {
    width: 120,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  headerCellSchedule: {
    width: 100,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  headerCellName: {
    flex: 2,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  headerCellActions: {
    flex: 2,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  cellId: {
    width: 50,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
  },
  cell: {
    flex: 1,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
  },
  cellPet: {
    width: 120,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
  },
  cellService: {
    width: 100,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
  },
  cellVet: {
    width: 120,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
  },
  cellSchedule: {
    width: 100,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
  },
  cellName: {
    flex: 2,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
  },
  actionsCell: {
    flex: 2,
    paddingRight: 10,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#23C062',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    color: '#23C062',
    fontSize: 11,
    fontWeight: '600',
  },
  cancelActionButton: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  cancelActionButtonText: {
    color: '#dc3545',
  },
  doneActionButton: {
    borderColor: '#28a745',
    backgroundColor: '#f0f9f0',
  },
  doneActionButtonText: {
    color: '#28a745',
  },
  viewActionButton: {
    borderColor: '#007bff',
    backgroundColor: '#f0f8ff',
  },
  viewActionButtonText: {
    color: '#007bff',
  },
  rescheduleActionButton: {
    borderColor: '#fd7e14',
    backgroundColor: '#fff8f0',
  },
  rescheduleActionButtonText: {
    color: '#fd7e14',
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
  dropdownContainer: {
    position: 'relative',
    zIndex: 100,
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
  dropdownText: {
    fontSize: 10,
    marginRight: 2,
  },
  dropdownArrow: {
    fontSize: 8,
    color: '#666',
    fontWeight: 'bold',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 0,
    left: 40,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    zIndex: 101,
    minWidth: 35,
    elevation: 5,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 12,
    textAlign: 'left',
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
  tableBody: {
    height: 330,
    overflow: 'visible',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 250,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '70%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#800000',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: '#800000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonIcon: {
    width: 16,
    height: 16,
    tintColor: '#ffffff',
  },
  modalForm: {
    padding: 20,
    maxHeight: 300,
  },
  formPreviewFieldsContainer: {
    gap: 15,
  },
  formPreviewField: {
    marginBottom: 15,
    zIndex: -1,
  },
  formPreviewFieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formPreviewFieldInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    backgroundColor: '#fafafa',
    maxWidth: 200,
  },
  formPreviewFieldDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    maxWidth: 200,
  },
  formPreviewFieldDropdownText: {
    fontSize: 12,
    color: '#666',
  },
  formPreviewFieldDatePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    maxWidth: 200,
  },
  formPreviewFieldDateText: {
    fontSize: 12,
    color: '#666',
  },
  previewDropdownContainer: {
    position: 'relative',
    zIndex: 1000000,
  },
  previewDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 1000000,
    elevation: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    maxHeight: 200,
    maxWidth: 200,
  },
  previewDropdownScroll: {
    maxHeight: 200,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 12,
    backgroundColor: '#fafafa',
  },
  drawerInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    backgroundColor: '#fafafa',
  },
  halfInput: {
    width: '48%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: '#23C062',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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
  subHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  downloadButton: {
    backgroundColor: '#007BFF',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
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
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  returnButton: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 15,
  },
  returnButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
  },
  calendarScrollView: {
    height: 380,
    padding: 20,
    overflow: 'visible',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: 10,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  appointmentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#23C062',
  },
  appointmentTime: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: 3,
  },
  appointmentName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  appointmentPet: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  appointmentService: {
    fontSize: 10,
    color: '#007BFF',
    fontStyle: 'italic',
  },
  calendarButton: {
    backgroundColor: '#007BFF',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  calendarButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  vetCalendarButton: {
    backgroundColor: '#28a745',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  vetCalendarButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  customerDropdownContainer: {
    position: 'relative',
    zIndex: 3001,
    marginBottom: 15,
  },
  petDropdownContainer: {
    position: 'relative',
    zIndex: 2001,
    marginBottom: 15,
  },
  modalDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
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
    fontSize: 12,
    color: '#333',
  },
  disabledDropdown: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  modalDropdownText: {
    fontSize: 12,
    color: '#333',
  },
  modalDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 1000,
    elevation: 15,
    maxHeight: 150,
  },
  modalDropdownOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalDropdownOptionText: {
    fontSize: 12,
    color: '#333',
  },
  calendarModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '85%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  calendarHeader: {
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  calendarHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
  },
  calendarContent: {
    flex: 1,
    padding: 20,
  },
  monthHeader: {
    fontSize: 26,
    fontWeight: '700',
    color: '#800000',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 6,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#800000',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 45,
    borderWidth: 0.5,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dayWithAppointments: {
    backgroundColor: '#e8f5e8',
    borderColor: '#23C062',
  },
  dayNumber: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  appointmentDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#23C062',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  appointmentCount: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  dayViewScrollView: {
    flex: 1,
    padding: 20,
  },
  dayViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 15,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dayViewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
  },
  hourlySchedule: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
  },
  hourSlot: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 50,
  },
  hourLabel: {
    width: 90,
    fontSize: 14,
    color: '#800000',
    fontWeight: '600',
    paddingVertical: 12,
    paddingRight: 15,
    textAlign: 'right',
  },
  hourContent: {
    flex: 1,
    paddingVertical: 8,
    paddingLeft: 15,
    justifyContent: 'center',
  },
  hourAppointment: {
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#23C062',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  hourAppointmentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  hourAppointmentDetails: {
    fontSize: 12,
    color: '#666',
  },
  filterContainer: {
    position: 'relative',
    zIndex: 99999,
  },
  filterIcon: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterIconText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#800000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOptionText: {
    color: '#800000',
    fontWeight: 'bold',
  },
  filterDropdownMenu: {
    position: 'absolute',
    top: 40,
    right: -20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    minWidth: 180,
    elevation: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 100000,
    maxHeight: 300,
  },
  filterDropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterDropdownOptionText: {
    fontSize: 11,
    color: '#333',
    textAlign: 'left',
  },

  // New Calendar Styles
  newCalendarContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    height: 450,
    overflow: 'visible',
    zIndex: -1,
  },
  newCalendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  newBackBtn: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  newBackBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  newCalendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#800000',
    flex: 1,
    textAlign: 'center',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 20,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#800000',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  filterDropdownText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
    flex: 1,
  },
  filterDropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 220,
    maxHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 50,
  },
  filterHeader: {
    backgroundColor: '#800000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  filterHeaderText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  filterScrollView: {
    maxHeight: 200,
  },
  filterSection: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: 8,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  yearOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  selectedYearOption: {
    backgroundColor: '#800000',
  },
  yearOptionText: {
    fontSize: 11,
    color: '#495057',
    fontWeight: '500',
  },
  selectedYearText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  monthOption: {
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  selectedMonthOption: {
    backgroundColor: '#800000',
  },
  monthOptionText: {
    fontSize: 10,
    color: '#495057',
    fontWeight: '500',
  },
  selectedMonthText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  newCalendarContent: {
    flex: 1,
    padding: 15,
    zIndex: -1,
  },
  newWeekHeader: {
    flexDirection: 'row',
    marginBottom: 0,
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
  },
  newWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#800000',
  },
  newDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  newDayBox: {
    width: '14.28%',
    height: 40,
    borderWidth: 0.5,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  newDayWithAppt: {
    backgroundColor: '#e8f5e8',
  },
  newDayText: {
    fontSize: 14,
    color: '#333',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    gap: 15,
  },
  vetFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
    zIndex: 1000,
    marginLeft: 'auto',
  },
  vetFilterLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#800000',
  },
  vetFilterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 120,
  },
  vetFilterText: {
    fontSize: 11,
    color: '#333',
    flex: 1,
  },
  vetFilterMenu: {
    position: 'absolute',
    top: 30,
    left: 80,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    zIndex: 1001,
    elevation: 10,
    maxHeight: 150,
    minWidth: 120,
  },
  vetFilterScrollView: {
    maxHeight: 140,
  },
  vetFilterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  vetFilterOptionText: {
    fontSize: 11,
    color: '#333',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeLegendItem: {
    backgroundColor: '#800000',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  activeLegendText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  detailTable: {
    backgroundColor: '#fff',
    minHeight: 'auto',
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  returnButton: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  returnIcon: {
    width: 16,
    height: 16,
    tintColor: '#ffffff',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
    flex: 1,
  },
  editButton: {
    backgroundColor: '#007BFF',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: '#DC3545',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
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
  drawerCloseIcon: {
    width: 16,
    height: 16,
    tintColor: '#800000',
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
  drawerButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    gap: 10,
  },
  statusIndicators: {
    position: 'absolute',
    top: 2,
    right: 2,
    flexDirection: 'row',
    gap: 1,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  todayBox: {
    backgroundColor: '#800000',
    borderWidth: 2,
    borderColor: '#800000',
  },
  todayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  otherMonthBox: {
    backgroundColor: '#f8f9fa',
    opacity: 0.4,
  },
  otherMonthText: {
    color: '#999',
    opacity: 0.6,
  },
  newDayViewContainer: {
    flex: 1,
    padding: 15,
  },
  newDayViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  newDayViewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#800000',
    marginLeft: 15,
  },
  newScheduleView: {
    flex: 1,
  },
  newTimeSlot: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 40,
  },
  newTimeLabel: {
    width: 70,
    fontSize: 11,
    color: '#800000',
    fontWeight: '600',
    paddingVertical: 10,
    textAlign: 'right',
    paddingRight: 10,
  },
  newApptSlot: {
    flex: 1,
    paddingVertical: 5,
    paddingLeft: 10,
  },
  newApptCard: {
    backgroundColor: '#e8f5e8',
    borderRadius: 4,
    padding: 8,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#23C062',
  },
  newApptName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  newApptDetails: {
    fontSize: 10,
    color: '#666',
  },
  editStatusDropdownContainer: {
    position: 'relative',
    zIndex: 1001,
    marginBottom: 15,
  },
  editCustomerDropdownContainer: {
    position: 'relative',
    zIndex: 3001,
    marginBottom: 15,
  },
  editPetDropdownContainer: {
    position: 'relative',
    zIndex: 2001,
    marginBottom: 15,
  },
  editStaffDropdownContainer: {
    position: 'relative',
    zIndex: 1501,
    marginBottom: 15,
  },
  dropdownScrollView: {
    maxHeight: 120,
  },
  datePickerButton: {
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: 12,
    color: '#333',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 250,
  },
  datePickerContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '70%',
    height: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 250,
  },
  timePickerContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '50%',
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timePickerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#800000',
  },
  timePickerClose: {
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: '#800000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerCloseIcon: {
    width: 16,
    height: 16,
    tintColor: '#ffffff',
  },
  timeSlots: {
    flex: 1,
    padding: 10,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeSlotText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  editServiceDropdownContainer: {
    position: 'relative',
    zIndex: 1751,
    marginBottom: 15,
  },
  addServiceOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  addServiceText: {
    fontSize: 12,
    color: '#007BFF',
    fontWeight: 'bold',
  },
  addServiceModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  addServiceForm: {
    padding: 20,
  },
  disabledDropdown: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  cellId: {
    width: 50,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
  },
  categoryDropdownContainer: {
    position: 'relative',
    zIndex: 3000,
  },
  formDropdownContainer: {
    position: 'relative',
    zIndex: 2000,
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
    zIndex: 3001,
    elevation: 30,
    maxHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 2001,
    elevation: 20,
    maxHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  disabledDropdown: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },

  apptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  statusBadgeText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  newApptStaff: {
    fontSize: 9,
    color: '#007BFF',
    fontStyle: 'italic',
    marginTop: 1,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 300,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  medicalRecordDetails: {
    padding: 20,
  },
  medicalRecordRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  medicalRecordLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  medicalRecordValue: {
    flex: 2,
    fontSize: 14,
    color: '#555',
  },
  formDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#800000',
    marginTop: 20,
    marginBottom: 10,
  },
  petsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#800000',
  },
  petsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  petsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  petsTable: {
    backgroundColor: '#fff',
    height: 300,
  },
  medicalHistoryTable: {
    backgroundColor: '#fff',
    height: 400,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    width: 150,
    fontSize: 12,
    outlineStyle: 'none',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
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

});