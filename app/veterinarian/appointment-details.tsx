import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { updateAppointment, deleteAppointment, getMedicalCategories, getMedicalForms, getFormFields, addMedicalRecord, getPets } from '@/lib/services/firebaseService';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';

export default function AppointmentDetails() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  const [appointment, setAppointment] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formTemplates, setFormTemplates] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [newRecord, setNewRecord] = useState({
    category: '',
    formTemplate: '',
    petId: ''
  });

  useEffect(() => {
    if (params.appointmentData) {
      try {
        const appointmentData = JSON.parse(params.appointmentData as string);
        setAppointment(appointmentData);
        loadRecordData();
      } catch (error) {
        console.error('Error parsing appointment data:', error);
        router.back();
      }
    }
  }, [params.appointmentData]);

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
      
      const mappedCategories = cats.map(cat => ({ id: cat.id, name: cat.name || cat.category }));
      if (!mappedCategories.find(cat => cat.name === 'No Category')) {
        mappedCategories.unshift({ id: 'no-category', name: 'No Category' });
      }
      setCategories(mappedCategories);
    } catch (error) {
      console.error('Error loading record data:', error);
      setCategories([{ id: 'no-category', name: 'No Category' }]);
    }
  };

  const handleAddRecord = () => {
    setNewRecord({
      category: '',
      formTemplate: '',
      petId: appointment.petId || appointment.petName
    });
    setShowAddRecordModal(true);
    setShowDropdown(false);
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
      
      const fields = await getFormFields(newRecord.formTemplate, user.email);
      setFormFields(fields);
      setFormData({});
      setShowFormModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load form fields');
    }
  };

  const handleSubmitForm = async () => {
    try {
      const mappedFormData = {};
      formFields.forEach(field => {
        mappedFormData[field.label] = formData[field.id] || '';
      });
      
      const recordData = {
        petId: appointment.petId || newRecord.petId,
        petName: appointment.petName,
        category: newRecord.category,
        formTemplate: newRecord.formTemplate,
        formType: newRecord.formTemplate,
        formData: formData,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
        veterinarian: user?.email,
        createdBy: user?.email,
        diagnosis: mappedFormData.diagnosis || 'N/A',
        treatment: mappedFormData.treatment || 'N/A',
        notes: mappedFormData.notes || Object.values(mappedFormData).join(', ') || 'N/A'
      };
      
      await addMedicalRecord(recordData, user.email);
      setShowFormModal(false);
      setShowAddRecordModal(false);
      
      Alert.alert('Success', 'Medical record added successfully');
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'Failed to add medical record');
    }
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

  const handleMarkDone = async () => {
    if (!appointment) return;
    
    try {
      await updateAppointment(user?.email, appointment.id, { status: 'Completed' });
      Alert.alert('Success', 'Appointment marked as completed', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update appointment');
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;
    
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
              await deleteAppointment(user?.email, appointment.id);
              Alert.alert('Success', 'Appointment deleted', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete appointment');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#28a745';
      case 'Due': return '#dc3545';
      case 'Completed': return '#007bff';
      case 'cancelled': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const formatDateTime = (appointment) => {
    let appointmentTime;
    if (appointment.appointmentDate?.seconds) {
      appointmentTime = new Date(appointment.appointmentDate.seconds * 1000);
    } else {
      appointmentTime = new Date(appointment.appointmentDate || appointment.dateTime);
    }
    
    if (isNaN(appointmentTime.getTime())) {
      return { date: 'Date TBD', time: 'Time TBD' };
    }
    
    return {
      date: appointmentTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: appointmentTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      })
    };
  };

  if (!appointment) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading appointment details...</Text>
      </View>
    );
  }

  const { date, time } = formatDateTime(appointment);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.detailTable}>
          <View style={styles.detailTableHeader}>
            <Text style={styles.detailHeaderCell}>Field</Text>
            <Text style={styles.detailHeaderCell}>Value</Text>
            {appointment.status !== 'Completed' && (
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.menuButton} onPress={() => setShowDropdown(!showDropdown)}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#7B2C2C" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Customer</Text>
            <Text style={styles.detailCell}>{appointment.customerName || 'N/A'}</Text>
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Pet</Text>
            <Text style={styles.detailCell}>{appointment.petName || 'N/A'}</Text>
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Date</Text>
            <Text style={styles.detailCell}>{date}</Text>
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Time</Text>
            <Text style={styles.detailCell}>{time}</Text>
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Reason</Text>
            <Text style={styles.detailCell}>{appointment.reason || appointment.service || 'N/A'}</Text>
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Veterinarian</Text>
            <Text style={styles.detailCell}>{appointment.veterinarian || 'Not assigned'}</Text>
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Notes</Text>
            <Text style={styles.detailCell}>{appointment.notes || 'No notes'}</Text>
          </View>
          <View style={styles.detailTableRow}>
            <Text style={styles.detailCell}>Status</Text>
            <Text style={[styles.detailCell, { color: getStatusColor(appointment.status), fontWeight: 'bold' }]}>{appointment.status}</Text>
          </View>
        </View>
      </ScrollView>
      {showDropdown && (
        <Modal transparent={true} visible={showDropdown} onRequestClose={() => setShowDropdown(false)}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
            <View style={styles.dropdown}>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { handleMarkDone(); setShowDropdown(false); }}>
                <Text style={styles.dropdownText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { handleAddRecord(); setShowDropdown(false); }}>
                <Text style={styles.dropdownText}>Add Record</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { handleDelete(); setShowDropdown(false); }}>
                <Text style={styles.dropdownText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
      <Modal
        visible={showAddRecordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddRecordModal(false)}
      >
        <View style={styles.recordModalOverlay}>
          <View style={styles.recordModalContent}>
            <View style={styles.recordModalHeader}>
              <Text style={styles.recordModalTitle}>Add Medical Record</Text>
              <TouchableOpacity onPress={() => setShowAddRecordModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.recordModalForm}>
              <View style={[styles.inputGroup, { zIndex: 10000 }]}>
                <Text style={styles.inputLabel}>Category * ({categories.length} available)</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => {
                    setShowCategoryDropdown(!showCategoryDropdown);
                    setShowTemplateDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownButtonText}>
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

              <View style={[styles.inputGroup, { zIndex: 5000 }]}>
                <Text style={styles.inputLabel}>Form Template *</Text>
                <TouchableOpacity 
                  style={[styles.dropdownButton, !newRecord.category && styles.disabledDropdown]}
                  onPress={() => {
                    if (newRecord.category) {
                      setShowTemplateDropdown(!showTemplateDropdown);
                      setShowCategoryDropdown(false);
                    }
                  }}
                >
                  <Text style={[styles.dropdownButtonText, !newRecord.category && styles.disabledText]}>
                    {!newRecord.category ? 'Select category first' : (newRecord.formTemplate || 'Select Form Template')}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {showTemplateDropdown && (
                  <View style={styles.dropdownMenu}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                      {formTemplates.filter(template => template.category === newRecord.category)
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
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.recordModalButtons}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  detailTable: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 44, 0.1)',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  detailTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
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
    color: '#7B2C2C',
  },
  detailCell: {
    flex: 1,
    fontSize: 12,
    color: '#7B2C2C',
  },
  headerActions: {
    position: 'relative',
  },
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 95,
    paddingRight: 20,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 44, 0.1)',
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownText: {
    fontSize: 14,
    color: '#7B2C2C',
  },
  recordModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  recordModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  recordModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recordModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B2C2C',
  },
  recordModalForm: {
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
  dropdownButtonText: {
    fontSize: 16,
    color: '#7B2C2C',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
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
    color: '#7B2C2C',
  },
  disabledDropdown: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  disabledText: {
    color: '#999',
  },
  recordModalButtons: {
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
    backgroundColor: Colors.primary,
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
    color: Colors.primary,
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