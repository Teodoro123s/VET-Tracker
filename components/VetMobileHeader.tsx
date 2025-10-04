import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTenant } from '@/contexts/TenantContext';
import { getVeterinarians } from '@/lib/services/firebaseService';
import { useRouter } from 'expo-router';

interface VetMobileHeaderProps {
  showBackButton?: boolean;
  title?: string;
  onBackPress?: () => void;
}

export default function VetMobileHeader({ showBackButton = false, title, onBackPress }: VetMobileHeaderProps) {
  const { userEmail } = useTenant();
  const router = useRouter();

  const [vetData, setVetData] = useState(null);

  useEffect(() => {
    loadVetData();
  }, [userEmail]);

  const getDisplayName = (email) => {
    if (!email) return 'User';
    return email.split('@')[0];
  };

  const loadVetData = async () => {
    try {
      const vets = await getVeterinarians(userEmail);
      const currentVet = vets.find(vet => vet.email === userEmail);
      setVetData(currentVet);
    } catch (error) {
      console.error('Error loading vet data:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBackButton ? (
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => router.push('/veterinarian/vet-mobile')}>
              <Ionicons name="arrow-back" size={24} color="#800020" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.avatar} onPress={() => router.push('/veterinarian/vet-profile')}>
              <Ionicons name="person" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.name}>{vetData?.name || getDisplayName(userEmail)}</Text>
              <Text style={styles.email}>{vetData?.email || userEmail}</Text>
            </View>
          </>
        )}
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/veterinarian/vet-notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#800020" />
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#800020" />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#800020',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

});