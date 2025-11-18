# Missing Features and Implementation Guide

## Current Implementation Status ✅

### Already Implemented:
1. ✅ SubscriptionContext - Real-time subscription tracking
2. ✅ Subscription countdown display (Sidebar, Header, Settings)
3. ✅ Route restrictions for expired subscriptions
4. ✅ Visual indicators (badges, warnings, lock icons)
5. ✅ Queued subscription tracking
6. ✅ Subscription scheduler (auto-activation of queued periods)
7. ✅ Email filtering for admin-only subscription management

---

## Missing Features & Required Implementation 🔧

### 1. Route Protection Middleware (HIGH PRIORITY)
**Purpose**: Prevent direct URL access to restricted routes when subscription expired

**Files to Create/Modify**:
- `app/(protected)/_layout.tsx` - Protected route group
- `middleware/subscriptionGuard.ts` - Route protection logic

**Implementation**:
```typescript
// middleware/subscriptionGuard.ts
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

export function useProtectedRoute() {
  const { user } = useAuth();
  const { hasActiveSubscription, loading } = useSubscription();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inRestrictedArea = segments[0] === 'client' && 
                             !['settings'].includes(segments[1]);

    if (user?.role === 'admin' && 
        !hasActiveSubscription && 
        inRestrictedArea) {
      router.replace('/client/settings');
    }
  }, [hasActiveSubscription, loading, segments, user]);
}
```

**Usage in Protected Routes**:
```typescript
// app/client/_layout.tsx
import { useProtectedRoute } from '@/middleware/subscriptionGuard';

export default function ClientLayout() {
  useProtectedRoute();
  return <Stack />;
}
```

---

### 2. Automatic Tenant Status Update (HIGH PRIORITY)
**Purpose**: Update tenant status to 'expired' when subscription ends

**File to Modify**: `lib/services/subscriptionService.ts`

**Add Function**:
```typescript
export async function updateTenantSubscriptionStatus(email: string, status: 'active' | 'expired'): Promise<void> {
  try {
    const tenantsQuery = query(
      collection(db, 'tenants'),
      where('email', '==', email)
    );
    
    const snapshot = await getDocs(tenantsQuery);
    
    for (const docSnap of snapshot.docs) {
      await updateDoc(doc(db, 'tenants', docSnap.id), {
        status: status,
        lastStatusUpdate: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error updating tenant status:', error);
  }
}
```

**Integrate into activateQueuedPeriods**:
```typescript
// After marking subscription as expired
await updateTenantSubscriptionStatus(expiredPeriod.email, 'expired');

// After activating queued subscription
await updateTenantSubscriptionStatus(nextPeriod.email, 'active');
```

---

### 3. Email Notification Service (MEDIUM PRIORITY)
**Purpose**: Notify admins about subscription status changes

**File to Create**: `lib/services/subscriptionNotificationService.ts`

**Functions**:
```typescript
export async function sendExpirationWarning(
  email: string, 
  daysRemaining: number,
  endDate: Date
): Promise<void> {
  // Send email when subscription has 7, 3, or 1 day(s) remaining
}

export async function sendExpirationNotification(
  email: string,
  period: string
): Promise<void> {
  // Send email when subscription expires
}

export async function sendActivationNotification(
  email: string,
  period: string,
  endDate: Date
): Promise<void> {
  // Send email when new/queued subscription activates
}

export async function sendQueuedConfirmation(
  email: string,
  period: string,
  position: number
): Promise<void> {
  // Send email confirming subscription is queued
}
```

**Parameters**:
- `email`: User's email address
- `daysRemaining`: Days until expiration
- `endDate`: Subscription end date
- `period`: Subscription period (e.g., "1 month")
- `position`: Queue position for queued subscriptions

---

### 4. Grace Period Logic (MEDIUM PRIORITY)
**Purpose**: Allow limited access for X days after expiration

**File to Modify**: `contexts/SubscriptionContext.tsx`

**Add to State**:
```typescript
interface SubscriptionStatus {
  // ... existing fields
  isInGracePeriod: boolean;
  graceDaysRemaining: number;
}
```

**Grace Period Calculation**:
```typescript
const GRACE_PERIOD_DAYS = 3;

const gracePeriodEnd = new Date(firstTransaction.endDate);
gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

const isInGracePeriod = now <= gracePeriodEnd && now > firstTransaction.endDate;
const graceDaysRemaining = isInGracePeriod 
  ? Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  : 0;
```

**Update Access Logic**:
```typescript
// In Sidebar.tsx - Allow access during grace period
const hasAccess = hasActiveSubscription || isInGracePeriod;
```

---

### 5. Subscription History Tracking (LOW PRIORITY)
**Purpose**: Track all subscription changes and payments

**File to Create**: `lib/services/subscriptionHistoryService.ts`

**Functions**:
```typescript
export async function addSubscriptionHistory(
  tenantId: string,
  email: string,
  action: 'created' | 'activated' | 'expired' | 'renewed' | 'cancelled',
  period: string,
  amount: string,
  metadata?: Record<string, any>
): Promise<void> {
  await addDoc(collection(db, 'subscriptionHistory'), {
    tenantId,
    email,
    action,
    period,
    amount,
    metadata,
    timestamp: Timestamp.now()
  });
}

export async function getSubscriptionHistory(
  email: string
): Promise<SubscriptionHistoryRecord[]> {
  const historyQuery = query(
    collection(db, 'subscriptionHistory'),
    where('email', '==', email),
    orderBy('timestamp', 'desc')
  );
  
  const snapshot = await getDocs(historyQuery);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate()
  }));
}
```

**Usage**:
```typescript
// When adding subscription
await addSubscriptionHistory(tenantId, email, 'created', period, amount);

// When activating queued
await addSubscriptionHistory(tenantId, email, 'activated', period, amount);

// When expiring
await addSubscriptionHistory(tenantId, email, 'expired', period, amount);
```

---

### 6. In-App Notifications (MEDIUM PRIORITY)
**Purpose**: Show system notifications for subscription events

**File to Modify**: `lib/services/notificationService.ts`

**Add Function**:
```typescript
export async function createSubscriptionNotification(
  tenantId: string,
  type: 'warning' | 'expired' | 'activated',
  message: string
): Promise<void> {
  await addDoc(collection(db, 'notifications'), {
    tenantId,
    type: 'subscription',
    priority: type === 'expired' ? 'high' : 'medium',
    title: getNotificationTitle(type),
    message,
    read: false,
    createdAt: Timestamp.now()
  });
}

function getNotificationTitle(type: string): string {
  switch(type) {
    case 'warning': return '⚠️ Subscription Expiring Soon';
    case 'expired': return '❌ Subscription Expired';
    case 'activated': return '✅ Subscription Activated';
    default: return 'Subscription Update';
  }
}
```

**Integration Points**:
```typescript
// In subscriptionScheduler or manual checks
if (daysRemaining <= 7) {
  await createSubscriptionNotification(
    tenantId,
    'warning',
    `Your subscription expires in ${daysRemaining} days`
  );
}

if (!hasActiveSubscription) {
  await createSubscriptionNotification(
    tenantId,
    'expired',
    'Your subscription has expired. Contact support to renew.'
  );
}
```

---

### 7. SuperAdmin Analytics (LOW PRIORITY)
**Purpose**: Show subscription statistics in superadmin dashboard

**File to Modify**: `app/server/superadmin-dashboard.tsx`

**Add Functions**:
```typescript
async function loadSubscriptionAnalytics() {
  const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
  const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
  
  const now = new Date();
  let activeCount = 0;
  let expiredCount = 0;
  let expiringCount = 0;
  
  const tenantsByEmail = new Map();
  
  transactionsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate();
    const periodDays = getPeriodDays(data.period);
    const endDate = new Date(createdAt);
    endDate.setDate(endDate.getDate() + periodDays);
    
    if (!tenantsByEmail.has(data.email)) {
      tenantsByEmail.set(data.email, []);
    }
    tenantsByEmail.get(data.email).push({ ...data, endDate });
  });
  
  tenantsByEmail.forEach((transactions, email) => {
    transactions.sort((a, b) => a.createdAt - b.createdAt);
    const first = transactions[0];
    
    if (now <= first.endDate) {
      const daysLeft = Math.ceil((first.endDate - now) / (1000*60*60*24));
      activeCount++;
      if (daysLeft <= 7) expiringCount++;
    } else {
      expiredCount++;
    }
  });
  
  return {
    totalSubscriptions: tenantsByEmail.size,
    activeCount,
    expiredCount,
    expiringCount,
    revenue: calculateRevenue(transactionsSnapshot.docs)
  };
}
```

**Display Metrics**:
- Total active subscriptions
- Expiring soon count (≤7 days)
- Expired subscriptions count
- Revenue from subscriptions
- Most popular period (1 month, 6 months, etc.)

---

### 8. Subscription Pause/Resume (LOW PRIORITY)
**Purpose**: Allow pausing subscriptions (stops countdown)

**Database Fields to Add**:
```typescript
interface SubscriptionPeriod {
  // ... existing fields
  isPaused: boolean;
  pausedAt?: Date;
  pausedDaysRemaining?: number;
}
```

**Functions to Implement**:
```typescript
export async function pauseSubscription(email: string): Promise<void> {
  // Find active subscription
  // Calculate days remaining
  // Update status to 'paused'
  // Store pausedDaysRemaining
}

export async function resumeSubscription(email: string): Promise<void> {
  // Find paused subscription
  // Calculate new endDate from pausedDaysRemaining
  // Update status to 'active'
}
```

---

### 9. Payment Integration (FUTURE)
**Purpose**: Integrate actual payment processing

**Required Services**:
- PayPal/Stripe integration
- Payment verification
- Receipt generation
- Refund handling

**Files to Create**:
- `lib/services/paymentService.ts`
- `lib/services/receiptService.ts`

---

### 10. Subscription Tier Management (FUTURE)
**Purpose**: Different subscription tiers with different features

**Database Structure**:
```typescript
interface SubscriptionTier {
  id: string;
  name: 'Basic' | 'Pro' | 'Enterprise';
  price: number;
  features: string[];
  maxUsers: number;
  maxPets: number;
  maxStorage: number;
}
```

**Feature Restrictions**:
```typescript
export function hasFeatureAccess(
  userTier: string,
  feature: string
): boolean {
  const tierFeatures = {
    'Basic': ['appointments', 'customers'],
    'Pro': ['appointments', 'customers', 'records', 'notifications'],
    'Enterprise': ['all']
  };
  
  return tierFeatures[userTier]?.includes(feature) || 
         tierFeatures[userTier]?.includes('all');
}
```

---

## Implementation Priority

### Phase 1 (Critical - Implement Now):
1. ✅ Route Protection Middleware
2. ✅ Automatic Tenant Status Update
3. Email Notification Service (expiration warnings)

### Phase 2 (Important - Next Sprint):
4. Grace Period Logic
5. In-App Notifications
6. Subscription History Tracking

### Phase 3 (Nice to Have - Future):
7. SuperAdmin Analytics Dashboard
8. Subscription Pause/Resume
9. Payment Integration
10. Subscription Tier Management

---

## Testing Checklist

### Manual Testing:
- [ ] Add subscription period for new admin
- [ ] Verify countdown displays correctly
- [ ] Test route restrictions when expired
- [ ] Check queued subscription activation
- [ ] Verify email notifications sent
- [ ] Test grace period access
- [ ] Check settings page shows correct status
- [ ] Verify superadmin can manage all subscriptions

### Automated Testing (Optional):
- Unit tests for SubscriptionContext calculations
- Integration tests for subscription activation
- E2E tests for restricted route access

---

## Database Indexes Required

Add these to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "email", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tenants",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "role", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## Configuration Constants

**File**: `constants/SubscriptionConfig.ts`

```typescript
export const SUBSCRIPTION_CONFIG = {
  GRACE_PERIOD_DAYS: 3,
  WARNING_THRESHOLD_DAYS: 7,
  SCHEDULER_INTERVAL_MS: 3600000, // 1 hour
  
  PERIODS: {
    '1 month': { days: 30, price: 7499 },
    '6 months': { days: 180, price: 44994 },
    '1 year': { days: 365, price: 89988 },
    '2 years': { days: 730, price: 179976 }
  },
  
  NOTIFICATION_DAYS: [7, 3, 1], // Send notifications at these days remaining
  
  SUPPORT_CONTACT: {
    email: 'support@vettracker.com',
    phone: '+1 (555) 123-4567'
  }
};
```

---

**Last Updated**: November 18, 2025
**Status**: Implementation Guide - Ready for Development
