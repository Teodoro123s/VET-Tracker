import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import SpeciesBreedsManager from '@/components/SpeciesBreedsManager';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [showSpeciesManager, setShowSpeciesManager] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>
      
      <View style={styles.settingsGroup}>
        <ThemedText type="subtitle">General</ThemedText>
        
        <View style={styles.settingItem}>
          <ThemedText>Enable Notifications</ThemedText>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
        
        <View style={styles.settingItem}>
          <ThemedText>Auto Backup</ThemedText>
          <Switch value={autoBackup} onValueChange={setAutoBackup} />
        </View>
      </View>
      
      <View style={styles.settingsGroup}>
        <ThemedText type="subtitle">Data Management</ThemedText>
        
        <TouchableOpacity 
          style={styles.settingButton}
          onPress={() => setShowSpeciesManager(true)}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="paw" size={20} color="#800000" />
            <Text style={styles.buttonText}>Manage Species & Breeds</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.settingsGroup}>
        <ThemedText type="subtitle">Clinic Information</ThemedText>
        <ThemedText>Clinic Name: Veterinary Care Center</ThemedText>
        <ThemedText>Address: 123 Pet Street, Animal City</ThemedText>
        <ThemedText>Phone: (555) 123-4567</ThemedText>
      </View>
      
      <SpeciesBreedsManager
        visible={showSpeciesManager}
        onClose={() => setShowSpeciesManager(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  settingsGroup: {
    marginTop: 30,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});