import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../contexts/NotificationContext';
import { getAppointments, getCustomers, getPets, getMedicalHistory } from '../../lib/services/firebaseService';
import { useAdminProfile } from '../../contexts/AdminProfileContext';
import Sidebar from '../../components/Sidebar';

export default function NotificationsScreen() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { adminEmail, adminRole, profileImage, uploading, showImageModal, previewImage, handleImageUpload, handleGalleryUpload, handleSaveImage, handleCancelUpload } = useAdminProfile();
  const [clinicName, setClinicName] = useState('');
  
  useEffect(() => {
    setClinicName(adminEmail.split('@')[0]);
  }, [adminEmail]);
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleNavigation = async (route: string | null) => {
    if (!route) return;
    try {
      if (typeof window !== 'undefined') {
        window.location.href = route;
      } else {
        // router.push(route as any);
      }
    } catch (error) {
      console.error(`Navigation error to ${route}:`, error);
      alert('Failed to navigate. Please try again.');
    }
  };

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
      {/* Admin Header */}
      <View style={styles.adminHeader}>
        <Image source={require('../../assets/pawns web logo v3.png')} style={styles.logo} />
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleNavigation('/client/notifications')}>
            <Ionicons name="notifications" size={20} color="#800000" />
          </TouchableOpacity>
          <View style={styles.profileContainer}>
            <TouchableOpacity style={styles.profileImage} onPress={handleImageUpload} disabled={uploading}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImagePhoto} />
              ) : (
                <Ionicons name="person" size={20} color="#666" />
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <Ionicons name="cloud-upload" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.adminName}>{adminEmail}</Text>
              <Text style={styles.adminRole}>{adminRole}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </View>
        </View>
      </View>
      
      {/* Main Layout Container */}
      <View style={styles.mainLayout}>
        {/* Admin Sidebar */}
        <View style={styles.adminSidebar}>
          <Sidebar />
        </View>
        
        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.pageHeader}>
            <Text style={styles.headerText}>Notifications</Text>
            <View style={styles.headerActions}>
              <View style={styles.notificationSearchContainer}>
                <TextInput
                  style={styles.notificationSearchInput}
                  placeholder="Search..."
                  placeholderTextColor="rgba(153, 153, 153, 0.8)"
                  value={searchTerm}
                  onChangeText={(text) => {
                    setSearchTerm(text);
                    setCurrentPage(1);
                  }}
                />
                <View style={styles.searchIconContainer}>
                  <Ionicons name="search" size={14} color="#fff" />
                </View>
              </View>
            </View>
          </View>
          
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
      
      {/* Image Upload Modal */}
      <Modal visible={showImageModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.imageModal}>
            <Text style={styles.modalTitle}>Update Profile Picture</Text>
            <View style={styles.imagePreview}>
              {previewImage ? (
                <Image source={{ uri: previewImage }} style={styles.previewImage} />
              ) : profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.previewImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={40} color="#666" />
                </View>
              )}
            </View>
            {!previewImage ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelUpload}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadButton} onPress={handleGalleryUpload}>
                  <Ionicons name="cloud-upload" size={20} color="#fff" />
                  <Text style={styles.uploadButtonText}>Upload</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelUpload}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveImage}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  adminHeader: {
    height: 70,
    borderRadius: 10,
    backgroundColor: '#FAFAFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 200,
  },
  searchInput: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    color: '#333',
  },
  searchIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#7F1D1F',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileImagePhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'column',
  },
  adminName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  adminRole: {
    fontSize: 12,
    color: '#666',
  },
  mainLayout: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
  },
  adminSidebar: {
    width: 279,
    flexShrink: 0,
    borderRadius: 10,
    backgroundColor: '#FAFAFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    borderRadius: 10,
  },
  pageHeader: {
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 20,
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
  notificationSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(127, 29, 31, 0.3)',
    borderRadius: 8,
    paddingLeft: 10,
    width: 265.798,
    height: 32,
    flexShrink: 0,
    backgroundColor: 'rgba(250, 250, 250, 0.00)',
    shadowColor: 'rgba(31, 61, 89, 0.04)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  notificationSearchInput: {
    flex: 1,
    fontSize: 15,
  },
  tableContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  subHeader: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  filterTabs: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 8,
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
    marginLeft: 'auto',
    marginRight: 8,
  },
  markAllText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  table: {
    backgroundColor: '#fff',
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 16,
    paddingLeft: 70,
    paddingRight: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingLeft: 70,
    paddingRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  unreadRow: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  headerCellTitle: {
    width: 200,
    fontWeight: '600',
    textAlign: 'left',
    fontSize: 13,
    color: '#374151',
    paddingRight: 16,
  },
  headerCellMessage: {
    flex: 2,
    fontWeight: '600',
    textAlign: 'left',
    fontSize: 13,
    color: '#374151',
    paddingRight: 16,
  },
  headerCellTime: {
    width: 120,
    fontWeight: '600',
    textAlign: 'left',
    fontSize: 13,
    color: '#374151',
    paddingRight: 16,
  },

  cellTitle: {
    width: 200,
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    paddingRight: 16,
  },
  cellMessage: {
    flex: 2,
    textAlign: 'left',
    fontSize: 13,
    color: '#6b7280',
    paddingRight: 16,
  },
  cellTime: {
    width: 120,
    textAlign: 'left',
    fontSize: 13,
    color: '#6b7280',
    paddingRight: 16,
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
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 70,
    paddingRight: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: 320,
    alignItems: 'center',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    overflow: 'hidden',
  },
  previewImage: {
    width: 100,
    height: 100,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  modalCancel: {
    marginTop: 8,
    paddingVertical: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#800000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: '#800000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});