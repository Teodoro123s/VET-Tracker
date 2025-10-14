import { db } from '../config/firebaseConfig';
import { collection, query, where, orderBy, limit, startAfter, getDocs, DocumentSnapshot } from 'firebase/firestore';

interface PaginationResult<T> {
  data: T[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

export const paginatedFirebaseService = {
  async getAppointmentsPaginated(
    userEmail: string, 
    pageSize: number = 10, 
    lastDoc?: DocumentSnapshot
  ): Promise<PaginationResult<any>> {
    try {
      const tenantId = userEmail.split('@')[0];
      let q = query(
        collection(db, `tenants/${tenantId}/appointments`),
        orderBy('appointmentDate', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return {
        data,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Pagination error:', error);
      return { data: [], lastDoc: null, hasMore: false };
    }
  },

  async getTodayAppointmentsCount(userEmail: string): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tenantId = userEmail.split('@')[0];
      const q = query(
        collection(db, `tenants/${tenantId}/appointments`),
        where('appointmentDate', '>=', today),
        where('appointmentDate', '<', tomorrow)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Count error:', error);
      return 0;
    }
  }
};