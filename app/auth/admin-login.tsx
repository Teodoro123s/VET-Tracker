import React from 'react';
import LoginWeb from '../../components/LoginWeb';

// Admin login is web-only - mobile users should use veterinarian login
export default function AdminLoginScreen() {
  return <LoginWeb />;
}