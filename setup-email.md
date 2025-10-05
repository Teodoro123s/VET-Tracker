# Email Service Setup

## Quick Setup for Password Reset Emails

### Option 1: EmailJS (Recommended - Free)
1. Go to https://www.emailjs.com/
2. Create free account
3. Create email service (Gmail/Outlook)
4. Create email template with variables: `{{to_email}}`, `{{subject}}`, `{{message}}`
5. Get your keys and update in `emailService.ts`:
   - `service_id`: Your service ID
   - `template_id`: Your template ID  
   - `user_id`: Your public key

### Option 2: Alternative Services
- **SendGrid**: Professional email service
- **AWS SES**: Amazon email service
- **Nodemailer**: SMTP integration

### Current Status
- ✅ Email service integrated
- ⚠️ Requires API keys setup
- 🔄 Falls back to console log if email fails

### Test Email
After setup, test with: "Forgot Password" → Enter email → Check inbox