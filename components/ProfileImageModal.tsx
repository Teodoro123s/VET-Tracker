import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface ProfileImageModalProps {
  visible: boolean;
  onClose: () => void;
  onGalleryPress: () => void;
  onSave: () => void;
  previewImage: string | null;
  uploading: boolean;
}

export default function ProfileImageModal({
  visible,
  onClose,
  onGalleryPress,
  onSave,
  previewImage,
  uploading
}: ProfileImageModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Profile Image</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {previewImage ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: previewImage }} style={styles.previewImage} />
              <View style={styles.previewActions}>
                <TouchableOpacity 
                  style={styles.changeButton}
                  onPress={onGalleryPress}
                  disabled={uploading}
                >
                  <Ionicons name="images" size={20} color={Colors.primary} />
                  <Text style={styles.changeButtonText}>Change Image</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.saveButton, uploading && styles.disabledButton]}
                  onPress={onSave}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="white" />
                      <Text style={styles.saveButtonText}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.uploadContainer}>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={onGalleryPress}
              >
                <Ionicons name="images" size={48} color={Colors.primary} />
                <Text style={styles.uploadText}>Select from Gallery</Text>
                <Text style={styles.uploadSubtext}>Choose a photo from your device</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 12,
    width: '95%',
    maxWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  uploadContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  uploadButton: {
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    width: '100%',
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  changeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    gap: 8,
  },
  changeButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});