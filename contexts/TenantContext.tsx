import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

interface TenantContextType {
  userEmail: string | null;
  isSuperAdmin: boolean;
  tenantId: string | null;
}

const TenantContext = createContext<TenantContextType>({
  userEmail: null,
  isSuperAdmin: false,
  tenantId: null,
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  const userEmail = user?.email || null;
  const isSuperAdmin = user?.role === 'superadmin' || userEmail?.includes('superadmin') || false;
  const tenantId = isSuperAdmin ? null : (user?.tenantId || userEmail?.match(/^([^@]+)@/)?.[1] || null);

  return (
    <TenantContext.Provider value={{ userEmail, isSuperAdmin, tenantId }}>
      {children}
    </TenantContext.Provider>
  );
};