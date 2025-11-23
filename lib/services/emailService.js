// Simple email service using Resend API directly with fetch
// Read sensitive values from environment variables to avoid committing them.
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'no-reply@vettracker.example';

// Get sender email based on user role and context
const getSenderEmail = (senderType, adminEmail = null) => {
  switch (senderType) {
    case 'superadmin':
      return SUPERADMIN_EMAIL;
    case 'admin':
      return adminEmail || SUPERADMIN_EMAIL;
    case 'staff':
    case 'veterinarian':
      return adminEmail || SUPERADMIN_EMAIL;
    default:
      return SUPERADMIN_EMAIL;
  }
};

export const sendEmail = async (to, subject, html, senderType = 'superadmin', adminEmail = null) => {
  try {
    const fromEmail = getSenderEmail(senderType, adminEmail);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Email failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export const sendAppointmentConfirmation = async (customerEmail, appointmentDetails, adminEmail = null) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Appointment Confirmation</h2>
      <p>Dear ${appointmentDetails.customerName},</p>
      <p>Your appointment has been confirmed:</p>
      <ul>
        <li><strong>Pet:</strong> ${appointmentDetails.petName}</li>
        <li><strong>Date:</strong> ${appointmentDetails.date}</li>
        <li><strong>Time:</strong> ${appointmentDetails.time}</li>
        <li><strong>Veterinarian:</strong> ${appointmentDetails.veterinarian}</li>
        <li><strong>Reason:</strong> ${appointmentDetails.reason}</li>
      </ul>
      <p>Thank you for choosing our clinic!</p>
    </div>
  `;

  return sendEmail(customerEmail, 'Appointment Confirmation', html, 'admin', adminEmail);
};

export const sendPasswordReset = async (email, newPassword, userRole = 'admin', adminEmail = null) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Password Reset - VET Tracker</h2>
      <p>Your new temporary password is: <strong>${newPassword}</strong></p>
      <p style="color: #d9534f;">Please login and change your password immediately for security.</p>
    </div>
  `;

  const senderType = userRole === 'superadmin' ? 'superadmin' : 'admin';
  return sendEmail(email, 'Password Reset - VET Tracker', html, senderType, adminEmail);
};

export const sendAIEmail = async ({ subject, recipientName, message, additionalNotes, toEmail, senderType = 'admin', adminEmail = null }) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>${subject}</h2>
        <p>Dear ${recipientName},</p>
        <p>${message}</p>
        ${additionalNotes ? `<p>${additionalNotes}</p>` : ''}
        <p>Best regards,<br/>VET Tracker Team</p>
      </div>
    `;

    const result = await sendEmail(toEmail, subject, html, senderType, adminEmail);
    return { success: true, result };
  } catch (error) {
    console.error('AI Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send credentials to new staff/veterinarians (from admin)
export const sendStaffCredentials = async (email, password, staffName, adminEmail) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Welcome to VET Tracker</h2>
      <p>Dear ${staffName},</p>
      <p>Your account has been created. Here are your login credentials:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p style="color: #d9534f;">Please login and change your password immediately.</p>
      <p>Best regards,<br/>Your Clinic Administrator</p>
    </div>
  `;

  return sendEmail(email, 'VET Tracker - Account Created', html, 'admin', adminEmail);
};

// Send admin credentials (from superadmin)
export const sendAdminCredentials = async (email, password, adminName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Welcome to VET Tracker - Admin Access</h2>
      <p>Dear ${adminName},</p>
      <p>Your administrator account has been created. Here are your login credentials:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p style="color: #d9534f;">Please login and change your password immediately.</p>
      <p>Best regards,<br/>VET Tracker Support Team</p>
    </div>
  `;

  return sendEmail(email, 'VET Tracker - Administrator Account Created', html, 'superadmin');
};
