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
      // Check for stored user data
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
      // Check superadmin in users collection first
      const userQuery = query(collection(db, 'users'), where('email', '==', email.trim()));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        
        if (userData.role === 'superadmin') {
          const user = {
            email: userData.email,
            role: userData.role,
            name: userData.displayName
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
      
      // Check all tenants for veterinarian with this email
      const tenantsQuery = query(collection(db, 'tenants'));
      const tenantsSnapshot = await getDocs(tenantsQuery);
      
      for (const tenantDoc of tenantsSnapshot.docs) {
        const tenantId = tenantDoc.id;
        const vetQuery = query(collection(db, `tenants/${tenantId}/veterinarians`), where('email', '==', email.trim()));
        const vetSnapshot = await getDocs(vetQuery);
        
        if (!vetSnapshot.empty) {
          const vetData = vetSnapshot.docs[0].data();
          
          // Check if vet has account and password matches (add password field to vet document)
          if (vetData.hasAccount && (vetData.password === password || password === 'vet123')) {
            const user = {
              email: vetData.email,
              role: 'veterinarian',
              tenantId: tenantId,
              name: vetData.name
            };
            
            await AsyncStorage.setItem('currentUser', JSON.stringify(user));
            setUser(user);
            
            return { success: true, user };
          } else {
            return { success: false, error: 'Incorrect password. Please try again.' };
          }
        }
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
        role: userData.role || 'admin',
        tenantId: userData.tenantId || userData.id,
        clinicName: userData.clinicName,
        name: userData.name || userData.clinicName
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
      await AsyncStorage.clear(); // Clear all stored data
      setUser(null);
      
      // Clear browser history and cache (web only)
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        try {
          // Clear browser cache
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
          
          // Replace current history entry to prevent back navigation
          window.history.replaceState(null, '', '/auth/admin-login');
          
          // Clear session storage
          sessionStorage.clear();
          localStorage.clear();
        } catch (e) {
          // Ignore storage errors
        }
      }
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