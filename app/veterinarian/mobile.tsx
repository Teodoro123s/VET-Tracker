import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function Mobile() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to mobile login
    router.replace('/mobile-login');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  text: {
    fontSize: 18,
    color: '#666',
  },
});