import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function VetCalendarScreen() {
  const router = useRouter();
  
  const veterinarians = [
    'Dr. Michael Smith',
    'Dr. Sarah Johnson', 
    'Dr. Michael Brown',
    'Dr. Lisa Wilson'
  ];
  
  const appointments = [
    { id: 1, name: 'Smith, John', petName: 'Max', service: 'Checkup', staff: 'Dr. Michael Brown', dateTime: 'Today\n9:00 AM', status: 'Pending' },
    { id: 2, name: 'Johnson, Sarah', petName: 'Luna', service: 'Vaccination', staff: 'Dr. Michael Smith', dateTime: 'Yesterday\n10:30 AM', status: 'Completed' },
    { id: 3, name: 'Brown, Mike', petName: 'Charlie', service: 'Surgery', staff: 'Dr. Lisa Wilson', dateTime: 'Tomorrow\n2:00 PM', status: 'Due' },
    { id: 4, name: 'Davis, Lisa', petName: 'Whiskers', service: 'Grooming', staff: 'Dr. Michael Brown', dateTime: 'Tomorrow\n9:30 AM', status: 'Pending' },
    { id: 5, name: 'Wilson, Tom', petName: 'Buddy', service: 'Checkup', staff: 'Dr. Michael Smith', dateTime: '2 days ago\n11:00 AM', status: 'Cancelled' },
    { id: 6, name: 'Wilson, Tom', petName: 'Shadow', service: 'Vaccination', staff: 'Dr. Lisa Wilson', dateTime: 'Tomorrow\n1:30 PM', status: 'Due' },
    { id: 7, name: 'Brown, Mike', petName: 'Milo', service: 'Surgery', staff: 'Dr. Sarah Johnson', dateTime: 'Jan 17\n10:00 AM', status: 'Pending' },
    { id: 8, name: 'Smith, John', petName: 'Bella', service: 'Vaccination', staff: 'Dr. Michael Brown', dateTime: 'Today\n11:30 AM', status: 'Pending' },
  ];
  
  const [selectedVet, setSelectedVet] = useState('Dr. Michael Smith');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showVetDropdown, setShowVetDropdown] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayView, setShowDayView] = useState(false);
  
  const getVetAppointments = (vetName) => {
    return appointments.filter(apt => apt.staff === vetName);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {!showDayView ? (
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity style={styles.navButton} onPress={() => {
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear(selectedYear - 1);
                } else {
                  setSelectedMonth(selectedMonth - 1);
                }
              }}>
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} {selectedYear}
              </Text>
              <TouchableOpacity style={styles.navButton} onPress={() => {
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear(selectedYear + 1);
                } else {
                  setSelectedMonth(selectedMonth + 1);
                }
              }}>
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.weekHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>
            
            <View style={styles.daysGrid}>
              {(() => {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const selectedMonthName = monthNames[selectedMonth];
                const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
                const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                const daysInPrevMonth = new Date(selectedYear, selectedMonth, 0).getDate();
                const totalCells = 42;
                
                const calendarDays = [];
                
                for (let i = firstDay - 1; i >= 0; i--) {
                  const day = daysInPrevMonth - i;
                  calendarDays.push({ day, isCurrentMonth: false, isPrevMonth: true });
                }
                
                for (let day = 1; day <= daysInMonth; day++) {
                  calendarDays.push({ day, isCurrentMonth: true, isPrevMonth: false });
                }
                
                const remainingCells = totalCells - calendarDays.length;
                for (let day = 1; day <= remainingCells; day++) {
                  calendarDays.push({ day, isCurrentMonth: false, isPrevMonth: false });
                }
                
                return calendarDays.map((dayObj, index) => {
                  const { day, isCurrentMonth } = dayObj;
                  const todayDate = new Date();
                  const currentDay = todayDate.getDate();
                  const currentMonth = todayDate.getMonth();
                  const currentYear = todayDate.getFullYear();
                  
                  const vetAppointments = getVetAppointments(selectedVet);
                  const dayAppointments = isCurrentMonth ? vetAppointments.filter(apt => {
                    const isCurrentMonthAppt = apt.dateTime.includes(`${selectedMonthName} ${day}`);
                    const isTodayAppt = day === currentDay && selectedMonth === currentMonth && selectedYear === currentYear && apt.dateTime.includes('Today');
                    const isTomorrow = day === (currentDay + 1) && selectedMonth === currentMonth && selectedYear === currentYear && apt.dateTime.includes('Tomorrow');
                    const isYesterday = day === (currentDay - 1) && selectedMonth === currentMonth && selectedYear === currentYear && apt.dateTime.includes('Yesterday');
                    const daysAgoMatch = apt.dateTime.match(/([0-9]+) days ago/);
                    const isDaysAgo = daysAgoMatch && day === (currentDay - parseInt(daysAgoMatch[1])) && selectedMonth === currentMonth && selectedYear === currentYear;
                    return isCurrentMonthAppt || isTodayAppt || isTomorrow || isYesterday || isDaysAgo;
                  }) : [];
                  
                  const hasAppointments = dayAppointments.length > 0;
                  const isTodayBox = isCurrentMonth && day === todayDate.getDate() && selectedMonth === todayDate.getMonth() && selectedYear === todayDate.getFullYear();
                  
                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={[
                        styles.dayBox, 
                        hasAppointments && styles.dayWithAppt, 
                        isTodayBox && styles.todayBox, 
                        !isCurrentMonth && styles.otherMonthBox
                      ]} 
                      onPress={() => {
                        if (isCurrentMonth) {
                          setSelectedDay(day);
                          setShowDayView(true);
                        }
                      }}
                    >
                      <Text style={[
                        styles.dayText, 
                        isTodayBox && styles.todayText, 
                        !isCurrentMonth && styles.otherMonthText
                      ]}>
                        {day}
                      </Text>
                      {hasAppointments && (
                        <View style={styles.appointmentIndicator}>
                          <Text style={styles.appointmentCount}>{dayAppointments.length}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>
          </View>
        ) : (
          <View style={styles.dayViewContainer}>
            <View style={styles.dayViewHeader}>
              <Text style={styles.dayViewTitle}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} {selectedDay}, {selectedYear} - {selectedVet}
              </Text>
            </View>
            
            <ScrollView style={styles.scheduleView}>
              {Array.from({length: 24}, (_, i) => {
                const hour = i;
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const selectedMonthName = monthNames[selectedMonth];
                const vetAppointments = getVetAppointments(selectedVet);
                
                const hourAppts = vetAppointments.filter(apt => {
                  const currentDate = new Date();
                  const currentDay = currentDate.getDate();
                  const currentMonth = currentDate.getMonth();
                  const currentYear = currentDate.getFullYear();
                  const timeMatch = apt.dateTime.includes(`${hour}:`) || apt.dateTime.includes(`${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:`);
                  const isCurrentMonthAppt = apt.dateTime.includes(`${selectedMonthName} ${selectedDay}`);
                  const isToday = selectedDay === currentDay && selectedMonth === currentMonth && selectedYear === currentYear && apt.dateTime.includes('Today');
                  const isTomorrow = selectedDay === (currentDay + 1) && selectedMonth === currentMonth && selectedYear === currentYear && apt.dateTime.includes('Tomorrow');
                  const isYesterday = selectedDay === (currentDay - 1) && selectedMonth === currentMonth && selectedYear === currentYear && apt.dateTime.includes('Yesterday');
                  const daysAgoMatch = apt.dateTime.match(/([0-9]+) days ago/);
                  const isDaysAgo = daysAgoMatch && selectedDay === (currentDay - parseInt(daysAgoMatch[1])) && selectedMonth === currentMonth && selectedYear === currentYear;
                  const dayMatch = isCurrentMonthAppt || isToday || isTomorrow || isYesterday || isDaysAgo;
                  return timeMatch && dayMatch;
                });
                
                return (
                  <View key={hour} style={styles.timeSlot}>
                    <Text style={styles.timeLabel}>
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </Text>
                    <View style={styles.apptSlot}>
                      {hourAppts.map((apt) => (
                        <View key={apt.id} style={[styles.apptCard, {
                          borderLeftColor: apt.status === 'Pending' ? '#FFA500' : 
                                         apt.status === 'Due' ? '#FF6B6B' :
                                         apt.status === 'Completed' ? '#4ECDC4' : '#6c757d'
                        }]}>
                          <View style={styles.apptHeader}>
                            <Text style={styles.apptName}>{apt.name}</Text>
                            <View style={[styles.statusBadge, {
                              backgroundColor: apt.status === 'Pending' ? '#FFA500' : 
                                             apt.status === 'Due' ? '#FF6B6B' :
                                             apt.status === 'Completed' ? '#4ECDC4' : '#6c757d'
                            }]}>
                              <Text style={styles.statusBadgeText}>{apt.status}</Text>
                            </View>
                          </View>
                          <Text style={styles.apptDetails}>{apt.petName} - {apt.service}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  content: {
    flex: 1,
    padding: 20,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#2c5aa0',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5aa0',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    borderRadius: 5,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c5aa0',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayBox: {
    width: '14.28%',
    height: 50,
    borderWidth: 0.5,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  dayWithAppt: {
    backgroundColor: '#e8f5e8',
  },
  todayBox: {
    backgroundColor: '#2c5aa0',
    borderWidth: 2,
    borderColor: '#2c5aa0',
  },
  otherMonthBox: {
    backgroundColor: '#f8f9fa',
    opacity: 0.4,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  todayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  otherMonthText: {
    color: '#999',
    opacity: 0.6,
  },
  appointmentIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#23C062',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentCount: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  dayViewContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
  },
  dayViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  dayViewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5aa0',
    marginLeft: 15,
    flex: 1,
  },
  scheduleView: {
    flex: 1,
  },
  timeSlot: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 50,
  },
  timeLabel: {
    width: 80,
    fontSize: 11,
    color: '#2c5aa0',
    fontWeight: '600',
    paddingVertical: 10,
    textAlign: 'right',
    paddingRight: 10,
  },
  apptSlot: {
    flex: 1,
    paddingVertical: 5,
    paddingLeft: 10,
  },
  apptCard: {
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
    padding: 10,
    marginBottom: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#23C062',
  },
  apptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  apptName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: 'bold',
  },
  apptDetails: {
    fontSize: 11,
    color: '#666',
  },
});