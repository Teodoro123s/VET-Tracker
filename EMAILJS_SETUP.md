# EmailJS Setup for Free Automated Emails

## Step 1: Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Sign up for free account (200 emails/month)
3. Verify your email address

## Step 2: Create Email Service
1. Go to Email Services → Add New Service
2. Choose Gmail (or your email provider)
3. Connect your Gmail account
4. Note the Service ID (e.g., "service_vet_free")

## Step 3: Create Email Template
1. Go to Email Templates → Create New Template
2. Template ID: `template_credentials`
3. Template content:

```html
Subject: Veterinary Management System - Login Credentials

Dear {{to_name}},

Your login credentials for the Veterinary Management System:

Email: {{login_email}}
Password: {{login_password}}
Login URL: {{login_url}}

Please change your password after your first login for security.

Best regards,
{{system_name}} Team
```

## Step 4: Get User ID
1. Go to Account → General
2. Copy your User ID (Public Key)

## Step 5: Update Code
Replace in superadmin.tsx:
```javascript
service_id: 'your_actual_service_id',
template_id: 'template_credentials', 
user_id: 'your_actual_user_id',
```

## Step 6: Test
1. Create a new subscriber
2. Check if email is received
3. Verify all template variables work

## Free Limits:
- ✅ 200 emails/month
- ✅ No credit card required
- ✅ Professional templates
- ✅ Reliable delivery