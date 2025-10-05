import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/config/firebaseConfig';
import { loginWithCredentialOverlap, getVeterinarianByEmail, getTenantId } from '../lib/services/firebaseService';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Try credential overlap login first
      const credentialResult = await loginWithCredentialOverlap(email.trim(), password);
      
      if (credentialResult.success) {
        // Check tenants collection for user data
        const q = query(collection(db, 'tenants'), where('email', '==', email.trim()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          
          const user = {
            email: userData.email,
            role: userData.role || 'admin',
            tenantId: userData.tenantId,
            clinicName: userData.clinicName,
            name: userData.name || userData.clinicName
          };
          
          await AsyncStorage.setItem('currentUser', JSON.stringify(user));
          setUser(user);
          
          return { success: true, user };
        }
      }
      
      // Check superadmins collection first
      const superAdminQuery = query(collection(db, 'superadmins'), where('email', '==', email.trim()));
      const superAdminSnapshot = await getDocs(superAdminQuery);
      
      if (!superAdminSnapshot.empty) {
        const superAdminData = superAdminSnapshot.docs[0].data();
        
        if (superAdminData.password !== password) {
          return { success: false, error: 'Incorrect password. Please try again.' };
        }
        
        const user = {
          email: superAdminData.email,
          role: 'superadmin',
          name: superAdminData.name
        };
        
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        setUser(user);
        
        return { success: true, user };
      }
      
      // Fallback to original login method
      const q = query(collection(db, 'tenants'), where('email', '==', email.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, error: 'No account found with this email address' };
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      if (userData.password !== password) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }
      
      if (userData.status === 'inactive' || userData.status === 'suspended') {
        return { success: false, error: 'This account has been disabled. Contact support.' };
      }
      
      const user = {
        email: userData.email,
        role: userData.role,
        tenantId: userData.tenantId,
        clinicName: userData.clinicName
      };
      
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please check your internet connection and try again.' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('currentUser');
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    checkAuthState,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};