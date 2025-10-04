import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { getAppointments, getCustomers, getPets, getMedicalHistory } from '../../lib/services/firebaseService';
import { useTenant } from '../../contexts/TenantContext';

export default function NotificationsScreen() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { userEmail } = useTenant();
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pending': return '#FFA500';
      case 'due': return '#FF6B6B';
      case 'new': return '#007BFF';
      case 'cancelled': return '#6C757D';
      case 'overdue': return '#DC3545';
      default: return '#666';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };



  const allNotifications = notifications;
  
  const filteredNotifications = allNotifications.filter(notification => {
    const matchesSearch = notification.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         notification.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All' || 
                         (activeFilter === 'Unread' && !notification.read) ||
                         (activeFilter === 'Read' && notification.read);
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = filteredNotifications.slice(startIndex, endIndex);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageChange = (page) => {
    const pageNum = parseInt(page);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    setShowDropdown(false);
  };

  const dropdownOptions = [5, 10, 25, 50];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Notifications</Text>
        <View style={styles.headerActions}>
          <View style={styles.searchContainer}>
            <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search notifications..."
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
                setCurrentPage(1);
              }}
            />
          </View>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.tableContainer}>
          <View style={styles.subHeader}>
            <View style={styles.filterTabs}>
              {['All', 'Unread', 'Read'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterTab, activeFilter === filter && styles.activeFilterTab]}
                  onPress={() => {
                    setActiveFilter(filter);
                    setCurrentPage(1);
                  }}
                >
                  <Text style={[styles.filterTabText, activeFilter === filter && styles.activeFilterTabText]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
              <Text style={styles.markAllText}>Mark All Read</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCellTitle}>Title</Text>
              <Text style={styles.headerCellMessage}>Message</Text>
              <Text style={styles.headerCellTime}>Time</Text>
            </View>
            
            <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
              {currentNotifications.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No notifications found</Text>
                </View>
              ) : (
                currentNotifications.map((notification) => (
                  <View 
                    key={notification.id} 
                    style={[styles.tableRow, !notification.read && styles.unreadRow]}
                  >
                    <Text style={styles.cellTitle}>{notification.title}</Text>
                    <Text style={styles.cellMessage}>{notification.message}</Text>
                    <Text style={styles.cellTime}>{formatTime(notification.timestamp)}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
          
          <View style={styles.pagination}>
            <View style={styles.paginationControls}>
              <Text style={styles.paginationLabel}>Rows per page:</Text>
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowDropdown(!showDropdown)}
                >
                  <Text style={styles.dropdownText}>{itemsPerPage}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {showDropdown && (
                  <View style={styles.dropdownMenu}>
                    {dropdownOptions.map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={styles.dropdownOption}
                        onPress={() => {
                          setItemsPerPage(size);
                          setCurrentPage(1);
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>{size}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              
              <TouchableOpacity
                style={styles.pageBtn}
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <Text style={styles.pageBtnText}>‹</Text>
              </TouchableOpacity>
              
              <Text style={styles.pageOf}>
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length}
              </Text>
              
              <TouchableOpacity
                style={styles.pageBtn}
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <Text style={styles.pageBtnText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 20,
    marginTop: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#800000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  searchInput: {
    width: 150,
    fontSize: 12,
    outlineStyle: 'none',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tableContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  subHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'flex-start',
    marginRight: 5,
  },
  activeFilterTab: {
    backgroundColor: '#800000',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'left',
  },
  activeFilterTabText: {
    color: '#fff',
  },
  markAllButton: {
    backgroundColor: '#007BFF',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markAllText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  table: {
    backgroundColor: '#fff',
    height: 380,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  tableBody: {
    height: 330,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  unreadRow: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  headerCellTitle: {
    width: 200,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  headerCellMessage: {
    flex: 2,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  headerCellTime: {
    width: 120,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },

  cellTitle: {
    width: 200,
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
    paddingRight: 10,
  },
  cellMessage: {
    flex: 2,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
  },
  cellTime: {
    width: 120,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
  },

  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 200,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  pagination: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 20,
    paddingRight: 15,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationLabel: {
    fontSize: 10,
    color: '#666',
  },
  dropdown: {
    position: 'relative',
    zIndex: 1001,
  },

  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 50,
  },
  dropdownText: {
    fontSize: 10,
    marginRight: 4,
  },
  dropdownArrow: {
    fontSize: 6,
    color: '#666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: -120,
    left: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    zIndex: 10000,
    minWidth: 50,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  pageBtn: {
    backgroundColor: '#800000',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },
  pageBtnText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  pageInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    width: 25,
    textAlign: 'center',
    fontSize: 10,
  },
  pageOf: {
    fontSize: 10,
    color: '#666',
  },
});