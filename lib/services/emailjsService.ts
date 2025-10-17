// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_n0fmulh';
const EMAILJS_USER_ID = '7nYFwpZOJE87ZXU45';
const EMAILJS_STAFF_TEMPLATE_ID = 'template_7c2cpda';
const EMAILJS_WELCOME_TEMPLATE_ID = 'template_5vubis9';

export const sendCredentialsEmail = async (
  to: string,
  name: string,
  email: string,
  password: string
) => {
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
          email: email,
          to_email: to,
          to_name: name,
          name: name,
          staff_email: email,
          staff_password: password,
          portal_url: 'http://localhost:8081/login',
          login_email: email,
          login_password: password
        }
      })
    });

    if (response.ok) {
      return { success: true, message: `Credentials sent to ${email}` };
    } else {
      throw new Error('EmailJS failed');
    }
  } catch (error) {
    console.error('EmailJS service error:', error);
    return { success: false, error };
  }
};

export const sendWelcomeCredentialsEmail = async (
  to: string,
  name: string,
  email: string,
  password: string
) => {
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
        template_params: {
          to_email: to,
          to_name: name,
          login_email: email,
          login_password: password
        }
      })
    });

    if (response.ok) {
      return { success: true, message: `Welcome credentials sent to ${email}` };
    } else {
      throw new Error('EmailJS failed');
    }
  } catch (error) {
    console.error('EmailJS welcome service error:', error);
    return { success: false, error };
  }
};

export const sendAppointmentReminder = async (
  to: string,
  petName: string,
  appointmentDate: string,
  appointmentTime: string
) => {
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: 'template_appointment_reminder',
        user_id: EMAILJS_USER_ID,
        template_params: {
          to_email: to,
          pet_name: petName,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime
        }
      })
    });

    if (response.ok) {
      return { success: true, message: `Reminder sent to ${to}` };
    } else {
      throw new Error('EmailJS failed');
    }
  } catch (error) {
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