// Email service for sending credentials using existing EmailJS setup
export const sendCredentialsEmail = async (email: string, password: string) => {
  try {
    console.log(`📧 Sending credentials to: ${email}`);
    console.log(`🔑 Password: ${password}`);
    
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'service_n0fmulh',
        template_id: 'template_7c2cpda', 
        user_id: '7nYFwpZOJE87ZXU45',
        template_params: {
          email: email,
          to_email: email,
          to_name: email.split('@')[0],
          name: email.split('@')[0],
          staff_email: email,
          staff_password: password,
          portal_url: window.location.origin + '/login',
          login_email: email,
          login_password: password
        }
      })
    });

    if (response.ok) {
      console.log('✅ Email sent successfully');
      return {
        success: true,
        message: `✅ Credentials sent successfully to ${email}`
      };
    } else {
      throw new Error('EmailJS API failed');
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      message: `❌ Failed to send email: ${error.message || 'Unknown error'}`
    };
  }
};

// Send appointment confirmation email
export const sendAppointmentConfirmationEmail = async (appointmentData: any) => {
  try {
    console.log(`📧 Sending appointment confirmation to: ${appointmentData.customerEmail}`);
    
    const appointmentDate = new Date(appointmentData.appointmentDate);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'service_n0fmulh',
        template_id: 'template_appointment', // You'll need to create this template in EmailJS
        user_id: '7nYFwpZOJE87ZXU45',
        template_params: {
          to_email: appointmentData.customerEmail,
          to_name: appointmentData.customerName,
          customer_name: appointmentData.customerName,
          pet_name: appointmentData.petName,
          appointment_date: formattedDate,
          appointment_time: formattedTime,
          reason: appointmentData.reason || 'General checkup',
          veterinarian: appointmentData.veterinarian || 'Our veterinary team',
          clinic_name: 'Veterinary Clinic',
          status: 'Pending'
        }
      })
    });

    if (response.ok) {
      console.log('✅ Appointment confirmation email sent successfully');
      return {
        success: true,
        message: `✅ Appointment confirmation sent to ${appointmentData.customerEmail}`
      };
    } else {
      throw new Error('EmailJS API failed');
    }
  } catch (error) {
    console.error('❌ Error sending appointment confirmation email:', error);
    return {
      success: false,
      message: `❌ Failed to send confirmation email: ${error.message || 'Unknown error'}`
    };
  }
};

// Generate secure password
export const generateSecurePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};