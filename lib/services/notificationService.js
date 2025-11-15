import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export const createNotification = async (tenantId, notification) => {
  try {
    const notificationData = {
      ...notification,
      createdAt: serverTimestamp(),
      read: false,
      timestamp: new Date()
    };

    await addDoc(collection(db, `tenants/${tenantId}/notifications`), notificationData);
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

export const notifyVeterinarianCreated = async (tenantId, veterinarianData) => {
  return await createNotification(tenantId, {
    title: 'New Veterinarian Added',
    message: `Dr. ${veterinarianData.name} has been added to your clinic`,
    type: 'veterinarian_created',
    data: { veterinarianId: veterinarianData.id }
  });
};

export const notifyAppointmentCreated = async (tenantId, appointmentData) => {
  return await createNotification(tenantId, {
    title: 'New Appointment Booked',
    message: `${appointmentData.customerName} booked appointment for ${appointmentData.petName}`,
    type: 'appointment_created',
    data: { appointmentId: appointmentData.id }
  });
};

export const notifyCustomerCreated = async (tenantId, customerData) => {
  return await createNotification(tenantId, {
    title: 'New Customer Registered',
    message: `${customerData.name} has registered as a new customer`,
    type: 'customer_created',
    data: { customerId: customerData.id }
  });
};

export const notifyMedicalRecordCreated = async (tenantId, recordData) => {
  return await createNotification(tenantId, {
    title: 'Medical Record Added',
    message: `New medical record created for ${recordData.petName}`,
    type: 'medical_record_created',
    data: { recordId: recordData.id }
  });
};

export const notifyFileUploaded = async (tenantId, fileData) => {
  return await createNotification(tenantId, {
    title: 'File Uploaded',
    message: `${fileData.fileName} has been uploaded successfully`,
    type: 'file_uploaded',
    data: { fileId: fileData.id }
  });
};