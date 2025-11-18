import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { sendCredentialsEmail } from '../utils/emailService';

/**
 * Send expiration warning notification
 */
export async function sendExpirationWarning(
  email: string, 
  daysRemaining: number,
  endDate: Date
): Promise<{ success: boolean; message: string }> {
  try {
    const subject = `⚠️ VET-Tracker Subscription Expiring in ${daysRemaining} Day${daysRemaining > 1 ? 's' : ''}`;
    
    const message = `
Dear ${email.split('@')[0]},

Your VET-Tracker subscription is expiring soon!

⏰ Days Remaining: ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}
📅 Expiration Date: ${endDate.toLocaleDateString()}

To avoid service interruption, please contact support to renew your subscription:

📧 Email: support@vettracker.com
📞 Phone: +1 (555) 123-4567

Thank you for using VET-Tracker!

Best regards,
VET-Tracker Team
    `.trim();

    // Send email using existing email service
    await sendCredentialsEmail(email, message, subject);
    
    console.log(`✉️ Expiration warning sent to ${email} (${daysRemaining} days remaining)`);
    
    return {
      success: true,
      message: `Warning email sent to ${email}`
    };
  } catch (error) {
    console.error('Error sending expiration warning:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Send subscription expiration notification
 */
export async function sendExpirationNotification(
  email: string,
  period: string
): Promise<{ success: boolean; message: string }> {
  try {
    const subject = '❌ VET-Tracker Subscription Expired';
    
    const message = `
Dear ${email.split('@')[0]},

Your VET-Tracker subscription has expired.

📊 Expired Period: ${period}
⚠️ Status: Most features are now restricted

To regain full access to VET-Tracker, please contact support to renew your subscription:

📧 Email: support@vettracker.com
📞 Phone: +1 (555) 123-4567

We look forward to serving you again!

Best regards,
VET-Tracker Team
    `.trim();

    await sendCredentialsEmail(email, message, subject);
    
    console.log(`✉️ Expiration notification sent to ${email}`);
    
    return {
      success: true,
      message: `Expiration email sent to ${email}`
    };
  } catch (error) {
    console.error('Error sending expiration notification:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Send subscription activation notification
 */
export async function sendActivationNotification(
  email: string,
  period: string,
  endDate: Date
): Promise<{ success: boolean; message: string }> {
  try {
    const subject = '✅ VET-Tracker Subscription Activated';
    
    const message = `
Dear ${email.split('@')[0]},

Your VET-Tracker subscription has been activated!

📊 Period: ${period}
📅 Expiration Date: ${endDate.toLocaleDateString()}
✅ Status: Active

You now have full access to all VET-Tracker features.

If you have any questions, please contact support:

📧 Email: support@vettracker.com
📞 Phone: +1 (555) 123-4567

Thank you for choosing VET-Tracker!

Best regards,
VET-Tracker Team
    `.trim();

    await sendCredentialsEmail(email, message, subject);
    
    console.log(`✉️ Activation notification sent to ${email}`);
    
    return {
      success: true,
      message: `Activation email sent to ${email}`
    };
  } catch (error) {
    console.error('Error sending activation notification:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Send queued subscription confirmation
 */
export async function sendQueuedConfirmation(
  email: string,
  period: string,
  position: number
): Promise<{ success: boolean; message: string }> {
  try {
    const subject = '⏳ VET-Tracker Subscription Queued';
    
    const message = `
Dear ${email.split('@')[0]},

Your VET-Tracker subscription has been queued successfully!

📊 Period: ${period}
📍 Queue Position: ${position}
⏳ Status: Will activate when current subscription expires

Your subscription will automatically activate when your current period ends.

If you have any questions, please contact support:

📧 Email: support@vettracker.com
📞 Phone: +1 (555) 123-4567

Thank you for your continued trust in VET-Tracker!

Best regards,
VET-Tracker Team
    `.trim();

    await sendCredentialsEmail(email, message, subject);
    
    console.log(`✉️ Queued confirmation sent to ${email}`);
    
    return {
      success: true,
      message: `Queued confirmation email sent to ${email}`
    };
  } catch (error) {
    console.error('Error sending queued confirmation:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Create in-app notification for subscription events
 */
export async function createSubscriptionNotification(
  tenantId: string,
  email: string,
  type: 'warning' | 'expired' | 'activated' | 'queued',
  message: string
): Promise<void> {
  try {
    const titles = {
      warning: '⚠️ Subscription Expiring Soon',
      expired: '❌ Subscription Expired',
      activated: '✅ Subscription Activated',
      queued: '⏳ Subscription Queued'
    };

    await addDoc(collection(db, 'notifications'), {
      tenantId: email,
      userEmail: email,
      type: 'subscription',
      priority: type === 'expired' ? 'high' : type === 'warning' ? 'medium' : 'low',
      title: titles[type],
      message,
      read: false,
      createdAt: Timestamp.now()
    });
    
    console.log(`📬 In-app notification created for ${email}: ${type}`);
  } catch (error) {
    console.error('Error creating subscription notification:', error);
  }
}
