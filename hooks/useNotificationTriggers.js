import { useNotifications } from '../contexts/NotificationContext';

export const useNotificationTriggers = () => {
  const { notifySuccess, notifyError, notifyInfo } = useNotifications();

  const triggerVeterinarianCreated = (veterinarianName) => {
    notifySuccess(
      'New Veterinarian Added',
      `Dr. ${veterinarianName} has been successfully added to your clinic`,
      'veterinarian_created'
    );
  };

  const triggerAppointmentCreated = (customerName, petName, service) => {
    notifySuccess(
      'New Appointment Booked',
      `${customerName} booked appointment for ${petName} - ${service}`,
      'appointment_created'
    );
  };

  const triggerCustomerCreated = (customerName) => {
    notifySuccess(
      'New Customer Registered',
      `${customerName} has been successfully registered`,
      'customer_created'
    );
  };

  const triggerMedicalRecordCreated = (petName, recordType) => {
    notifySuccess(
      'Medical Record Added',
      `New ${recordType} record created for ${petName}`,
      'medical_record_created'
    );
  };

  const triggerFileUploaded = (fileName, fileType) => {
    notifySuccess(
      'File Uploaded Successfully',
      `${fileName} (${fileType}) has been uploaded`,
      'file_uploaded'
    );
  };

  const triggerAccountCreated = (accountType, name) => {
    notifySuccess(
      'Account Created',
      `New ${accountType} account created for ${name}`,
      'account_created'
    );
  };

  const triggerDataUpdated = (dataType, itemName) => {
    notifyInfo(
      'Data Updated',
      `${dataType} information for ${itemName} has been updated`,
      'data_updated'
    );
  };

  const triggerError = (action, errorMessage) => {
    notifyError(
      `${action} Failed`,
      errorMessage || 'An error occurred. Please try again.'
    );
  };

  return {
    triggerVeterinarianCreated,
    triggerAppointmentCreated,
    triggerCustomerCreated,
    triggerMedicalRecordCreated,
    triggerFileUploaded,
    triggerAccountCreated,
    triggerDataUpdated,
    triggerError
  };
};