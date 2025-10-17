import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="medical" size={48} color="#7B2A3B" />
        <ThemedText type="title" style={styles.title}>VET-Tracker</ThemedText>
        <ThemedText style={styles.subtitle}>Veterinary Management System</ThemedText>
      </View>
      <ThemedView style={styles.content}>
        <ThemedText type="subtitle">Welcome to VET-Tracker</ThemedText>
        <ThemedText style={styles.description}>
          A comprehensive veterinary clinic management system for appointments, medical records, and customer management.
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    color: '#7B2A3B',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
});
