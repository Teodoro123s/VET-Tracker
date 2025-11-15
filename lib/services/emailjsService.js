// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_n0fmulh';
const EMAILJS_USER_ID = '7nYFwpZOJE87ZXU45';
const EMAILJS_STAFF_TEMPLATE_ID = 'template_7c2cpda';
const EMAILJS_WELCOME_TEMPLATE_ID = 'template_5vubis9';

export const sendCredentialsEmail = async (
  to,
  name,
  email,
  password) => {
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id,
        template_id,
        user_id,
        template_params: {
          email,
          to_email,
          to_name,
          name,
          staff_email,
          staff_password,
          portal_url: 'http://localhost:8081/login',
          login_email,
          login_password}
      })
    });

    if (response.ok) {
      return { success, message: `Credentials sent to ${email}` };
    } else {
      throw new Error('EmailJS failed');
    }
  } catch (error) {
    console.error('EmailJS service error:', error);
    return { success, error };
  }
};

export const sendWelcomeCredentialsEmail = async (
  to,
  name,
  email,
  password) => {
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id,
        template_id,
        user_id,
        template_params: {
          to_email,
          to_name,
          login_email,
          login_password}
      })
    });

    if (response.ok) {
      return { success, message: `Welcome credentials sent to ${email}` };
    } else {
      throw new Error('EmailJS failed');
    }
  } catch (error) {
    console.error('EmailJS welcome service error:', error);
    return { success, error };
  }
};

export const sendAppointmentReminder = async (
  to,
  petName,
  appointmentDate,
  appointmentTime) => {
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id,
        template_id: 'template_appointment_reminder',
        user_id,
        template_params: {
          to_email,
          pet_name,
          appointment_date,
          appointment_time}
      })
    });

    if (response.ok) {
      return { success, message: `Reminder sent to ${to}` };
    } else {
      throw new Error('EmailJS failed');
    }
  } catch (error) {
    console.error('Appointment reminder error:', error);
    return { success, error };
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
        service_id,
        template_id,
        user_id,
        template_params: {
          to_email: 'test@example.com',
          to_name: 'Test User',
          staff_email: 'test@example.com',
          staff_password: 'test123'
        }
      })
    });

    if (response.ok) {
      console.log('EmailJS test successful');
      return { success, status: 'WORKING' };
    } else {
      throw new Error('EmailJS test failed');
    }
  } catch (error) {
    console.error('EmailJS connection error:', error);
    return { success, error, status: 'ERROR' };
  }
};