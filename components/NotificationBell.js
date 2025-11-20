import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { notificationService, InAppNotification } from '../lib/services/notificationService';
import { Colors } from '../constants/Colors';
export default function NotificationBell({ tenantId, userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    // Set up periodic refresh
    const interval = setInterval(loadNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [tenantId, userEmail]);

  const loadNotifications = async () => {
    try {
      const userNotifications = await notificationService.getInAppNotifications(tenantId, userEmail);
      const sortedNotifications = userNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(sortedNotifications);
      setUnreadCount(sortedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markNotificationAsRead(tenantId, notificationId);
      await loadNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment': return '📅';
      case 'reminder': return '⏰';
      case 'warning': return '⚠️';
      default 'ℹ️';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins  setShowModal(true)}>
        🔔
        {unreadCount > 0 && (
          
            {unreadCount > 99 ? '99+' }
          
        )}
      

       setShowModal(false)}
      >
        
          
            
              Notifications
               setShowModal(false)}>
                ✕
              
            
            
            
              {notifications.length === 0 ? (
                
                  No notifications
                
              ) : (
                notifications.map((notification) => (
                   notification.id && markAsRead(notification.id)}
                  >
                    
                      
                        
                          {getNotificationIcon(notification.type)}
                        
                        
                          {notification.title}
                        
                        
                          {formatTime(notification.createdAt)}
                        
                      
                      
                        {notification.message}
                      
                      {!notification.read && (
                        
                      )}
                    
                  
                ))
              )}
            
          
        
      
    
  );
}

const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
    padding,
  },
  bellIcon: {
    fontSize,
  },
  badge: {
    backgroundColor: '#ff4444',
    borderRadius,
    minWidth,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex,
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize,
  closeButton: {
    fontSize,
  notificationsList: {
    maxHeight,
  },
  emptyState: {
    padding,
  emptyText: {
  notificationItem: {
    padding,
    borderBottomWidth,
  unreadNotification: {
  notificationContent: {
  notificationHeader: {
  notificationIcon: {
    fontSize,
    marginRight,
  },
  notificationTitle: {
    fontSize,
  notificationTime: {
    fontSize,
  notificationMessage: {
    fontSize,
  unreadDot: {});