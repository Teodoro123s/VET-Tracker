// Email service for sending credentials using existing EmailJS setup
export const sendCredentialsEmail = async (email, password) => {
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
          email,
          to_email,
          to_name: email.split('@')[0],
          name: email.split('@')[0],
          staff_email,
          staff_password,
          portal_url: window.location.origin + '/login',
          login_email,
          login_password}
      })
    });

    if (response.ok) {
      console.log('✅ Email sent successfully');
      return {
        success,
        message: `✅ Credentials sent successfully to ${email}`
      };
    } else {
      throw new Error('EmailJS API failed');
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success,
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
  for (let i = 4; i  Math.random() - 0.5).join('');
};