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
      setFormFields(fields || []);
    } catch (error) {
      console.error('Error loading form fields:', error);
      Alert.alert('Error', 'Failed to load form fields: ' + error.message);
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
          // Go back to appointment details, skipping selection screen
          router.replace('/veterinarian/vet-appointments');
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
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{params.formTemplate || 'Medical Record'}</Text>
          <TouchableOpacity 
            style={[styles.saveButton, isSubmitting && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.saveText}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
        
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
          
          {formFields.length === 0 ? (
            <View style={styles.noFieldsCard}>
              <Text style={styles.noFieldsText}>No form fields available</Text>
            </View>
          ) : (
            formFields.map((field) => (
              <View key={field.id} style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>
                  {field.label}{field.required && ' *'}
                </Text>
                {renderFormField(field)}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7B2C2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B2C2C',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  content: {
    padding: 20,
    paddingTop: 0,
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
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B2C2C',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  fieldCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7B2C2C',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 48,
    textAlignVertical: 'top',
  },
  errorField: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    fontStyle: 'italic',
  },
});