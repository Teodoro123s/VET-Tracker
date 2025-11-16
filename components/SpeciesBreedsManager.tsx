import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Modal } from 'react-native';
import { getSpecies, getBreeds, addSpecies, addBreed, canManageSpeciesBreeds } from '@/lib/services/speciesBreedsService';

interface SpeciesBreedsManagerProps {
  userEmail: string;
  onClose: () => void;
  visible: boolean;
}

export default function SpeciesBreedsManager({ userEmail, onClose, visible }: SpeciesBreedsManagerProps) {
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [activeTab, setActiveTab] = useState('species');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && userEmail) {
      loadData();
    }
  }, [visible, userEmail]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [speciesData, breedsData] = await Promise.all([
        getSpecies(userEmail),
        getBreeds(userEmail)
      ]);
      setSpecies(speciesData);
      setBreeds(breedsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', `Please enter ${activeTab === 'species' ? 'species' : 'breed'} name`);
      return;
    }

    if (activeTab === 'breeds' && !selectedSpecies) {
      Alert.alert('Error', 'Please select a species for the breed');
      return;
    }

    try {
      setLoading(true);
      
      if (activeTab === 'species') {
        await addSpecies({ name: newItemName.trim() }, userEmail);
      } else {
        const speciesName = species.find(s => s.id === selectedSpecies)?.name;
        await addBreed({
          name: newItemName.trim(),
          speciesId: selectedSpecies,
          speciesName: speciesName
        }, userEmail);
      }

      setNewItemName('');
      setSelectedSpecies('');
      setShowAddForm(false);
      await loadData();
      Alert.alert('Success', `${activeTab === 'species' ? 'Species' : 'Breed'} added successfully`);
    } catch (error) {
      Alert.alert('Error', `Failed to add ${activeTab === 'species' ? 'species' : 'breed'}`);
    } finally {
      setLoading(false);
    }
  };

  const canManage = canManageSpeciesBreeds(userEmail);

  if (!visible || !canManage) {
    return null;
  }

  const currentData = activeTab === 'species' ? species : breeds;
  const displayData = activeTab === 'breeds' 
    ? breeds.map(breed => ({
        ...breed,
        displayName: `${breed.name} (${breed.speciesName || species.find(s => s.id === breed.speciesId)?.name || 'Unknown Species'})`
      }))
    : species;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Species & Breeds</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'species' && styles.activeTab]}
              onPress={() => setActiveTab('species')}
            >
              <Text style={[styles.tabText, activeTab === 'species' && styles.activeTabText]}>Species</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'breeds' && styles.activeTab]}
              onPress={() => setActiveTab('breeds')}
            >
              <Text style={[styles.tabText, activeTab === 'breeds' && styles.activeTabText]}>Breeds</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setShowAddForm(true)}
            disabled={loading}
          >
            <Text style={styles.addButtonText}>+ Add {activeTab === 'species' ? 'Species' : 'Breed'}</Text>
          </TouchableOpacity>

          <ScrollView style={styles.listContainer}>
            {loading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : displayData.length === 0 ? (
              <Text style={styles.emptyText}>
                No {activeTab} found. Add some to get started.
              </Text>
            ) : (
              displayData.map((item) => (
                <View key={item.id} style={styles.listItem}>
                  <Text style={styles.itemText}>
                    {activeTab === 'breeds' ? item.displayName : item.name}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {showAddForm && (
          <Modal visible={true} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add New {activeTab === 'species' ? 'Species' : 'Breed'}</Text>
                
                {activeTab === 'breeds' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Species *</Text>
                    <ScrollView style={styles.speciesSelector}>
                      {species.map((speciesItem) => (
                        <TouchableOpacity
                          key={speciesItem.id}
                          style={[
                            styles.speciesOption,
                            selectedSpecies === speciesItem.id && styles.selectedSpeciesOption
                          ]}
                          onPress={() => setSelectedSpecies(speciesItem.id)}
                        >
                          <Text style={[
                            styles.speciesOptionText,
                            selectedSpecies === speciesItem.id && styles.selectedSpeciesOptionText
                          ]}>
                            {speciesItem.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{activeTab === 'species' ? 'Species' : 'Breed'} Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={newItemName}
                    onChangeText={setNewItemName}
                    placeholder={`Enter ${activeTab === 'species' ? 'species' : 'breed'} name`}
                    autoFocus
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => {
                      setShowAddForm(false);
                      setNewItemName('');
                      setSelectedSpecies('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleAdd}
                    disabled={loading}
                  >
                    <Text style={styles.saveButtonText}>
                      {loading ? 'Adding...' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#800000',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#800000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#23C062',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fafafa',
    marginBottom: 5,
    borderRadius: 5,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#800000',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  speciesSelector: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  speciesOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedSpeciesOption: {
    backgroundColor: '#800000',
  },
  speciesOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedSpeciesOptionText: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#23C062',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});