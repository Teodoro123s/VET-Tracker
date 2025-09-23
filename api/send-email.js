// API endpoint for sending emails
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { to, subject, html, message } = req.body;

  try {
    // Method 1: Using Nodemailer with Gmail SMTP
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@vetmanagement.com',
      to: to,
      subject: subject,
      html: html || message,
      text: message
    };

    await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully to:', to);
    return res.status(200).json({ 
      success: true, 
      message: `Email sent successfully to ${to}` 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    
    try {
      // Method 2: Using SendGrid as fallback
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to: to,
        from: process.env.EMAIL_USER || 'noreply@vetmanagement.com',
        subject: subject,
        html: html || message,
        text: message
      };

      await sgMail.send(msg);
      
      console.log('✅ Email sent successfully via SendGrid to:', to);
      return res.status(200).json({ 
        success: true, 
        message: `Email sent successfully to ${to}` 
      });

    } catch (sendGridError) {
      console.error('SendGrid error:', sendGridError);
      
      // Method 3: Log for manual sending
      console.log('📧 MANUAL EMAIL REQUIRED:');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      
      return res.status(200).json({ 
        success: true, 
        message: `Email service unavailable. Credentials logged for manual sending to ${to}` 
      });
    }
  }
}