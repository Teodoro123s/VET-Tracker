import { SUBSCRIPTION_CONFIG } from '../../constants/SubscriptionConfig';

/**
 * Convert price string to number for database storage
 * Removes currency symbols, commas, and converts to number
 */
export function parsePrice(priceString: string): number {
  if (typeof priceString === 'number') return priceString;
  if (!priceString) return 0;
  
  // Remove currency symbols, commas, and extract numbers
  const cleanPrice = priceString.replace(/[₱$,\s]/g, '').replace(/[^0-9.]/g, '');
  return parseFloat(cleanPrice) || 0;
}

/**
 * Format number as currency string for display
 */
export function formatPrice(amount: number): string {
  return `₱${amount.toLocaleString()}`;
}

/**
 * Get subscription price by period from config
 */
export function getSubscriptionPrice(period: string): number {
  return SUBSCRIPTION_CONFIG.PERIODS[period]?.price || SUBSCRIPTION_CONFIG.PERIODS['1 month'].price;
}

/**
 * Get formatted subscription price by period
 */
export function getFormattedSubscriptionPrice(period: string): string {
  return formatPrice(getSubscriptionPrice(period));
}

/**
 * Get display price from transaction data
 * Prefers stored amount field, falls back to price string, then calculated price
 */
export function getDisplayPrice(data: any): string {
  // First check if we have a numeric amount field
  if (data.amount && typeof data.amount === 'number') {
    return formatPrice(data.amount);
  }
  
  // Then check if we have a price string
  if (data.price && typeof data.price === 'string') {
    return data.price;
  }
  
  // Finally, calculate from period
  return getFormattedSubscriptionPrice(data.period || '1 month');
}

/**
 * Parse price from various formats for analytics
 * Handles both string and number formats
 */
export function parseAnalyticsPrice(priceField: any): number {
  if (typeof priceField === 'number') {
    return priceField;
  }
  
  if (typeof priceField === 'string') {
    return parsePrice(priceField);
  }
  
  return 0;
}