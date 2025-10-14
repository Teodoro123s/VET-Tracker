import { Resend } from 'resend';

const resend = new Resend('re_EKRydmbK_MCqpzJru5XYt7y8Evuw47hDX');

export const sendCredentialsEmail = async (
  to: string,
  name: string,
  email: string,
  password: string
) => {
  try {
    const { data } = await resend.emails.send({
      from: 'VET Clinic <noreply@yourvetclinic.com>',
      to: [to],
      subject: 'Your VET Clinic Login Credentials',
      html: `
        <h2>Welcome to VET Clinic</h2>
        <p>Hello ${name},</p>
        <p>Your login credentials have been created:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Please change your password after first login.</p>
      `
    });
    return { success: true, data };
  } catch (error) {
    console.error('Resend error:', error);
    return { success: false, error };
  }
};