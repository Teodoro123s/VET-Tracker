import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Customer email templates
export const sendCustomerEmail = async (to, subject, message, template = 'customer') => {
  try {
    await addDoc(collection(db, 'mail'), {
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
export const sendVetEmail = async (to, subject, message, template = 'veterinarian') => {
  try {
    await addDoc(collection(db, 'mail'), {
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
export const sendAppointmentEmail = async (customerEmail, vetEmail, appointmentData) => {
  // Send to customer
  await sendCustomerEmail(
    customerEmail,
    'Appointment Confirmation',
    `Your appointment for ${appointmentData.petName} is confirmed for ${appointmentData.date} at ${appointmentData.time}.`
  );
  
  // Send to veterinarian
  await sendVetEmail(
    vetEmail,
    'New Appointment Scheduled',
    `New appointment: ${appointmentData.customerName} with ${appointmentData.petName} on ${appointmentData.date} at ${appointmentData.time}.`
  );
};