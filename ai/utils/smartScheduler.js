export interface VetSchedule {
  vetId;
  workingHours: { start; end};
  breakTimes: { start; end}[];
  specializations[];
  appointmentBuffer; // minutes between appointments
}
// Smart appointment scheduler
export class SmartScheduler {
  private vetSchedules = [];
  private existingAppointments[] = [];

  constructor(vetSchedules, existingAppointments[]) {
    this.vetSchedules = vetSchedules;
    this.existingAppointments = existingAppointments;
  }

  // Get optimal appointment suggestions
  public getOptimalSlots(request, numberOfSuggestions = 3): TimeSlot[] {
    const suggestions = [];
    const startDate = request.preferredDate ? new Date(request.preferredDate) : new Date();
    
    // Look ahead up to 14 days
    for (let dayOffset = 0; dayOffset  {
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
  private isVetSuitableForService(vetSchedule, service)  {
    if (vetSchedule.specializations.length === 0) return true; // General vet
    
    const serviceKeywords = service.toLowerCase();
    return vetSchedule.specializations.some(spec => 
      serviceKeywords.includes(spec.toLowerCase())
    );
  }

  // Rank slots by optimality
  private rankSlotsByOptimality(slots, request): TimeSlot[] {
    return slots.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Prefer earlier dates for urgent/emergency
      if (request.priority === 'urgent' || request.priority === 'emergency') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA  {
      const startMinutes = this.parseTime(breakTime.start);
      const endMinutes = this.parseTime(breakTime.end);
      return timeMinutes >= startMinutes && timeMinutes  {
  // Mock vet schedules - replace with actual data from your database
  const vetSchedules = [
    {
      vetId: 'vet1',
      workingHours: { start: '09:00', end: '17:00' },
      breakTimes: [{ start: '12:00', end: '13:00' }],
      specializations: ['general', 'surgery'],
      appointmentBuffer
    },
    {
      vetId: 'vet2', 
      workingHours: { start: '08:00', end: '16:00' },
      breakTimes: [{ start: '12:30', end: '13:30' }],
      specializations: ['cardiology', 'emergency'],
      appointmentBuffer
    }
  ];

  // Mock existing appointments - replace with actual data
  const existingAppointments = [
    { vetId: 'vet1', date: '2024-01-15', time: '10:00', duration},
    { vetId: 'vet1', date: '2024-01-15', time: '14:00', duration}
  ];

  const scheduler = new SmartScheduler(vetSchedules, existingAppointments);
  return scheduler.getOptimalSlots(request);
};