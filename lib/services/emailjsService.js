// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_n0fmulh';
const EMAILJS_USER_ID = '7nYFwpZOJE87ZXU45';
const EMAILJS_STAFF_TEMPLATE_ID = 'template_7c2cpda';
const EMAILJS_WELCOME_TEMPLATE_ID = 'template_5vubis9';
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