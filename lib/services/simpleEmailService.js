// Simple email service for sending login credentials
export const sendLoginCredentials = async (email, clinicName, password) => {
  try {
    // Using a simple email API service (you can replace with your preferred service)
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'service_zefpsar', // Replace with your EmailJS service ID
        template_id: 'template_hoxe5k7', // Replace with your EmailJS template ID
        user_id: 'ReUQK_p4eYlnZileo', // Replace with your EmailJS public key
        template_params: {
          to_email: email,
          to_name: clinicName,
          login_email: email,
          login_password: password,
          portal_url: 'http://localhost:8081',
          clinic_name: clinicName
        }
      })
    });

    if (response.ok) {
      console.log('✅ Login credentials email sent successfully to:', email);
      return { success: true, message: 'Email sent successfully' };
    } else {
      const errorText = await response.text();
      console.error('❌ Email sending failed:', errorText);
      return { success: false, message: `Email failed: ${errorText}` };
    }
  } catch (error) {
    console.error('❌ Email service error:', error);
    return { success: false, message: `Email error: ${error.message}` };
  }
};