// Working email service for login credentials
export const sendCredentialsEmail = async (email, clinicName, password) => {
  try {
    // Using EmailJS with working credentials
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'service_zefpsar',
        template_id: 'template_hoxe5k7', 
        user_id: 'ReUQK_p4eYlnZileo',
        template_params: {
          to_email: email,
          to_name: clinicName,
          staff_email: email,
          staff_password: password,
          portal_url: 'http://localhost:8081',
          clinic_name: clinicName,
          message: `Welcome to VET Tracker! Your login credentials are:\n\nEmail: ${email}\nPassword: ${password}\n\nPlease login at: http://localhost:8081`
        }
      })
    });

    if (response.ok) {
      console.log('✅ Credentials email sent to:', email);
      return { success: true, message: 'Email sent successfully' };
    } else {
      const errorText = await response.text();
      console.error('❌ Email failed:', errorText);
      return { success: false, message: `Failed: ${errorText}` };
    }
  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false, message: error.message };
  }
};