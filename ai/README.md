# AI Integration for Veterinary Management System

## Overview
Complete AI-powered features for the veterinary management system including chatbot assistance, smart scheduling, medical record parsing, and automated email notifications.

## Features

### 🤖 AI Chatbot Assistant
- **Floating chat widget** - Always accessible on veterinarian pages
- **Smart navigation** - Guides users to correct app sections
- **Email integration** - Sends appointment reminders and notifications
- **Project-specific help** - Knows how to use the app features
- **Natural language processing** - Understands user intents

### 📧 Intelligent Email System
- **Automated notifications** - Appointment reminders, follow-ups
- **AI-generated content** - Personalized email messages
- **EmailJS integration** - Uses service_zefpsar and template_hoxe5k7
- **Multi-recipient support** - Customers, veterinarians, staff

### 🧠 Medical Record Parser
- **AI text analysis** - Reads customized medical forms
- **Appointment detection** - Finds next appointment dates automatically
- **Smart scheduling** - Auto-creates notifications for follow-ups
- **Pattern recognition** - Understands various date formats and medical terminology

### 📅 Smart Appointment Scheduler
- **Optimal time suggestions** - AI recommends best appointment slots
- **Conflict prevention** - Avoids double-bookings and scheduling conflicts
- **Veterinarian matching** - Matches services with specialized vets
- **Priority-based scheduling** - Emergency > Urgent > Routine

## File Structure

```
ai/
├── components/
│   └── FloatingChatbot.tsx     # Main chatbot UI component
├── services/
│   ├── emailService.ts         # AI email functionality
│   └── chatbotService.ts       # Message processing and responses
└── utils/
    ├── medicalRecordParser.ts  # AI medical record analysis
    └── smartScheduler.ts       # Intelligent appointment scheduling
```

## Usage

### Chatbot Commands
- **"Book appointment"** → Navigates to calendar
- **"Send email reminder"** → Sends appointment notification
- **"Go to customers"** → Opens customer management
- **"Show notifications"** → Opens notification panel
- **"Help with..."** → Provides step-by-step guidance

### Email Integration
```typescript
import { sendAIEmail } from '@/ai/services/emailService';

await sendAIEmail({
  subject: 'Appointment Reminder',
  recipientName: 'John Smith',
  message: 'Your pet Buddy has an appointment tomorrow at 2:00 PM.',
  toEmail: 'customer@email.com'
});
```

### Medical Record Processing
```typescript
import { processMedicalRecordForAppointments } from '@/ai/utils/medicalRecordParser';

// Automatically detect and schedule follow-up appointments
const result = await processMedicalRecordForAppointments(medicalRecord);
```

### Smart Scheduling
```typescript
import { getSmartAppointmentSuggestions } from '@/ai/utils/smartScheduler';

const suggestions = await getSmartAppointmentSuggestions({
  petName: 'Buddy',
  ownerName: 'John Smith',
  service: 'vaccination',
  duration: 30,
  priority: 'routine'
});
```

## Configuration

### Email Settings
- **Service ID**: `service_zefpsar`
- **Template ID**: `template_hoxe5k7`
- **From Email**: `edzhel.teodoro25@gmail.com`
- **Daily Limit**: 500 emails

### Chatbot Settings
- **Position**: Bottom-right floating button
- **Availability**: Veterinarian pages only
- **Response Time**: < 1 second for navigation, < 3 seconds for email

## Integration Points

### With Existing Systems
- **Firebase**: Medical records, appointments, customer data
- **EmailJS**: Email notifications and reminders
- **Expo Router**: Navigation between app sections
- **React Native**: Mobile-optimized UI components

### Future Enhancements
- **Voice recognition** - Voice-to-text for medical notes
- **Image analysis** - AI diagnosis from pet photos
- **Predictive analytics** - Health trend analysis
- **Multi-language support** - Chatbot in different languages

## Technical Details

### Dependencies
- `@emailjs/react-native` - Email service integration
- `expo-router` - Navigation handling
- `@expo/vector-icons` - UI icons
- `react-native` - Mobile framework

### Performance
- **Chatbot response time**: < 1 second
- **Email delivery**: < 5 seconds
- **Medical record parsing**: < 2 seconds
- **Memory usage**: < 50MB additional

### Security
- **No sensitive data storage** - All data processed in real-time
- **Email encryption** - TLS/SSL for email transmission
- **Input validation** - Sanitized user inputs
- **Rate limiting** - Prevents spam and abuse

## Support

For issues or questions about the AI integration:
1. Check console logs for error messages
2. Verify EmailJS service connection
3. Test with minimal data first
4. Contact development team for advanced issues

## Version History

- **v1.0** - Initial AI chatbot and email integration
- **v1.1** - Added medical record parsing
- **v1.2** - Smart appointment scheduling
- **v1.3** - Enhanced UI and performance optimizations