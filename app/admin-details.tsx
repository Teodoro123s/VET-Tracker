import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDetailsScreen() {
  const router = useRouter();
  const { userEmail, isSuperAdmin } = useTenant();
  const { user } = useAuth();
  
  const [adminDetails, setAdminDetails] = useState({
    username: '',
    email: '',
    lastLogin: 'Today 8:00 AM',
    createdDate: 'Jan 1, 2023'
  });

  useEffect(() => {
    if (userEmail) {
      setAdminDetails(prev => ({
        ...prev,
        username: userEmail,
        email: userEmail
      }));
    }
  }, [userEmail]);
  
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [drawerAnimation] = useState(new Animated.Value(-350));
  const [editAdmin, setEditAdmin] = useState({});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Admin Details</Text>
      </View>
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.tableContainer}>
            <View style={styles.detailTable}>
              <View style={styles.tableTopRow}>
                <View style={styles.headerRow}>
                  <TouchableOpacity style={styles.returnButton} onPress={() => router.back()}>
                    <Text style={styles.returnButtonText}>←</Text>
                  </TouchableOpacity>
                  <Text style={styles.detailTitle}>{isSuperAdmin ? 'SuperAdmin Information' : 'Administrator Information'}</Text>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={() => {
                  setEditAdmin({
                    username: adminDetails.username,
                    email: adminDetails.email
                  });
                  setShowEditDrawer(true);
                  Animated.timing(drawerAnimation, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                  }).start();
                }}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tableHeader}>
                <Text style={styles.headerCellName}>Field</Text>
                <Text style={styles.headerCellName}>Value</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.cellName}>Username</Text>
                <Text style={styles.cellName}>{adminDetails.username}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.cellName}>Email Address</Text>
                <Text style={styles.cellName}>{adminDetails.email}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.cellName}>Last Login</Text>
                <Text style={styles.cellName}>{adminDetails.lastLogin}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.cellName}>Account Created</Text>
                <Text style={styles.cellName}>{adminDetails.createdDate}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      
      {showEditDrawer && (
        <Modal visible={true} transparent animationType="none">
          <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={() => {
            Animated.timing(drawerAnimation, {
              toValue: -350,
              duration: 300,
              useNativeDriver: false,
            }).start(() => setShowEditDrawer(false));
          }}>
            <Animated.View style={[styles.drawer, { left: drawerAnimation }]} onStartShouldSetResponder={() => true}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Edit Admin Details</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(drawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowEditDrawer(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Username *</Text>
                <TextInput
                  style={styles.drawerInput}
                  value={editAdmin.username}
                  onChangeText={(text) => setEditAdmin({...editAdmin, username: text})}
                />
                
                <Text style={styles.fieldLabel}>Email Address *</Text>
                <TextInput
                  style={styles.drawerInput}
                  value={editAdmin.email}
                  onChangeText={(text) => setEditAdmin({...editAdmin, email: text})}
                />
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  Animated.timing(drawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowEditDrawer(false));
                }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={() => {
                  setAdminDetails({
                    ...adminDetails,
                    username: editAdmin.username,
                    email: editAdmin.email
                  });
                  
                  Animated.timing(drawerAnimation, {
                    toValue: -350,
                    duration: 300,
                    useNativeDriver: false,
                  }).start(() => setShowEditDrawer(false));
                }}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#800000',
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
  detailTable: {
    backgroundColor: '#fff',
  },
  tableTopRow: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  returnButton: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  returnButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
  },
  editButton: {
    backgroundColor: '#007BFF',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerCellName: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  cellName: {
    flex: 1,
    fontSize: 12,
    color: '#555',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 350,
    backgroundColor: '#fff',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#800000',
  },
  drawerCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerCloseText: {
    fontSize: 18,
    color: '#666',
  },
  drawerForm: {
    flex: 1,
    padding: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  drawerInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  drawerButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#23C062',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});