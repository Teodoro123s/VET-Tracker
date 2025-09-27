export interface VetSchedule {
  vetId: string;
  workingHours: { start: string; end: string };
  breakTimes: { start: string; end: string }[];
  specializations: string[];
  appointmentBuffer: number; // minutes between appointments
}

export interface AppointmentRequest {
  petName: string;
  ownerName: string;
  service: string;
  preferredDate?: string;
  duration: number; // minutes
  priority: 'routine' | 'urgent' | 'emergency';
}

export interface TimeSlot {
  date: string;
  time: string;
  vetId: string;
  vetName: string;
  available: boolean;
  reason?: string;
}

// Smart appointment scheduler
export class SmartScheduler {
  private vetSchedules: VetSchedule[] = [];
  private existingAppointments: any[] = [];

  constructor(vetSchedules: VetSchedule[], existingAppointments: any[]) {
    this.vetSchedules = vetSchedules;
    this.existingAppointments = existingAppointments;
  }

  // Get optimal appointment suggestions
  public getOptimalSlots(request: AppointmentRequest, numberOfSuggestions = 3): TimeSlot[] {
    const suggestions: TimeSlot[] = [];
    const startDate = request.preferredDate ? new Date(request.preferredDate) : new Date();
    
    // Look ahead up to 14 days
    for (let dayOffset = 0; dayOffset < 14 && suggestions.length < numberOfSuggestions; dayOffset++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() + dayOffset);
      
      const daySlots = this.getAvailableSlotsForDate(checkDate, request);
      suggestions.push(...daySlots.slice(0, numberOfSuggestions - suggestions.length));
    }

    return this.rankSlotsByOptimality(suggestions, request);
  }

  // Get available slots for a specific date
  private getAvailableSlotsForDate(date: Date, request: AppointmentRequest): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dateStr = date.toISOString().split('T')[0];

    for (const vetSchedule of this.vetSchedules) {
      // Check if vet specialization matches service
      if (!this.isVetSuitableForService(vetSchedule, request.service)) {
        continue;
      }

      const workingSlots = this.generateWorkingSlots(vetSchedule, dateStr);
      const availableSlots = this.filterAvailableSlots(workingSlots, vetSchedule, request, dateStr);
      
      slots.push(...availableSlots);
    }

    return slots;
  }

  // Generate working time slots for a vet
  private generateWorkingSlots(vetSchedule: VetSchedule, date: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startTime = this.parseTime(vetSchedule.workingHours.start);
    const endTime = this.parseTime(vetSchedule.workingHours.end);
    
    let currentTime = startTime;
    
    while (currentTime < endTime) {
      const timeStr = this.formatTime(currentTime);
      
      // Skip break times
      if (!this.isBreakTime(timeStr, vetSchedule.breakTimes)) {
        slots.push({
          date,
          time: timeStr,
          vetId: vetSchedule.vetId,
          vetName: `Dr. ${vetSchedule.vetId}`, // Replace with actual vet name
          available: true
        });
      }
      
      currentTime += 30; // 30-minute slots
    }

    return slots;
  }

  // Filter slots based on existing appointments and conflicts
  private filterAvailableSlots(slots: TimeSlot[], vetSchedule: VetSchedule, request: AppointmentRequest, date: string): TimeSlot[] {
    return slots.filter(slot => {
      // Check for existing appointments
      const hasConflict = this.existingAppointments.some(apt => 
        apt.vetId === vetSchedule.vetId &&
        apt.date === date &&
        this.timesOverlap(slot.time, apt.time, request.duration, apt.duration || 30)
      );

      if (hasConflict) {
        slot.available = false;
        slot.reason = 'Already booked';
        return false;
      }

      // Check buffer time
      const hasBufferConflict = this.existingAppointments.some(apt =>
        apt.vetId === vetSchedule.vetId &&
        apt.date === date &&
        this.isWithinBuffer(slot.time, apt.time, vetSchedule.appointmentBuffer)
      );

      if (hasBufferConflict) {
        slot.available = false;
        slot.reason = 'Buffer time required';
        return false;
      }

      return true;
    });
  }

  // Check if vet is suitable for the requested service
  private isVetSuitableForService(vetSchedule: VetSchedule, service: string): boolean {
    if (vetSchedule.specializations.length === 0) return true; // General vet
    
    const serviceKeywords = service.toLowerCase();
    return vetSchedule.specializations.some(spec => 
      serviceKeywords.includes(spec.toLowerCase())
    );
  }

  // Rank slots by optimality
  private rankSlotsByOptimality(slots: TimeSlot[], request: AppointmentRequest): TimeSlot[] {
    return slots.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Prefer earlier dates for urgent/emergency
      if (request.priority === 'urgent' || request.priority === 'emergency') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA < dateB) scoreA += 10;
        if (dateB < dateA) scoreB += 10;
      }

      // Prefer morning slots for routine appointments
      if (request.priority === 'routine') {
        const timeA = this.parseTime(a.time);
        const timeB = this.parseTime(b.time);
        if (timeA < 12 * 60) scoreA += 5; // Before noon
        if (timeB < 12 * 60) scoreB += 5;
      }

      // Prefer specialized vets
      // This would require vet specialization data
      
      return scoreB - scoreA;
    });
  }

  // Helper methods
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private isBreakTime(time: string, breakTimes: { start: string; end: string }[]): boolean {
    const timeMinutes = this.parseTime(time);
    return breakTimes.some(breakTime => {
      const startMinutes = this.parseTime(breakTime.start);
      const endMinutes = this.parseTime(breakTime.end);
      return timeMinutes >= startMinutes && timeMinutes < endMinutes;
    });
  }

  private timesOverlap(time1: string, time2: string, duration1: number, duration2: number): boolean {
    const start1 = this.parseTime(time1);
    const end1 = start1 + duration1;
    const start2 = this.parseTime(time2);
    const end2 = start2 + duration2;

    return start1 < end2 && start2 < end1;
  }

  private isWithinBuffer(time1: string, time2: string, bufferMinutes: number): boolean {
    const minutes1 = this.parseTime(time1);
    const minutes2 = this.parseTime(time2);
    return Math.abs(minutes1 - minutes2) < bufferMinutes;
  }
}

// Usage example function
export const getSmartAppointmentSuggestions = async (request: AppointmentRequest) => {
  // Mock vet schedules - replace with actual data from your database
  const vetSchedules: VetSchedule[] = [
    {
      vetId: 'vet1',
      workingHours: { start: '09:00', end: '17:00' },
      breakTimes: [{ start: '12:00', end: '13:00' }],
      specializations: ['general', 'surgery'],
      appointmentBuffer: 15
    },
    {
      vetId: 'vet2', 
      workingHours: { start: '08:00', end: '16:00' },
      breakTimes: [{ start: '12:30', end: '13:30' }],
      specializations: ['cardiology', 'emergency'],
      appointmentBuffer: 10
    }
  ];

  // Mock existing appointments - replace with actual data
  const existingAppointments = [
    { vetId: 'vet1', date: '2024-01-15', time: '10:00', duration: 30 },
    { vetId: 'vet1', date: '2024-01-15', time: '14:00', duration: 60 }
  ];

  const scheduler = new SmartScheduler(vetSchedules, existingAppointments);
  return scheduler.getOptimalSlots(request);
};