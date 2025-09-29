import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { emailjsService } from './emailjsService';
import { aiService } from './aiService';

export interface AppointmentNotification {
  id?: string;
  appointmentId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  petName: string;
  appointmentDate: Date;
  notificationType: 'today' | 'tomorrow' | '2days' | 'upcoming' | 'reminder';
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  emailSent: boolean;
  inAppNotificationSent: boolean;
}

export interface InAppNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'reminder' | 'info' | 'warning';
  read: boolean;
  createdAt: Date;
  appointmentId?: string;
}

class NotificationService {
  // Get upcoming appointments that need notifications
  async getAppointmentsForNotification(tenantId: string): Promise<any[]> {
    const today = new Date();
    const twoDaysFromNow = new Date(today.getTime() + (2 * 24 * 60 * 60 * 1000));
    
    const appointmentsRef = collection(db, `tenants/${tenantId}/appointments`);
    const q = query(
      appointmentsRef,
      where('appointmentDate', '>=', today),
      where('appointmentDate', '<=', twoDaysFromNow)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Create notification records
  async createNotification(tenantId: string, notification: AppointmentNotification): Promise<string> {
    const notificationsRef = collection(db, `tenants/${tenantId}/notifications`);
    const docRef = await addDoc(notificationsRef, {
      ...notification,
      createdAt: new Date()
    });
    return docRef.id;
  }

  // AI-powered email notification using EmailJS (template_hoxe5k7)
  async sendEmailNotification(notification: AppointmentNotification): Promise<boolean> {
    try {
      // Use AI to personalize the email
      const personalization = await aiService.personalizeEmail(
        notification.customerEmail,
        notification.customerName,
        notification.petName,
        'Appointment reminder',
        notification.notificationType,
        [] // Customer history - can be fetched from DB
      );

      console.log('🤖 AI Personalization:', personalization);
      
      return await emailjsService.sendAppointmentReminder(
        notification.customerEmail,
        notification.customerName,
        notification.petName,
        notification.appointmentDate,
        notification.notificationType
      );
    } catch (error) {
      console.error('Failed to send AI-powered email:', error);
      return false;
    }
  }

  // Create in-app notification
  async createInAppNotification(tenantId: string, notification: InAppNotification): Promise<string> {
    const inAppNotificationsRef = collection(db, `tenants/${tenantId}/inAppNotifications`);
    const docRef = await addDoc(inAppNotificationsRef, notification);
    return docRef.id;
  }

  // Get in-app notifications for user
  async getInAppNotifications(tenantId: string, userId: string): Promise<InAppNotification[]> {
    const notificationsRef = collection(db, `tenants/${tenantId}/inAppNotifications`);
    const q = query(
      notificationsRef,
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InAppNotification));
  }

  // Mark notification as read
  async markNotificationAsRead(tenantId: string, notificationId: string): Promise<void> {
    const notificationRef = doc(db, `tenants/${tenantId}/inAppNotifications`, notificationId);
    await updateDoc(notificationRef, { read: true });
  }

  // AI-powered appointment notification processing
  async processAppointmentNotifications(tenantId: string, userEmail: string): Promise<void> {
    console.log('🤖 AI Processing appointment notifications...');
    const appointments = await this.getAppointmentsForNotification(tenantId);
    
    for (const appointment of appointments) {
      const notificationType = this.determineNotificationType(appointment.appointmentDate);
      
      if (notificationType) {
        // AI Analysis: Optimize notification timing
        const aiTiming = await aiService.optimizeNotificationTiming(
          { email: appointment.customerEmail, name: appointment.customerName },
          appointment,
          [] // Response history - can be fetched from DB
        );
        
        console.log('🤖 AI Optimal timing:', aiTiming);
        
        // Check if notification already sent
        const existingNotification = await this.checkExistingNotification(
          tenantId, 
          appointment.id, 
          notificationType
        );
        
        if (!existingNotification) {
          const notification: AppointmentNotification = {
            appointmentId: appointment.id,
            customerId: appointment.customerId,
            customerEmail: appointment.customerEmail,
            customerName: appointment.customerName,
            petName: appointment.petName,
            appointmentDate: appointment.appointmentDate,
            notificationType,
            status: 'pending',
            emailSent: false,
            inAppNotificationSent: false
          };

          // Create notification record
          const notificationId = await this.createNotification(tenantId, notification);

          // AI-powered email sending
          const emailSent = await this.sendEmailNotification(notification);

          // Create AI-enhanced in-app notification
          const inAppNotification: InAppNotification = {
            userId: userEmail,
            title: `🤖 ${this.getNotificationTitle(notificationType)}`,
            message: `AI-optimized: ${this.getNotificationMessage(notification)}`,
            type: 'appointment',
            read: false,
            createdAt: new Date(),
            appointmentId: appointment.id
          };

          await this.createInAppNotification(tenantId, inAppNotification);

          // Update notification status
          const notificationRef = doc(db, `tenants/${tenantId}/notifications`, notificationId);
          await updateDoc(notificationRef, {
            status: emailSent ? 'sent' : 'failed',
            emailSent,
            inAppNotificationSent: true,
            sentAt: new Date(),
            aiOptimized: true,
            aiTiming: aiTiming
          });
        }
      }
    }
  }

  private determineNotificationType(appointmentDate: Date): string | null {
    const now = new Date();
    const diffTime = appointmentDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    if (diffDays === 2) return '2days';
    if (diffDays > 2 && diffDays <= 7) return 'upcoming';
    
    return null;
  }

  private async checkExistingNotification(
    tenantId: string, 
    appointmentId: string, 
    notificationType: string
  ): Promise<boolean> {
    const notificationsRef = collection(db, `tenants/${tenantId}/notifications`);
    const q = query(
      notificationsRef,
      where('appointmentId', '==', appointmentId),
      where('notificationType', '==', notificationType)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  private getEmailSubject(notificationType: string): string {
    switch (notificationType) {
      case 'today': return 'Appointment Today - VET Tracker';
      case 'tomorrow': return 'Appointment Tomorrow - VET Tracker';
      case '2days': return 'Upcoming Appointment in 2 Days - VET Tracker';
      case 'upcoming': return 'Upcoming Appointment This Week - VET Tracker';
      default: return 'Appointment Reminder - VET Tracker';
    }
  }

  private getEmailBody(notification: AppointmentNotification): string {
    const dateStr = notification.appointmentDate.toLocaleDateString();
    const timeStr = notification.appointmentDate.toLocaleTimeString();
    
    return `
      Dear ${notification.customerName},
      
      This is a reminder about your upcoming appointment for ${notification.petName}.
      
      Appointment Details:
      - Date: ${dateStr}
      - Time: ${timeStr}
      - Pet: ${notification.petName}
      
      Please arrive 15 minutes early for check-in.
      
      If you need to reschedule, please contact us as soon as possible.
      
      Best regards,
      VET Tracker Team
    `;
  }

  private getNotificationTitle(notificationType: string): string {
    switch (notificationType) {
      case 'today': return 'Appointment Today';
      case 'tomorrow': return 'Appointment Tomorrow';
      case '2days': return 'Appointment in 2 Days';
      case 'upcoming': return 'Upcoming Appointment';
      default: return 'Appointment Reminder';
    }
  }

  private getNotificationMessage(notification: AppointmentNotification): string {
    const dateStr = notification.appointmentDate.toLocaleDateString();
    const timeStr = notification.appointmentDate.toLocaleTimeString();
    
    return `${notification.customerName} has an appointment for ${notification.petName} on ${dateStr} at ${timeStr}`;
  }
}

export const notificationService = new NotificationService();