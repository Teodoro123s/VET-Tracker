import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { notificationService, InAppNotification } from '../lib/services/notificationService';

interface NotificationBellProps {
  tenantId: string;
  userEmail: string;
}

export default function NotificationBell({ tenantId, userEmail }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
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

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(tenantId, notificationId);
      await loadNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return '📅';
      case 'reminder': return '⏰';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      <TouchableOpacity style={styles.bellContainer} onPress={() => setShowModal(true)}>
        <Text style={styles.bellIcon}>🔔</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.notificationsList}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No notifications</Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.read && styles.unreadNotification
                    ]}
                    onPress={() => notification.id && markAsRead(notification.id)}
                  >
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationIcon}>
                          {getNotificationIcon(notification.type)}
                        </Text>
                        <Text style={styles.notificationTitle}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {formatTime(notification.createdAt)}
                        </Text>
                      </View>
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                      {!notification.read && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
    padding: 8,
  },
  bellIcon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#800000',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
  },
  notificationsList: {
    maxHeight: 400,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  notificationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unreadNotification: {
    backgroundColor: '#f8f9ff',
  },
  notificationContent: {
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  notificationMessage: {
    fontSize: 12,
    color: '#555',
    lineHeight: 16,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007bff',
  },
});