import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { addMedicalRecord, getAppointments, getCustomers, getPets } from '../../lib/services/firebaseService';
import { useTenant } from '../../contexts/TenantContext';

export default function VetMedicalRecord() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams();
  const { userEmail } = useTenant();
  
  const [appointment, setAppointment] = useState(null);
  const [pet, setPet] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [recordData, setRecordData] = useState({
    diagnosis: '',
    treatment: '',
    medications: '',
    notes: '',
    followUp: '',
    symptoms: '',
    vitalSigns: {
      temperature: '',
      weight: '',
      heartRate: '',
      respiratoryRate: ''
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointmentData();
  }, [appointmentId]);

  const loadAppointmentData = async () => {
    try {
      const [appointments, customers, pets] = await Promise.all([
        getAppointments(userEmail),
        getCustomers(userEmail),
        getPets(userEmail)
      ]);

      const apt = appointments.find(a => a.id === appointmentId);
      if (apt) {
        setAppointment(apt);
        
        const customer = customers.find(c => c.name === apt.customerName);
        setCustomer(customer);
        
        const pet = pets.find(p => p.name === apt.petName);
        setPet(pet);
      }
    } catch (error) {
      console.error('Error loading appointment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRecord = async () => {
    if (!recordData.diagnosis || !recordData.treatment) {
      Alert.alert('Error', 'Please fill in diagnosis and treatment fields');
      return;
    }

    try {
      const record = {
        appointmentId,
        petId: pet?.id,
        petName: pet?.name,
        customerName: customer?.name,
        veterinarian: userEmail,
        date: new Date().toLocaleDateString(),
        diagnosis: recordData.diagnosis,
        treatment: recordData.treatment,
        medications: recordData.medications,
        symptoms: recordData.symptoms,
        notes: recordData.notes,
        followUp: recordData.followUp,
        vitalSigns: recordData.vitalSigns,
        createdAt: new Date(),
        service: appointment?.service
      };

      await addMedicalRecord(record, userEmail);
      Alert.alert('Success', 'Medical record saved successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving record:', error);
      Alert.alert('Error', 'Failed to save medical record');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Patient Info */}
        <View style={styles.patientInfo}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Owner:</Text>
            <Text style={styles.infoValue}>{customer?.name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pet:</Text>
            <Text style={styles.infoValue}>{pet?.name || 'N/A'} ({pet?.type})</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service:</Text>
            <Text style={styles.infoValue}>{appointment?.service || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>{new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Vital Signs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vital Signs</Text>
          <View style={styles.vitalSignsGrid}>
            <View style={styles.vitalInput}>
              <Text style={styles.inputLabel}>Temperature (°F)</Text>
              <TextInput
                style={styles.textInput}
                value={recordData.vitalSigns.temperature}
                onChangeText={(text) => setRecordData({
                  ...recordData,
                  vitalSigns: { ...recordData.vitalSigns, temperature: text }
                })}
                placeholder="101.5"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.vitalInput}>
              <Text style={styles.inputLabel}>Weight (lbs)</Text>
              <TextInput
                style={styles.textInput}
                value={recordData.vitalSigns.weight}
                onChangeText={(text) => setRecordData({
                  ...recordData,
                  vitalSigns: { ...recordData.vitalSigns, weight: text }
                })}
                placeholder="25"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.vitalInput}>
              <Text style={styles.inputLabel}>Heart Rate (bpm)</Text>
              <TextInput
                style={styles.textInput}
                value={recordData.vitalSigns.heartRate}
                onChangeText={(text) => setRecordData({
                  ...recordData,
                  vitalSigns: { ...recordData.vitalSigns, heartRate: text }
                })}
                placeholder="120"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.vitalInput}>
              <Text style={styles.inputLabel}>Respiratory Rate</Text>
              <TextInput
                style={styles.textInput}
                value={recordData.vitalSigns.respiratoryRate}
                onChangeText={(text) => setRecordData({
                  ...recordData,
                  vitalSigns: { ...recordData.vitalSigns, respiratoryRate: text }
                })}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms</Text>
          <TextInput
            style={styles.textArea}
            value={recordData.symptoms}
            onChangeText={(text) => setRecordData({ ...recordData, symptoms: text })}
            placeholder="Describe observed symptoms..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Diagnosis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnosis *</Text>
          <TextInput
            style={styles.textArea}
            value={recordData.diagnosis}
            onChangeText={(text) => setRecordData({ ...recordData, diagnosis: text })}
            placeholder="Enter diagnosis..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Treatment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Treatment *</Text>
          <TextInput
            style={styles.textArea}
            value={recordData.treatment}
            onChangeText={(text) => setRecordData({ ...recordData, treatment: text })}
            placeholder="Describe treatment provided..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medications</Text>
          <TextInput
            style={styles.textArea}
            value={recordData.medications}
            onChangeText={(text) => setRecordData({ ...recordData, medications: text })}
            placeholder="List medications prescribed..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Follow-up */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow-up Instructions</Text>
          <TextInput
            style={styles.textArea}
            value={recordData.followUp}
            onChangeText={(text) => setRecordData({ ...recordData, followUp: text })}
            placeholder="Follow-up care instructions..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <TextInput
            style={styles.textArea}
            value={recordData.notes}
            onChangeText={(text) => setRecordData({ ...recordData, notes: text })}
            placeholder="Any additional notes..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveRecord}>
          <Text style={styles.saveButtonText}>Save Medical Record</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  content: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  patientInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    backgroundColor: '#ffffff',
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
    color: '#333',
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
  },
  vitalSignsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vitalInput: {
    width: '48%',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4caf50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});