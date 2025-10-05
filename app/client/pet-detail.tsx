import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, Animated } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getPetById, getCustomerById, updatePet, deletePet, getMedicalHistory, getMedicalRecords, addMedicalRecord, getAnimalTypes, getBreeds, getMedicalCategories, getMedicalForms, getFormFields } from '@/lib/services/firebaseService';
import { useTenant } from '@/contexts/TenantContext';

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams();
  const { userEmail } = useTenant();
  const [pet, setPet] = useState(null);
  const [owner, setOwner] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [editSlideAnim] = useState(new Animated.Value(-350));
  const [recordSlideAnim] = useState(new Animated.Value(-350));
  const [editPet, setEditPet] = useState({
    name: '',
    species: '',
    breed: ''
  });
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [showSpeciesDropdown, setShowSpeciesDropdown] = useState(false);
  const [showBreedsDropdown, setShowBreedsDropdown] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newRecord, setNewRecord] = useState({
    category: '',
    formTemplate: '',
    petId: id as string
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formTemplates, setFormTemplates] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formFields, setFormFields] = useState([]);

  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (id && userEmail) {
      loadData();
    }
  }, [id, userEmail]);

  const loadData = async () => {
    try {
      const [petData, speciesData, breedsData, categoriesData, formsData] = await Promise.all([
        getPetById(userEmail, id as string),
        getAnimalTypes(userEmail),
        getBreeds(userEmail),
        getMedicalCategories(userEmail),
        getMedicalForms(userEmail)
      ]);
      
      console.log('Categories loaded:', categoriesData);
      setPet(petData);
      setSpecies(speciesData);
      setBreeds(breedsData);
      const mappedCategories = categoriesData.map(cat => ({ id: cat.id, name: cat.name || cat.category }));
      if (!mappedCategories.find(cat => cat.name === 'No Category')) {
        mappedCategories.unshift({ id: 'no-category', name: 'No Category' });
      }
      setCategories(mappedCategories);
      console.log('Mapped categories:', mappedCategories);
      const formTemplatesList = formsData.map(form => ({
        id: form.id,
        formName: form.formName || form.type || form.name,
        category: form.category || 'No Category'
      }));
      setFormTemplates(formTemplatesList);
      
      if (petData?.owner) {
        const ownerData = await getCustomerById(userEmail, petData.owner);
        setOwner(ownerData);
      }
      
      const allRecords = await getMedicalRecords(userEmail);
      const petRecords = allRecords.filter(record => {
        const matchesId = record.petId === id;
        const matchesName = record.petName === petData?.name;
        return matchesId || matchesName;
      });
      setMedicalHistory(petRecords);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = medicalHistory.filter(record => 
    record.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.formTemplate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = filteredHistory.slice(startIndex, endIndex);

  const handleEdit = () => {
    setEditPet({
      name: pet.name || '',
      species: pet.species || '',
      breed: pet.breed || ''
    });
    setShowEditModal(true);
    editSlideAnim.setValue(-350);
    Animated.timing(editSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSaveEdit = async () => {
    try {
      if (!editPet.name) {
        Alert.alert('Error', 'Please fill in pet name');
        return;
      }
      
      await updatePet(id as string, editPet, userEmail);
      setPet(prev => ({ ...prev, ...editPet }));
      
      Animated.timing(editSlideAnim, {
        toValue: -350,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowEditModal(false));
      
      Alert.alert('Success', 'Pet updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update pet');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Pet',
      'Are you sure you want to delete this pet and all medical records? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete }
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      await deletePet(id as string, userEmail);
      Alert.alert('Success', 'Pet deleted successfully', [
        { text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.push('/client/customers') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete pet');
    }
  };

  const handleAddRecord = () => {
    console.log('Add Record button clicked');
    setNewRecord({
      category: '',
      formTemplate: '',
      petId: id as string
    });
    setShowAddRecordModal(true);
    recordSlideAnim.setValue(-350);
    Animated.timing(recordSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSaveRecord = async () => {
    try {
      if (!newRecord.category) {
        Alert.alert('Error', 'Please select category');
        return;
      }
      if (!newRecord.formTemplate) {
        Alert.alert('Error', 'Please select form template');
        return;
      }
      
      // Fetch form fields and show form modal
      const fields = await getFormFields(newRecord.formTemplate, userEmail);
      setFormFields(fields);
      setFormData({});
      setShowFormModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load form fields');
    }
  };

  const handleSubmitForm = async () => {
    try {
      console.log('Submitting form with data:', formData);
      console.log('Form fields:', formFields);
      
      // Map form data using field labels as keys
      const mappedFormData = {};
      formFields.forEach(field => {
        mappedFormData[field.label] = formData[field.id] || '';
      });
      
      console.log('Mapped form data:', mappedFormData);
      
      const recordData = {
        petId: id as string,
        petName: pet?.name,
        category: newRecord.category,
        formTemplate: newRecord.formTemplate,
        formType: newRecord.formTemplate,
        formData: mappedFormData,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
        veterinarian: userEmail,
        createdBy: userEmail,
        diagnosis: mappedFormData.diagnosis || 'N/A',
        treatment: mappedFormData.treatment || 'N/A',
        notes: mappedFormData.notes || Object.values(mappedFormData).join(', ') || 'N/A'
      };
      
      console.log('Final record data:', recordData);
      
      await addMedicalRecord(recordData, userEmail);
      setShowFormModal(false);
      Animated.timing(recordSlideAnim, {
        toValue: -350,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowAddRecordModal(false));
      
      // Reload medical history
      const allRecords = await getMedicalRecords(userEmail);
      const petRecords = allRecords.filter(record => {
        const matchesId = record.petId === id;
        const matchesName = record.petName === pet?.name;
        return matchesId || matchesName;
      });
      setMedicalHistory(petRecords);
      
      Alert.alert('Success', 'Medical record added successfully');
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'Failed to add medical record');
    }
  };

  const formatDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    } else if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const formatNumber = (text) => {
    return text.replace(/[^0-9.]/g, '').replace(/(\.)(?=.*\1)/g, '');
  };

  const renderFormField = (field) => {
    switch (field.type) {
      case 'text':
        return (
          <TextInput
            key={field.id}
            style={styles.formInput}
            placeholder={`Enter ${field.label}`}
            value={formData[field.id] || ''}
            onChangeText={(text) => setFormData({...formData, [field.id]: text})}
          />
        );
      case 'date':
        return (
          <TextInput
            key={field.id}
            style={styles.formInput}
            placeholder="MM/DD/YYYY"
            value={formData[field.id] || ''}
            keyboardType="numeric"
            maxLength={10}
            onChangeText={(text) => {
              const formatted = formatDate(text);
              setFormData({...formData, [field.id]: formatted});
            }}
          />
        );
      case 'number':
        return (
          <TextInput
            key={field.id}
            style={styles.formInput}
            placeholder={`Enter ${field.label}`}
            keyboardType="numeric"
            value={formData[field.id] || ''}
            onChangeText={(text) => {
              const formatted = formatNumber(text);
              setFormData({...formData, [field.id]: formatted});
            }}
          />
        );
      default:
        return (
          <TextInput
            key={field.id}
            style={styles.formInput}
            placeholder={`Enter ${field.label}`}
            value={formData[field.id] || ''}
            onChangeText={(text) => setFormData({...formData, [field.id]: text})}
          />
        );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading pet details...</Text>
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={styles.container}>
        <Text>Pet not found</Text>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/client/customers')} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Pet Details</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.tableContainer}>
          <View style={styles.table}>
            <View style={styles.returnRow}>
              <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/client/customers')} style={styles.returnButton}>
                <Text style={styles.returnIcon}>←</Text>
              </TouchableOpacity>
              <View style={styles.returnText} />
              <View style={styles.returnText} />
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Field</Text>
              <Text style={styles.headerCell}>Value</Text>
            </View>
            
            <View style={styles.tableBody}>
              <View style={styles.tableRow}>
                <Text style={styles.cell}>Name</Text>
                <Text style={styles.cell}>{pet.name}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.cell}>Species</Text>
                <Text style={styles.cell}>{pet.species || 'N/A'}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.cell}>Breed</Text>
                <Text style={styles.cell}>{pet.breed || 'N/A'}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.cell}>Owner</Text>
                <Text style={styles.cell}>{owner?.name || `${owner?.firstname || ''} ${owner?.surname || ''}` || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Medical History</Text>
            <View style={styles.historyHeaderActions}>
              <TouchableOpacity style={styles.addRecordButton} onPress={handleAddRecord}>
                <Text style={styles.addRecordButtonText}>+ Add Record</Text>
              </TouchableOpacity>
              <View style={styles.searchContainer}>
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Search records..."
                  value={searchTerm}
                  onChangeText={(text) => {
                    setSearchTerm(text);
                    setCurrentPage(1);
                  }}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.tableContainer}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.headerCell}>Date</Text>
                <Text style={styles.headerCell}>Category</Text>
                <Text style={styles.headerCell}>Form Template</Text>
              </View>
              {filteredHistory.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>
                    {medicalHistory.length === 0 ? 'No medical records' : 'No records found'}
                  </Text>
                </View>
              ) : itemsPerPage >= 20 ? (
                <ScrollView style={styles.tableBody}>
                  {currentRecords.map((record) => (
                    <TouchableOpacity 
                      key={record.id} 
                      style={styles.tableRow} 
                      activeOpacity={0.7}
                      onPress={() => router.push(`/client/medical-record-detail?id=${record.id}`)}
                    >
                      <Text style={styles.cell}>{record.date}</Text>
                      <Text style={styles.cell}>{record.category || 'N/A'}</Text>
                      <Text style={styles.cell}>{record.formTemplate || 'N/A'}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                currentRecords.map((record) => (
                  <TouchableOpacity 
                    key={record.id} 
                    style={styles.tableRow} 
                    activeOpacity={0.7}
                    onPress={() => router.push(`/client/medical-record-detail?id=${record.id}`)}
                  >
                    <Text style={styles.cell}>{record.date}</Text>
                    <Text style={styles.cell}>{record.category || 'N/A'}</Text>
                    <Text style={styles.cell}>{record.formTemplate || 'N/A'}</Text>
                  </TouchableOpacity>
                ))
              )}
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
                      {[5, 10, 25, 50].map((size) => (
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
                  {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredHistory.length)} of {filteredHistory.length}
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

      {showEditModal && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: editSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Edit Pet</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(editSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowEditModal(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Pet Name *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter pet name"
                  value={editPet.name}
                  onChangeText={(text) => setEditPet({...editPet, name: text})}
                />
                
                <Text style={styles.fieldLabel}>Species</Text>
                <View style={[styles.dropdownContainer, { zIndex: 3000 }]}>
                  <TouchableOpacity 
                    style={styles.petDropdown}
                    onPress={() => {
                      setShowSpeciesDropdown(!showSpeciesDropdown);
                      setShowBreedsDropdown(false);
                    }}
                  >
                    <Text style={styles.petDropdownText}>{editPet.species || 'Select species'}</Text>
                    <Text style={styles.petDropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showSpeciesDropdown && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {species.length === 0 ? (
                          <View style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>No species available</Text>
                          </View>
                        ) : (
                          species.sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
                            <TouchableOpacity 
                              key={item.id}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setEditPet({...editPet, species: item.name, breed: ''});
                                setShowSpeciesDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{item.name}</Text>
                              <View style={styles.optionActions}>
                                <TouchableOpacity 
                                  style={styles.editIcon}
                                  onPress={() => {
                                    setEditingItem(item);
                                    setEditValue(item.name);
                                    setModalType('species');
                                    setShowSpeciesDropdown(false);
                                    setShowEditItemModal(true);
                                  }}
                                >
                                  <Text style={styles.iconText}>✏</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteIcon}>
                                  <Text style={styles.iconText}>🗑</Text>
                                </TouchableOpacity>
                              </View>
                            </TouchableOpacity>
                          ))
                        )}
                        <TouchableOpacity 
                          style={styles.customOption}
                          onPress={() => {
                            setModalType('species');
                            setCustomValue('');
                            setShowSpeciesDropdown(false);
                            setShowCustomModal(true);
                          }}
                        >
                          <Text style={styles.customOptionText}>+ Add Custom Species</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Breed</Text>
                <View style={[styles.dropdownContainer, { zIndex: 2000 }]}>
                  <TouchableOpacity 
                    style={styles.petDropdown}
                    onPress={() => {
                      setShowBreedsDropdown(!showBreedsDropdown);
                      setShowSpeciesDropdown(false);
                    }}
                  >
                    <Text style={styles.petDropdownText}>{editPet.breed || 'Select breed'}</Text>
                    <Text style={styles.petDropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showBreedsDropdown && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {(() => {
                          const filteredBreeds = breeds.filter(breed => {
                            const selectedSpecies = species.find(s => s.name === editPet.species);
                            return selectedSpecies && breed.speciesId === selectedSpecies.id;
                          });
                          
                          if (filteredBreeds.length === 0) {
                            return [
                              <View key="no-breeds" style={styles.dropdownOption}>
                                <Text style={styles.dropdownOptionText}>No breeds available for this species</Text>
                              </View>
                            ];
                          }
                          
                          return filteredBreeds.sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
                            <TouchableOpacity 
                              key={item.id}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setEditPet({...editPet, breed: item.name});
                                setShowBreedsDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{item.name}</Text>
                              <View style={styles.optionActions}>
                                <TouchableOpacity 
                                  style={styles.editIcon}
                                  onPress={() => {
                                    setEditingItem(item);
                                    setEditValue(item.name);
                                    setModalType('breed');
                                    setShowBreedsDropdown(false);
                                    setShowEditItemModal(true);
                                  }}
                                >
                                  <Text style={styles.iconText}>✏</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteIcon}>
                                  <Text style={styles.iconText}>🗑</Text>
                                </TouchableOpacity>
                              </View>
                            </TouchableOpacity>
                          ));
                        })()}
                        <TouchableOpacity 
                          style={styles.customOption}
                          onPress={() => {
                            setModalType('breed');
                            setCustomValue('');
                            setShowBreedsDropdown(false);
                            setShowCustomModal(true);
                          }}
                        >
                          <Text style={styles.customOptionText}>+ Add Custom Breed</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </View>
                

              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  Animated.timing(editSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowEditModal(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={handleSaveEdit}>
                  <Text style={styles.drawerSaveText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {showAddRecordModal && (
        <Modal visible={showAddRecordModal} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: recordSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add Medical Record</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(recordSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddRecordModal(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.drawerForm}>
                <Text style={styles.fieldLabel}>Category *</Text>
                <View style={[styles.dropdownContainer, { zIndex: 3000 }]}>
                  <TouchableOpacity 
                    style={styles.petDropdown}
                    onPress={() => {
                      console.log('Category dropdown clicked, current state:', showCategoryDropdown);
                      setShowCategoryDropdown(!showCategoryDropdown);
                      setShowTemplateDropdown(false);
                    }}
                  >
                    <Text style={styles.petDropdownText}>
                      {newRecord.category || 'Select Category'}
                    </Text>
                    <Text style={styles.petDropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showCategoryDropdown && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {categories.length === 0 ? (
                          <View style={styles.dropdownOption}>
                            <Text style={styles.dropdownOptionText}>No categories available</Text>
                          </View>
                        ) : (
                          categories.map((category) => (
                            <TouchableOpacity
                              key={category.id}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setNewRecord({...newRecord, category: category.name, formTemplate: ''});
                                setShowCategoryDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{category.name}</Text>
                            </TouchableOpacity>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Form Template *</Text>
                <View style={[styles.dropdownContainer, { zIndex: 2000 }]}>
                  <TouchableOpacity 
                    style={[styles.petDropdown, !newRecord.category && styles.disabledDropdown]}
                    onPress={() => {
                      if (newRecord.category) {
                        setShowTemplateDropdown(!showTemplateDropdown);
                        setShowCategoryDropdown(false);
                      }
                    }}
                  >
                    <Text style={[styles.petDropdownText, !newRecord.category && styles.disabledText]}>
                      {!newRecord.category ? 'Select category first' : (newRecord.formTemplate || 'Select Form Template')}
                    </Text>
                    <Text style={styles.petDropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showTemplateDropdown && (
                    <View style={styles.dropdownMenu}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {(() => {
                          const filtered = formTemplates.filter(template => {
                            if (!newRecord.category) return true;
                            return template.category === newRecord.category;
                          });
                          
                          if (formTemplates.length === 0) {
                            return [
                              <View key="no-templates" style={styles.dropdownOption}>
                                <Text style={styles.dropdownOptionText}>No form templates available</Text>
                              </View>
                            ];
                          }
                          
                          if (filtered.length === 0 && newRecord.category) {
                            return [
                              <View key="no-forms" style={styles.dropdownOption}>
                                <Text style={styles.dropdownOptionText}>No forms available for this category</Text>
                              </View>
                            ];
                          }
                          
                          return filtered
                            .sort((a, b) => a.formName.localeCompare(b.formName))
                            .map((template) => (
                            <TouchableOpacity
                              key={template.id}
                              style={styles.dropdownOption}
                              onPress={() => {
                                setNewRecord({...newRecord, formTemplate: template.formName});
                                setShowTemplateDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownOptionText}>{template.formName}</Text>
                            </TouchableOpacity>
                          ));
                        })()}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  Animated.timing(recordSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddRecordModal(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={handleSaveRecord}>
                  <Text style={styles.drawerSaveText}>Create Record</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {showCustomModal && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.floatingModalOverlay}>
            <View style={styles.floatingModal}>
              <Text style={styles.floatingModalTitle}>Add Custom {modalType === 'species' ? 'Species' : 'Breed'}</Text>
              <TextInput
                style={styles.floatingModalInput}
                placeholder={`Enter ${modalType} name`}
                value={customValue}
                onChangeText={setCustomValue}
                autoFocus
              />
              <View style={styles.floatingModalButtons}>
                <TouchableOpacity 
                  style={styles.floatingModalCancel}
                  onPress={() => setShowCustomModal(false)}
                >
                  <Text style={styles.floatingModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.floatingModalSave}
                  onPress={() => {
                    if (customValue.trim()) {
                      if (modalType === 'species') {
                        setEditPet({...editPet, species: customValue.trim(), breed: ''});
                      } else {
                        setEditPet({...editPet, breed: customValue.trim()});
                      }
                    }
                    setShowCustomModal(false);
                  }}
                >
                  <Text style={styles.floatingModalSaveText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showEditItemModal && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.floatingModalOverlay}>
            <View style={styles.floatingModal}>
              <Text style={styles.floatingModalTitle}>Edit {modalType === 'species' ? 'Species' : 'Breed'}</Text>
              <TextInput
                style={styles.floatingModalInput}
                placeholder={`Enter ${modalType} name`}
                value={editValue}
                onChangeText={setEditValue}
                autoFocus
              />
              <View style={styles.floatingModalButtons}>
                <TouchableOpacity 
                  style={styles.floatingModalCancel}
                  onPress={() => setShowEditItemModal(false)}
                >
                  <Text style={styles.floatingModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.floatingModalSave}
                  onPress={() => {
                    setShowEditItemModal(false);
                  }}
                >
                  <Text style={styles.floatingModalSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showFormModal && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.formPreviewModalOverlay}>
            <View style={styles.formPreviewModalContent}>
              <View style={styles.formPreviewHeader}>
                <TouchableOpacity style={styles.formPreviewBackButton} onPress={() => setShowFormModal(false)}>
                  <Text style={styles.formPreviewBackText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.formPreviewHeaderTitle}>{newRecord.formTemplate}</Text>
                <TouchableOpacity style={styles.formPreviewSaveHeaderButton} onPress={handleSubmitForm}>
                  <Text style={styles.formPreviewSaveHeaderText}>Save Record</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.formPreviewBody} showsVerticalScrollIndicator={false}>
                <View style={styles.formPreviewDisplayArea}>
                  <View style={styles.formPreviewFieldsContainer}>
                    {formFields.map((field) => (
                      <View key={field.id} style={styles.formPreviewField}>
                        <Text style={styles.formPreviewFieldLabel}>
                          {field.label}{field.required && ' *'}
                        </Text>
                        {renderFormField(field)}
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
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
  tableContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 20,
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
  historySection: {
    marginTop: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  searchContainer: {
    borderWidth: 2,
    borderColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    width: 150,
    fontSize: 12,
  },
  historyTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#800000',
  },
  addRecordButton: {
    backgroundColor: '#23C062',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addRecordButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  returnRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  returnButton: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  returnIcon: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  returnText: {
    flex: 1,
  },
  actionButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007bff',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  drawerOverlay: {
    flex: 1,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
    position: 'relative',
    marginBottom: 15,
  },
  petDropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  petDropdownText: {
    fontSize: 12,
    color: '#555',
  },
  petDropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 150,
    zIndex: 1001,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  optionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editIcon: {
    padding: 4,
  },
  deleteIcon: {
    padding: 4,
  },
  iconText: {
    fontSize: 12,
  },
  customOption: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  customOptionText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: 'bold',
  },
  floatingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  floatingModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  floatingModalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
    marginBottom: 20,
  },
  floatingModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  floatingModalCancel: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  floatingModalCancelText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  floatingModalSave: {
    flex: 1,
    backgroundColor: '#23C062',
    paddingVertical: 12,
    borderRadius: 8,
  },
  floatingModalSaveText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  formPreviewModalOverlay: {
    flex: 1,
    paddingLeft: 270,
  },
  formPreviewModalContent: {
    flex: 1,
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    overflow: 'visible',
  },
  formPreviewHeader: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  formPreviewBackButton: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  formPreviewBackText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  formPreviewHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
    flex: 1,
    textAlign: 'center',
  },
  formPreviewSaveHeaderButton: {
    backgroundColor: '#23C062',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  formPreviewSaveHeaderText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  formPreviewBody: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderTopWidth: 0,
  },
  formPreviewDisplayArea: {
    padding: 20,
  },
  formPreviewFieldsContainer: {
    gap: 15,
  },
  formPreviewField: {
    marginBottom: 15,
    zIndex: -1,
  },
  formPreviewFieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    backgroundColor: '#fafafa',
    maxWidth: 300,
  },
  disabledDropdown: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  disabledText: {
    color: '#999',
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
  pageOf: {
    fontSize: 10,
    color: '#666',
  },
});