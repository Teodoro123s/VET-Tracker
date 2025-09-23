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