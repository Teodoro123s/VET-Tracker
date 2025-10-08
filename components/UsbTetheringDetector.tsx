import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { detectUsbTethering, subscribeToNetworkChanges, NetworkInfo } from '../utils/networkDetection';

export const UsbTetheringDetector: React.FC = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  useEffect(() => {
    detectUsbTethering().then(setNetworkInfo);
    
    const unsubscribe = subscribeToNetworkChanges(setNetworkInfo);
    return unsubscribe;
  }, []);

  if (!networkInfo) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.status, networkInfo.isUsbTethering && styles.tethering]}>
        {networkInfo.isUsbTethering ? '📱 USB Tethering Detected' : '🌐 Regular Connection'}
      </Text>
      <Text style={styles.details}>Type: {networkInfo.type}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    margin: 10,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tethering: {
    color: '#ff6b35',
  },
  details: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});