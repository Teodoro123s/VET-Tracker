import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAppointments } from '../lib/firebaseService';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'pending' | 'due' | 'overdue' | 'new' | 'cancelled';
  appointmentId?: string;
  timestamp: Date;
  read: boolean;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  checkAppointments: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load notifications from storage on app start
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const stored = await AsyncStorage.getItem('notifications');
        const storedLastChecked = await AsyncStorage.getItem('lastChecked');
        
        if (stored) {
          const parsedNotifications = JSON.parse(stored).map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
          setNotifications(parsedNotifications);
        }
        
        if (storedLastChecked) {
          setLastChecked(new Date(storedLastChecked));
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadNotifications();
  }, []);

  // Save notifications to storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      const saveNotifications = async () => {
        try {
          await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
          await AsyncStorage.setItem('lastChecked', lastChecked.toISOString());
        } catch (error) {
          console.error('Error saving notifications:', error);
        }
      };
      
      saveNotifications();
    }
  }, [notifications, lastChecked, isLoaded]);

  const getPriority = (type: string) => {
    switch (type) {
      case 'overdue': return 1;
      case 'due': return 2;
      case 'pending': return 3;
      case 'new': return 4;
      case 'cancelled': return 5;
      default: return 6;
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.sort((a, b) => {
        const priorityDiff = getPriority(a.type) - getPriority(b.type);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const checkAppointments = async () => {
    try {
      const appointments = await getAppointments();
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const newNotifications: Notification[] = [];

      appointments.forEach(appointment => {
        const appointmentDate = appointment.date ? new Date(appointment.date).toISOString().split('T')[0] : null;
        const isToday = appointmentDate === today;
        const isTomorrow = appointmentDate === tomorrow;
        const isPast = appointmentDate && appointmentDate < today;
        
        // Check for new appointments (created after last check)
        const createdAt = appointment.createdAt ? new Date(appointment.createdAt) : new Date(appointment.date);
        if (createdAt > lastChecked) {
          newNotifications.push({
            id: `new-${appointment.id}-${Date.now()}`,
            title: 'New Appointment Created',
            message: `${appointment.customerName || appointment.name} - ${appointment.petName} (${appointment.service})`,
            type: 'new',
            appointmentId: appointment.id,
            timestamp: now,
            read: false,
          });
        }

        // Check for appointments due today
        if (appointment.status === 'Pending' && isToday) {
          newNotifications.push({
            id: `due-today-${appointment.id}`,
            title: 'Appointment Due Today',
            message: `${appointment.customerName || appointment.name} - ${appointment.petName} (${appointment.service}) at ${appointment.time || 'scheduled time'}`,
            type: 'due',
            appointmentId: appointment.id,
            timestamp: now,
            read: false,
          });
        }

        // Check for appointments due tomorrow
        if (appointment.status === 'Pending' && isTomorrow) {
          newNotifications.push({
            id: `due-tomorrow-${appointment.id}`,
            title: 'Appointment Due Tomorrow',
            message: `${appointment.customerName || appointment.name} - ${appointment.petName} (${appointment.service}) at ${appointment.time || 'scheduled time'}`,
            type: 'pending',
            appointmentId: appointment.id,
            timestamp: now,
            read: false,
          });
        }

        // Check for overdue appointments
        if (appointment.status === 'Pending' && isPast) {
          newNotifications.push({
            id: `overdue-${appointment.id}`,
            title: 'Overdue Appointment',
            message: `${appointment.customerName || appointment.name} - ${appointment.petName} (${appointment.service}) was scheduled for ${appointmentDate}`,
            type: 'overdue',
            appointmentId: appointment.id,
            timestamp: now,
            read: false,
          });
        }

        // Check for cancelled appointments
        if (appointment.status === 'Cancelled') {
          const cancelledNotificationExists = notifications.some(n => 
            n.appointmentId === appointment.id && n.type === 'cancelled'
          );
          if (!cancelledNotificationExists) {
            newNotifications.push({
              id: `cancelled-${appointment.id}-${Date.now()}`,
              title: 'Appointment Cancelled',
              message: `${appointment.customerName || appointment.name} - ${appointment.petName} (${appointment.service}) has been cancelled`,
              type: 'cancelled',
              appointmentId: appointment.id,
              timestamp: now,
              read: false,
            });
          }
        }
      });

      setNotifications(prev => {
        const existingIds = prev.map(n => n.id);
        const filteredNew = newNotifications.filter(n => !existingIds.includes(n.id));
        const updated = [...filteredNew, ...prev].slice(0, 100); // Keep only last 100 notifications
        return updated.sort((a, b) => {
          const priorityDiff = getPriority(a.type) - getPriority(b.type);
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
      });

      setLastChecked(now);
    } catch (error) {
      console.error('Error checking appointments for notifications:', error);
    }
  };

  // Auto-check appointments every 5 minutes (only after loading)
  useEffect(() => {
    if (isLoaded) {
      checkAppointments(); // Initial check
      const interval = setInterval(checkAppointments, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [isLoaded]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      checkAppointments,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}