import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

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
  }
};