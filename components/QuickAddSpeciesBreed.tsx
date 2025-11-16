import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import SpeciesBreedsManager from './SpeciesBreedsManager';
import { canManageSpeciesBreeds } from '@/lib/services/speciesBreedsService';

interface QuickAddSpeciesBreedProps {
  userEmail: string;
  onDataUpdated?: () => void;
  style?: any;
}

export default function QuickAddSpeciesBreed({ userEmail, onDataUpdated, style }: QuickAddSpeciesBreedProps) {
  const [showManager, setShowManager] = useState(false);

  const canManage = canManageSpeciesBreeds(userEmail);

  if (!canManage) {
    return null;
  }

  const handleClose = () => {
    setShowManager(false);
    if (onDataUpdated) {
      onDataUpdated();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.quickAddButton} 
        onPress={() => setShowManager(true)}
      >
        <Text style={styles.quickAddText}>+ Species/Breeds</Text>
      </TouchableOpacity>

      <SpeciesBreedsManager
        userEmail={userEmail}
        visible={showManager}
        onClose={handleClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  quickAddButton: {
    backgroundColor: '#800000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickAddText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});