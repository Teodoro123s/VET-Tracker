import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getMedicalCategories, getMedicalForms } from '../../lib/services/firebaseService';

export default function MedicalRecordSelection() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  const [categories, setCategories] = useState([]);
  const [formTemplates, setFormTemplates] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
      console.error('Error loading data:', error);
      setCategories([{ id: 'no-category', name: 'No Category' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSelect = (formTemplate) => {
    router.replace({
      pathname: '/veterinarian/medical-record-form',
      params: {
        appointmentId: params.appointmentId,
        petName: params.petName,
        customerName: params.customerName,
        category: selectedCategory,
        formTemplate: formTemplate.formName
      }
    });
  };

  const filteredForms = formTemplates.filter(template => 
    selectedCategory ? template.category === selectedCategory : true
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Select Category</Text>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                selectedCategory === category.name && styles.selectedCategoryItem
              ]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category.name && styles.selectedCategoryText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedCategory && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Select Form Template</Text>
            {filteredForms.length === 0 ? (
              <View style={styles.noFormsContainer}>
                <Text style={styles.noFormsText}>No forms available for this category</Text>
              </View>
            ) : (
              filteredForms.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.formItem}
                  onPress={() => handleFormSelect(template)}
                >
                  <Text style={styles.formText}>{template.formName}</Text>
                  <Text style={styles.formArrow}>→</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
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
  content: {
    flex: 1,
    padding: 20,
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
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B2C2C',
    marginBottom: 16,
  },
  categoryItem: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  selectedCategoryItem: {
    backgroundColor: '#7B2C2C',
    borderColor: '#7B2C2C',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  formItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  formText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  formArrow: {
    fontSize: 18,
    color: '#7B2C2C',
    fontWeight: 'bold',
  },
  noFormsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noFormsText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});