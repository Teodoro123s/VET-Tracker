import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/config/firebaseConfig';
import { loginWithCredentialOverlap, getVeterinarianByEmail, getTenantId } from '../lib/services/firebaseService';
import { verifyPassword } from '../lib/utils/passwordUtils';

interface User {
  email: string;
  role: string;
  tenantId?: string;
  name: string;
}

const AuthContext = createContext<{ user: User | null; loading: boolean; login: Function; logout: Function }>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // Check for stored user data
      let userData = null;
      try {
        userData = await AsyncStorage.getItem('currentUser');
      } catch (e) {
        userData = null;
      }

      // If running on web, prefer sessionStorage (for refresh persistence) then localStorage
      if (!userData && typeof window !== 'undefined') {
        try {
          const ss = sessionStorage.getItem('currentUser');
          if (ss) {
            userData = ss;
          } else {
            const ls = localStorage.getItem('currentUser');
            if (ls) userData = ls;
          }
        } catch (e) {
          try {
            const ls = localStorage.getItem('currentUser');
            if (ls) userData = ls;
          } catch (e2) {}
        }
      }

      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe = (Platform.OS === 'web' ? true : true)) => {
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
          
          // Persist according to rememberMe and platform
          try {
            if (!Platform || Platform.OS !== 'web') {
              // mobile/native: persist only if rememberMe
              if (rememberMe) await AsyncStorage.setItem('currentUser', JSON.stringify(user));
            } else {
              // web: sessionStorage for session-only, localStorage for persistent
              if (rememberMe) {
                try { localStorage.setItem('currentUser', JSON.stringify(user)); } catch (e) {}
              } else {
                try { sessionStorage.setItem('currentUser', JSON.stringify(user)); } catch (e) {}
              }
            }
          } catch (e) {}
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
        
        try {
          if (!Platform || Platform.OS !== 'web') {
            if (rememberMe) await AsyncStorage.setItem('currentUser', JSON.stringify(user));
          } else {
            if (rememberMe) {
              try { localStorage.setItem('currentUser', JSON.stringify(user)); } catch (e) {}
            } else {
              try { sessionStorage.setItem('currentUser', JSON.stringify(user)); } catch (e) {}
            }
          }
        } catch (e) {}
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
          
          // Check tenant entry for veterinarian credentials
          const vetTenantQuery = query(collection(db, 'tenants'), where('email', '==', email.trim()), where('role', '==', 'veterinarian'));
          const vetTenantSnapshot = await getDocs(vetTenantQuery);
          
          let isAuthenticated = false;
          
          if (!vetTenantSnapshot.empty) {
            const tenantData = vetTenantSnapshot.docs[0].data();
            
            // Check plain password (Firebase Auth uses SCRYPT, we can't replicate it)
            isAuthenticated = tenantData.password === password;
            console.log('Veterinarian authentication via password check:', isAuthenticated);
          }
          
          // Also check dev password
          if (!isAuthenticated && password === 'vet123') {
            isAuthenticated = true;
            console.log('Veterinarian authentication via dev password');
          }
          
          if (isAuthenticated && vetData.hasAccount) {
            const user = {
              email: vetData.email,
              role: 'veterinarian',
              tenantId: tenantId,
              name: vetData.name
            };
            
            try {
              if (!Platform || Platform.OS !== 'web') {
                if (rememberMe) await AsyncStorage.setItem('currentUser', JSON.stringify(user));
              } else {
                if (rememberMe) {
                  try { localStorage.setItem('currentUser', JSON.stringify(user)); } catch (e) {}
                } else {
                  try { sessionStorage.setItem('currentUser', JSON.stringify(user)); } catch (e) {}
                }
              }
            } catch (e) {}
            setUser(user);
            
            return { success: true, user };
          } else if (vetData.hasAccount) {
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
      
      try {
        if (!Platform || Platform.OS !== 'web') {
          if (rememberMe) await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        } else {
          if (rememberMe) {
            try { localStorage.setItem('currentUser', JSON.stringify(user)); } catch (e) {}
          } else {
            try { sessionStorage.setItem('currentUser', JSON.stringify(user)); } catch (e) {}
          }
        }
      } catch (e) {}
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
      
      // Clear browser history, cache and force navigation to login (web only)
      if (typeof window !== 'undefined') {
        try {
          if (typeof caches !== 'undefined' && 'keys' in caches) {
            caches.keys().then(names => names.forEach(name => caches.delete(name))).catch(() => {});
          }

          // Clear storages
          try { sessionStorage && sessionStorage.clear(); } catch (e) {}
          try { localStorage && localStorage.clear(); } catch (e) {}

          // Replace history entry and navigate to login to prevent back/URL access
          window.history.replaceState(null, '', '/auth/admin-login');
          // Use replace to ensure no back navigation to protected routes
          window.location.replace('/auth/admin-login');
        } catch (e) {
          // Ignore storage/navigation errors
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