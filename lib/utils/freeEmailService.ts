// Email sending disabled — stub for legacy free email helper
export async function sendStaffCredentialsViaEmailJS(email: string, password: string, doctorName: string): Promise<{ success: boolean; message: string }> {
  console.warn('sendStaffCredentialsViaEmailJS: EmailJS removed; no email sent.', { email, doctorName });
  return { success: true, message: 'Email sending disabled in this build' };
}