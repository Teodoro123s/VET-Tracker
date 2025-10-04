import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getMedicalRecordById, deleteMedicalRecord } from '@/lib/services/firebaseService';
import { useTenant } from '@/contexts/TenantContext';

export default function MedicalRecordDetailScreen() {
  const { id } = useLocalSearchParams();
  const { userEmail } = useTenant();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && userEmail) {
      loadRecord();
    }
  }, [id, userEmail]);

  const loadRecord = async () => {
    try {
      const recordData = await getMedicalRecordById(userEmail, id as string);
      setRecord(recordData);
    } catch (error) {
      console.error('Error loading medical record:', error);
      Alert.alert('Error', 'Failed to load medical record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this medical record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete }
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      await deleteMedicalRecord(id as string, userEmail);
      Alert.alert('Success', 'Medical record deleted successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete medical record');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading medical record...</Text>
      </View>
    );
  }

  if (!record) {
    return (
      <View style={styles.container}>
        <Text>Medical record not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Medical Record Details</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.tableContainer}>
          <View style={styles.table}>
            <View style={styles.returnRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.returnButton}>
                <Text style={styles.returnIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.returnText}></Text>
              <Text style={styles.returnText}></Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Field</Text>
              <Text style={styles.headerCell}>Value</Text>
            </View>
            
            <View style={styles.tableBody}>
              <View style={styles.tableRow}>
                <Text style={styles.cell}>Date</Text>
                <Text style={styles.cell}>{record.date || 'N/A'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.cell}>Category</Text>
                <Text style={styles.cell}>{record.category || 'N/A'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.cell}>Form Template</Text>
                <Text style={styles.cell}>{record.formTemplate || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {record.formData && Object.keys(record.formData).length > 0 && (
          <View style={styles.formDataSection}>
            <Text style={styles.sectionTitle}>Form Data</Text>
            <View style={styles.tableContainer}>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.headerCell}>Field</Text>
                  <Text style={styles.headerCell}>Value</Text>
                </View>
                <View style={styles.tableBody}>
                  {Object.entries(record.formData).map(([key, value]) => (
                    <View key={key} style={styles.tableRow}>
                      <Text style={styles.cell}>{key}</Text>
                      <Text style={styles.cell}>{String(value) || 'N/A'}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
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
  backButton: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
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
    marginBottom: 20,
  },
  table: {
    backgroundColor: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  cell: {
    flex: 1,
    fontSize: 12,
    color: '#555',
  },
  tableBody: {
    flex: 1,
  },
  returnRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  returnButton: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  returnIcon: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  returnText: {
    flex: 1,
  },
  actionButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  formDataSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: 15,
  },
});