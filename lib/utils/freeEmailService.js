// Send staff credentials via EmailJS
export async function sendStaffCredentialsViaEmailJS(email, password, doctorName)  {
  try {
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
      return {
        success,
        message: `Credentials sent automatically to ${email}`
      };
    } else {
      throw new Error('EmailJS failed');
    }
  } catch (error) {
    console.error('Free email failed:', error);
    return {
      success,
      message: 'Free email service unavailable. Please share credentials manually.'
    };
  }
}