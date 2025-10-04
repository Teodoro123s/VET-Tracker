import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/config/firebaseConfig';

export default function VetMobile() {
  const router = useRouter();
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [vetDetails, setVetDetails] = useState({
    name: 'Loading...',
    email: user?.email || '',
    license: 'Loading...',
    specialization: 'Loading...',
    phone: 'Loading...',
    experience: 'Loading...'
  });

  useEffect(() => {
    fetchVetDetails();
  }, [user]);

  const fetchVetDetails = async () => {
    if (!user?.email) return;
    
    try {
      // Query veterinarians collection directly
      const vetQuery = query(
        collection(db, 'veterinarians'),
        where('email', '==', user.email)
      );
      
      const vetSnapshot = await getDocs(vetQuery);
      
      if (!vetSnapshot.empty) {
        const vetData = vetSnapshot.docs[0].data();
        console.log('Vet data from database:', vetData); // Debug log
        setVetDetails({
          name: vetData.name || 'Dr. Veterinarian',
          email: vetData.email || user.email,
          license: vetData.license || 'License not provided',
          specialization: vetData.specialization || 'Specialization not provided',
          phone: vetData.phone || 'Phone not provided',
          experience: vetData.experience || 'Experience not provided'
        });
      } else {
        console.log('No veterinarian found with email:', user.email);
      }
    } catch (error) {
      console.error('Error fetching vet details:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>




        <View style={styles.quickStats}>
          <TouchableOpacity style={styles.statCard}>
            <Ionicons name="calendar" size={32} color="#800020" />
            <ThemedText style={styles.statValue}>8</ThemedText>
            <ThemedText style={styles.statLabel}>Today's Appointments</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard}>
            <Ionicons name="document-text" size={32} color="#800020" />
            <ThemedText style={styles.statValue}>3</ThemedText>
            <ThemedText style={styles.statLabel}>Pending Records</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="add-circle" size={40} color="#800020" />
              <Text style={styles.actionText}>New Record</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="search" size={40} color="#800020" />
              <Text style={styles.actionText}>Search Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/veterinarian/vet-calendar')}>
              <Ionicons name="calendar" size={40} color="#800020" />
              <Text style={styles.actionText}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="settings" size={40} color="#800020" />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>



      {/* Profile Modal */}
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
                <Ionicons name="close" size={24} color="#666" />
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
                <ThemedText style={styles.profileLabel}>Phone:</ThemedText>
                <ThemedText style={styles.profileValue}>{vetDetails.phone}</ThemedText>
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
                <ThemedText style={styles.profileLabel}>Experience:</ThemedText>
                <ThemedText style={styles.profileValue}>{vetDetails.experience}</ThemedText>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                setShowProfile(false);
                router.push('/shared/logout');
              }}
            >
              <Ionicons name="log-out" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.notificationTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.notificationList}>
              <View style={styles.notificationItem}>
                <Ionicons name="time" size={20} color="#FFA500" />
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationItemTitle}>Appointment Pending</Text>
                  <Text style={styles.notificationText}>John Smith - Buddy needs approval</Text>
                  <Text style={styles.notificationTime}>Today at 2:00 PM</Text>
                </View>
              </View>
              
              <View style={styles.notificationItem}>
                <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationItemTitle}>Appointment Due</Text>
                  <Text style={styles.notificationText}>Sarah Johnson - Max appointment is due</Text>
                  <Text style={styles.notificationTime}>Today at 3:30 PM</Text>
                </View>
              </View>
              
              <View style={styles.notificationItem}>
                <Ionicons name="calendar" size={20} color="#4ECDC4" />
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationItemTitle}>Upcoming Appointment</Text>
                  <Text style={styles.notificationText}>Mike Davis - Luna scheduled tomorrow</Text>
                  <Text style={styles.notificationTime}>Tomorrow at 10:00 AM</Text>
                </View>
              </View>
            </ScrollView>
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
  vetDetailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    width: 70,
  },
  detailValue: {
    fontSize: 14,
    color: '#999',
    flex: 1,
    fontStyle: 'italic',
  },
  detailValueActive: {
    color: '#333',
    fontStyle: 'normal',
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
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
    color: '#800020',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickActions: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  notificationModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    width: '90%',
    maxHeight: '70%',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationList: {
    maxHeight: 400,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'flex-start',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});