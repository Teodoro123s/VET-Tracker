import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';

export default function VetMobile() {
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);

  const vetDetails = {
    name: 'Dr. Sarah Smith',
    email: 'dr.sarah@vetclinic.com',
    license: 'VET-2024-001',
    specialization: 'Small Animal Medicine',
    phone: '+1 (555) 123-4567',
    experience: '8 years'
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Veterinarian Dashboard</ThemedText>
        <TouchableOpacity 
          style={styles.avatarButton}
          onPress={() => setShowProfile(true)}
        >
          <Text style={styles.avatarText}>DS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <ThemedText type="subtitle" style={styles.welcomeText}>Welcome back, Dr. Smith</ThemedText>
          <ThemedText style={styles.dateText}>Today is {new Date().toLocaleDateString()}</ThemedText>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>8</ThemedText>
            <ThemedText style={styles.statLabel}>Today's Appointments</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>3</ThemedText>
            <ThemedText style={styles.statLabel}>Pending Records</ThemedText>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showProfile}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Veterinarian Profile</ThemedText>
              <TouchableOpacity onPress={() => setShowProfile(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileDetails}>
              <View style={styles.profileRow}>
                <ThemedText style={styles.profileLabel}>Name:</ThemedText>
                <ThemedText style={styles.profileValue}>{vetDetails.name}</ThemedText>
              </View>
              <View style={styles.profileRow}>
                <ThemedText style={styles.profileLabel}>Email:</ThemedText>
                <ThemedText style={styles.profileValue}>{vetDetails.email}</ThemedText>
              </View>
              <View style={styles.profileRow}>
                <ThemedText style={styles.profileLabel}>License:</ThemedText>
                <ThemedText style={styles.profileValue}>{vetDetails.license}</ThemedText>
              </View>
              <View style={styles.profileRow}>
                <ThemedText style={styles.profileLabel}>Specialization:</ThemedText>
                <ThemedText style={styles.profileValue}>{vetDetails.specialization}</ThemedText>
              </View>
              <View style={styles.profileRow}>
                <ThemedText style={styles.profileLabel}>Phone:</ThemedText>
                <ThemedText style={styles.profileValue}>{vetDetails.phone}</ThemedText>
              </View>
              <View style={styles.profileRow}>
                <ThemedText style={styles.profileLabel}>Experience:</ThemedText>
                <ThemedText style={styles.profileValue}>{vetDetails.experience}</ThemedText>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                setShowProfile(false);
                router.push('/logout');
              }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    color: '#333',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 0.48,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  profileDetails: {
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  profileLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: 120,
  },
  profileValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});