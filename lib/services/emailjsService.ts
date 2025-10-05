// EmailJS Service for VET Tracker
// Template ID: template_hoxe5k7

interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey?: string;
}

class EmailJSService {
  private config: EmailJSConfig = {
    serviceId: 'service_zefpsar',
    templateId: 'template_6w1b0xi', // Password reset template
    publicKey: process.env.EMAILJS_PUBLIC_KEY || 'ReUQK_p4eYlnZileo',
    privateKey: process.env.EMAILJS_PRIVATE_KEY || '',
  };

  // Method to send password reset emails
  async sendPasswordReset(email: string, newPassword: string): Promise<boolean> {
    const templateParams = {
      to_email: email,
      from_name: 'VetCare System',
      password: newPassword,
      message: `Your new password is: ${newPassword}\n\nPlease log in and change this password immediately.`,
      subject: 'VetCare - Password Reset'
    };
    return await this.sendEmail(templateParams);
  }

  async sendEmail(templateParams: any): Promise<boolean> {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: this.config.serviceId,
          template_id: this.config.templateId,
          user_id: this.config.publicKey,
          template_params: templateParams,
        }),
      });

      if (response.ok) {
        console.log(`Email sent successfully via EmailJS template ${this.config.templateId}`);
        return true;
      } else {
        console.error('EmailJS error:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('EmailJS service error:', error);
      return false;
    }
  }

  async sendAppointmentReminder(
    customerEmail: string,
    customerName: string,
    petName: string,
    appointmentDate: Date,
    notificationType: string
  ): Promise<boolean> {
    const templateParams = {
      to_email: customerEmail,
      customer_name: customerName,
      pet_name: petName,
      appointment_date: appointmentDate.toLocaleDateString(),
      appointment_time: appointmentDate.toLocaleTimeString(),
      notification_type: notificationType,
      subject: this.getEmailSubject(notificationType),
      clinic_name: 'VET Tracker',
      template_id: this.config.templateId,
    };

    return await this.sendEmail(templateParams);
  }

  private getEmailSubject(notificationType: string): string {
    switch (notificationType) {
      case 'today': return '🏥 Appointment Today - VET Tracker';
      case 'tomorrow': return '📅 Appointment Tomorrow - VET Tracker';
      case '2days': return '⏰ Upcoming Appointment in 2 Days - VET Tracker';
      case 'upcoming': return '📋 Upcoming Appointment This Week - VET Tracker';
      default: return '🔔 Appointment Reminder - VET Tracker';
    }
  }
}

export const emailjsService = new EmailJSService();