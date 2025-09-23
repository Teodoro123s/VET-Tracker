// Simple email service using a backend API
export async function sendCredentialsEmail(toEmail: string, password: string): Promise<{ success: boolean; message: string }> {
  try {
    // Try to send via a simple email API (you can replace this with your preferred service)
    const emailData = {
      to: toEmail,
      subject: 'Veterinary Management System - Login Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #800000;">Welcome to Veterinary Management System</h2>
          <p>Dear Administrator,</p>
          <p>Your login credentials have been created:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email:</strong> ${toEmail}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><strong>Login URL:</strong> <a href="${window.location.origin}/login">${window.location.origin}/login</a></p>
          </div>
          <p>Please keep these credentials secure and change your password after first login.</p>
          <p>Best regards,<br>Veterinary Management Team</p>
        </div>
      `
    };

    // For now, we'll use the mailto fallback since we don't have an email service configured
    // In production, you would send this to your email API endpoint
    console.log('Email would be sent:', emailData);
    
    // Fallback to mailto
    const subject = encodeURIComponent('Veterinary Management System - Login Credentials');
    const body = encodeURIComponent(`Dear Administrator,

Your login credentials for the Veterinary Management System:

Email: ${toEmail}
Password: ${password}

Login URL: ${window.location.origin}/login

Please keep these credentials secure.

Best regards,
Veterinary Management Team`);
    
    const mailtoLink = `mailto:${toEmail}?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
    
    return {
      success: true,
      message: `Credentials prepared for ${toEmail}. Default email client opened.`
    };
    
  } catch (error) {
    console.error('Email preparation failed:', error);
    return {
      success: false,
      message: 'Failed to prepare email. Please send credentials manually.'
    };
  }
}