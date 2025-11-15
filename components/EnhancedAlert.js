import React from 'react';
import { Alert, Platform } from 'react-native';
class EnhancedAlert {
  static getIcon(type) {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'confirm': return '❓';
      case 'emergency': return '🚨';
      case 'critical': return '🔴';
      default '';
    }
  }

  static formatMessage(title, message, type) {
    const icon = type ? this.getIcon(type) : '';
    return {
      title ? `${icon} ${title}` : title,
      message
    };
  }

  static show(options)  {
    const { title, message, buttons = [{ text: 'OK' }], type } = options;
    const formatted = this.formatMessage(title, message, type);

    Alert.alert(formatted.title, formatted.message, buttons);
  }

  static success(title, message, onPress) {
    this.show({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'OK', onPress }]
    });
  }

  static error(title, message, onPress) {
    this.show({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'OK', onPress }]
    });
  }

  static warning(title, message, onPress) {
    this.show({
      title,
      message,
      type: 'warning',
      buttons: [{ text: 'OK', onPress }]
    });
  }

  static info(title, message, onPress) {
    this.show({
      title,
      message,
      type: 'info',
      buttons: [{ text: 'OK', onPress }]
    });
  }

  static confirm(
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  ) {
    this.show({
      title,
      message,
      type: 'confirm',
      buttons
        { text, style: 'cancel', onPress},
        { text, style: 'destructive', onPress}
      ]
    });
  }

  static deleteConfirm(
    itemName,
    itemType,
    onConfirm,
    onCancel
  ) {
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
    action,
    details,
    onConfirm,
    onCancel
  ) {
    this.confirm(
      `${action} Confirmation`,
      `${details}\n\nDo you want to proceed?`,
      onConfirm,
      onCancel,
      'Save',
      'Cancel'
    );
  }

  static validationError(missingFields) {
    const fieldList = missingFields.map(field => `• ${field}`).join('\n');
    this.error(
      'Required Fields Missing',
      `Please fill in the following required fields:\n\n${fieldList}`
    );
  }

  static networkError(action, retry) {
    const buttons = retry 
      ? [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress}
        ]
      : [{ text: 'OK' }];

    this.show({
      title: 'Network Error',
      message: `Failed to ${action}.\n\nPlease check your internet connection and try again.`,
      type: 'error',
      buttons
    });
  }

  static operationSuccess(operation, details) {
    const message = details 
      ? `${operation} completed successfully.\n\n${details}`
      : `${operation} completed successfully.`;
    
    this.success('Success', message);
  }

  static operationError(operation, error) {
    const message = error 
      ? `Failed to ${operation}.\n\nError: ${error}`
      : `Failed to ${operation}. Please try again.`;
    
    this.error('Operation Failed', message);
  }

  static permissionDenied(action) {
    this.warning(
      'Permission Denied',
      `You don't have permission to ${action}.\n\nPlease contact your administrator if you believe this is an error.`
    );
  }

  static sessionExpired(onLogin) {
    this.show({
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again to continue.',
      type: 'warning',
      buttons
        { text: 'OK', onPress}
      ]
    });
  }

  static dataLoss(onProceed, onCancel) {
    this.confirm(
      'Unsaved Changes',
      'You have unsaved changes that will be lost.\n\n⚠️ Are you sure you want to continue without saving?',
      onProceed,
      onCancel,
      'Continue',
      'Stay'
    );
  }

  static emailSent(recipient, credentials?; password})  {
    const message = credentials
      ? `Login credentials have been sent to:\n${recipient}\n\n📧 Email: ${credentials.email}\n🔑 Password: ${credentials.password}\n\nThe recipient will receive an email with these details.`
      : `Email has been sent successfully to:\n${recipient}`;
    
    this.success('Email Sent', message);
  }

  static emailFailed(recipient, credentials?; password})  {
    const message = credentials
      ? `Failed to send email to ${recipient}.\n\nPlease share these credentials manually:\n\n📧 Email: ${credentials.email}\n🔑 Password: ${credentials.password}`
      : `Failed to send email to ${recipient}.\n\nPlease check the email address and try again.`;
    
    this.error('Email Failed', message);
  }

  static passwordGenerated(email, password, emailSent = false)  {
    const message = emailSent
      ? `New password generated and sent to:\n${email}\n\n🔑 New Password: ${password}\n\n📧 The user will receive an email with the new credentials.`
      : `New password generated for:\n${email}\n\n🔑 New Password: ${password}\n\n⚠️ Please share this password manually as email sending failed.`;
    
    this.success('Password Generated', message);
  }

  static appointmentReminder(patientName, time, veterinarian) {
    this.info(
      'Appointment Reminder',
      `Upcoming appointment:\n\n🐾 Patient: ${patientName}\n⏰ Time: ${time}\n👨‍⚕️ Veterinarian: ${veterinarian}`
    );
  }

  static maintenanceMode(message) {
    this.warning(
      'System Maintenance',
      message || 'The system is currently under maintenance. Some features may be temporarily unavailable.\n\nPlease try again later.'
    );
  }

  static scheduleConflict(details, onResolve) {
    this.show({
      title: 'Schedule Conflict',
      message: `⚠️ Scheduling Conflict Detected\n\n${details}\n\nPlease choose a different time slot to avoid conflicts.`,
      type: 'warning',
      buttons ? [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Resolve', onPress}
      ] : [{ text: 'OK' }]
    });
  }

  static appointmentComplete(patientName, onAddRecord) {
    this.show({
      title: 'Appointment Completed',
      message: `✅ Appointment with ${patientName} has been marked as completed.\n\nWould you like to add a medical record for this visit?`,
      type: 'success',
      buttons ? [
        { text: 'Later', style: 'cancel' },
        { text: 'Add Record', onPress}
      ] : [{ text: 'OK' }]
    });
  }

  static duplicateEntry(itemType, itemName) {
    this.warning(
      'Duplicate Entry',
      `A ${itemType} with the name "${itemName}" already exists.\n\nPlease choose a different name or update the existing entry.`
    );
  }

  static connectionLost(onRetry) {
    const buttons = onRetry ? [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Retry', onPress}
    ] : [{ text: 'OK' }];

    this.show({
      title: 'Connection Lost',
      message: '📡 Connection to the server has been lost.\n\nPlease check your internet connection and try again.',
      type: 'error',
      buttons
    });
  }

  static rateLimitExceeded(action, waitTime) {
    const message = waitTime
      ? `🚦 Rate Limit Exceeded\n\nToo many ${action} attempts. Please wait ${waitTime} before trying again.\n\nThis helps protect the system from overload.`
      : `🚦 Rate Limit Exceeded\n\nToo many ${action} attempts. Please wait a moment before trying again.`;
    
    this.warning('Rate Limit', message);
  }
}

export default EnhancedAlert;

// Additional alert types for specific veterinary scenarios
export const VetAlerts = {
  petCheckIn: (petName, ownerName) => {
    EnhancedAlert.info(
      'Pet Check-In',
      `🐾 ${petName} has arrived for their appointment.\n\n👤 Owner: ${ownerName}\n\nPlease prepare for the consultation.`
    );
  },

  medicationReminder: (petName, medication, time) => {
    EnhancedAlert.info(
      'Medication Reminder',
      `💊 Medication Due\n\n🐾 Patient: ${petName}\n💉 Medication: ${medication}\n⏰ Due: ${time}`
    );
  },

  emergencyAlert: (details, onRespond) => {
    EnhancedAlert.show({
      title: 'Emergency Alert',
      message: `🚨 EMERGENCY\n\n${details}\n\nImmediate attention required!`,
      type: 'emergency',
      buttons ? [
        { text: 'Respond', onPress, style: 'destructive' }
      ] : [{ text: 'Acknowledged' }]
    });
  },

  vaccinationDue: (petName, vaccination, dueDate) => {
    EnhancedAlert.warning(
      'Vaccination Due',
      `💉 Vaccination Reminder\n\n🐾 Patient: ${petName}\n💉 Vaccination: ${vaccination}\n📅 Due Date: ${dueDate}\n\nPlease schedule an appointment soon.`
    );
  },

  criticalVitals: (petName, vitals, onReview) => {
    EnhancedAlert.show({
      title: 'Critical Vitals Alert',
      message: `⚠️ CRITICAL VITALS\n\n🐾 Patient: ${petName}\n📊 Vitals: ${vitals}\n\nImmediate veterinary attention may be required.`,
      type: 'critical',
      buttons ? [
        { text: 'Review Now', onPress, style: 'destructive' }
      ] : [{ text: 'Acknowledged' }]
    });
  }
};