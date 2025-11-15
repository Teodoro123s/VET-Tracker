import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const TenantContext = createContext({
  userEmail,
  isSuperAdmin,
  tenantId,
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }) => {
  const { user } = useAuth();
  
  const userEmail = user?.email || null;
  const isSuperAdmin = user?.role === 'superadmin' || userEmail?.includes('superadmin') || false;
  const tenantId = isSuperAdmin ? null : (user?.tenantId || userEmail?.match(/^([^@]+)@/)?.[1] || null);

  return (
    
      {children}
    
  );
};