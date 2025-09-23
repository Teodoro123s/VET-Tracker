import { activateQueuedPeriods } from '../services/subscriptionService';

class SubscriptionScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Start the scheduler to check for expired periods every hour
  start() {
    if (this.isRunning) {
      console.log('Subscription scheduler is already running');
      return;
    }

    console.log('Starting subscription scheduler...');
    this.isRunning = true;

    // Run immediately on start
    this.checkAndActivateQueued();

    // Then run every hour (3600000 ms)
    this.intervalId = setInterval(() => {
      this.checkAndActivateQueued();
    }, 3600000); // 1 hour
  }

  // Stop the scheduler
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Subscription scheduler stopped');
  }

  // Manual trigger for checking and activating queued periods
  async checkAndActivateQueued() {
    try {
      console.log('Checking for expired periods and activating queued subscriptions...');
      await activateQueuedPeriods();
      console.log('Subscription check completed');
    } catch (error) {
      console.error('Error in subscription scheduler:', error);
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null
    };
  }
}

// Export singleton instance
export const subscriptionScheduler = new SubscriptionScheduler();

// Auto-start the scheduler when the module is imported
if (typeof window !== 'undefined') {
  // Only start in browser environment
  subscriptionScheduler.start();
}