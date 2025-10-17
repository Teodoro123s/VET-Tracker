// Simple Node.js test for Resend
const { Resend } = require('resend');

const resend = new Resend('re_EKRydmbK_MCqpzJru5XYt7y8Evuw47hDX');

async function testResend() {
  console.log('Testing Resend connection...');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'VET Tracker <noreply@vettracker.com>',
      to: ['test@example.com'],
      subject: 'Resend Test',
      html: '<h1>Test successful!</h1>'
    });

    if (error) {
      console.error('❌ Resend Error:', error);
      return false;
    }

    console.log('✅ Resend Working! Email ID:', data.id);
    return true;
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    return false;
  }
}

testResend();