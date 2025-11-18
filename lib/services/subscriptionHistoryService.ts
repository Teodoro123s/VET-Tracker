import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface SubscriptionHistoryRecord {
  id: string;
  tenantId: string;
  email: string;
  action: 'created' | 'activated' | 'expired' | 'renewed' | 'cancelled';
  period: string;
  amount: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Add a subscription history record
 */
export async function addSubscriptionHistory(
  tenantId: string,
  email: string,
  action: 'created' | 'activated' | 'expired' | 'renewed' | 'cancelled',
  period: string,
  amount: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await addDoc(collection(db, 'subscriptionHistory'), {
      tenantId,
      email,
      action,
      period,
      amount,
      metadata: metadata || {},
      timestamp: Timestamp.now()
    });
    
    console.log(`📝 Subscription history recorded: ${action} for ${email}`);
  } catch (error) {
    console.error('Error adding subscription history:', error);
  }
}

/**
 * Get subscription history for a specific email
 */
export async function getSubscriptionHistory(
  email: string
): Promise<SubscriptionHistoryRecord[]> {
  try {
    const historyQuery = query(
      collection(db, 'subscriptionHistory'),
      where('email', '==', email),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(historyQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      tenantId: doc.data().tenantId,
      email: doc.data().email,
      action: doc.data().action,
      period: doc.data().period,
      amount: doc.data().amount,
      metadata: doc.data().metadata,
      timestamp: doc.data().timestamp.toDate()
    }));
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    return [];
  }
}

/**
 * Get all subscription history (for admin)
 */
export async function getAllSubscriptionHistory(): Promise<SubscriptionHistoryRecord[]> {
  try {
    const historyQuery = query(
      collection(db, 'subscriptionHistory'),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(historyQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      tenantId: doc.data().tenantId,
      email: doc.data().email,
      action: doc.data().action,
      period: doc.data().period,
      amount: doc.data().amount,
      metadata: doc.data().metadata,
      timestamp: doc.data().timestamp.toDate()
    }));
  } catch (error) {
    console.error('Error fetching all subscription history:', error);
    return [];
  }
}
