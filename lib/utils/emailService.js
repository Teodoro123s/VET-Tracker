// Import unified email service
import { sendStaffCredentials, sendAdminCredentials } from './emailService.js';

// Email service for sending credentials with proper sender routing
export const sendCredentialsEmail = async (email, password, userRole = 'staff', adminEmail = null, userName = null) => {
  try {
    console.log(`📧 Sending credentials to: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 User Role: ${userRole}`);
    console.log(`📮 Admin Email: ${adminEmail}`);
    
    const name = userName || email.split('@')[0];
    let result;
    
    // Route email based on user role
    if (userRole === 'admin' || userRole === 'superadmin') {
      // Admin credentials sent from superadmin
      result = await sendAdminCredentials(email, password, name);
    } else {
      // Staff/veterinarian credentials sent from admin
      result = await sendStaffCredentials(email, password, name, adminEmail);
    }
    
    if (result.success) {
      console.log('✅ Email sent successfully');
      console.log(`📤 Sent from: ${result.from}`);
      return {
        success: true,
        message: `✅ Credentials sent successfully to ${email} from ${result.from}`
      };
    } else {
      throw new Error(result.error);
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

// Send admin credentials (from superadmin)
export const sendAdminCredentialsEmail = async (email, password, adminName) => {
  return sendCredentialsEmail(email, password, 'admin', null, adminName);
};

// Send staff credentials (from admin)
export const sendStaffCredentialsEmail = async (email, password, staffName, adminEmail) => {
  return sendCredentialsEmail(email, password, 'staff', adminEmail, staffName);
};

// Send veterinarian credentials (from admin)
export const sendVeterinarianCredentialsEmail = async (email, password, vetName, adminEmail) => {
  return sendCredentialsEmail(email, password, 'veterinarian', adminEmail, vetName);
};

// Generic message sender (used for notifications, warnings, etc.)
export const sendGenericEmail = async (to, message, subject) => {
  try {
    console.log(`📧 sendGenericEmail -> To: ${to}`);
    console.log(`📌 Subject: ${subject}`);
    console.log(`✉️ Message: ${message}`);
    return { success: true, message: `Logged email to ${to}` };
  } catch (error) {
    console.error('❌ Error in sendGenericEmail:', error);
    return { success: false, message: error.message || 'Unknown error' };
  }
};