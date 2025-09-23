import { View, Text, StyleSheet, Switch } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useState } from 'react';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);

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
        <ThemedText type="subtitle">Clinic Information</ThemedText>
        <ThemedText>Clinic Name: Veterinary Care Center</ThemedText>
        <ThemedText>Address: 123 Pet Street, Animal City</ThemedText>
        <ThemedText>Phone: (555) 123-4567</ThemedText>
      </View>
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
});