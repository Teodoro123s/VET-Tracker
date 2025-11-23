// EmailJS Configuration - use environment variables to avoid committing secrets
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

const EMAILJS_SERVICE_ID = extra.EMAILJS_SERVICE_ID || process.env.EMAILJS_SERVICE_ID || '';
const EMAILJS_USER_ID = extra.EMAILJS_USER_ID || process.env.EMAILJS_USER_ID || '';
const EMAILJS_PRIVATE_KEY = extra.EMAILJS_PRIVATE_KEY || process.env.EMAILJS_PRIVATE_KEY || '';
const EMAILJS_STAFF_TEMPLATE_ID = extra.EMAILJS_STAFF_TEMPLATE_ID || process.env.EMAILJS_STAFF_TEMPLATE_ID || '';
const EMAILJS_WELCOME_TEMPLATE_ID = extra.EMAILJS_WELCOME_TEMPLATE_ID || process.env.EMAILJS_WELCOME_TEMPLATE_ID || '';
const SUPERADMIN_EMAIL = extra.SUPERADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || 'no-reply@vettracker.example';

// Guard: check if EmailJS is configured
const isEmailJSConfigured = () => {
  return EMAILJS_SERVICE_ID && EMAILJS_PRIVATE_KEY && EMAILJS_STAFF_TEMPLATE_ID && EMAILJS_WELCOME_TEMPLATE_ID;
};

// Send credentials email using EmailJS
exports.sendCredentialsEmail = async (to, name, email, password, senderType = 'admin', adminEmail = null) => {
  if (!isEmailJSConfigured()) {
    console.warn('sendCredentialsEmail: EmailJS not configured (missing env vars); no email sent.', { to, email });
    return { success: false, message: 'EmailJS not configured. Set EMAILJS_SERVICE_ID, EMAILJS_USER_ID, and template IDs in .env' };
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_STAFF_TEMPLATE_ID,
        user_id: EMAILJS_USER_ID,
        accessToken: EMAILJS_PRIVATE_KEY,
        template_params: {
          from_email: adminEmail || SUPERADMIN_EMAIL,
          to_email: to,
          to_name: name,
          staff_email: email,
          staff_password: password
        }
      })
    });

    if (response.ok) {
      console.log('EmailJS credentials email sent successfully to', to);
      return { success: true };
    } else {
      const errorText = await response.text();
      throw new Error(`EmailJS failed: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error('sendCredentialsEmail error:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome credentials email
exports.sendWelcomeCredentialsEmail = async (to, name, email, password, senderType = 'superadmin', adminEmail = null) => {
  if (!isEmailJSConfigured()) {
    console.warn('sendWelcomeCredentialsEmail: EmailJS not configured; no email sent.', { to, email });
    return { success: false, message: 'EmailJS not configured. Set EMAILJS_SERVICE_ID, EMAILJS_USER_ID, and template IDs in .env' };
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_WELCOME_TEMPLATE_ID,
        user_id: EMAILJS_USER_ID,
        accessToken: EMAILJS_PRIVATE_KEY,
        template_params: {
          from_email: adminEmail || SUPERADMIN_EMAIL,
          to_email: to,
          to_name: name,
          staff_email: email,
          staff_password: password
        }
      })
    });

    if (response.ok) {
      console.log('EmailJS welcome email sent successfully to', to);
      return { success: true };
    } else {
      const errorText = await response.text();
      throw new Error(`EmailJS failed: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error('sendWelcomeCredentialsEmail error:', error);
    return { success: false, error: error.message };
  }
};

// Send appointment reminder
exports.sendAppointmentReminder = async (to, petName, appointmentDate, appointmentTime) => {
  if (!isEmailJSConfigured()) {
    console.warn('sendAppointmentReminder: EmailJS not configured; no email sent.', { to, petName });
    return { success: false, message: 'EmailJS not configured. Set EMAILJS_SERVICE_ID, EMAILJS_USER_ID, and template IDs in .env' };
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_STAFF_TEMPLATE_ID,
        user_id: EMAILJS_USER_ID,
        accessToken: EMAILJS_PRIVATE_KEY,
        template_params: {
          from_email: SUPERADMIN_EMAIL,
          to_email: to,
          pet_name: petName,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime
        }
      })
    });

    if (response.ok) {
      console.log('EmailJS appointment reminder sent to', to);
      return { success: true };
    } else {
      const errorText = await response.text();
      throw new Error(`EmailJS failed: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error('Appointment reminder error:', error);
    return { success: false, error: error.message };
  }
};

// Test EmailJS connection
export const testEmailConnection = async () => {
  if (!isEmailJSConfigured()) {
    console.warn('testEmailConnection: EmailJS not configured; skipping test.');
    return { success: false, status: 'NOT_CONFIGURED', message: 'Set EmailJS env vars in .env' };
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_STAFF_TEMPLATE_ID,
        user_id: EMAILJS_USER_ID,
        accessToken: EMAILJS_PRIVATE_KEY,
        template_params: {
          from_email: SUPERADMIN_EMAIL,
          to_email: 'test@example.com',
          to_name: 'Test User',
          staff_email: 'test@example.com',
          staff_password: 'test123'
        }
      })
    });

    if (response.ok) {
      console.log('EmailJS test successful');
      return { success: true, status: 'WORKING' };
    } else {
      const errorText = await response.text();
      throw new Error(`EmailJS test failed: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error('EmailJS connection error:', error);
    return { success: false, error: error.message, status: 'ERROR' };
  }
};

// Send admin credentials from superadmin
export const sendAdminCredentialsEmail = async (to, name, email, password) => {
  return exports.sendWelcomeCredentialsEmail(to, name, email, password, 'superadmin');
};

// Send staff credentials from admin
export const sendStaffCredentialsEmail = async (to, name, email, password, adminEmail) => {
  return exports.sendCredentialsEmail(to, name, email, password, 'admin', adminEmail);
};