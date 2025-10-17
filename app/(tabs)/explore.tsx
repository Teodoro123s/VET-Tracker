import { StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function TabTwoScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.content}>
        <ThemedView style={styles.header}>
          <Ionicons name="information-circle" size={48} color="#7B2A3B" />
          <ThemedText type="title" style={styles.title}>About VET-Tracker</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Features</ThemedText>
          <ThemedText style={styles.description}>
            • Appointment scheduling and management{"\n"}
            • Customer and pet database{"\n"}
            • Medical records tracking{"\n"}
            • Veterinarian management{"\n"}
            • Real-time notifications{"\n"}
            • Dashboard analytics
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Technology</ThemedText>
          <ThemedText style={styles.description}>
            Built with React Native, Expo, and Firebase for cross-platform veterinary clinic management.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    color: '#7B2A3B',
    marginTop: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginTop: 12,
  },
});
