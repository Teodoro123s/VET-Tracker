// Unified Email Service
// Handles all email sending with proper sender routing

import { getSenderEmail, getEmailConfig, validateEmailConfig, SUPERADMIN_EMAIL } from './emailConfigService.js';

// Email service providers
const EMAIL_PROVIDERS = {
  RESEND: 'resend',
  EMAILJS: 'emailjs',
  FIREBASE: 'firebase'
};

// Resend API configuration
const RESEND_API_KEY = '0d5dc172-80a8-4a58-8f10-c4d50552fcd3';

// EmailJS configuration
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_n0fmulh',
  USER_ID: '7nYFwpZOJE87ZXU45',
  STAFF_TEMPLATE_ID: 'template_7c2cpda',
  WELCOME_TEMPLATE_ID: 'template_5vubis9'
};

// Send email using Resend API
const sendWithResend = async (emailData) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Resend email error:', error);
    throw error;
  }
};

// Send email using EmailJS
const sendWithEmailJS = async (emailData) => {
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.SERVICE_ID,
        template_id: emailData.templateId || EMAILJS_CONFIG.STAFF_TEMPLATE_ID,
        user_id: EMAILJS_CONFIG.USER_ID,
        template_params: {
          from_email: emailData.from,
          to_email: emailData.to,
          to_name: emailData.recipientName || emailData.to.split('@')[0],
          subject: emailData.subject,
          message: emailData.html,
          ...emailData.templateParams
        }
      })
    });

    if (!response.ok) {
      throw new Error(`EmailJS failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('EmailJS error:', error);
    throw error;
  }
};

// Main email sending function
export const sendEmail = async (options) => {
  const {
    to,
    subject,
    html,
    senderType = 'admin',
    adminEmail = null,
    provider = EMAIL_PROVIDERS.RESEND,
    templateParams = {}
  } = options;

  try {
    // Validate configuration
    validateEmailConfig({ senderType, adminEmail, recipientEmail: to });

    // Get sender email
    const fromEmail = getSenderEmail(senderType, adminEmail);

    // Prepare email data
    const emailData = {
      from: fromEmail,
      to,
      subject,
      html,
      templateParams,
      recipientName: to.split('@')[0]
    };

    // Send based on provider
    let result;
    switch (provider) {
      case EMAIL_PROVIDERS.EMAILJS:
        result = await sendWithEmailJS(emailData);
        break;
      case EMAIL_PROVIDERS.RESEND:
      default:
        result = await sendWithResend(emailData);
        break;
    }

    console.log(`✅ Email sent successfully from ${fromEmail} to ${to}`);
    return { success: true, result, from: fromEmail };

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Send admin credentials (from superadmin)
export const sendAdminCredentials = async (email, password, adminName) => {
  const config = getEmailConfig('admin-creation');
  
  const html = config.template.template({
    name: adminName,
    email,
    password
  });

  return sendEmail({
    to: email,
    subject: config.template.subject,
    html,
    senderType: config.senderType,
    adminEmail: config.adminEmail
  });
};

// Send staff/veterinarian credentials (from admin)
export const sendStaffCredentials = async (email, password, staffName, adminEmail) => {
  const config = getEmailConfig('staff-creation', { adminEmail });
  
  const html = config.template.template({
    name: staffName,
    email,
    password
  });

  return sendEmail({
    to: email,
    subject: config.template.subject,
    html,
    senderType: config.senderType,
    adminEmail: config.adminEmail
  });
};

// Send appointment confirmation (from admin)
export const sendAppointmentConfirmation = async (customerEmail, appointmentDetails, adminEmail) => {
  const config = getEmailConfig('appointment-confirmation', { adminEmail });
  
  const html = config.template.template(appointmentDetails);

  return sendEmail({
    to: customerEmail,
    subject: config.template.subject,
    html,
    senderType: config.senderType,
    adminEmail: config.adminEmail
  });
};

// Send password reset
export const sendPasswordReset = async (email, newPassword, userRole = 'admin', adminEmail = null) => {
  const scenario = userRole === 'superadmin' ? 'password-reset-admin' : 'password-reset-staff';
  const config = getEmailConfig(scenario, { adminEmail });
  
  const html = config.template.template({
    password: newPassword
  });

  return sendEmail({
    to: email,
    subject: config.template.subject,
    html,
    senderType: config.senderType,
    adminEmail: config.adminEmail
  });
};

// Send appointment reminder (from admin)
export const sendAppointmentReminder = async (customerEmail, appointmentDetails, adminEmail) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Appointment Reminder</h2>
      <p>Dear ${appointmentDetails.customerName},</p>
      <p>This is a reminder of your upcoming appointment:</p>
      <ul>
        <li><strong>Pet:</strong> ${appointmentDetails.petName}</li>
        <li><strong>Date:</strong> ${appointmentDetails.date}</li>
        <li><strong>Time:</strong> ${appointmentDetails.time}</li>
        <li><strong>Veterinarian:</strong> ${appointmentDetails.veterinarian}</li>
      </ul>
      <p>Please arrive 15 minutes early. Thank you!</p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: 'Appointment Reminder - VET Tracker',
    html,
    senderType: 'admin',
    adminEmail
  });
};

// Send custom email with AI content
export const sendAIEmail = async (options) => {
  const { 
    toEmail, 
    subject, 
    recipientName, 
    message, 
    additionalNotes, 
    senderType = 'admin', 
    adminEmail = null 
  } = options;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>${subject}</h2>
      <p>Dear ${recipientName},</p>
      <p>${message}</p>
      ${additionalNotes ? `<p>${additionalNotes}</p>` : ''}
      <p>Best regards,<br/>VET Tracker Team</p>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    senderType,
    adminEmail
  });
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'VET Tracker - Email Test',
      html: '<p>This is a test email from VET Tracker system.</p>',
      senderType: 'superadmin'
    });

    return {
      success: result.success,
      status: result.success ? 'WORKING' : 'ERROR',
      message: result.success ? 'Email system is working' : result.error
    };
  } catch (error) {
    return {
      success: false,
      status: 'ERROR',
      message: error.message
    };
  }
};

export default {
  sendEmail,
  sendAdminCredentials,
  sendStaffCredentials,
  sendAppointmentConfirmation,
  sendPasswordReset,
  sendAppointmentReminder,
  sendAIEmail,
  testEmailConnection,
  EMAIL_PROVIDERS,
  SUPERADMIN_EMAIL
};