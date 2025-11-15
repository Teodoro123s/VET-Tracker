import React from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';

export function LoadingScreen() {
  return (
    
      
      
      Loading...
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  logo: {
    width,
    height,
    marginBottom,
  },
  spinner: {
    marginBottom,
  },
  text: {
    fontSize,
    color: Colors.text.secondary,
  },
});