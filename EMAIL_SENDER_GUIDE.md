# Email Sender Configuration Guide

## Overview
The VET Tracker system now uses role-based email sending with proper sender routing:

- **Superadmin emails**: Sent from `edzhelteodoro@gmail.com`
- **Admin emails**: Sent from respective admin's email address
- **Staff/Veterinarian emails**: Sent from their clinic admin's email address

## Email Routing Rules

### 1. Superadmin Communications
- **Sender**: `edzhelteodoro@gmail.com`
- **Use Cases**:
  - Creating new admin accounts
  - System-wide notifications
  - Password resets for admins
  - Subscription management

### 2. Admin Communications  
- **Sender**: Admin's email address
- **Use Cases**:
  - Creating staff/veterinarian accounts
  - Appointment confirmations to customers
  - Password resets for staff
  - Clinic notifications

### 3. Staff/Veterinarian Communications
- **Sender**: Their clinic admin's email address
- **Use Cases**:
  - Appointment reminders
  - Medical record notifications
  - Internal clinic communications

## Usage Examples

### Import the Services
```javascript
import { 
  sendAdminCredentials, 
  sendStaffCredentials, 
  sendAppointmentConfirmation,
  sendPasswordReset 
} from './lib/services/unifiedEmailService.js';
```

### 1. Creating Admin Account (Superadmin → Admin)
```javascript
// Sent from: edzhelteodoro@gmail.com
await sendAdminCredentials(
  'admin@clinic.com', 
  'tempPassword123', 
  'Dr. Smith'
);
```

### 2. Creating Staff Account (Admin → Staff)
```javascript
// Sent from: admin@clinic.com
await sendStaffCredentials(
  'staff@clinic.com', 
  'tempPassword123', 
  'Jane Doe',
  'admin@clinic.com'  // Admin's email
);
```

### 3. Appointment Confirmation (Admin → Customer)
```javascript
// Sent from: admin@clinic.com
await sendAppointmentConfirmation(
  'customer@email.com',
  {
    customerName: 'John Doe',
    petName: 'Buddy',
    date: '2024-01-15',
    time: '10:00 AM',
    veterinarian: 'Dr. Smith',
    reason: 'Checkup'
  },
  'admin@clinic.com'  // Admin's email
);
```

### 4. Password Reset
```javascript
// For admin (sent from superadmin)
await sendPasswordReset(
  'admin@clinic.com', 
  'newPassword123', 
  'admin'
);

// For staff (sent from admin)
await sendPasswordReset(
  'staff@clinic.com', 
  'newPassword123', 
  'staff',
  'admin@clinic.com'  // Admin's email
);
```

## Configuration Files

### Main Services
- `lib/services/unifiedEmailService.js` - Main email service
- `lib/services/emailConfigService.js` - Configuration and routing
- `lib/services/emailService.js` - Resend API integration
- `lib/services/emailjsService.js` - EmailJS integration

### Updated Files
- `lib/utils/emailService.js` - Utility functions
- `services/emailService.js` - Firebase email service

## Email Providers

The system supports multiple email providers:
1. **Resend API** (Primary) - Direct API integration
2. **EmailJS** - Template-based emails
3. **Firebase Extensions** - Queue-based emails

## Testing

Test the email system:
```javascript
import { testEmailConnection } from './lib/services/unifiedEmailService.js';

const result = await testEmailConnection();
console.log(result); // { success: true, status: 'WORKING' }
```

## Environment Variables

Make sure these are configured:
- Resend API Key: Already configured in the service
- EmailJS credentials: Already configured
- Firebase configuration: Already set up

## Troubleshooting

1. **Emails not sending**: Check API keys and network connectivity
2. **Wrong sender**: Verify the `adminEmail` parameter is passed correctly
3. **Template errors**: Check the email template data structure

## Security Notes

- The superadmin email (`edzhelteodoro@gmail.com`) is hardcoded for security
- Admin emails are passed as parameters and validated
- All passwords are temporary and must be changed on first login
- Email content is sanitized and templated for security