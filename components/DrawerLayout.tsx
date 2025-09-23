import React from 'react';
import { View, TouchableOpacity, StyleSheet, Modal } from 'react-native';

interface DrawerLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  drawerContent: React.ReactNode;
}

export default function DrawerLayout({ isOpen, onClose, children, drawerContent }: DrawerLayoutProps) {
  return (
    <View style={styles.container}>
      {children}
      
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={onClose}
          >
            <View style={styles.drawerContainer} onStartShouldSetResponder={() => true}>
              {drawerContent}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerContainer: {
    width: 250,
    height: '100%',
    backgroundColor: '#800000',
  },
});