import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { getStaffByEmail, updateStaff } from '../lib/firebaseService';

export default function StaffProfile() {
  const { userEmail } = useTenant();
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadStaffProfile();
  }, []);

  const loadStaffProfile = async () => {
    try {
      const staff = await getStaffByEmail(userEmail, userEmail);
      if (staff) {
        setStaffData(staff);
        setEditData({
          name: staff.name || '',
          phone: staff.phone || '',
          email: staff.email || ''
        });
      }
    } catch (error) {
      console.error('Error loading staff profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateStaff(staffData.id, editData, userEmail);
      setStaffData({ ...staffData, ...editData });
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!staffData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>My Profile</Text>
        <TouchableOpacity
          style={[styles.editButton, editing && styles.saveButton]}
          onPress={editing ? handleSaveProfile : () => setEditing(true)}
        >
          <Text style={styles.editButtonText}>
            {editing ? 'Save Changes' : 'Edit Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={editData.name}
                onChangeText={(text) => setEditData({ ...editData, name: text })}
                placeholder="Enter full name"
              />
            ) : (
              <Text style={styles.fieldValue}>{staffData.name}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={editData.phone}
                onChangeText={(text) => setEditData({ ...editData, phone: text })}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>{staffData.phone || 'Not provided'}</Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <Text style={styles.fieldValue}>{staffData.email}</Text>
            <Text style={styles.fieldNote}>Email cannot be changed</Text>
          </View>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Role & Permissions</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Role</Text>
            <Text style={styles.fieldValue}>Receptionist</Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Account Status</Text>
            <Text style={[styles.fieldValue, { color: '#28a745' }]}>
              {staffData.hasAccount ? 'Active' : 'No Login Account'}
            </Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Permissions</Text>
            <View style={styles.permissionsGrid}>
              {Object.entries(staffData.permissions || {}).map(([module, perms]: [string, any]) => (
                <View key={module} style={styles.permissionCard}>
                  <Text style={styles.permissionModule}>
                    {module.charAt(0).toUpperCase() + module.slice(1)}
                  </Text>
                  <View style={styles.permissionActions}>
                    {Object.entries(perms).map(([action, allowed]: [string, any]) => (
                      <Text 
                        key={action} 
                        style={[styles.permissionAction, { color: allowed ? '#28a745' : '#dc3545' }]}
                      >
                        {action}: {allowed ? '✓' : '✗'}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Created Date</Text>
            <Text style={styles.fieldValue}>
              {staffData.createdAt ? 
                new Date(staffData.createdAt.seconds * 1000).toLocaleDateString() : 
                'Not available'
              }
            </Text>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Created By</Text>
            <Text style={styles.fieldValue}>{staffData.createdBy || 'System'}</Text>
          </View>
        </View>
      </View>

      {editing && (
        <View style={styles.editActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setEditing(false);
              setEditData({
                name: staffData.name || '',
                phone: staffData.phone || '',
                email: staffData.email || ''
              });
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#800000',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  editButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  editButtonText: {
    color: '#800000',
    fontWeight: '600',
    fontSize: 14,
  },
  profileCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
  },
  fieldNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  permissionsGrid: {
    gap: 10,
  },
  permissionCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  permissionModule: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  permissionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionAction: {
    fontSize: 12,
    fontWeight: '500',
  },
  editActions: {
    padding: 20,
    paddingTop: 0,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#dc3545',
  },
});