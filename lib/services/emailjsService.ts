// EmailJS provider removed — stubbed implementations
// These functions preserve the original exports so callers don't break.
export const sendCredentialsEmail = async (
  to: string,
  name: string,
  email: string,
  password: string
) => {
  console.warn('sendCredentialsEmail: EmailJS has been removed; no email sent.', { to, email });
  return { success: true, message: 'Email sending disabled in this build' };
};

export const sendWelcomeCredentialsEmail = async (
  to: string,
  name: string,
  email: string,
  password: string
) => {
  console.warn('sendWelcomeCredentialsEmail: EmailJS removed; no email sent.', { to, email });
  return { success: true, message: 'Email sending disabled in this build' };
};

export const sendAppointmentReminder = async (
  to: string,
  petName: string,
  appointmentDate: string,
  appointmentTime: string
) => {
  console.warn('sendAppointmentReminder: EmailJS removed; no email sent.', { to, petName });
  return { success: true, message: 'Email sending disabled in this build' };
};

export const testEmailConnection = async () => {
  console.warn('testEmailConnection: EmailJS removed; skipping test.');
  return { success: true, status: 'DISABLED' };
};