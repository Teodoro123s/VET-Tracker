import { sendAIEmail } from '../../lib/services/emailService';
import { router } from 'expo-router';

// Parse user intent from message
const parseUserIntent = (message) => {
  const patterns = {
    time: /what time|current time|time now|what's the time/i,
    date: /what date|today's date|current date|what day/i,
    greeting: /hello|hi|hey|good morning|good afternoon|good evening/i,
    thanks: /thank you|thanks|appreciate/i,
    appointment: /book|schedule|appointment|visit/i,
    navigation: /go to|show me|take me|where is|navigate/i,
    help: /how to|help|guide|tutorial/i,
    emergency: /emergency|urgent|critical/i,
    customer: /customer|client|owner/i,
    email: /send.*email|email.*reminder|notify.*email/i,
    calendar: /calendar|schedule|date/i,
    notifications: /notification|alert|bell/i
  };
  
  for (let [intent, pattern] of Object.entries(patterns)) {
    if (pattern.test(message)) return intent;
  }
  return 'general';
};

// Project-specific responses
const getProjectResponse = (intent, message) => {
  const responses = {
    appointment: {
      message: "I can help you book an appointment! To schedule:\n• Go to Calendar tab\n• Tap on desired date\n• Fill appointment form\n\nWould you like me to take you there?",
      action: "navigate_calendar"
    },
    navigation: {
      message: "Where would you like to go?\n• 📅 Calendar - Book appointments\n• 👥 Customers - Manage clients\n• 🔔 Notifications - View alerts\n• 📋 Medical Records - Pet history",
      action: "show_navigation"
    },
    customer: {
      message: "To manage customers:\n• Go to Customers tab\n• Tap '+' to add new customer\n• Select existing customer to view pets\n• Access medical history from pet details",
      action: "navigate_customers"
    },
    email: {
      message: "I can send email notifications! What type?\n• Appointment reminders\n• Follow-up care instructions\n• Emergency alerts\n\nJust tell me the details!",
      action: "email_options"
    },
    calendar: {
      message: "Opening calendar for you! You can:\n• View appointments by date\n• Book new appointments\n• Check veterinarian availability",
      action: "navigate_calendar"
    },
    notifications: {
      message: "Opening notifications! You can view:\n• Pending appointments\n• Due appointments\n• Upcoming schedules\n• System alerts",
      action: "navigate_notifications"
    },
    emergency: {
      message: "🚨 For emergencies:\n• Call: (555) 123-4567\n• Email: emergency@vetclinic.com\n• Walk-in patients accepted\n\nIs this a current emergency?",
      action: "show_emergency"
    }
  };
  
  return responses[intent] || null;
};

// Handle email requests
const handleEmailRequest = async (message) => {
  if (/appointment.*reminder/i.test(message)) {
    const emailResult = await sendAIEmail({
      subject: 'Appointment Reminder',
      recipientName: 'Customer',
      message: 'Your pet has an upcoming appointment. Please confirm your attendance.',
      additionalNotes: 'Please bring vaccination records and any medications.',
      toEmail: 'customer@example.com' // Replace with actual customer email
    });
    
    return {
      message: emailResult.success ? 
        "✅ Appointment reminder email sent successfully!" : 
        "❌ Failed to send email. Please try again.",
      action};
  }
  
  if (/follow.*up/i.test(message)) {
    const emailResult = await sendAIEmail({
      subject: 'Follow-up Care Instructions',
      recipientName: 'Pet Owner',
      message: 'Thank you for visiting our clinic. Here are the follow-up care instructions for your pet.',
      additionalNotes: 'Please monitor your pet and contact us if you notice any concerning symptoms.',
      toEmail: 'owner@example.com'
    });
    
    return {
      message: emailResult.success ? 
        "✅ Follow-up email sent successfully!" : 
        "❌ Failed to send follow-up email.",
      action};
  }
  
  return {
    message: "I can help you send emails! Please specify:\n• Appointment reminder\n• Follow-up instructions\n• Emergency notification\n\nWhat would you like to send?",
    action};
};

// Execute navigation actions
export const executeAction = (action) => {
  switch(action) {
    case 'navigate_calendar':
      router.push('/veterinarian/vet-calendar');
      break;
    case 'navigate_customers':
      router.push('/veterinarian/vet-customers');
      break;
    case 'navigate_notifications':
      router.push('/veterinarian/vet-notifications');
      break;
    case 'navigate_appointments':
      router.push('/veterinarian/vet-appointments');
      break;
  }
};

// Smart responses for time, date, greetings
const getSmartResponse = (intent) => {
  const now = new Date();
  
  const responses = {
    time: {
      message: `The current time is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12})}.`,
      action
    },
    date: {
      message: `Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`,
      action
    },
    greeting: {
      message: getGreetingMessage(),
      action},
    thanks: {
      message: "You're welcome! I'm here to help whenever you need assistance. Is there anything else I can help you with?",
      action}
  };
  
  return responses[intent] || null;
};

// Get greeting based on time of day
const getGreetingMessage = () => {
  const hour = new Date().getHours();
  let greeting = "Hello";
  
  if (hour  {
  const intent = parseUserIntent(userMessage);
  
  // Check for smart responses first
  const smartResponse = getSmartResponse(intent);
  if (smartResponse) return smartResponse;
  
  // Check for project-specific responses
  const projectResponse = getProjectResponse(intent, userMessage);
  if (projectResponse) return projectResponse;
  
  // Handle email requests
  if (intent === 'email') {
    return await handleEmailRequest(userMessage);
  }
  
  // Enhanced general responses
  if (/how are you/i.test(userMessage)) {
    return { message: "I'm doing great, thank you! I'm here and ready to help you with your veterinary needs. How can I assist you?", action};
  }
  
  if (/who are you/i.test(userMessage)) {
    return { message: "I'm your AI veterinary assistant! I help you navigate the app, book appointments, and answer questions about pet care.", action};
  }
  
  // General responses
  const generalResponses = {
    general: "I'm your veterinary assistant! I can help you with:\n• 📅 Booking appointments\n• 👥 Managing customers\n• 🕐 Current time and date\n• 🧭 Navigating the app\n• ❓ Answering questions\n\nWhat would you like to do?",
    help: "Here's what I can help you with:\n\n📱 **Navigation**\n• Take you to any section of the app\n\n📅 **Appointments**\n• Guide you through booking\n• Send reminders to customers\n\n🕐 **General Info**\n• Current time and date\n• How to use features\n\n❓ **Questions**\n• Ask me anything!\n\nJust type your question!"
  };
  
  return {
    message || generalResponses.general,
    action};
};