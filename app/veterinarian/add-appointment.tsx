import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { addAppointment, getVeterinarians, getCustomers, getPets, getReasonOptions, addReasonOption, updateReasonOption, deleteReasonOption } from '@/lib/services/firebaseService';

export default function AddAppointment() {
  const router = useRouter();
  const { user } = useAuth();

  // Data lists
  const [customers, setCustomers] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [petName, setPetName] = useState('');
  const [veterinarian, setVeterinarian] = useState('');
  const [veterinarianEmail, setVeterinarianEmail] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Dropdown states
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [showAddReasonModal, setShowAddReasonModal] = useState(false);
  const [showEditReasonModal, setShowEditReasonModal] = useState(false);
  const [reasonOptions, setReasonOptions] = useState<any[]>([]);
  const [newReasonText, setNewReasonText] = useState('');
  const [editingReason, setEditingReason] = useState<any>(null);
  
  // Date and time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAMPM, setSelectedAMPM] = useState('AM');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) return;
      
      try {
        // Load customers
        const customersList = await getCustomers(user.email);
        setCustomers(customersList);

        // Load pets
        const petsList = await getPets(user.email);
        setPets(petsList);

        // Load veterinarian name and email
        const vets = await getVeterinarians(user.email);
        const currentVet = vets.find(v => v.email === user.email);
        
        if (currentVet) {
          const vetName = `${currentVet.firstname || ''} ${currentVet.surname || ''}`.trim() || currentVet.name || user.email;
          setVeterinarian(vetName);
          setVeterinarianEmail(user.email); // Store the email for filtering
        } else {
          setVeterinarian(user.name || user.email);
          setVeterinarianEmail(user.email);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setVeterinarian(user.name || user.email);
        setVeterinarianEmail(user.email);
      }
    };

    loadData();
  }, [user]);

  const loadReasonOptions = async () => {
    if (!user?.email) return;
    
    try {
      const reasonsList = await getReasonOptions(user.email);
      setReasonOptions(reasonsList);
    } catch (error) {
      console.error('Failed to load reason options:', error);
    }
  };

  // Load reason options on component mount
  useEffect(() => {
    if (user?.email) {
      loadReasonOptions();
    }
  }, [user]);

  // Customer selection handler
  const selectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    const firstName = customer.firstname || '';
    const lastName = customer.surname || '';
    const fullName = `${firstName} ${lastName}`.trim() || customer.email || 'Unknown Customer';
    
    setCustomerId(customer.id);
    setCustomerName(fullName);
    setCustomerEmail(customer.email || '');
    setPetName(''); // Reset pet selection when customer changes
    setShowCustomerDropdown(false);
  };

  // Pet selection handler
  const selectPet = (pet: any) => {
    setPetName(pet.name);
    setShowPetDropdown(false);
  };

  // Get pets for selected customer
  const getCustomerPets = () => {
    if (!selectedCustomer) return [];
    return pets.filter(pet => pet.ownerId === selectedCustomer.id || pet.owner === selectedCustomer.id);
  };

  // Date and time helper functions
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

  const getHours = () => Array.from({length: 12}, (_, i) => i + 1);
  const getMinutes = () => [0, 10, 20, 30, 40, 50];
  
  const formatSelectedTime = () => {
    const hour24 = selectedAMPM === 'AM' ? 
      (selectedHour === 12 ? 0 : selectedHour) : 
      (selectedHour === 12 ? 12 : selectedHour + 12);
    return `${hour24.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
  };

  const handleAddReason = async () => {
    if (!newReasonText.trim()) {
      Alert.alert('Error', 'Please enter a reason');
      return;
    }

    try {
      await addReasonOption(user?.email, { text: newReasonText.trim() });
      setNewReasonText('');
      setShowAddReasonModal(false);
      await loadReasonOptions();
      Alert.alert('Success', 'Reason added successfully');
    } catch (error) {
      console.error('Failed to add reason:', error);
      Alert.alert('Error', 'Failed to add reason');
    }
  };

  const handleEditReason = async () => {
    if (!newReasonText.trim()) {
      Alert.alert('Error', 'Please enter a reason');
      return;
    }

    try {
      await updateReasonOption(user?.email, editingReason.id, { text: newReasonText.trim() });
      setNewReasonText('');
      setEditingReason(null);
      setShowEditReasonModal(false);
      await loadReasonOptions();
      Alert.alert('Success', 'Reason updated successfully');
    } catch (error) {
      console.error('Failed to edit reason:', error);
      Alert.alert('Error', 'Failed to update reason');
    }
  };

  const handleDeleteReason = async (reasonId: string) => {
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
              await deleteReasonOption(user?.email, reasonId);
              await loadReasonOptions();
              Alert.alert('Success', 'Reason deleted successfully');
            } catch (error) {
              console.error('Failed to delete reason:', error);
              Alert.alert('Error', 'Failed to delete reason');
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!customerName || !petName || !appointmentDate || !appointmentTime || !reason) {
      Alert.alert('Validation', 'Please fill in all required fields (Customer, Pet, Date, Time, Reason)');
      return;
    }

    // Validate appointment date and time is not in the past
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    
    if (appointmentDateTime <= now) {
      Alert.alert(
        'Invalid Date/Time', 
        'Cannot book appointments in the past. Please select a future date and time.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Follow the same structure as admin/client appointments
    const appointmentData = {
      customerId: customerId || '',
      customerName,
      customerEmail,
      petName,
      appointmentDate: new Date(`${appointmentDate}T${appointmentTime}`),
      appointmentTime,
      veterinarian,
      veterinarianEmail,
      reason,
      status: 'scheduled',
      notes,
      createdAt: new Date(),
    };

    try {
      setSubmitting(true);
      await addAppointment(user?.email, appointmentData);
      Alert.alert('Success', 'Appointment created successfully!');
      router.push('/veterinarian/vet-appointments');
    } catch (error) {
      console.error('Add appointment failed:', error);
      Alert.alert('Error', `Failed to add appointment: ${error.message || error}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Appointment</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.close}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.form} 
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        onScroll={() => {
          // Close dropdowns when scrolling
          setShowCustomerDropdown(false);
          setShowPetDropdown(false);
          setShowReasonDropdown(false);
        }}
        scrollEventThrottle={16}
      >
        <Text style={styles.label}>Customer *</Text>
        <View style={styles.customerSelector}>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => {
              setShowCustomerDropdown(!showCustomerDropdown);
              setShowPetDropdown(false); // Close pet dropdown
            }}
          >
            <Text style={styles.selectedCustomer}>
              {customerName || 'Select Customer'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          {showCustomerDropdown && (
            <>
              <TouchableOpacity 
                style={styles.dropdownOverlay}
                onPress={() => setShowCustomerDropdown(false)}
                activeOpacity={1}
              />
              <View style={styles.dropdownMenu}>
                <ScrollView 
                  style={styles.dropdownScroll} 
                  showsVerticalScrollIndicator={true} 
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.dropdownContent}
                >
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
            </>
          )}
        </View>

        <Text style={styles.label}>Pet *</Text>
        <View style={styles.petSelector}>
          <TouchableOpacity 
            style={[styles.dropdownButton, !selectedCustomer && styles.disabledDropdown]}
            onPress={() => {
              if (selectedCustomer) {
                setShowPetDropdown(!showPetDropdown);
                setShowCustomerDropdown(false); // Close customer dropdown
              }
            }}
            disabled={!selectedCustomer}
          >
            <Text style={[styles.selectedCustomer, !selectedCustomer && styles.disabledText]}>
              {!selectedCustomer ? 'Select customer first' : (petName || 'Select Pet')}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          {showPetDropdown && selectedCustomer && (
            <>
              <TouchableOpacity 
                style={styles.dropdownOverlay}
                onPress={() => setShowPetDropdown(false)}
                activeOpacity={1}
              />
              <View style={styles.dropdownMenu}>
                <ScrollView 
                  style={styles.dropdownScroll} 
                  showsVerticalScrollIndicator={true} 
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.dropdownContent}
                >
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
            </>
          )}
        </View>

        <Text style={styles.label}>Date *</Text>
        <TouchableOpacity 
          style={styles.dateTimeButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateTimeText}>
            {appointmentDate ? 
              new Date(appointmentDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              }) : 'Select Date'}
          </Text>
          <Text style={styles.dropdownArrow}>📅</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Time *</Text>
        <TouchableOpacity 
          style={styles.dateTimeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateTimeText}>
            {appointmentTime ? 
              (() => {
                const [hour, minute] = appointmentTime.split(':');
                const h = parseInt(hour);
                const ampm = h >= 12 ? 'PM' : 'AM';
                const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
                return `${h12}:${minute} ${ampm}`;
              })()
              : 'Select Time'}
          </Text>
          <Text style={styles.dropdownArrow}>🕐</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Veterinarian</Text>
        <TextInput 
          style={[styles.input, styles.disabledInput]} 
          value={veterinarian} 
          editable={false}
          placeholder="Loading..."
        />

        <Text style={styles.label}>Reason *</Text>
        <View style={styles.reasonSelector}>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => {
              setShowReasonDropdown(!showReasonDropdown);
              setShowCustomerDropdown(false);
              setShowPetDropdown(false);
            }}
          >
            <Text style={styles.selectedCustomer}>
              {reason || 'Select Reason'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          {showReasonDropdown && (
            <>
              <TouchableOpacity 
                style={styles.dropdownOverlay}
                onPress={() => setShowReasonDropdown(false)}
                activeOpacity={1}
              />
              <View style={styles.dropdownMenu}>
                <ScrollView 
                  style={styles.dropdownScroll} 
                  showsVerticalScrollIndicator={true} 
                  nestedScrollEnabled={true}
                  bounces={false}
                  contentContainerStyle={styles.dropdownContent}
                >
                  {reasonOptions.length === 0 ? (
                    <View style={styles.dropdownOption}>
                      <Text style={[styles.dropdownOptionText, {fontStyle: 'italic', color: '#999'}]}>
                        No reasons available
                      </Text>
                    </View>
                  ) : (
                    reasonOptions.map((reasonOption) => (
                      <View key={reasonOption.id} style={styles.reasonOptionRow}>
                        <TouchableOpacity
                          style={styles.reasonOption}
                          onPress={() => {
                            setReason(reasonOption.text);
                            setShowReasonDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>{reasonOption.text}</Text>
                        </TouchableOpacity>
                        <View style={styles.reasonActions}>
                          <TouchableOpacity
                            style={styles.editIcon}
                            onPress={() => {
                              setEditingReason(reasonOption);
                              setNewReasonText(reasonOption.text);
                              setShowEditReasonModal(true);
                              setShowReasonDropdown(false);
                            }}
                          >
                            <Text style={styles.iconText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteIcon}
                            onPress={() => {
                              setShowReasonDropdown(false);
                              handleDeleteReason(reasonOption.id);
                            }}
                          >
                            <Text style={styles.iconText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                  <TouchableOpacity
                    style={styles.addReasonOption}
                    onPress={() => {
                      setShowAddReasonModal(true);
                      setShowReasonDropdown(false);
                    }}
                  >
                    <Text style={styles.addReasonText}>+ Add Custom Reason</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </>
          )}
        </View>

        <Text style={styles.label}>Notes</Text>
        <TextInput style={[styles.input, styles.notes]} value={notes} onChangeText={setNotes} placeholder="Notes" multiline />

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, submitting && styles.disabled]} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.saveText}>{submitting ? 'Adding...' : 'Add Appointment'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
                    const selectedDateStr = formatSelectedDate();
                    
                    // Validate selected date is not in the past
                    const selectedDateTime = new Date(selectedDateStr);
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
                    
                    setAppointmentDate(selectedDateStr);
                    setShowDatePicker(false);
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
                    
                    // Validate time is not in the past if date is today
                    if (appointmentDate) {
                      const appointmentDateTime = new Date(`${appointmentDate}T${selectedTime}`);
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
                    
                    setAppointmentTime(selectedTime);
                    setShowTimePicker(false);
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
                  placeholderTextColor="#999"
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
    </View>
  );
}const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f7fa', 
    padding: 12 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold',
    color: '#7B2C2C',
  },
  close: { fontSize: 28, color: '#666' },
  form: { flex: 1 },
  label: { fontSize: 14, color: '#333', marginTop: 8, fontWeight: 'bold' },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    marginTop: 6, 
    backgroundColor: '#fff',
    fontSize: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notes: { minHeight: 80, textAlignVertical: 'top' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  cancelBtn: { 
    flex: 1, 
    marginRight: 8, 
    padding: 14, 
    backgroundColor: '#f5f5f5', 
    borderRadius: 20, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#ddd' 
  },
  cancelText: { color: '#666', fontWeight: 'bold', fontSize: 14 },
  saveBtn: { 
    flex: 1, 
    marginLeft: 8, 
    padding: 14, 
    backgroundColor: '#7B2C2C', 
    borderRadius: 20, 
    alignItems: 'center',
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  disabled: { opacity: 0.6 },
  disabledInput: { backgroundColor: '#f5f5f5', color: '#666' },
  customerSelector: {
    position: 'relative',
    zIndex: 3000,
    marginTop: 6,
  },
  petSelector: {
    position: 'relative',
    zIndex: 2000,
    marginTop: 6,
  },
  reasonSelector: {
    position: 'relative',
    zIndex: 1000,
    marginTop: 6,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledDropdown: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  selectedCustomer: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  disabledText: {
    color: '#999',
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
    maxHeight: 250,
    zIndex: 1001,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScroll: {
    maxHeight: 240,
  },
  dropdownContent: {
    paddingVertical: 4,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  reasonOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reasonOption: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    color: '#7B2C2C',
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
    width: '80%',
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
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 48,
    justifyContent: 'center',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#333',
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 12,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateTimeText: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  timePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: '50%',
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
  dateSelector: {
    flexDirection: 'row',
    padding: 15,
    height: 200,
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
    height: 200,
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
    backgroundColor: '#7B2C2C',
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});
