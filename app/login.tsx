import React from 'react';
import { Platform } from 'react-native';
import LoginWeb from '../components/LoginWeb';
import LoginMobile from '../components/LoginMobile';

export default function LoginScreen() {
  // Use web component for web platform, mobile component for native platforms
  if (Platform.OS === 'web') {
    return <LoginWeb />;
  }
  
  return <LoginMobile />;
}