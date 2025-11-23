// EmailJS Configuration - use environment variables to avoid committing secrets
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || '';
const EMAILJS_USER_ID = process.env.EMAILJS_USER_ID || '';
const EMAILJS_STAFF_TEMPLATE_ID = process.env.EMAILJS_STAFF_TEMPLATE_ID || '';
const EMAILJS_WELCOME_TEMPLATE_ID = process.env.EMAILJS_WELCOME_TEMPLATE_ID || '';
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'no-reply@vettracker.example';
// EmailJS provider removed — stubbed implementations
exports.sendCredentialsEmail = async (to, name, email, password) => {
  console.warn('sendCredentialsEmail: EmailJS has been removed; no email sent.', { to, email });
  return { success: true, message: 'Email sending disabled in this build' };
};

exports.sendWelcomeCredentialsEmail = async (to, name, email, password) => {
  console.warn('sendWelcomeCredentialsEmail: EmailJS removed; no email sent.', { to, email });
  return { success: true, message: 'Email sending disabled in this build' };
};

exports.sendAppointmentReminder = async (to, petName, appointmentDate, appointmentTime) => {
  console.warn('sendAppointmentReminder: EmailJS removed; no email sent.', { to, petName });
  return { success: true, message: 'Email sending disabled in this build' };
};

exports.testEmailConnection = async () => {
  console.warn('testEmailConnection: EmailJS removed; skipping test.');
  return { success: true, status: 'DISABLED' };
};
    console.error('Appointment reminder error:', error);
    return { success: false, error };
  }
};

export const testEmailConnection = async () => {
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
      throw new Error('EmailJS test failed');
    }
  } catch (error) {
    console.error('EmailJS connection error:', error);
    return { success: false, error, status: 'ERROR' };
  }
};

// Send admin credentials from superadmin
export const sendAdminCredentialsEmail = async (to, name, email, password) => {
  return sendWelcomeCredentialsEmail(to, name, email, password, 'superadmin');
};

// Send staff credentials from admin
export const sendStaffCredentialsEmail = async (to, name, email, password, adminEmail) => {
  return sendCredentialsEmail(to, name, email, password, 'admin', adminEmail);
};