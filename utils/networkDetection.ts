import NetInfo from '@react-native-community/netinfo';

export interface NetworkInfo {
  isConnected: boolean;
  type: string;
  isUsbTethering: boolean;
  details: any;
}

export const detectUsbTethering = async (): Promise<NetworkInfo> => {
  const netInfo = await NetInfo.fetch();
  
  const isUsbTethering = 
    netInfo.type === 'ethernet' || 
    (netInfo.type === 'wifi' && netInfo.details?.ssid?.includes('USB')) ||
    (netInfo.type === 'cellular' && netInfo.details?.carrier === 'USB Tethering');

  return {
    isConnected: netInfo.isConnected ?? false,
    type: netInfo.type,
    isUsbTethering,
    details: netInfo.details
  };
};

export const subscribeToNetworkChanges = (callback: (networkInfo: NetworkInfo) => void) => {
  return NetInfo.addEventListener(async (state) => {
    const networkInfo = await detectUsbTethering();
    callback(networkInfo);
  });
};