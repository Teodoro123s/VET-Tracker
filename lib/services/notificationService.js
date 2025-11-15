import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export const notificationService = {
  async sendAnnouncement(message, userEmail, targetAudience: 'all' | 'vets' | 'staff' = 'all') {
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'announcement',
        message,
        sender,
        targetAudience,
        timestamp: serverTimestamp(),
        read,
        priority: 'normal'
      });
      return { success};
    } catch (error) {
      console.error('Failed to send announcement:', error);
      return { success, error };
    }
  },

  async sendUrgentAlert(message, userEmail) {
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'urgent',
        message,
        sender,
        targetAudience: 'all',
        timestamp: serverTimestamp(),
        read,
        priority: 'high'
      });
      return { success};
    } catch (error) {
      return { success, error };
    }
  }
};