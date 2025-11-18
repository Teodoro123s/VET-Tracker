import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/config/firebaseConfig';
import { useAuth } from './AuthContext';
import { SUBSCRIPTION_CONFIG } from '../constants/SubscriptionConfig';
import { sendExpirationWarning, createSubscriptionNotification } from '../lib/services/subscriptionNotificationService';

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  daysRemaining: number;
  totalDaysRemaining: number; // Including queued subscriptions
  currentPeriod: string;
  endDate: Date | null;
  queuedPeriods: number;
  loading: boolean;
  isInGracePeriod: boolean;
  graceDaysRemaining: number;
}

const SubscriptionContext = createContext<SubscriptionStatus>({
  hasActiveSubscription: true,
  daysRemaining: 0,
  totalDaysRemaining: 0,
  currentPeriod: '',
  endDate: null,
  queuedPeriods: 0,
  loading: true,
  isInGracePeriod: false,
  graceDaysRemaining: 0,
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    hasActiveSubscription: true,
    daysRemaining: 0,
    totalDaysRemaining: 0,
    currentPeriod: '',
    endDate: null,
    queuedPeriods: 0,
    loading: true,
    isInGracePeriod: false,
    graceDaysRemaining: 0,
  });
  
  const [lastWarningDay, setLastWarningDay] = useState<number>(-1);

  useEffect(() => {
    // Skip subscription check for superadmin and veterinarians
    if (!user?.email || user?.role === 'superadmin' || user?.role === 'veterinarian') {
      setSubscriptionStatus({
        hasActiveSubscription: true,
        daysRemaining: 999999,
        totalDaysRemaining: 999999,
        currentPeriod: 'N/A',
        endDate: null,
        queuedPeriods: 0,
        loading: false,
        isInGracePeriod: false,
        graceDaysRemaining: 0,
      });
      return;
    }

    // Only check for admin users
    if (user?.role !== 'admin') {
      setSubscriptionStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const transactions = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate() || new Date();
          const periodDays = data.period === '1 month' ? 30 : 
                           data.period === '6 months' ? 180 : 
                           data.period === '1 year' ? 365 : 730;
          const endDate = new Date(createdAt);
          endDate.setDate(createdAt.getDate() + periodDays);
          
          return {
            id: doc.id,
            email: data.email,
            period: data.period,
            startDate: createdAt,
            endDate,
            createdAt
          };
        })
        .filter(t => t.email === user.email)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const now = new Date();
      
      if (transactions.length === 0) {
        setSubscriptionStatus({
          hasActiveSubscription: false,
          daysRemaining: 0,
          totalDaysRemaining: 0,
          currentPeriod: '',
          endDate: null,
          queuedPeriods: 0,
          loading: false,
          isInGracePeriod: false,
          graceDaysRemaining: 0,
        });
        return;
      }

      // Check first transaction (active or expired)
      const firstTransaction = transactions[0];
      const hasActive = now <= firstTransaction.endDate;
      const daysRemaining = hasActive 
        ? Math.ceil((firstTransaction.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Calculate grace period
      const gracePeriodEnd = new Date(firstTransaction.endDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + SUBSCRIPTION_CONFIG.GRACE_PERIOD_DAYS);
      
      const isInGracePeriod = now <= gracePeriodEnd && now > firstTransaction.endDate;
      const graceDaysRemaining = isInGracePeriod 
        ? Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Send expiration warnings at configured days
      if (hasActive && SUBSCRIPTION_CONFIG.NOTIFICATION_DAYS.includes(daysRemaining)) {
        if (lastWarningDay !== daysRemaining) {
          setLastWarningDay(daysRemaining);
          // Send warning (async, don't await)
          sendExpirationWarning(user.email, daysRemaining, firstTransaction.endDate);
          createSubscriptionNotification(
            user.email,
            user.email,
            'warning',
            `Your subscription expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}. Please contact support to renew.`
          );
        }
      }

      // Calculate total days including queued subscriptions
      let totalDays = daysRemaining;
      let lastEndDate = firstTransaction.endDate;
      
      for (let i = 1; i < transactions.length; i++) {
        const transaction = transactions[i];
        const periodDays = transaction.period === '1 month' ? 30 : 
                          transaction.period === '6 months' ? 180 : 
                          transaction.period === '1 year' ? 365 : 730;
        totalDays += periodDays;
        
        // Update last end date
        const queuedEndDate = new Date(lastEndDate);
        queuedEndDate.setDate(queuedEndDate.getDate() + periodDays);
        lastEndDate = queuedEndDate;
      }

      setSubscriptionStatus({
        hasActiveSubscription: hasActive,
        daysRemaining,
        totalDaysRemaining: totalDays,
        currentPeriod: firstTransaction.period,
        endDate: firstTransaction.endDate,
        queuedPeriods: transactions.length - 1,
        loading: false,
        isInGracePeriod,
        graceDaysRemaining,
      });
    });

    return () => unsubscribe();
  }, [user?.email, user?.role]);

  return (
    <SubscriptionContext.Provider value={subscriptionStatus}>
      {children}
    </SubscriptionContext.Provider>
  );
};
