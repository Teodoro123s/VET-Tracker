export const SUBSCRIPTION_CONFIG = {
  // Grace period after subscription expires (in days)
  GRACE_PERIOD_DAYS: 3,
  
  // Warning threshold - show warnings when this many days remain
  WARNING_THRESHOLD_DAYS: 7,
  
  // Scheduler interval (in milliseconds) - how often to check for expired subscriptions
  SCHEDULER_INTERVAL_MS: 3600000, // 1 hour
  
  // Subscription periods configuration
  PERIODS: {
    '1 month': { days: 30, price: 7499 },
    '6 months': { days: 180, price: 44994 },
    '1 year': { days: 365, price: 89988 },
    '2 years': { days: 730, price: 179976 }
  },
  
  // Days at which to send expiration warning notifications
  NOTIFICATION_DAYS: [7, 3, 1],
  
  // Support contact information
  SUPPORT_CONTACT: {
    email: 'support@vettracker.com',
    phone: '+1 (555) 123-4567'
  }
};
