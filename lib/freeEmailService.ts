// Send staff credentials via EmailJS
export async function sendStaffCredentialsViaEmailJS(email: string, password: string, doctorName: string): Promise<{ success: boolean; message: string }> {
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
          to_email: email,
          to_name: doctorName,
          staff_email: email,
          staff_password: password,
          doctor_name: doctorName,
          login_email: email,
          login_password: password
        }
      })
    });

    if (response.ok) {
      return {
        success: true,
        message: `Credentials sent automatically to ${email}`
      };
    } else {
      throw new Error('EmailJS failed');
    }
  } catch (error) {
    console.error('Free email failed:', error);
    return {
      success: false,
      message: 'Free email service unavailable. Please share credentials manually.'
    };
  }
}