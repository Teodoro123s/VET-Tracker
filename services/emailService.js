import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const SUPERADMIN_EMAIL = 'edzhelteodoro@gmail.com';

// Get sender email based on user role
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

// Customer email templates
export const sendCustomerEmail = async (to, subject, message, template = 'customer', senderType = 'admin', adminEmail = null) => {
  try {
    const fromEmail = getSenderEmail(senderType, adminEmail);
    
    await addDoc(collection(db, 'mail'), {
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      template: {
        name: template,
        data: {
          customerName: to.split('@')[0],
          message: message
        }
      },
      message: {
        subject: `[VET Tracker] ${subject}`,
        text: message,
        html: `<div style="font-family: Arial, sans-serif;"><h2>VET Tracker</h2><p>${message}</p></div>`
      }
    });
    
    // Add notification alert
    await addDoc(collection(db, 'notifications'), {
      type: 'email_sent',
      recipient: to,
      subject: subject,
      timestamp: new Date(),
      status: 'sent'
    });
    
    console.log('Customer email queued successfully');
  } catch (error) {
    console.error('Error sending customer email:', error);
    throw error;
  }
};

// Veterinarian email templates
export const sendVetEmail = async (to, subject, message, template = 'veterinarian', adminEmail = null) => {
  try {
    const fromEmail = getSenderEmail('admin', adminEmail);
    
    await addDoc(collection(db, 'mail'), {
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      template: {
        name: template,
        data: {
          vetName: to.split('@')[0],
          message: message
        }
      },
      message: {
        subject: `[VET Staff] ${subject}`,
        text: message,
        html: `<div style="font-family: Arial, sans-serif; background: #f8f9fa; padding: 20px;"><h2 style="color: #800000;">VET Tracker - Staff Portal</h2><p>${message}</p></div>`
      }
    });
    
    // Add notification alert
    await addDoc(collection(db, 'notifications'), {
      type: 'email_sent',
      recipient: to,
      subject: subject,
      timestamp: new Date(),
      status: 'sent'
    });
    
    console.log('Veterinarian email queued successfully');
  } catch (error) {
    console.error('Error sending veterinarian email:', error);
    throw error;
  }
};

// Appointment-specific emails
export const sendAppointmentEmail = async (customerEmail, vetEmail, appointmentData, adminEmail = null) => {
  // Send to customer
  await sendCustomerEmail(
    customerEmail,
    'Appointment Confirmation',
    `Your appointment for ${appointmentData.petName} is confirmed for ${appointmentData.date} at ${appointmentData.time}.`,
    'customer',
    'admin',
    adminEmail
  );
  
  // Send to veterinarian
  await sendVetEmail(
    vetEmail,
    'New Appointment Scheduled',
    `New appointment: ${appointmentData.customerName} with ${appointmentData.petName} on ${appointmentData.date} at ${appointmentData.time}.`,
    'veterinarian',
    adminEmail
  );
};

// Send admin credentials from superadmin
export const sendAdminCredentialsFirebase = async (email, password, adminName) => {
  const message = `Welcome to VET Tracker! Your administrator account has been created.\n\nLogin Credentials:\nEmail: ${email}\nPassword: ${password}\n\nPlease login and change your password immediately.`;
  
  await addDoc(collection(db, 'mail'), {
    from: SUPERADMIN_EMAIL,
    to: [email],
    message: {
      subject: '[VET Tracker] Administrator Account Created',
      text: message,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Welcome to VET Tracker - Admin Access</h2><p>Dear ${adminName},</p><p>Your administrator account has been created. Here are your login credentials:</p><ul><li><strong>Email:</strong> ${email}</li><li><strong>Password:</strong> ${password}</li></ul><p style="color: #d9534f;">Please login and change your password immediately.</p><p>Best regards,<br/>VET Tracker Support Team</p></div>`
    }
  });
};

// Send staff credentials from admin
export const sendStaffCredentialsFirebase = async (email, password, staffName, adminEmail) => {
  const message = `Welcome to VET Tracker! Your account has been created by your clinic administrator.\n\nLogin Credentials:\nEmail: ${email}\nPassword: ${password}\n\nPlease login and change your password immediately.`;
  
  await addDoc(collection(db, 'mail'), {
    from: adminEmail || SUPERADMIN_EMAIL,
    to: [email],
    message: {
      subject: '[VET Tracker] Account Created',
      text: message,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>Welcome to VET Tracker</h2><p>Dear ${staffName},</p><p>Your account has been created. Here are your login credentials:</p><ul><li><strong>Email:</strong> ${email}</li><li><strong>Password:</strong> ${password}</li></ul><p style="color: #d9534f;">Please login and change your password immediately.</p><p>Best regards,<br/>Your Clinic Administrator</p></div>`
    }
  });
};