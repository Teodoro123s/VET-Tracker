// EmailJS Configuration
// Replace these with your actual EmailJS credentials from https://www.emailjs.com/

export const EMAILJS_CONFIG = {
  SERVICE_ID: 'your_service_id',        // From EmailJS dashboard
  TEMPLATE_ID: 'your_template_id',      // From EmailJS dashboard  
  PUBLIC_KEY: 'your_public_key',        // From EmailJS dashboard
};

// Template variables that will be sent to EmailJS:
// - to_email: recipient email
// - user_email: user's email address
// - user_password: generated password
// - clinic_name: clinic name (derived from email)

/* 
SETUP INSTRUCTIONS:

1. Go to https://www.emailjs.com/
2. Create an account and verify your email
3. Create a new service (Gmail, Outlook, etc.)
4. Create an email template with these variables:
   - {{to_email}}
   - {{user_email}} 
   - {{user_password}}
   - {{clinic_name}}
5. Get your Service ID, Template ID, and Public Key
6. Replace the values above with your actual credentials
*/