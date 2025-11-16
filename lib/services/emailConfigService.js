// Centralized Email Configuration Service
// Handles sender routing based on user roles and context

const SUPERADMIN_EMAIL = 'edzhelteodoro@gmail.com';

// Email sender configuration
export const EMAIL_SENDERS = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin', 
  STAFF: 'staff',
  VETERINARIAN: 'veterinarian'
};

// Get appropriate sender email based on context
export const getSenderEmail = (senderType, adminEmail = null) => {
  switch (senderType) {
    case EMAIL_SENDERS.SUPERADMIN:
      return SUPERADMIN_EMAIL;
    case EMAIL_SENDERS.ADMIN:
      return adminEmail || SUPERADMIN_EMAIL;
    case EMAIL_SENDERS.STAFF:
    case EMAIL_SENDERS.VETERINARIAN:
      return adminEmail || SUPERADMIN_EMAIL;
    default:
      return SUPERADMIN_EMAIL;
  }
};

// Determine sender type based on email context
export const determineSenderType = (emailContext) => {
  const { recipientRole, senderRole, isSystemEmail } = emailContext;
  
  // System emails (password resets, account creation) from superadmin
  if (isSystemEmail && senderRole === 'superadmin') {
    return EMAIL_SENDERS.SUPERADMIN;
  }
  
  // Admin creating staff/veterinarian accounts
  if (senderRole === 'admin' && (recipientRole === 'staff' || recipientRole === 'veterinarian')) {
    return EMAIL_SENDERS.ADMIN;
  }
  
  // Appointment confirmations, notifications from clinic
  if (recipientRole === 'customer' || recipientRole === 'client') {
    return EMAIL_SENDERS.ADMIN;
  }
  
  // Staff communications
  if (recipientRole === 'staff' || recipientRole === 'veterinarian') {
    return EMAIL_SENDERS.ADMIN;
  }
  
  // Default to superadmin for system communications
  return EMAIL_SENDERS.SUPERADMIN;
};

// Email templates with proper sender configuration
export const EMAIL_TEMPLATES = {
  ADMIN_CREDENTIALS: {
    subject: 'VET Tracker - Administrator Account Created',
    senderType: EMAIL_SENDERS.SUPERADMIN,
    template: (data) => `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to VET Tracker - Admin Access</h2>
        <p>Dear ${data.name},</p>
        <p>Your administrator account has been created. Here are your login credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${data.email}</li>
          <li><strong>Password:</strong> ${data.password}</li>
        </ul>
        <p style="color: #d9534f;">Please login and change your password immediately.</p>
        <p>Best regards,<br/>VET Tracker Support Team</p>
      </div>
    `
  },
  
  STAFF_CREDENTIALS: {
    subject: 'VET Tracker - Account Created',
    senderType: EMAIL_SENDERS.ADMIN,
    template: (data) => `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to VET Tracker</h2>
        <p>Dear ${data.name},</p>
        <p>Your account has been created. Here are your login credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${data.email}</li>
          <li><strong>Password:</strong> ${data.password}</li>
        </ul>
        <p style="color: #d9534f;">Please login and change your password immediately.</p>
        <p>Best regards,<br/>Your Clinic Administrator</p>
      </div>
    `
  },
  
  APPOINTMENT_CONFIRMATION: {
    subject: 'Appointment Confirmation',
    senderType: EMAIL_SENDERS.ADMIN,
    template: (data) => `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Appointment Confirmation</h2>
        <p>Dear ${data.customerName},</p>
        <p>Your appointment has been confirmed:</p>
        <ul>
          <li><strong>Pet:</strong> ${data.petName}</li>
          <li><strong>Date:</strong> ${data.date}</li>
          <li><strong>Time:</strong> ${data.time}</li>
          <li><strong>Veterinarian:</strong> ${data.veterinarian}</li>
          <li><strong>Reason:</strong> ${data.reason}</li>
        </ul>
        <p>Thank you for choosing our clinic!</p>
      </div>
    `
  },
  
  PASSWORD_RESET: {
    subject: 'Password Reset - VET Tracker',
    template: (data) => `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset - VET Tracker</h2>
        <p>Your new temporary password is: <strong>${data.password}</strong></p>
        <p style="color: #d9534f;">Please login and change your password immediately for security.</p>
      </div>
    `
  }
};

// Validate email configuration
export const validateEmailConfig = (config) => {
  const { senderType, adminEmail, recipientEmail } = config;
  
  if (!recipientEmail) {
    throw new Error('Recipient email is required');
  }
  
  if (senderType === EMAIL_SENDERS.ADMIN && !adminEmail) {
    console.warn('Admin email not provided, falling back to superadmin email');
  }
  
  return true;
};

// Get email configuration for specific scenarios
export const getEmailConfig = (scenario, data = {}) => {
  const configs = {
    'admin-creation': {
      senderType: EMAIL_SENDERS.SUPERADMIN,
      template: EMAIL_TEMPLATES.ADMIN_CREDENTIALS,
      adminEmail: null
    },
    'staff-creation': {
      senderType: EMAIL_SENDERS.ADMIN,
      template: EMAIL_TEMPLATES.STAFF_CREDENTIALS,
      adminEmail: data.adminEmail
    },
    'appointment-confirmation': {
      senderType: EMAIL_SENDERS.ADMIN,
      template: EMAIL_TEMPLATES.APPOINTMENT_CONFIRMATION,
      adminEmail: data.adminEmail
    },
    'password-reset-admin': {
      senderType: EMAIL_SENDERS.SUPERADMIN,
      template: EMAIL_TEMPLATES.PASSWORD_RESET,
      adminEmail: null
    },
    'password-reset-staff': {
      senderType: EMAIL_SENDERS.ADMIN,
      template: EMAIL_TEMPLATES.PASSWORD_RESET,
      adminEmail: data.adminEmail
    }
  };
  
  return configs[scenario] || configs['admin-creation'];
};

export default {
  getSenderEmail,
  determineSenderType,
  EMAIL_SENDERS,
  EMAIL_TEMPLATES,
  validateEmailConfig,
  getEmailConfig,
  SUPERADMIN_EMAIL
};