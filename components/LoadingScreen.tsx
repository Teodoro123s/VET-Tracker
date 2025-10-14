import React from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/logo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
      <ThemedText style={styles.text}>Loading...</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  spinner: {
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
});