// Gmail API Service for VET Tracker
// Service ID: service_zefpsar

interface GmailConfig {
  serviceId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
}

class GmailService {
  private config: GmailConfig = {
    serviceId: 'service_zefpsar',
    clientId: process.env.GMAIL_CLIENT_ID || '',
    clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
    refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
  };

  async getAccessToken(): Promise<string> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.config.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();
      this.config.accessToken = data.access_token;
      return data.access_token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw error;
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/html; charset=utf-8`,
        '',
        body
      ].join('\n');

      const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedEmail,
        }),
      });

      if (response.ok) {
        console.log(`Email sent successfully to ${to} via service ${this.config.serviceId}`);
        return true;
      } else {
        console.error('Failed to send email:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Gmail service error:', error);
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
    const subject = this.getEmailSubject(notificationType);
    const body = this.getEmailBody(customerName, petName, appointmentDate, notificationType);
    
    return await this.sendEmail(customerEmail, subject, body);
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

  private getEmailBody(
    customerName: string,
    petName: string,
    appointmentDate: Date,
    notificationType: string
  ): string {
    const dateStr = appointmentDate.toLocaleDateString();
    const timeStr = appointmentDate.toLocaleTimeString();
    
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #800000; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">VET Tracker</h1>
            <p style="margin: 5px 0 0 0;">Appointment Reminder</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #800000; margin-top: 0;">Dear ${customerName},</h2>
            
            <p>This is a reminder about your upcoming appointment for <strong>${petName}</strong>.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #800000; margin-top: 0;">Appointment Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 8px 0;"><strong>📅 Date:</strong> ${dateStr}</li>
                <li style="margin: 8px 0;"><strong>🕐 Time:</strong> ${timeStr}</li>
                <li style="margin: 8px 0;"><strong>🐾 Pet:</strong> ${petName}</li>
              </ul>
            </div>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; border-left: 4px solid #2196f3;">
              <p style="margin: 0;"><strong>📝 Important:</strong> Please arrive 15 minutes early for check-in.</p>
            </div>
            
            <p>If you need to reschedule, please contact us as soon as possible.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                <strong>VET Tracker Team</strong><br>
                <em>Service ID: service_zefpsar</em>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const gmailService = new GmailService();