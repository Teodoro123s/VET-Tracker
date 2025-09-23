import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebaseConfig';

export async function sendWelcomeCredentials(email: string, password: string, username?: string): Promise<{ success: boolean; message: string }> {
  try {
    // Try to send via EmailJS or custom email service first
    const emailData = {
      to_email: email,
      subject: 'Welcome to VetCare Mobile App - Your Login Credentials',
      message: `Welcome to VetCare Mobile App!

Your login credentials are:
Email: ${email}
Username: ${username || email.split('@')[0]}
Password: ${password}

Please download the VetCare mobile app and use these credentials to log in.

For security, please change your password after your first login.

Best regards,
VetCare Team`
    };

    // Try custom email service (if available)
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });
      
      if (response.ok) {
        return {
          success: true,
          message: `Welcome email with credentials sent to ${email}`
        };
      }
    } catch (apiError) {
      console.log('API email service not available, trying Firebase...');
    }

    // Fallback: Send password reset email
    await sendPasswordResetEmail(auth, email);
    
    return {
      success: true,
      message: `Password reset email sent to ${email}. Please manually provide the username: ${username || email.split('@')[0]}`
    };
  } catch (error) {
    console.error('All email methods failed:', error);
    
    // Return failure with manual instructions
    return {
      success: false,
      message: `Email service unavailable. Please manually send credentials to ${email}`
    };
  }
}

// Alternative: Use Firebase Admin SDK to send custom emails
export async function sendCustomWelcomeEmail(email: string, password: string): Promise<{ success: boolean; message: string }> {
  try {
    // This would require Firebase Functions or Admin SDK on server
    const response = await fetch('/api/send-welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      return {
        success: true,
        message: `Welcome email sent to ${email}`
      };
    } else {
      throw new Error('API call failed');
    }
  } catch (error) {
    console.error('Custom email failed:', error);
    return {
      success: false,
      message: `Email service unavailable. Credentials: ${email} / ${password}`
    };
  }
}