import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAppointments } from '@/lib/services/firebaseService';
import { useAuth } from '@/contexts/AuthContext';

export default function VetCalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [translateX] = useState(new Animated.Value(0));
  const [showNotifications, setShowNotifications] = useState(false);
  
  useEffect(() => {
    fetchAppointments();
  }, []);
  
  const fetchAppointments = async () => {
    try {
      const appointmentData = await getAppointments(user?.email);
      setAppointments(appointmentData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };
  
  const getVetAppointments = () => {
    let filtered = appointments.filter(apt => apt.veterinarian === user?.email || apt.assignedVet === user?.email);
    if (statusFilter !== 'All') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    return filtered;
  };
  

  
  const navigateMonth = (direction) => {
    if (direction === -1) {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.filterHeader}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['All', 'Pending', 'Approved', 'Due'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterButton, statusFilter === status && styles.filterButtonActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.content}>
        <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(-1)}>
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} {selectedYear}
              </Text>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.notificationButton} onPress={() => {
                  console.log('Bell clicked!');
                  Alert.alert('Test', 'Bell clicked');
                  setShowNotifications(true);
                }}>
                  <Ionicons name="notifications" size={20} color="#2c5aa0" />
                  {(getVetAppointments().filter(apt => apt.status === 'Pending' || apt.status === 'Due').length + 3) > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {getVetAppointments().filter(apt => apt.status === 'Pending' || apt.status === 'Due').length + 3}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(1)}>
                  <Text style={styles.navButtonText}>›</Text>
                </TouchableOpacity>
              </View>
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
                  
                  const vetAppointments = getVetAppointments();
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
                  
                  const isSelected = selectedDate && selectedDate.day === day && selectedDate.month === selectedMonth && selectedDate.year === selectedYear;
                  
                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={[
                        styles.dayBox, 
                        hasAppointments && styles.dayWithAppt, 
                        isTodayBox && styles.todayBox, 
                        !isCurrentMonth && styles.otherMonthBox,
                        isSelected && styles.selectedDayBox
                      ]} 
                      onPress={() => {
                        if (isCurrentMonth) {
                          setSelectedDate({ day, month: selectedMonth, year: selectedYear });
                        }
                      }}
                    >
                      <Text style={[
                        styles.dayText, 
                        isTodayBox && styles.todayText, 
                        !isCurrentMonth && styles.otherMonthText,
                        isSelected && styles.selectedDayText
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
        
      </View>
      
      <Modal visible={showNotifications} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.notificationModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.notificationItem}>
              <Text style={styles.itemTitle}>🔔 Appointment Pending</Text>
              <Text style={styles.itemText}>John Smith - Buddy needs approval</Text>
              <Text style={styles.itemTime}>Today at 2:00 PM</Text>
            </View>
            
            <View style={styles.notificationItem}>
              <Text style={styles.itemTitle}>⚠️ Appointment Due</Text>
              <Text style={styles.itemText}>Sarah Johnson - Max appointment is due</Text>
              <Text style={styles.itemTime}>Today at 3:30 PM</Text>
            </View>
            
            <View style={styles.notificationItem}>
              <Text style={styles.itemTitle}>📅 Upcoming Appointment</Text>
              <Text style={styles.itemText}>Mike Davis - Luna scheduled tomorrow</Text>
              <Text style={styles.itemTime}>Tomorrow at 10:00 AM</Text>
            </View>
          </View>
        </View>
      </Modal>
        
        {selectedDate && (
          <View style={styles.scheduleContainer}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleTitle}>
                Schedule for {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedDate.month]} {selectedDate.day}, {selectedDate.year}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDate(null)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.timeSlotsList} showsVerticalScrollIndicator={false}>
              {(() => {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const selectedMonthName = monthNames[selectedDate.month];
                const vetAppointments = getVetAppointments();
                
                const dayAppointments = vetAppointments.filter(apt => {
                  const currentDate = new Date();
                  const currentDay = currentDate.getDate();
                  const currentMonth = currentDate.getMonth();
                  const currentYear = currentDate.getFullYear();
                  const isCurrentMonthAppt = apt.dateTime.includes(`${selectedMonthName} ${selectedDate.day}`);
                  const isToday = selectedDate.day === currentDay && selectedDate.month === currentMonth && selectedDate.year === currentYear && apt.dateTime.includes('Today');
                  const isTomorrow = selectedDate.day === (currentDay + 1) && selectedDate.month === currentMonth && selectedDate.year === currentYear && apt.dateTime.includes('Tomorrow');
                  const isYesterday = selectedDate.day === (currentDay - 1) && selectedDate.month === currentMonth && selectedDate.year === currentYear && apt.dateTime.includes('Yesterday');
                  const daysAgoMatch = apt.dateTime.match(/([0-9]+) days ago/);
                  const isDaysAgo = daysAgoMatch && selectedDate.day === (currentDay - parseInt(daysAgoMatch[1])) && selectedDate.month === currentMonth && selectedDate.year === currentYear;
                  return isCurrentMonthAppt || isToday || isTomorrow || isYesterday || isDaysAgo;
                });
                
                if (dayAppointments.length === 0) {
                  return (
                    <View style={styles.noAppointments}>
                      <Text style={styles.noAppointmentsText}>No appointments scheduled for this day</Text>
                    </View>
                  );
                }
                
                return dayAppointments.map((apt) => (
                  <View key={apt.id} style={[styles.appointmentCard, {
                    borderLeftColor: apt.status === 'Pending' ? '#FFA500' : 
                                   apt.status === 'Due' ? '#FF6B6B' :
                                   apt.status === 'Completed' ? '#4ECDC4' : '#6c757d'
                  }]}>
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.appointmentTime}>{apt.dateTime.split(' at ')[1] || 'Time not specified'}</Text>
                      <View style={[styles.statusBadge, {
                        backgroundColor: apt.status === 'Pending' ? '#FFA500' : 
                                       apt.status === 'Due' ? '#FF6B6B' :
                                       apt.status === 'Completed' ? '#4ECDC4' : '#6c757d'
                      }]}>
                        <Text style={styles.statusBadgeText}>{apt.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.appointmentName}>{apt.name}</Text>
                    <Text style={styles.appointmentDetails}>{apt.petName} - {apt.service}</Text>
                  </View>
                ));
              })()}
            </ScrollView>
          </View>
        )}
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
  filterHeader: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
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
  backToDayButton: {
    padding: 5,
    marginRight: 10,
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
  selectedDayBox: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  selectedDayText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  scheduleContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 300,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5aa0',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  timeSlotsList: {
    flex: 1,
  },
  noAppointments: {
    padding: 20,
    alignItems: 'center',
  },
  noAppointmentsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  appointmentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c5aa0',
  },
  appointmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  appointmentDetails: {
    fontSize: 14,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: 8,
    marginRight: 10,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  notificationPanel: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 350,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5aa0',
  },
  notificationList: {
    padding: 15,
  },
  noNotifications: {
    padding: 30,
    alignItems: 'center',
  },
  noNotificationsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2c5aa0',
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  notificationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationFullPanel: {
    backgroundColor: '#fff',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  notificationScrollList: {
    flex: 1,
  },
  notificationRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'flex-start',
  },
  notificationText: {
    flex: 1,
    marginLeft: 12,
  },
  notificationRowTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationRowMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  notificationModal: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeText: {
    fontSize: 20,
    color: '#666',
  },
  notificationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  itemTime: {
    fontSize: 12,
    color: '#999',
  },
});