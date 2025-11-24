import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getFormFields, addMedicalRecord } from '../../lib/services/firebaseService';

export default function VetMedicalRecordForm() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFormFields();
  }, []);

  const loadFormFields = async () => {
    try {
      console.log('Loading form fields for:', params.formTemplate, 'user:', user?.email);
      const fields = await getFormFields(params.formTemplate, user?.email);
      console.log('Loaded fields:', fields);
      
      if (!fields || fields.length === 0) {
        // Create basic medical record fields if none found
        const basicFields = [
          { id: 'diagnosis', label: 'Diagnosis', type: 'textarea', required: true },
          { id: 'treatment', label: 'Treatment', type: 'textarea', required: true },
          { id: 'notes', label: 'Notes', type: 'textarea', required: false }
        ];
        setFormFields(basicFields);
      } else {
        setFormFields(fields);
      }
    } catch (error) {
      console.error('Error loading form fields:', error);
      // Show basic fields on error
      const basicFields = [
        { id: 'diagnosis', label: 'Diagnosis', type: 'textarea', required: true },
        { id: 'treatment', label: 'Treatment', type: 'textarea', required: true },
        { id: 'notes', label: 'Notes', type: 'textarea', required: false }
      ];
      setFormFields(basicFields);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const mappedFormData = {};
      formFields.forEach(field => {
        mappedFormData[field.label] = formData[field.id] || '';
      });
      
      const recordData = {
        petId: params.appointmentId,
        petName: params.petName,
        category: params.category,
        formTemplate: params.formTemplate,
        formType: params.formTemplate,
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
      Alert.alert('Success', 'Medical record saved successfully!', [
        { text: 'OK', onPress: () => {
          // Navigate to medical history of the specific customer
          router.replace({
            pathname: '/veterinarian/vet-customers',
            params: {
              customerId: params.customerId || params.appointmentId,
              customerName: params.customerName,
              petId: params.appointmentId,
              petName: params.petName,
              showMedicalHistory: 'true'
            }
          });
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save medical record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormField = (field) => {
    if (!field || !field.id) {
      return (
        <View style={styles.errorField}>
          <Text style={styles.errorText}>Invalid field configuration</Text>
        </View>
      );
    }

    const commonProps = {
      style: styles.input,
      value: formData[field.id] || '',
      onChangeText: (text) => setFormData({...formData, [field.id]: text}),
      placeholder: `Enter ${field.label || 'value'}`,
    };

    switch (field.type) {
      case 'text':
      case 'textarea':
        return (
          <TextInput
            {...commonProps}
            multiline={field.type === 'textarea'}
            numberOfLines={field.type === 'textarea' ? 4 : 1}
          />
        );
      case 'date':
        return (
          <TextInput
            {...commonProps}
            placeholder="MM/DD/YYYY"
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
            {...commonProps}
            keyboardType="numeric"
            onChangeText={(text) => {
              const formatted = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
              setFormData({...formData, [field.id]: formatted});
            }}
          />
        );
      default:
        return <TextInput {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading form...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{params.formTemplate || 'Medical Record Form'}</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.patientCard}>
            <Text style={styles.cardTitle}>Patient Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Patient:</Text>
              <Text style={styles.infoValue}>{params.petName || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Owner:</Text>
              <Text style={styles.infoValue}>{params.customerName || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.fieldsContainer}>
            {formFields.map((field) => (
              <View key={field.id} style={styles.fieldItem}>
                <Text style={styles.fieldLabel}>
                  {field.label}{field.required && ' *'}
                </Text>
                {renderFormField(field)}
              </View>
            ))}
          </View>
          
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitText}>
              {isSubmitting ? 'Saving...' : 'Save Medical Record'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 0,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7B2C2C',
    textAlign: 'center',
  },

  content: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  noFieldsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noFieldsText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B2C2C',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  fieldsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  fieldItem: {
    marginBottom: 22,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2C2C',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
    minHeight: 52,
    textAlignVertical: 'top',
    color: '#374151',
  },
  errorField: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#7B2C2C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    opacity: 0.7,
  },
});