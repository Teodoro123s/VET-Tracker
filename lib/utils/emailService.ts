// Email utilities: Email sending disabled — stubs for safety
export const sendCredentialsEmail = async (email: string, password: string) => {
  console.warn('sendCredentialsEmail: Email sending disabled; no email sent.', { email });
  return { success: true, message: 'Email sending disabled in this build' };
};

export const sendAppointmentConfirmationEmail = async (appointmentData: any) => {
  console.warn('sendAppointmentConfirmationEmail: Email sending disabled; no email sent.', { appointmentData });
  return { success: true, message: 'Email sending disabled in this build' };
};

// Generate secure password remains useful — keep implementation
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

export const sendGenericEmail = async (to: string, message: string, subject?: string) => {
  try {
    console.log(`sendGenericEmail -> To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    return { success: true, message: `Logged email to ${to}` };
  } catch (error: any) {
    console.error('Error in sendGenericEmail:', error);
    return { success: false, message: error?.message || 'Unknown error' };
  }
};