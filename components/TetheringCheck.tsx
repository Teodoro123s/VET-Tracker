import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export const TetheringCheck = () => {
  const [isUsbTethering, setIsUsbTethering] = useState(false);

  useEffect(() => {
    const checkTethering = async () => {
      const netInfo = await NetInfo.fetch();
      setIsUsbTethering(netInfo.type === 'ethernet');
    };
    
    checkTethering();
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsUsbTethering(state.type === 'ethernet');
    });
    
    return unsubscribe;
  }, []);

  return (
    <Text style={{ color: isUsbTethering ? 'red' : 'green' }}>
      {isUsbTethering ? 'USB Tethering Active' : 'Normal Connection'}
    </Text>
  );
};