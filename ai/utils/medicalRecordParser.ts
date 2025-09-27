import { sendAIEmail } from '../services/emailService';

export interface ParsedAppointment {
  date: string;
  time?: string;
  type: string;
  reason?: string;
  customerEmail?: string;
  petName?: string;
  vetEmail?: string;
}

// AI Medical Record Parser
export const parseNextAppointment = (medicalRecord: any): ParsedAppointment | null => {
  const recordText = JSON.stringify(medicalRecord).toLowerCase();
  
  // Date patterns
  const datePatterns = [
    /next.*appointment.*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /follow.*up.*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /return.*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /recheck.*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /schedule.*(\d{1,2}\/\d{1,2}\/\d{4})/i
  ];
  
  // Relative date patterns
  const relativeDatePatterns = [
    /tomorrow/i,
    /next week/i,
    /in (\d+) days?/i,
    /in (\d+) weeks?/i,
    /(\d+) days? from now/i
  ];
  
  // Appointment type patterns
  const appointmentTypes = [
    'follow up', 'follow-up', 'recheck', 'return visit', 'next appointment',
    'vaccination', 'checkup', 'surgery', 'consultation', 'examination'
  ];
  
  let foundDate = '';
  let appointmentType = 'follow-up visit';
  
  // Check for specific dates
  for (const pattern of datePatterns) {
    const match = recordText.match(pattern);
    if (match) {
      foundDate = match[1];
      break;
    }
  }
  
  // Check for relative dates
  if (!foundDate) {
    for (const pattern of relativeDatePatterns) {
      const match = recordText.match(pattern);
      if (match) {
        foundDate = calculateRelativeDate(match[0]);
        break;
      }
    }
  }
  
  // Determine appointment type
  for (const type of appointmentTypes) {
    if (recordText.includes(type)) {
      appointmentType = type;
      break;
    }
  }
  
  if (foundDate) {
    return {
      date: foundDate,
      type: appointmentType,
      reason: extractReason(recordText),
      customerEmail: medicalRecord.customerEmail,
      petName: medicalRecord.petName,
      vetEmail: medicalRecord.vetEmail
    };
  }
  
  return null;
};

// Calculate relative dates
const calculateRelativeDate = (relativeText: string): string => {
  const today = new Date();
  
  if (/tomorrow/i.test(relativeText)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toLocaleDateString();
  }
  
  if (/next week/i.test(relativeText)) {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek.toLocaleDateString();
  }
  
  const daysMatch = relativeText.match(/(\d+) days?/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    return futureDate.toLocaleDateString();
  }
  
  const weeksMatch = relativeText.match(/(\d+) weeks?/i);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + (weeks * 7));
    return futureDate.toLocaleDateString();
  }
  
  return '';
};

// Extract appointment reason
const extractReason = (recordText: string): string => {
  const reasonPatterns = [
    /for (.+?) (appointment|visit|check)/i,
    /regarding (.+?) (treatment|condition)/i,
    /to (.+?) (monitor|check|examine)/i
  ];
  
  for (const pattern of reasonPatterns) {
    const match = recordText.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return 'routine check-up';
};

// Schedule notifications based on parsed appointment
export const scheduleAppointmentNotifications = async (appointment: ParsedAppointment) => {
  if (!appointment.customerEmail || !appointment.petName) {
    console.log('Missing customer email or pet name for notification');
    return;
  }
  
  try {
    // Send customer notification
    await sendAIEmail({
      subject: `Upcoming Appointment - ${appointment.petName}`,
      recipientName: 'Pet Owner',
      message: `Your pet ${appointment.petName} has a scheduled ${appointment.type} appointment on ${appointment.date}.`,
      additionalNotes: appointment.reason ? `Reason: ${appointment.reason}` : 'Please bring any previous medical records.',
      toEmail: appointment.customerEmail
    });
    
    // Send veterinarian notification if specified
    if (appointment.vetEmail) {
      await sendAIEmail({
        subject: `Appointment Scheduled - ${appointment.petName}`,
        recipientName: 'Doctor',
        message: `A ${appointment.type} appointment has been scheduled for ${appointment.petName} on ${appointment.date}.`,
        additionalNotes: appointment.reason ? `Reason: ${appointment.reason}` : '',
        toEmail: appointment.vetEmail
      });
    }
    
    console.log('Appointment notifications sent successfully');
  } catch (error) {
    console.error('Failed to send appointment notifications:', error);
  }
};

// Main function to process medical record and auto-schedule
export const processMedicalRecordForAppointments = async (medicalRecord: any) => {
  try {
    const parsedAppointment = parseNextAppointment(medicalRecord);
    
    if (parsedAppointment) {
      console.log('Found appointment in medical record:', parsedAppointment);
      await scheduleAppointmentNotifications(parsedAppointment);
      return {
        success: true,
        message: `Appointment notification scheduled for ${parsedAppointment.date}`,
        appointment: parsedAppointment
      };
    } else {
      return {
        success: false,
        message: 'No appointment information found in medical record'
      };
    }
  } catch (error) {
    console.error('Error processing medical record:', error);
    return {
      success: false,
      message: 'Error processing medical record for appointments'
    };
  }
};