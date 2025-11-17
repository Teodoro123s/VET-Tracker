import { addDoc, collection, serverTimestamp, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface InAppNotification {
  id?: string;
  title: string;
  message: string;
  type: string;
  createdAt: Date;
  read: boolean;
  targetAudience?: string;
  sender?: string;
  priority?: string;
}

export const notificationService = {
  async sendAnnouncement(message: string, userEmail: string, targetAudience: 'all' | 'vets' | 'staff' = 'all') {
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'announcement',
        message,
        sender: userEmail,
        targetAudience,
        timestamp: serverTimestamp(),
        read: false,
        priority: 'normal'
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to send announcement:', error);
      return { success: false, error };
    }
  },

  async sendUrgentAlert(message: string, userEmail: string) {
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'urgent',
        message,
        sender: userEmail,
        targetAudience: 'all',
        timestamp: serverTimestamp(),
        read: false,
        priority: 'high'
      });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },

  async getInAppNotifications(tenantId: string, userEmail: string): Promise<InAppNotification[]> {
    try {
      const q = query(
        collection(db, `tenants/${tenantId}/notifications`),
        where('targetAudience', 'in', ['all', userEmail])
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as InAppNotification[];
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  },

  async markNotificationAsRead(tenantId: string, notificationId: string) {
    try {
      await updateDoc(doc(db, `tenants/${tenantId}/notifications`, notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  subscribeToNotifications(tenantId: string, userEmail: string, callback: (notifications: InAppNotification[]) => void) {
    const q = query(
      collection(db, `tenants/${tenantId}/notifications`),
      where('targetAudience', 'in', ['all', userEmail])
    );
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as InAppNotification[];
      callback(notifications);
    });
  }
};