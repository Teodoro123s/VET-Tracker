import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated, Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getVeterinarianAppointments, updateAppointment, deleteAppointment } from '@/lib/services/firebaseService';
import { useAuth } from '@/contexts/AuthContext';

export default function VetCalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const [statusFilter, setStatusFilter] = useState('All');

  
  useEffect(() => {
    console.log('=== VET CALENDAR MOUNT ===');
    console.log('User:', user);
    console.log('User email:', user?.email);
    if (user?.email) {
      fetchAppointments();
    } else {
      console.log('No user email, skipping fetch');
      setLoading(false);
    }
  }, [user?.email]);
  
  const fetchAppointments = async () => {
    try {
      console.log('=== FETCH APPOINTMENTS START ===');
      console.log('User email:', user?.email);
      
      setLoading(true);
      
      if (!user?.email) {
        console.log('No user email, cannot fetch');
        setLoading(false);
        return;
      }
      
      // Get only appointments assigned to this veterinarian
      const appointmentData = await getVeterinarianAppointments(user?.email, user?.email);
      console.log('Fetched all appointments:', appointmentData?.length || 0);
      
      if (appointmentData && appointmentData.length > 0) {
        console.log('First appointment sample:', appointmentData[0]);
      }
      
      setAppointments(appointmentData || []);
      console.log('=== FETCH APPOINTMENTS END ===');
    } catch (error) {
      console.error('Error fetching appointments:', error);
      console.error('Error stack:', error.stack);
      setAppointments([]);
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const getVetAppointments = () => {
    // All appointments are already filtered for this veterinarian
    let filtered = appointments;
    
    // Smart status assignment
    const now = new Date();
    filtered = filtered.map(apt => {
      // Keep completed appointments as is
      if (apt.status === 'Completed' || apt.status === 'completed' || apt.status === 'cancelled') {
        return { ...apt, status: 'Completed' }; // Normalize to 'Completed'
      }
      
      let appointmentTime;
      if (apt.appointmentDate?.seconds) {
        appointmentTime = new Date(apt.appointmentDate.seconds * 1000);
      } else {
        appointmentTime = new Date(apt.appointmentDate || apt.dateTime);
      }
      
      if (isNaN(appointmentTime.getTime())) {
        return { ...apt, status: 'Pending' };
      }
      
      const timeDiff = appointmentTime.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      let newStatus;
      if (hoursDiff <= 0) {
        newStatus = 'Due'; // Past due
      } else {
        newStatus = 'Pending'; // Future appointment
      }
      
      return { ...apt, status: newStatus };
    });
    
    // Filter by status
    if (statusFilter !== 'All') {
      if (statusFilter === 'Done') {
        // Filter for completed appointments
        filtered = filtered.filter(apt => apt.status === 'Completed');
      } else {
        // Filter by exact status (Pending, Due)
        filtered = filtered.filter(apt => apt.status === statusFilter);
      }
    }
    
    // Sort appointments
    filtered.sort((a, b) => {
      let dateA, dateB;
      
      if (a.appointmentDate?.seconds) {
        dateA = new Date(a.appointmentDate.seconds * 1000);
      } else {
        dateA = new Date(a.appointmentDate || a.dateTime);
      }
      
      if (b.appointmentDate?.seconds) {
        dateB = new Date(b.appointmentDate.seconds * 1000);
      } else {
        dateB = new Date(b.appointmentDate || b.dateTime);
      }
      
      if (statusFilter === 'Pending') {
        return dateA.getTime() - dateB.getTime(); // Earliest first
      } else if (statusFilter === 'Due') {
        const isAOverdue = dateA.getTime() < now.getTime();
        const isBOverdue = dateB.getTime() < now.getTime();
        
        if (isAOverdue && !isBOverdue) return -1;
        if (!isAOverdue && isBOverdue) return 1;
        
        return dateA.getTime() - dateB.getTime();
      } else if (statusFilter === 'Done') {
        return dateB.getTime() - dateA.getTime(); // Most recent first
      } else {
        // All: Sort by status priority (Due > Pending > Completed), then by date
        const statusPriority = { 'Due': 0, 'Pending': 1, 'Completed': 2 };
        const priorityDiff = (statusPriority[a.status] || 3) - (statusPriority[b.status] || 3);
        
        if (priorityDiff !== 0) return priorityDiff;
        
        if (a.status === 'Due' || a.status === 'Pending') {
          return dateA.getTime() - dateB.getTime();
        } else {
          return dateB.getTime() - dateA.getTime();
        }
      }
    });
    
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
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          {['All', 'Pending', 'Due', 'Done'].map((status) => (
            <TouchableOpacity
              key={status}
              style={statusFilter === status ? styles.activeFilterButton : styles.inactiveFilterButton}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={statusFilter === status ? styles.activeFilterText : styles.inactiveFilterText}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.calendarHeader}>
          <Text style={styles.totalCount}>Total: {appointments.length}</Text>
        </View>
        <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(-1)}>
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth]} {selectedYear}
              </Text>
              <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(1)}>
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#dc3545' }]} />
                <Text style={styles.legendText}>Due</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#28a745' }]} />
                <Text style={styles.legendText}>Pending</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#007bff' }]} />
                <Text style={styles.legendText}>Done</Text>
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
                    try {
                      let aptDate;
                      if (apt.appointmentDate?.seconds) {
                        aptDate = new Date(apt.appointmentDate.seconds * 1000);
                      } else if (apt.appointmentDate) {
                        aptDate = new Date(apt.appointmentDate);
                      } else if (apt.dateTime) {
                        aptDate = new Date(apt.dateTime);
                      } else {
                        return false;
                      }
                      
                      if (isNaN(aptDate.getTime())) return false;
                      
                      const dayDate = new Date(selectedYear, selectedMonth, day);
                      return aptDate.toDateString() === dayDate.toDateString();
                    } catch (error) {
                      return false;
                    }
                  }) : [];
                  if (dayAppointments.length > 0) {
                    console.log(`Day ${selectedYear}-${selectedMonth + 1}-${day} has ${dayAppointments.length} appointments (first id: ${dayAppointments[0]?.id})`);
                  }
                  
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
                          const newSelected = { day, month: selectedMonth, year: selectedYear };
                          console.log('Selecting date:', newSelected);
                          setSelectedDate(newSelected);
                          Animated.timing(slideAnim, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: false,
                          }).start(() => console.log('Schedule panel animated in for', newSelected));
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
                      <View style={styles.appointmentDots}>
                        {(() => {
                          const uniqueStatuses = new Set();
                          dayAppointments.forEach(apt => {
                            let normalizedStatus;
                            if (apt.status === 'Completed' || apt.status === 'completed') {
                              normalizedStatus = 'Done';
                            } else if (apt.status === 'Due' || apt.status === 'due') {
                              normalizedStatus = 'Due';
                            } else {
                              normalizedStatus = 'Pending';
                            }
                            uniqueStatuses.add(normalizedStatus);
                          });
                          return Array.from(uniqueStatuses).slice(0, 3).map((status, idx) => {
                            const getStatusColor = () => {
                              switch(status) {
                                case 'Done': return '#007bff';
                                case 'Pending': return '#28a745';
                                case 'Due': return '#dc3545';
                                default: return '#007bff';
                              }
                            };
                            return (
                              <View
                                key={status}
                                style={[styles.appointmentDot, { backgroundColor: getStatusColor() }]}
                              />
                            );
                          });
                        })()}
                      </View>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>
        </View>
        
      </View>
      

        
        {selectedDate && (
          <>
            <View style={styles.scheduleOverlay} />
            <Animated.View style={[styles.scheduleContainer, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleTitle}>
                Schedule for {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedDate.month]} {selectedDate.day}, {selectedDate.year}
              </Text>
              <TouchableOpacity onPress={() => {
                Animated.timing(slideAnim, {
                  toValue: 600,
                  duration: 300,
                  useNativeDriver: false,
                }).start(() => setSelectedDate(null));
              }} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.timeSlotsList} showsVerticalScrollIndicator={false}>
              {(() => {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const selectedMonthName = monthNames[selectedDate.month];
                const vetAppointments = getVetAppointments();
                
                const dayAppointments = vetAppointments.filter(apt => {
                  try {
                    let aptDate;
                    if (apt.appointmentDate?.seconds) {
                      aptDate = new Date(apt.appointmentDate.seconds * 1000);
                    } else if (apt.appointmentDate) {
                      aptDate = new Date(apt.appointmentDate);
                    } else if (apt.dateTime) {
                      aptDate = new Date(apt.dateTime);
                    } else {
                      return false;
                    }
                    
                    if (isNaN(aptDate.getTime())) return false;
                    
                    const selectedDateObj = new Date(selectedDate.year, selectedDate.month, selectedDate.day);
                    return aptDate.toDateString() === selectedDateObj.toDateString();
                  } catch (error) {
                    return false;
                  }
                });
                
                if (dayAppointments.length === 0) {
                  return (
                    <View style={styles.noAppointments}>
                      <Text style={styles.noAppointmentsText}>No appointments scheduled for this day</Text>
                    </View>
                  );
                }
                
                const handleMarkDone = async (appointmentId) => {
                  try {
                    await updateAppointment(user?.email, appointmentId, { status: 'Completed' });
                    fetchAppointments();
                  } catch (error) {
                    Alert.alert('Error', 'Failed to update appointment');
                  }
                };
                
                const handleDeleteAppointment = async (appointmentId) => {
                  Alert.alert(
                    'Delete Appointment',
                    'Are you sure you want to delete this appointment?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await deleteAppointment(user?.email, appointmentId);
                            fetchAppointments();
                          } catch (error) {
                            console.error('Error deleting appointment:', error);
                          }
                        }
                      }
                    ]
                  );
                };
                
                // Sort day appointments
                dayAppointments.sort((a, b) => {
                  let dateA, dateB;
                  
                  if (a.appointmentDate?.seconds) {
                    dateA = new Date(a.appointmentDate.seconds * 1000);
                  } else {
                    dateA = new Date(a.appointmentDate || a.dateTime);
                  }
                  
                  if (b.appointmentDate?.seconds) {
                    dateB = new Date(b.appointmentDate.seconds * 1000);
                  } else {
                    dateB = new Date(b.appointmentDate || b.dateTime);
                  }
                  
                  return dateA.getTime() - dateB.getTime(); // Sort by time ascending
                });
                
                return dayAppointments.map((apt) => {
                  const now = new Date();
                  let appointmentTime;
                  if (apt.appointmentDate?.seconds) {
                    appointmentTime = new Date(apt.appointmentDate.seconds * 1000);
                  } else {
                    appointmentTime = new Date(apt.appointmentDate || apt.dateTime);
                  }
                  
                  // Smart status assignment
                  let currentStatus = apt.status;
                  if (apt.status === 'completed' || apt.status === 'Completed') {
                    currentStatus = 'Completed';
                  } else if (apt.status !== 'cancelled') {
                    if (!isNaN(appointmentTime.getTime())) {
                      const timeDiff = appointmentTime.getTime() - now.getTime();
                      const hoursDiff = timeDiff / (1000 * 60 * 60);
                      
                      if (hoursDiff <= 0) {
                        currentStatus = 'Due';
                      } else {
                        currentStatus = 'Pending';
                      }
                    }
                  }
                  
                  const getStatusColor = (status) => {
                    switch (status) {
                      case 'Pending': return '#28a745';
                      case 'Due': return '#dc3545';
                      case 'Completed': return '#007bff';
                      default: return '#6c757d';
                    }
                  };
                  
                  return (
                    <TouchableOpacity 
                      key={apt.id} 
                      style={styles.mobileAppointmentCard}
                      onPress={() => {
                        router.push({
                          pathname: '/veterinarian/appointment-details',
                          params: { appointmentData: JSON.stringify(apt) }
                        });
                      }}
                    >
                      <View style={styles.mobileStatusIcon}>
                        <Ionicons 
                          name={currentStatus === 'Pending' ? 'time' : currentStatus === 'Due' ? 'alert-circle' : currentStatus === 'Completed' ? 'checkmark-circle' : 'time'} 
                          size={20} 
                          color={getStatusColor(currentStatus)} 
                        />
                      </View>
                      <View style={styles.mobileAppointmentContent}>
                        <View style={styles.mobileDataRow}>
                          <Text style={styles.mobileDataLabel}>Name:</Text>
                          <Text style={styles.mobilePatientName}>{apt.customerName || apt.name}</Text>
                        </View>
                        <View style={styles.mobileDataRow}>
                          <Text style={styles.mobileDataLabel}>Pet:</Text>
                          <Text style={styles.mobilePetInfo}>{apt.petName}</Text>
                        </View>
                        <View style={styles.mobileDataRow}>
                          <Text style={styles.mobileDataLabel}>Date:</Text>
                          <Text style={styles.mobileAppointmentTime}>
                            {(() => {
                              let aptDate;
                              if (apt.appointmentDate?.seconds) {
                                aptDate = new Date(apt.appointmentDate.seconds * 1000);
                              } else {
                                aptDate = new Date(apt.appointmentDate || apt.dateTime);
                              }
                              return aptDate.toLocaleDateString() + ' ' + aptDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                            })()
                            }
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>
            </Animated.View>
          </>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    position: 'relative',
  },


  content: {
    flex: 1,
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
    paddingRight: 5,
  },
  totalCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    fontFamily: 'sans-serif',
    textAlign: 'right',
    position: 'absolute',
    right: 0,
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  filterRow: {
    flexDirection: 'row',
  },
  activeFilterButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginRight: 16,
    borderRadius: 20,
    backgroundColor: '#7B2C2C',
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveFilterButton: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginRight: 16,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  inactiveFilterText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    height: 500,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#7B2C2C',
    borderRadius: 12,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B2C2C',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#F2F2F7',
    paddingVertical: 10,
    borderRadius: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7B2C2C',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayBox: {
    width: '14.28%',
    height: 52,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  dayWithAppt: {
    backgroundColor: '#e8f5e8',
  },
  todayBox: {
    backgroundColor: 'rgba(123, 44, 44, 0.15)',
    borderWidth: 2,
    borderColor: '#7B2C2C',
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
    color: '#000000',
    fontWeight: 'bold',
  },
  otherMonthText: {
    color: '#999',
    opacity: 0.6,
  },
  appointmentDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
    marginTop: 2,
  },
  appointmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreCount: {
    fontSize: 8,
    color: '#666',
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
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
  scheduleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 40,
  },
  scheduleContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: '70%',
    zIndex: 50,
    elevation: 20,
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
    color: '#7B2C2C',
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
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 44, 0.1)',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mobileAppointmentCard: {
    backgroundColor: '#FAFAFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileStatusIcon: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(123, 44, 44, 0.08)',
  },
  statusIconText: {
    fontSize: 16,
    color: '#000',
  },
  appointmentContent: {
    flex: 1,
  },
  mobileAppointmentContent: {
    flex: 1,
  },
  mobileDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mobileDataLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    minWidth: 45,
    marginRight: 8,
    fontFamily: 'sans-serif',
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
    overflow: 'hidden',
    // web-only properties removed for React Native
  },
  mobilePatientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    fontFamily: 'sans-serif',
  },
  petInfo: {
    fontSize: 15,
    color: '#666',
    overflow: 'hidden',
    // web-only properties removed for React Native
  },
  mobilePetInfo: {
    fontSize: 15,
    color: '#48484A',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  appointmentTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    overflow: 'hidden',
    // web-only properties removed for React Native
  },
  mobileAppointmentTime: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 6,
    fontWeight: '400',
    fontFamily: 'sans-serif',
  },
  appointmentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  appointmentDetails: {
    fontSize: 12,
    color: '#666',
  },
  appointmentActions: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 8,
  },
  doneButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    flex: 1,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    flex: 1,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
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
    color: '#800020',
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
  completedBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  completedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

});