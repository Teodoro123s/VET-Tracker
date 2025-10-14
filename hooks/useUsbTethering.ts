import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useUsbTethering = () => {
  const [isUsbTethering, setIsUsbTethering] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsUsbTethering(state.type === 'ethernet');
    });
    return unsubscribe;
  }, []);

  return isUsbTethering;
};