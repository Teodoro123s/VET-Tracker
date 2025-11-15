// Test appointments for calendar functionality
export const createTestAppointments = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  return [
    {
      id: 'test-1',
      customerName: 'John Smith',
      petName: 'Buddy',
      service: 'Checkup',
      appointmentDate: today,
      status: 'Pending',
      veterinarian: 'Dr. Test Vet'
    },
    {
      id: 'test-2', 
      customerName: 'Jane Doe',
      petName: 'Whiskers',
      service: 'Vaccination',
      appointmentDate: tomorrow,
      status: 'Pending',
      veterinarian: 'Dr. Test Vet'
    },
    {
      id: 'test-3',
      customerName: 'Bob Johnson', 
      petName: 'Rex',
      service: 'Surgery',
      appointmentDate: nextWeek,
      status: 'Pending',
      veterinarian: 'Dr. Test Vet'
    }
  ];
};