import React from 'react';
import { Alert, Platform } from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface EnhancedAlertOptions {
  title: string;
  message: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'emergency' | 'critical';
}

class EnhancedAlert {
  private static getIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'confirm': return '❓';
      case 'emergency': return '🚨';
      case 'critical': return '🔴';
      default: return '';
    }
  }

  private static formatMessage(title: string, message: string, type?: string): { title: string; message: string } {
    const icon = type ? this.getIcon(type) : '';
    return {
      title: icon ? `${icon} ${title}` : title,
      message: message
    };
  }

  static show(options: EnhancedAlertOptions): void {
    const { title, message, buttons = [{ text: 'OK' }], type } = options;
    const formatted = this.formatMessage(title, message, type);

    Alert.alert(formatted.title, formatted.message, buttons);
  }

  static success(title: string, message: string, onPress?: () => void): void {
    this.show({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'OK', onPress }]
    });
  }

  static error(title: string, message: string, onPress?: () => void): void {
    this.show({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress }]
    });
  }

  static warning(title: string, message: string, onPress?: () => void): void {
    this.show({
      title,
      message,
      type: 'warning',
      buttons: [{ text: 'OK', onPress }]
    });
  }

  static info(title: string, message: string, onPress?: () => void): void {
    this.show({
      title,
      message,
      type: 'info',
      buttons: [{ text: 'OK', onPress }]
    });
  }

  static confirm(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ): void {
    this.show({
      title,
      message,
      type: 'confirm',
      buttons: [
        { text: cancelText, style: 'cancel', onPress: onCancel },
        { text: confirmText, style: 'destructive', onPress: onConfirm }
      ]
    });
  }

  static deleteConfirm(
    itemName: string,
    itemType: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    this.confirm(
      'Delete Confirmation',
      `Are you sure you want to delete "${itemName}"?\n\nThis ${itemType} will be permanently removed and cannot be recovered.\n\n⚠️ This action cannot be undone.`,
      onConfirm,
      onCancel,
      'Delete',
      'Cancel'
    );
  }

  static saveConfirm(
    action: string,
    details: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    this.confirm(
      `${action} Confirmation`,
      `${details}\n\nDo you want to proceed?`,
      onConfirm,
      onCancel,
      'Save',
      'Cancel'
    );
  }

  static validationError(missingFields: string[]): void {
    const fieldList = missingFields.map(field => `• ${field}`).join('\n');
    this.error(
      'Required Fields Missing',
      `Please fill in the following required fields:\n\n${fieldList}`
    );
  }

  static networkError(action: string, retry?: () => void): void {
    const buttons = retry 
      ? [
          { text: 'Cancel', style: 'cancel' as const },
          { text: 'Retry', onPress: retry }
        ]
      : [{ text: 'OK' }];

    this.show({
      title: 'Network Error',
      message: `Failed to ${action}.\n\nPlease check your internet connection and try again.`,
      type: 'error',
      buttons
    });
  }

  static operationSuccess(operation: string, details?: string): void {
    const message = details 
      ? `${operation} completed successfully.\n\n${details}`
      : `${operation} completed successfully.`;
    
    this.success('Success', message);
  }

  static operationError(operation: string, error?: string): void {
    const message = error 
      ? `Failed to ${operation}.\n\nError: ${error}`
      : `Failed to ${operation}. Please try again.`;
    
    this.error('Operation Failed', message);
  }

  static permissionDenied(action: string): void {
    this.warning(
      'Permission Denied',
      `You don't have permission to ${action}.\n\nPlease contact your administrator if you believe this is an error.`
    );
  }

  static sessionExpired(onLogin?: () => void): void {
    this.show({
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again to continue.',
      type: 'warning',
      buttons: [
        { text: 'OK', onPress: onLogin }
      ]
    });
  }

  static dataLoss(onProceed: () => void, onCancel?: () => void): void {
    this.confirm(
      'Unsaved Changes',
      'You have unsaved changes that will be lost.\n\n⚠️ Are you sure you want to continue without saving?',
      onProceed,
      onCancel,
      'Continue',
      'Stay'
    );
  }

  static emailSent(recipient: string, credentials?: { email: string; password: string }): void {
    const message = credentials
      ? `Login credentials have been sent to:\n${recipient}\n\n📧 Email: ${credentials.email}\n🔑 Password: ${credentials.password}\n\nThe recipient will receive an email with these details.`
      : `Email has been sent successfully to:\n${recipient}`;
    
    this.success('Email Sent', message);
  }

  static emailFailed(recipient: string, credentials?: { email: string; password: string }): void {
    const message = credentials
      ? `Failed to send email to ${recipient}.\n\nPlease share these credentials manually:\n\n📧 Email: ${credentials.email}\n🔑 Password: ${credentials.password}`
      : `Failed to send email to ${recipient}.\n\nPlease check the email address and try again.`;
    
    this.error('Email Failed', message);
  }

  static passwordGenerated(email: string, password: string, emailSent: boolean = false): void {
    const message = emailSent
      ? `New password generated and sent to:\n${email}\n\n🔑 New Password: ${password}\n\n📧 The user will receive an email with the new credentials.`
      : `New password generated for:\n${email}\n\n🔑 New Password: ${password}\n\n⚠️ Please share this password manually as email sending failed.`;
    
    this.success('Password Generated', message);
  }

  static appointmentReminder(patientName: string, time: string, veterinarian: string): void {
    this.info(
      'Appointment Reminder',
      `Upcoming appointment:\n\n🐾 Patient: ${patientName}\n⏰ Time: ${time}\n👨‍⚕️ Veterinarian: ${veterinarian}`
    );
  }

  static maintenanceMode(message?: string): void {
    this.warning(
      'System Maintenance',
      message || 'The system is currently under maintenance. Some features may be temporarily unavailable.\n\nPlease try again later.'
    );
  }

  static scheduleConflict(details: string, onResolve?: () => void): void {
    this.show({
      title: 'Schedule Conflict',
      message: `⚠️ Scheduling Conflict Detected\n\n${details}\n\nPlease choose a different time slot to avoid conflicts.`,
      type: 'warning',
      buttons: onResolve ? [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Resolve', onPress: onResolve }
      ] : [{ text: 'OK' }]
    });
  }

  static appointmentComplete(patientName: string, onAddRecord?: () => void): void {
    this.show({
      title: 'Appointment Completed',
      message: `✅ Appointment with ${patientName} has been marked as completed.\n\nWould you like to add a medical record for this visit?`,
      type: 'success',
      buttons: onAddRecord ? [
        { text: 'Later', style: 'cancel' },
        { text: 'Add Record', onPress: onAddRecord }
      ] : [{ text: 'OK' }]
    });
  }

  static duplicateEntry(itemType: string, itemName: string): void {
    this.warning(
      'Duplicate Entry',
      `A ${itemType} with the name "${itemName}" already exists.\n\nPlease choose a different name or update the existing entry.`
    );
  }

  static connectionLost(onRetry?: () => void): void {
    const buttons = onRetry ? [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Retry', onPress: onRetry }
    ] : [{ text: 'OK' }];

    this.show({
      title: 'Connection Lost',
      message: '📡 Connection to the server has been lost.\n\nPlease check your internet connection and try again.',
      type: 'error',
      buttons
    });
  }

  static rateLimitExceeded(action: string, waitTime?: string): void {
    const message = waitTime
      ? `🚦 Rate Limit Exceeded\n\nToo many ${action} attempts. Please wait ${waitTime} before trying again.\n\nThis helps protect the system from overload.`
      : `🚦 Rate Limit Exceeded\n\nToo many ${action} attempts. Please wait a moment before trying again.`;
    
    this.warning('Rate Limit', message);
  }
}

export default EnhancedAlert;

// Additional alert types for specific veterinary scenarios
export const VetAlerts = {
  petCheckIn: (petName: string, ownerName: string) => {
    EnhancedAlert.info(
      'Pet Check-In',
      `🐾 ${petName} has arrived for their appointment.\n\n👤 Owner: ${ownerName}\n\nPlease prepare for the consultation.`
    );
  },

  medicationReminder: (petName: string, medication: string, time: string) => {
    EnhancedAlert.info(
      'Medication Reminder',
      `💊 Medication Due\n\n🐾 Patient: ${petName}\n💉 Medication: ${medication}\n⏰ Due: ${time}`
    );
  },

  emergencyAlert: (details: string, onRespond?: () => void) => {
    EnhancedAlert.show({
      title: 'Emergency Alert',
      message: `🚨 EMERGENCY\n\n${details}\n\nImmediate attention required!`,
      type: 'emergency',
      buttons: onRespond ? [
        { text: 'Respond', onPress: onRespond, style: 'destructive' }
      ] : [{ text: 'Acknowledged' }]
    });
  },

  vaccinationDue: (petName: string, vaccination: string, dueDate: string) => {
    EnhancedAlert.warning(
      'Vaccination Due',
      `💉 Vaccination Reminder\n\n🐾 Patient: ${petName}\n💉 Vaccination: ${vaccination}\n📅 Due Date: ${dueDate}\n\nPlease schedule an appointment soon.`
    );
  },

  criticalVitals: (petName: string, vitals: string, onReview?: () => void) => {
    EnhancedAlert.show({
      title: 'Critical Vitals Alert',
      message: `⚠️ CRITICAL VITALS\n\n🐾 Patient: ${petName}\n📊 Vitals: ${vitals}\n\nImmediate veterinary attention may be required.`,
      type: 'critical',
      buttons: onReview ? [
        { text: 'Review Now', onPress: onReview, style: 'destructive' }
      ] : [{ text: 'Acknowledged' }]
    });
  }
};