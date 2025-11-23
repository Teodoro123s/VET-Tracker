import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { getTenantSubscriptionStatus } from './subscriptionService';
import { SUBSCRIPTION_CONFIG } from '../../constants/SubscriptionConfig';

export interface AccessOptions {
  required?: 'read' | 'write';
}

/**
 * Ensure tenant has access according to subscription status.
 * Throws an Error when access should be denied.
 */
export async function ensureTenantHasAccess(tenantId: string, opts: AccessOptions = {}) {
  const required = opts.required || 'write';

  console.log('=== ENSURE TENANT HAS ACCESS ===');
  console.log('Checking access for tenantId:', tenantId);
  console.log('Required access level:', required);

  // Check tenant document for explicit locks
  const tenantRef = doc(db, 'tenants', tenantId);
  const tenantSnap = await getDoc(tenantRef);
  
  console.log('Tenant document exists?', tenantSnap.exists());
  if (tenantSnap.exists()) {
    console.log('Tenant data:', tenantSnap.data());
  }
  
  if (!tenantSnap.exists()) {
    throw new Error('Tenant not found');
  }

  const tenantData = tenantSnap.data();
  const status = tenantData?.status || 'expired';

  if (status === 'locked') {
    throw new Error('Tenant account is locked');
  }

  // If active, allow
  if (status === 'active') return;

  // If expired, check grace period via subscription periods
  if (status === 'expired') {
    try {
      const subStatus = await getTenantSubscriptionStatus(tenantId);
      const active = subStatus.activePeriod;
      if (!active) {
        // No active period - check if within grace for last expired period
        // We'll treat this as no access for writes
        if (required === 'read') return; // allow read-only
        throw new Error('Subscription expired');
      }

      const now = new Date();
      const endDate = active.endDate;
      const graceEnd = new Date(endDate);
      graceEnd.setDate(endDate.getDate() + SUBSCRIPTION_CONFIG.GRACE_PERIOD_DAYS);

      const inGrace = now > endDate && now <= graceEnd;
      if (inGrace) {
        // allow reads, block writes
        if (required === 'read') return;
        throw new Error('Subscription in grace period - write access restricted');
      }

      // Past grace period
      throw new Error('Subscription expired and grace period ended');
    } catch (err) {
      // If anything goes wrong determining period, default to denying write access
      if (required === 'read') return;
      throw new Error('Access denied due to subscription status');
    }
  }

  // Default deny for unknown statuses
  if (required === 'read') return;
  throw new Error('Access denied');
}
