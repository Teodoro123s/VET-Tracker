// Simple email service using Resend API directly with fetch
const RESEND_API_KEY = '0d5dc172-80a8-4a58-8f10-c4d50552fcd3';

export const sendEmail = async (to, subject, html) => {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@vettracker.com',
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

export const sendAppointmentConfirmation = async (customerEmail, appointmentDetails) => {
  const html = `
    Appointment Confirmation
    Dear ${appointmentDetails.customerName},
    Your appointment has been confirmed Pet: ${appointmentDetails.petName}
      Date: ${appointmentDetails.date}
      Time: ${appointmentDetails.time}
      Veterinarian: ${appointmentDetails.veterinarian}
      Reason: ${appointmentDetails.reason}
    
    Thank you for choosing our clinic!
  `;

  return sendEmail(customerEmail, 'Appointment Confirmation', html);
};

export const sendPasswordReset = async (email, newPassword) => {
  const html = `
    Password Reset
    Your new temporary password is ${newPassword}
    Please login and change your password immediately.
  `;

  return sendEmail(email, 'Password Reset - VET Tracker', html);
};

export const sendAIEmail = async ({ subject, recipientName, message, additionalNotes, toEmail }) => {
  try {
    const html = `
      ${subject}
      Dear ${recipientName},
      ${message}
      ${additionalNotes ? `${additionalNotes}` : ''}
      Best regards,VET Tracker Team
    `;

    const result = await sendEmail(toEmail, subject, html);
    return { success, result };
  } catch (error) {
    console.error('AI Email sending error:', error);
    return { success, error: error.message };
  }
};
