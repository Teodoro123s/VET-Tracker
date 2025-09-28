import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Modal, Animated } from 'react-native';
import { getAnimalTypes, getBreeds, addAnimalType, addBreed, deleteAnimalType, deleteBreed } from '@/lib/services/firebaseService';
import { useTenant } from '@/contexts/TenantContext';
import { router } from 'expo-router';

export default function SpeciesBreedsScreen() {
  const { userEmail } = useTenant();
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('species');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSlideAnim] = useState(new Animated.Value(-350));
  const [newItem, setNewItem] = useState({ name: '', speciesId: '' });
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
  const [showFloatingModal, setShowFloatingModal] = useState(false);
  const [floatingModalPosition, setFloatingModalPosition] = useState({ x: 0, y: 0 });
  const [selectedItem, setSelectedItem] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editItem, setEditItem] = useState({ name: '', speciesId: '' });

  useEffect(() => {
    if (userEmail) {
      loadData();
    }
  }, [userEmail]);

  const loadData = async () => {
    try {
      const [speciesData, breedsData] = await Promise.all([
        getAnimalTypes(userEmail),
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

  const handleAdd = () => {
    if (!editMode) {
      setNewItem({ name: '', speciesId: '' });
      setSelectedSpecies('');
    } else {
      setSelectedSpecies(editItem.speciesId);
    }
    setShowAddModal(true);
    addSlideAnim.setValue(-350);
    Animated.timing(addSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSave = async () => {
    try {
      const itemName = editMode ? editItem.name : newItem.name;
      if (!itemName) {
        Alert.alert('Error', `Please enter ${activeTab === 'species' ? 'species' : 'breed'} name`);
        return;
      }
      
      if (activeTab === 'breeds' && !selectedSpecies) {
        Alert.alert('Error', 'Please select a species first');
        return;
      }
      
      if (editMode) {
        // Update existing item
        const updateData = { ...editItem, name: itemName };
        if (activeTab === 'breeds') {
          updateData.speciesId = selectedSpecies;
        }
        // Add update logic here when available
        Alert.alert('Info', 'Edit functionality will be implemented');
      } else {
        // Add new item
        if (activeTab === 'species') {
          await addAnimalType(newItem, userEmail);
        } else {
          const breedData = { ...newItem, speciesId: selectedSpecies };
          await addBreed(breedData, userEmail);
        }
      }
      
      Animated.timing(addSlideAnim, {
        toValue: -350,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setShowAddModal(false);
        setEditMode(false);
      });
      
      setNewItem({ name: '', speciesId: '' });
      setEditItem({ name: '', speciesId: '' });
      setSelectedSpecies('');
      loadData();
      Alert.alert('Success', `${activeTab === 'species' ? 'Species' : 'Breed'} ${editMode ? 'updated' : 'added'} successfully`);
    } catch (error) {
      Alert.alert('Error', `Failed to ${editMode ? 'update' : 'add'} ${activeTab === 'species' ? 'species' : 'breed'}`);
    }
  };

  const handleOptionsPress = (event, item) => {
    const { pageX, pageY } = event.nativeEvent;
    setFloatingModalPosition({ x: pageX - 100, y: pageY - 50 });
    setSelectedItem(item);
    setShowFloatingModal(true);
  };

  const handleEdit = () => {
    setEditItem({ name: selectedItem.name, speciesId: selectedItem.speciesId || '' });
    setEditMode(true);
    setShowFloatingModal(false);
    handleAdd();
  };

  const handleDelete = () => {
    setShowFloatingModal(false);
    Alert.alert(
      `Delete ${activeTab === 'species' ? 'Species' : 'Breed'}`,
      `Are you sure you want to delete ${selectedItem.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (activeTab === 'species') {
                await deleteAnimalType(selectedItem.id, userEmail);
              } else {
                await deleteBreed(selectedItem.id, userEmail);
              }
              loadData();
              Alert.alert('Success', `${activeTab === 'species' ? 'Species' : 'Breed'} deleted successfully`);
            } catch (error) {
              Alert.alert('Error', `Failed to delete ${activeTab === 'species' ? 'species' : 'breed'}`);
            }
          }
        }
      ]
    );
  };

  const currentData = activeTab === 'species' ? species : breeds;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Species & Breeds</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
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

        <View style={styles.actionHeader}>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>+ Add {activeTab === 'species' ? 'Species' : 'Breed'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Name</Text>
              <Text style={styles.headerCell}>Actions</Text>
            </View>
            
            {loading ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>Loading...</Text>
              </View>
            ) : currentData.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  {activeTab === 'species' ? 'No species found' : 'No breeds found. Please add species first.'}
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.tableBody}>
                {currentData.map((item) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={styles.cell}>{item.name}</Text>
                    <View style={styles.actionsCell}>
                      <TouchableOpacity 
                        style={styles.optionsButton}
                        onPress={(event) => handleOptionsPress(event, item)}
                      >
                        <Text style={styles.optionsButtonText}>⋮</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>

      {showAddModal && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>{editMode ? 'Edit' : 'Add New'} {activeTab === 'species' ? 'Species' : 'Breed'}</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(addSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddModal(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.drawerForm}>
                {activeTab === 'breeds' && (
                  <>
                    <Text style={styles.fieldLabel}>Species *</Text>
                    <View style={styles.dropdownContainer}>
                      <TouchableOpacity 
                        style={styles.dropdown}
                        onPress={() => setShowSpeciesDropdown(!showSpeciesDropdown)}
                      >
                        <Text style={styles.dropdownText}>
                          {selectedSpecies ? species.find(s => s.id === selectedSpecies)?.name : 'Select Species'}
                        </Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                      </TouchableOpacity>
                      {showSpeciesDropdown && (
                        <ScrollView style={styles.dropdownMenu}>
                          {species.map((speciesItem) => (
                            <TouchableOpacity
                              key={speciesItem.id}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setSelectedSpecies(speciesItem.id);
                                setShowSpeciesDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{speciesItem.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  </>
                )}
                
                <Text style={styles.fieldLabel}>{activeTab === 'species' ? 'Species' : 'Breed'} Name *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder={`Enter ${activeTab === 'species' ? 'species' : 'breed'} name`}
                  value={editMode ? editItem.name : newItem.name}
                  onChangeText={(text) => {
                    if (editMode) {
                      setEditItem({...editItem, name: text});
                    } else {
                      setNewItem({...newItem, name: text});
                    }
                  }}
                />
              </View>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  Animated.timing(addSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddModal(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={handleSave}>
                  <Text style={styles.drawerSaveText}>{editMode ? 'Update' : 'Add'} {activeTab === 'species' ? 'Species' : 'Breed'}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {showFloatingModal && (
        <Modal visible={true} transparent animationType="none">
          <TouchableOpacity 
            style={styles.floatingModalOverlay}
            onPress={() => setShowFloatingModal(false)}
          >
            <View 
              style={[
                styles.floatingModal,
                {
                  left: floatingModalPosition.x,
                  top: floatingModalPosition.y,
                }
              ]}
            >
              <TouchableOpacity style={styles.floatingOption} onPress={handleEdit}>
                <Text style={styles.floatingOptionText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.floatingOption} onPress={handleDelete}>
                <Text style={styles.floatingOptionText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
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
  backButton: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
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
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#23C062',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tableContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  table: {
    backgroundColor: '#fff',
    height: 390,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  cell: {
    flex: 1,
    fontSize: 12,
    color: '#555',
  },
  actionsCell: {
    flex: 0.3,
    alignItems: 'center',
  },
  optionsButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  optionsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tableBody: {
    flex: 1,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10000,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 350,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  drawerTitle: {
    fontSize: 14,
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
    fontWeight: 'bold',
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
    fontSize: 12,
    backgroundColor: '#fafafa',
  },
  drawerButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    gap: 10,
  },
  drawerCancelButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    flex: 1,
  },
  drawerCancelText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
    fontSize: 12,
  },
  drawerSaveButton: {
    backgroundColor: '#23C062',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
  },
  drawerSaveText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dropdownContainer: {
    marginBottom: 15,
    position: 'relative',
    zIndex: 2000,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  dropdownText: {
    fontSize: 12,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#666',
  },
  floatingModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  floatingModal: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 10001,
    minWidth: 120,
  },
  floatingOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  floatingOptionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 2001,
    elevation: 20,
    maxHeight: 150,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 12,
    color: '#333',
  },
});