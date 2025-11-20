import React from 'react';
import { View, TouchableOpacity, StyleSheet, Modal } from 'react-native';
export default function DrawerLayout({ isOpen, onClose, children, drawerContent }) {
  return (
    
      {children}
      
      
        
          
             true}>
              {drawerContent}
            
          
        
      
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex,
  },
  overlay: {
    flex,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex,
    flexDirection: 'row',
  },
  drawerContainer: {
    width,
    height: '100%',});