# Firebase Troubleshooting Guide

## Common Firebase Issues & Solutions

### 🔥 **Connection Issues**

#### Problem: "Firebase: Error (auth/network-request-failed)"
```javascript
// Solution: Add network error handling
const handleNetworkError = () => {
  EnhancedAlert.connectionLost(() => {
    // Retry logic
    window.location.reload();
  });
};
```

#### Problem: "Firebase app not initialized"
```javascript
// Check firebaseConfig.ts - ensure proper initialization
import { initializeApp } from 'firebase/app';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### 🔐 **Authentication Issues**

#### Problem: "auth/user-not-found" or "auth/wrong-password"
```javascript
// Enhanced error handling in AuthContext
const login = async (email, password) => {
  try {
    // Existing login logic...
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return { success: false, error: 'No account found with this email' };
    }
    if (error.code === 'auth/wrong-password') {
      return { success: false, error: 'Incorrect password' };
    }
    if (error.code === 'auth/network-request-failed') {
      return { success: false, error: 'Network error. Check connection.' };
    }
    return { success: false, error: 'Login failed' };
  }
};
```

#### Problem: Session persistence issues
```javascript
// Add to AuthContext
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      setUser(user);
    } else {
      setUser(null);
    }
    setLoading(false);
  });
  return unsubscribe;
}, []);
```

### 📊 **Firestore Issues**

#### Problem: "Missing or insufficient permissions"
```javascript
// Add permission checks
const checkPermissions = async (userEmail) => {
  try {
    const tenantId = await getTenantId(userEmail);
    if (!tenantId) {
      throw new Error('No tenant access');
    }
    return true;
  } catch (error) {
    EnhancedAlert.permissionDenied('access this data');
    return false;
  }
};
```

#### Problem: Tenant isolation not working
```javascript
// Fix getTenantId function
const getTenantId = async (userEmail) => {
  if (!userEmail) return null;
  
  try {
    // Direct tenant lookup
    const q = query(collection(db, 'tenants'), where('email', '==', userEmail));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return snapshot.docs[0].data().tenantId || snapshot.docs[0].id;
    }
    
    // Fallback to email prefix
    const emailPrefix = userEmail.split('@')[0];
    const tenantDoc = await getDoc(doc(db, 'tenants', emailPrefix));
    
    return tenantDoc.exists() ? emailPrefix : null;
  } catch (error) {
    console.error('Tenant ID lookup failed:', error);
    return null;
  }
};
```

### 🔄 **Data Synchronization Issues**

#### Problem: Stale data after updates
```javascript
// Add real-time listeners
const useRealtimeData = (collection, userEmail) => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, `tenants/${tenantId}/${collection}`),
      (snapshot) => {
        const newData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(newData);
      },
      (error) => {
        console.error('Real-time sync error:', error);
        EnhancedAlert.connectionLost();
      }
    );
    
    return unsubscribe;
  }, [userEmail]);
  
  return data;
};
```

#### Problem: Batch operations failing
```javascript
// Use Firebase batch operations
import { writeBatch } from 'firebase/firestore';

const batchUpdate = async (updates) => {
  const batch = writeBatch(db);
  
  updates.forEach(({ docRef, data }) => {
    batch.update(docRef, data);
  });
  
  try {
    await batch.commit();
    EnhancedAlert.operationSuccess('Batch Update', 'All changes saved successfully');
  } catch (error) {
    EnhancedAlert.operationError('batch update', error.message);
  }
};
```

### 📱 **Mobile-Specific Issues**

#### Problem: AsyncStorage not working
```javascript
// Add error handling for AsyncStorage
const safeAsyncStorage = {
  async getItem(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('AsyncStorage get error:', error);
      return null;
    }
  },
  
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('AsyncStorage set error:', error);
      EnhancedAlert.error('Storage Error', 'Failed to save data locally');
    }
  }
};
```

### 🚀 **Performance Issues**

#### Problem: Slow query performance
```javascript
// Add query optimization
const getOptimizedData = async (userEmail, limit = 50) => {
  try {
    const tenantId = await getTenantId(userEmail);
    const q = query(
      collection(db, `tenants/${tenantId}/customers`),
      orderBy('createdAt', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Query error:', error);
    return [];
  }
};
```

#### Problem: Too many reads
```javascript
// Implement caching
const dataCache = new Map();

const getCachedData = async (key, fetchFunction, ttl = 300000) => {
  const cached = dataCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetchFunction();
  dataCache.set(key, { data, timestamp: Date.now() });
  return data;
};
```

## 🛠️ **Quick Fixes**

### 1. Clear Firebase Cache
```javascript
// Add to app startup
import { clearIndexedDbPersistence } from 'firebase/firestore';

const clearFirebaseCache = async () => {
  try {
    await clearIndexedDbPersistence(db);
    console.log('Firebase cache cleared');
  } catch (error) {
    console.log('Cache clear failed:', error);
  }
};
```

### 2. Retry Failed Operations
```javascript
const retryOperation = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 3. Monitor Connection Status
```javascript
const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};
```

## 🔍 **Debugging Tools**

### Enable Firebase Debug Mode
```javascript
// Add to firebaseConfig.ts
import { connectFirestoreEmulator } from 'firebase/firestore';

if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

### Add Comprehensive Logging
```javascript
const logFirebaseOperation = (operation, data, error = null) => {
  console.group(`🔥 Firebase: ${operation}`);
  console.log('Data:', data);
  if (error) console.error('Error:', error);
  console.groupEnd();
};
```

## 📋 **Checklist for Firebase Issues**

- [ ] Check internet connection
- [ ] Verify Firebase configuration
- [ ] Check Firestore security rules
- [ ] Validate user permissions
- [ ] Test with different user accounts
- [ ] Check browser console for errors
- [ ] Verify data structure matches expectations
- [ ] Test on different devices/browsers
- [ ] Check Firebase project quotas
- [ ] Validate environment variables

## 🆘 **Emergency Recovery**

If Firebase is completely broken:

1. **Backup current data** (if accessible)
2. **Check Firebase console** for service status
3. **Revert to last working commit**
4. **Use offline mode** if available
5. **Contact Firebase support** if needed

## 📞 **Getting Help**

- Firebase Documentation: https://firebase.google.com/docs
- Stack Overflow: Tag with `firebase` and `react-native`
- Firebase Support: https://firebase.google.com/support