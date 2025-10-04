import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Modal, Animated } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { deleteMedicalCategory, deleteMedicalForm, getMedicalForms, getMedicalCategories, addMedicalForm, addMedicalCategory, getFormFields, addFormField, updateMedicalForm, deleteFormField, updateFormField, addMedicalRecord, getVeterinarians } from '../../lib/services/firebaseService';
import { useTenant } from '@/contexts/TenantContext';

export default function RecordsScreen() {
  const { userEmail } = useTenant();
  
  const records = [
    { id: 1, category: 'No Category', formCount: 0 },
  ];
  
  const medicalForms = [];
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCategoryDrawer, setShowAddCategoryDrawer] = useState(false);
  const [addCategorySlideAnim] = useState(new Animated.Value(-350));
  const [showAddFormDrawer, setShowAddFormDrawer] = useState(false);
  const [addFormSlideAnim] = useState(new Animated.Value(-350));
  const [showAddRecordDrawer, setShowAddRecordDrawer] = useState(false);
  const [addRecordSlideAnim] = useState(new Animated.Value(-350));
  const [newCategory, setNewCategory] = useState({
    category: ''
  });
  const [recordList, setRecordList] = useState([]);
  
  const [formsCurrentPage, setFormsCurrentPage] = useState(1);
  const [formsItemsPerPage, setFormsItemsPerPage] = useState(5);
  const [formsShowDropdown, setFormsShowDropdown] = useState(false);
  const [formsSearchTerm, setFormsSearchTerm] = useState('');
  const [medicalFormsList, setMedicalFormsList] = useState([]);
  
  // Load data from Firebase on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!userEmail) return;
      
      try {
        const [forms, categories, vets] = await Promise.all([
          getMedicalForms(userEmail),
          getMedicalCategories(userEmail),
          getVeterinarians(userEmail)
        ]);
        
        const formsList = forms.map(form => ({
          id: form.id,
          formName: form.formName || form.type,
          category: form.category
        }));
        setMedicalFormsList(formsList);
        
        // Load form fields for each form
        const formDetailsData = {};
        for (const form of formsList) {
          const fields = await getFormFields(form.formName, userEmail);
          formDetailsData[form.formName] = fields.map(field => ({
            id: field.id,
            label: field.label,
            type: field.type,
            required: field.required,
            options: field.options,
            dateFormat: field.dateFormat
          }));
        }
        setFormDetails(formDetailsData);
        
        const categoryList = categories.map(cat => ({
          id: cat.id,
          category: cat.name || cat.category,
          formCount: 0
        }));
        
        // Add "No Category" if not exists
        if (!categoryList.find(cat => cat.category === 'No Category')) {
          categoryList.unshift({ id: 'no-category', category: 'No Category', formCount: 0 });
        }
        
        setRecordList(categoryList);
        
        // Load veterinarians
        const vetList = vets.map(vet => ({
          id: vet.id,
          name: `${vet.firstname || ''} ${vet.surname || ''}`.trim() || vet.name || 'Unknown'
        }));
        setVeterinarians(vetList);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to default "No Category"
        setRecordList([{ id: 'no-category', category: 'No Category', formCount: 0 }]);
        setVeterinarians([]);
      }
    };
    
    loadData();
  }, [userEmail]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedFormPreview, setSelectedFormPreview] = useState(null);
  const [previewDropdownStates, setPreviewDropdownStates] = useState({});
  const [veterinarians, setVeterinarians] = useState([]);
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState(null);
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [showAddFieldDrawer, setShowAddFieldDrawer] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-350));
  const [showEditCategoryDrawer, setShowEditCategoryDrawer] = useState(false);
  const [editSlideAnim] = useState(new Animated.Value(-350));
  const [editCategoryName, setEditCategoryName] = useState('');
  const [newField, setNewField] = useState({
    fieldName: '',
    inputType: 'Text',
    required: 'No',
    dropdownOptions: ['Biogesic', 'Paracetamol', 'Neozep'],
    dateFormat: 'Month/Day/Year'
  });
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [showDateFormatDropdown, setShowDateFormatDropdown] = useState(false);
  const [showInputTypeDropdown, setShowInputTypeDropdown] = useState(false);
  const [showRequiredDropdown, setShowRequiredDropdown] = useState(false);
  const inputTypeOptions = ['Text', 'Number', 'Date', 'Dropdown', 'Veterinarian Dropdown'];
  const dateFormatOptions = ['Month/Day/Year', 'Timestamp'];
  const requiredOptions = ['No', 'Yes'];
  const [newFormTemplate, setNewFormTemplate] = useState({
    formName: '',
    category: 'No Category'
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [newRecord, setNewRecord] = useState({
    category: 'No Category',
    formTemplate: ''
  });
  const [showRecordCategoryDropdown, setShowRecordCategoryDropdown] = useState(false);
  const [showFormTemplateDropdown, setShowFormTemplateDropdown] = useState(false);
  
  useEffect(() => {
    if (showAddFieldDrawer) {
      slideAnim.setValue(-350);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showAddFieldDrawer]);
  
  useEffect(() => {
    if (showEditCategoryDrawer) {
      editSlideAnim.setValue(-350);
      Animated.timing(editSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showEditCategoryDrawer]);
  
  useEffect(() => {
    if (showAddCategoryDrawer) {
      addCategorySlideAnim.setValue(-350);
      Animated.timing(addCategorySlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showAddCategoryDrawer]);
  
  useEffect(() => {
    if (showAddFormDrawer) {
      addFormSlideAnim.setValue(-350);
      Animated.timing(addFormSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showAddFormDrawer]);
  
  useEffect(() => {
    if (showAddRecordDrawer) {
      addRecordSlideAnim.setValue(-350);
      Animated.timing(addRecordSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showAddRecordDrawer]);
  
  const categoryForms = {};
  
  const [formDetails, setFormDetails] = useState({});
  
  const recordsWithFormCount = recordList.map(record => ({
    ...record,
    formCount: medicalFormsList.filter(form => form.category === record.category).length
  }));
  
  const filteredRecords = recordsWithFormCount.filter(record =>
    record.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);
  
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
  
  const handleAddRecord = async () => {
    if (newCategory.category.trim()) {
      try {
        const categoryData = {
          name: newCategory.category,
          description: `Category for ${newCategory.category} forms`,
          createdAt: new Date().toISOString()
        };
        
        const savedCategory = await addMedicalCategory(categoryData, userEmail);
        
        const formCount = medicalFormsList.filter(form => form.category === newCategory.category).length;
        const record = {
          id: savedCategory.id,
          category: newCategory.category,
          formCount: formCount
        };
        setRecordList([...recordList, record]);
        setNewCategory({ category: '' });
        Animated.timing(addCategorySlideAnim, {
          toValue: -350,
          duration: 200,
          useNativeDriver: false,
        }).start(() => setShowAddCategoryDrawer(false));
      } catch (error) {
        console.error('Error adding category:', error);
        alert('Error adding category');
      }
    }
  };
  
  const filteredForms = medicalFormsList.filter(form =>
    form.formName.toLowerCase().includes(formsSearchTerm.toLowerCase())
  );
  
  const formsTotalPages = Math.ceil(filteredForms.length / formsItemsPerPage);
  const formsStartIndex = (formsCurrentPage - 1) * formsItemsPerPage;
  const formsEndIndex = formsStartIndex + formsItemsPerPage;
  const currentForms = filteredForms.slice(formsStartIndex, formsEndIndex);
  
  const handleFormsPrevious = () => {
    if (formsCurrentPage > 1) {
      setFormsCurrentPage(formsCurrentPage - 1);
    }
  };
  
  const handleFormsNext = () => {
    if (formsCurrentPage < formsTotalPages) {
      setFormsCurrentPage(formsCurrentPage + 1);
    }
  };
  
  const handleFormsPageChange = (page) => {
    const pageNum = parseInt(page);
    if (pageNum >= 1 && pageNum <= formsTotalPages) {
      setFormsCurrentPage(pageNum);
    }
  };
  
  const handleFormsItemsPerPageChange = (value) => {
    setFormsItemsPerPage(value);
    setFormsCurrentPage(1);
    setFormsShowDropdown(false);
  };
  
  const formsDropdownOptions = [5, 10, 20];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Categories</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.recordAddButton} onPress={() => setShowAddCategoryDrawer(true)}>
              <Image source={require('@/assets/ic_round-plus.png')} style={styles.addIcon} />
              <Text style={styles.recordAddButtonText}>Add Category</Text>
            </TouchableOpacity>
            <View style={styles.recordSearchContainer}>
              <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
              <TextInput 
                style={styles.recordSearchInput}
                placeholder="Search categories..."
                placeholderTextColor="#999"
                value={searchTerm}
                onChangeText={(text) => {
                  setSearchTerm(text);
                  setCurrentPage(1);
                }}
              />
            </View>
          </View>
        </View>
        <View style={styles.content}>
        <View style={styles.tableContainer}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCellName}>Category Name</Text>
              <Text style={styles.headerCell}>Number of Forms</Text>
            </View>
            {currentRecords.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No categories found</Text>
              </View>
            ) : itemsPerPage >= 20 ? (
              <ScrollView style={styles.tableBody}>
                {currentRecords.map((record) => (
                  <TouchableOpacity key={record.id} style={styles.tableRow} onPress={() => setSelectedCategoryDetail(record.category)}>
                    <Text style={styles.cellName}>{record.category}</Text>
                    <Text style={styles.cell}>{record.formCount}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              currentRecords.map((record) => (
                <TouchableOpacity key={record.id} style={styles.tableRow} onPress={() => setSelectedCategoryDetail(record.category)}>
                  <Text style={styles.cellName}>{record.category}</Text>
                  <Text style={styles.cell}>{record.formCount}</Text>
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
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredRecords.length)} of {filteredRecords.length}
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
      
      {/* Medical Forms Section */}
      <View style={styles.medicalFormsSection}>
        <View style={styles.medicalFormsHeader}>
          <Text style={styles.medicalFormsHeaderText}>Form Templates</Text>
          <View style={styles.medicalFormsHeaderActions}>
            <TouchableOpacity style={styles.formAddButton} onPress={() => setShowAddFormDrawer(true)}>
              <Image source={require('@/assets/ic_round-plus.png')} style={styles.addIcon} />
              <Text style={styles.formAddButtonText}>Add Form</Text>
            </TouchableOpacity>

            <View style={styles.formSearchContainer}>
              <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
              <TextInput 
                style={styles.formSearchInput}
                placeholder="Search forms..."
                placeholderTextColor="#999"
                value={formsSearchTerm}
                onChangeText={(text) => {
                  setFormsSearchTerm(text);
                  setFormsCurrentPage(1);
                }}
              />
            </View>
          </View>
        </View>
        <View style={styles.medicalFormsContent}>
          <View style={styles.medicalFormsTableContainer}>
            <View style={styles.medicalFormsTable}>
              <View style={styles.medicalFormsTableHeader}>
                <Text style={styles.medicalFormsHeaderCellName}>Form Name</Text>
                <Text style={styles.medicalFormsHeaderCell}>Category</Text>
                <Text style={styles.medicalFormsHeaderCell}>Fields</Text>
              </View>
{currentForms.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No form templates found</Text>
                </View>
              ) : formsItemsPerPage >= 10 ? (
                <ScrollView style={styles.medicalFormsTableBody}>
                  {currentForms.map((form) => (
                    <TouchableOpacity key={form.id} style={styles.medicalFormsTableRow} onPress={() => setSelectedForm(form.formName)}>
                      <Text style={styles.medicalFormsCellName}>{form.formName}</Text>
                      <Text style={styles.medicalFormsCell}>{form.category}</Text>
                      <Text style={styles.medicalFormsCell}>{formDetails[form.formName]?.length || 0}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                currentForms.map((form) => (
                  <TouchableOpacity key={form.id} style={styles.medicalFormsTableRow} onPress={() => setSelectedForm(form.formName)}>
                    <Text style={styles.medicalFormsCellName}>{form.formName}</Text>
                    <Text style={styles.medicalFormsCell}>{form.category}</Text>
                    <Text style={styles.medicalFormsCell}>{formDetails[form.formName]?.length || 0}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
            
            <View style={styles.medicalFormsPagination}>
              <View style={styles.medicalFormsPaginationControls}>
                <Text style={styles.paginationLabel}>Rows per page:</Text>
                <View style={styles.dropdown}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setFormsShowDropdown(!formsShowDropdown)}
                  >
                    <Text style={styles.dropdownText}>{formsItemsPerPage}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {formsShowDropdown && (
                    <View style={styles.dropdownMenu}>
                      {formsDropdownOptions.map((size) => (
                        <TouchableOpacity
                          key={size}
                          style={styles.dropdownOption}
                          onPress={() => {
                            setFormsItemsPerPage(size);
                            setFormsCurrentPage(1);
                            setFormsShowDropdown(false);
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
                  onPress={() => setFormsCurrentPage(Math.max(1, formsCurrentPage - 1))}
                  disabled={formsCurrentPage === 1}
                >
                  <Text style={styles.pageBtnText}>‹</Text>
                </TouchableOpacity>
                
                <Text style={styles.pageOf}>
                  {formsStartIndex + 1}-{Math.min(formsStartIndex + formsItemsPerPage, filteredForms.length)} of {filteredForms.length}
                </Text>
                
                <TouchableOpacity
                  style={styles.pageBtn}
                  onPress={() => setFormsCurrentPage(Math.min(formsTotalPages, formsCurrentPage + 1))}
                  disabled={formsCurrentPage === formsTotalPages}
                >
                  <Text style={styles.pageBtnText}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
      </ScrollView>
      
      {/* Category Detail View */}
      {selectedCategoryDetail && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.detailModalOverlay}>
            <View style={styles.detailModalContent}>
              <View style={styles.detailContent}>
                <View style={styles.detailTableContainer}>
                  <View style={styles.tableTopRow}>
                    <TouchableOpacity style={styles.returnButton} onPress={() => setSelectedCategoryDetail(null)}>
                      <Text style={styles.returnButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.formDetailTitle}>{selectedCategoryDetail}</Text>
                      <Text style={styles.categoryFormCount}>{medicalFormsList.filter(form => form.category === selectedCategoryDetail).length} Forms</Text>
                    </View>
                    <View style={styles.categoryActions}>
                      {selectedCategoryDetail !== 'No Category' && (
                        <>
                          <TouchableOpacity style={styles.editCategoryButton} onPress={() => {
                            setEditCategoryName(selectedCategoryDetail);
                            setShowEditCategoryDrawer(true);
                          }}>
                            <Text style={styles.editCategoryButtonText}>Edit Category</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.deleteCategoryButton} onPress={async () => {
                            try {
                              // Find the category to delete
                              const categoryToDelete = recordList.find(record => record.category === selectedCategoryDetail);
                              if (categoryToDelete && categoryToDelete.id) {
                                await deleteMedicalCategory(categoryToDelete.id, userEmail);
                              }
                              
                              // Move all form templates to "No Category"
                              const updatedForms = medicalFormsList.map(form => 
                                form.category === selectedCategoryDetail 
                                  ? { ...form, category: 'No Category' }
                                  : form
                              );
                              setMedicalFormsList(updatedForms);
                              
                              // Remove category from records
                              const updatedRecords = recordList.filter(record => record.category !== selectedCategoryDetail);
                              setRecordList(updatedRecords);
                              
                              setSelectedCategoryDetail(null);
                            } catch (error) {
                              console.error('Error deleting category:', error);
                              alert('Error deleting category');
                            }
                          }}>
                            <Text style={styles.deleteCategoryButtonText}>Delete</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={styles.detailTable}>
                    <View style={styles.detailTableHeader}>
                      <Text style={styles.detailHeaderCellName}>Form Template Name</Text>
                      <Text style={styles.detailHeaderCell}>Fields</Text>
                      <Text style={styles.detailHeaderCell}>Last Modified</Text>
                    </View>
                    <ScrollView style={styles.detailTableBody}>
                      {medicalFormsList.filter(form => form.category === selectedCategoryDetail).map((form) => (
                        <View key={form.id} style={styles.detailTableRow}>
                          <Text style={styles.detailCellName}>{form.formName}</Text>
                          <Text style={styles.detailCell}>{formDetails[form.formName]?.length || 0}</Text>
                          <Text style={styles.detailCell}>Today</Text>
                          <TouchableOpacity 
                            style={styles.deleteFormButton} 
                            onPress={async () => {
                              try {
                                await deleteMedicalForm(form.id, userEmail);
                                const updatedForms = medicalFormsList.filter(f => f.id !== form.id);
                                setMedicalFormsList(updatedForms);
                              } catch (error) {
                                console.error('Error deleting form:', error);
                                alert('Error deleting form');
                              }
                            }}
                          >
                            <Text style={styles.deleteFormButtonText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
      
      {/* Form Detail View */}
      {selectedForm && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.detailModalOverlay}>
            <View style={styles.detailModalContent}>
              <View style={styles.detailContent}>
                <View style={styles.detailTableContainer}>
                  <View style={styles.tableTopRow}>
                    <TouchableOpacity style={styles.returnButton} onPress={() => setSelectedForm(null)}>
                      <Text style={styles.returnButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.formDetailTitle}>{selectedForm}</Text>
                    <View style={styles.formDetailActions}>
                      <TouchableOpacity 
                        style={styles.previewFormButton} 
                        onPress={() => setSelectedFormPreview(medicalFormsList.find(form => form.formName === selectedForm))}
                      >
                        <Text style={styles.previewFormButtonText}>Preview</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addFieldButton} onPress={() => setShowAddFieldDrawer(true)}>
                        <Image source={require('@/assets/ic_round-plus.png')} style={styles.addIcon} />
                        <Text style={styles.addFieldButtonText}>Add Field</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.detailTable}>
                    <View style={styles.detailTableHeader}>
                      <Text style={styles.detailHeaderCell}>Field Name</Text>
                      <Text style={styles.detailHeaderCell}>Input Type</Text>
                      <Text style={styles.detailHeaderCell}>Required</Text>
                    </View>
                    <ScrollView style={styles.detailTableBody}>
                      {(formDetails[selectedForm] || []).map((field) => (
                        <View key={field.id} style={styles.detailTableRow}>
                          <Text style={styles.detailCell}>{field.label}</Text>
                          <Text style={styles.detailCell}>{field.type}</Text>
                          <Text style={styles.detailCell}>{field.required ? 'Yes' : 'No'}</Text>
                          <View style={styles.fieldActions}>
                            <TouchableOpacity 
                              style={styles.editFieldButton}
                              onPress={() => {
                                setNewField({
                                  fieldName: field.label,
                                  inputType: field.type === 'veterinarian_dropdown' ? 'Veterinarian Dropdown' : field.type.charAt(0).toUpperCase() + field.type.slice(1),
                                  required: field.required ? 'Yes' : 'No',
                                  dropdownOptions: field.options || ['Option 1', 'Option 2'],
                                  dateFormat: field.dateFormat || 'Month/Day/Year'
                                });
                                setEditingFieldId(field.id);
                                setShowAddFieldDrawer(true);
                              }}
                            >
                              <Text style={styles.editFieldButtonText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.deleteFieldButton}
                              onPress={async () => {
                                try {
                                  await deleteFormField(field.id, userEmail);
                                  setFormDetails(prev => ({
                                    ...prev,
                                    [selectedForm]: prev[selectedForm].filter(f => f.id !== field.id)
                                  }));
                                } catch (error) {
                                  console.error('Error deleting field:', error);
                                  alert('Error deleting field');
                                }
                              }}
                            >
                              <Text style={styles.deleteFieldButtonText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
      

      
      {/* Add Field Drawer */}
      {showAddFieldDrawer && (
        <Modal visible={true} transparent animationType="none">
          <TouchableOpacity 
            style={styles.drawerOverlay}
            activeOpacity={1}
            onPress={() => {
              Animated.timing(slideAnim, {
                toValue: -350,
                duration: 200,
                useNativeDriver: false,
              }).start(() => setShowAddFieldDrawer(false));
            }}
          >
            <Animated.View style={[styles.drawer, { left: slideAnim }]}>
              <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>{editingFieldId ? 'Edit Field' : 'Add New Field'}</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  setNewField({ fieldName: '', inputType: 'Text', required: 'No', dropdownOptions: ['Biogesic', 'Paracetamol', 'Neozep'], dateFormat: 'Month/Day/Year' });
                  setEditingFieldId(null);
                  Animated.timing(slideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddFieldDrawer(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.drawerContent}>
                <Text style={styles.fieldLabel}>Field Name *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter field name"
                  value={newField.fieldName}
                  onChangeText={(text) => setNewField({...newField, fieldName: text})}
                />
                
                <Text style={styles.fieldLabel}>Input Type *</Text>
                <View style={styles.inputTypeDropdownContainer}>
                  <TouchableOpacity style={styles.drawerDropdown} onPress={() => setShowInputTypeDropdown(!showInputTypeDropdown)}>
                    <Text style={styles.drawerDropdownText}>{newField.inputType}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showInputTypeDropdown && (
                    <View style={styles.inputTypeDropdownMenu}>
                      <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={false}>
                        {inputTypeOptions.map((option) => (
                          <TouchableOpacity
                            key={option}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewField({...newField, inputType: option});
                              setShowInputTypeDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{option}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                {newField.inputType === 'Dropdown' && (
                  <>
                    <Text style={styles.fieldLabel}>Custom Options</Text>
                    <Text style={styles.fieldDescription}>Add your dropdown choices</Text>
                    {newField.dropdownOptions.map((option, index) => (
                      <View key={index} style={styles.optionRow}>
                        <TextInput
                          style={styles.optionInput}
                          placeholder={`Option ${index + 1}`}
                          placeholderTextColor="#ccc"
                          value={option}
                          onChangeText={(text) => {
                            const updatedOptions = [...newField.dropdownOptions];
                            updatedOptions[index] = text;
                            setNewField({...newField, dropdownOptions: updatedOptions});
                          }}
                        />
                        <TouchableOpacity 
                          style={styles.deleteOptionButton}
                          onPress={() => {
                            if (newField.dropdownOptions.length > 1) {
                              const updatedOptions = newField.dropdownOptions.filter((_, i) => i !== index);
                              setNewField({...newField, dropdownOptions: updatedOptions});
                            }
                          }}
                        >
                          <Text style={styles.deleteOptionText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity 
                      style={styles.addOptionButton}
                      onPress={() => {
                        setNewField({...newField, dropdownOptions: [...newField.dropdownOptions, '']});
                      }}
                    >
                      <Text style={styles.addOptionText}>+ Add Option</Text>
                    </TouchableOpacity>
                  </>
                )}
                
                {newField.inputType === 'Date' && (
                  <>
                    <Text style={styles.fieldLabel}>Date Display Format</Text>
                    <Text style={styles.fieldDescription}>Choose how dates will appear in the form</Text>
                    <View style={styles.dateFormatDropdownContainer}>
                      <TouchableOpacity style={styles.drawerDropdown} onPress={() => setShowDateFormatDropdown(!showDateFormatDropdown)}>
                        <Text style={styles.drawerDropdownText}>
                          {newField.dateFormat === 'Month/Day/Year' ? 'MM/DD/YYYY (e.g., 12/25/2024)' : 'Full Timestamp (e.g., Dec 25, 2024 3:30 PM)'}
                        </Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                      </TouchableOpacity>
                      {showDateFormatDropdown && (
                        <View style={styles.dateFormatDropdownMenu}>
                          <TouchableOpacity
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewField({...newField, dateFormat: 'Month/Day/Year'});
                              setShowDateFormatDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>MM/DD/YYYY (e.g., 12/25/2024)</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewField({...newField, dateFormat: 'Timestamp'});
                              setShowDateFormatDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>Full Timestamp (e.g., Dec 25, 2024 3:30 PM)</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </>
                )}
                
                <View style={styles.labelWithAsterisk}>
                  <Text style={styles.fieldLabel}>Required *</Text>
                  {newField.required === 'Yes' && <Text style={styles.asterisk}>*</Text>}
                </View>
                <View style={styles.requiredDropdownContainer}>
                  <TouchableOpacity style={styles.drawerDropdown} onPress={() => setShowRequiredDropdown(!showRequiredDropdown)}>
                    <Text style={styles.drawerDropdownText}>{newField.required}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showRequiredDropdown && (
                    <View style={styles.requiredDropdownMenu}>
                      {requiredOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownOption}
                          onPress={() => {
                            setNewField({...newField, required: option});
                            setShowRequiredDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </ScrollView>
              
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  setNewField({ fieldName: '', inputType: 'Text', required: 'No', dropdownOptions: ['Biogesic', 'Paracetamol', 'Neozep'], dateFormat: 'Month/Day/Year' });
                  setEditingFieldId(null);
                  Animated.timing(slideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddFieldDrawer(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={async () => {
                  if (newField.fieldName.trim()) {
                    try {
                      const fieldType = newField.inputType === 'Veterinarian Dropdown' 
                        ? 'veterinarian_dropdown' 
                        : newField.inputType.toLowerCase().replace(' ', '_');
                      const fieldData = {
                        formName: selectedForm,
                        label: newField.fieldName,
                        type: fieldType,
                        required: newField.required === 'Yes'
                      };
                      
                      if (newField.inputType === 'Dropdown') {
                        fieldData.options = newField.dropdownOptions.filter(opt => opt.trim());
                      }
                      
                      if (newField.inputType === 'Date') {
                        fieldData.dateFormat = newField.dateFormat;
                      }
                      
                      if (editingFieldId) {
                        await updateFormField(editingFieldId, fieldData, userEmail);
                        setFormDetails(prevDetails => ({
                          ...prevDetails,
                          [selectedForm]: prevDetails[selectedForm].map(field => 
                            field.id === editingFieldId 
                              ? { ...field, ...fieldData, id: editingFieldId }
                              : field
                          )
                        }));
                      } else {
                        const savedField = await addFormField(fieldData, userEmail);
                        const newFieldObj = {
                          id: savedField.id,
                          label: newField.fieldName,
                          type: fieldType,
                          required: newField.required === 'Yes'
                        };
                        
                        if (newField.inputType === 'Dropdown') {
                          newFieldObj.options = newField.dropdownOptions.filter(opt => opt.trim());
                        }
                        
                        if (newField.inputType === 'Date') {
                          newFieldObj.dateFormat = newField.dateFormat;
                        }
                        
                        setFormDetails(prevDetails => ({
                          ...prevDetails,
                          [selectedForm]: [
                            ...(prevDetails[selectedForm] || []),
                            newFieldObj
                          ]
                        }));
                      }
                      
                      setNewField({ fieldName: '', inputType: 'Text', required: 'No', dropdownOptions: ['Biogesic', 'Paracetamol', 'Neozep'], dateFormat: 'Month/Day/Year' });
                      setEditingFieldId(null);
                      Animated.timing(slideAnim, {
                        toValue: -350,
                        duration: 200,
                        useNativeDriver: false,
                      }).start(() => setShowAddFieldDrawer(false));
                    } catch (error) {
                      console.error('Error saving field:', error);
                      alert('Error saving field');
                    }
                  }
                }}>
                  <Text style={styles.drawerSaveText}>{editingFieldId ? 'Update Field' : 'Add Field'}</Text>
                </TouchableOpacity>
              </View>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}
      
      {/* Edit Category Drawer */}
      {showEditCategoryDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: editSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Edit: {selectedCategoryDetail}</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(editSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowEditCategoryDrawer(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.drawerContent}>
                <Text style={styles.fieldLabel}>Category Name *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter category name"
                  value={editCategoryName}
                  onChangeText={setEditCategoryName}
                />
              </ScrollView>
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  Animated.timing(editSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowEditCategoryDrawer(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={() => {
                  if (editCategoryName.trim() && editCategoryName !== selectedCategoryDetail) {
                    // Update category in records
                    const updatedRecords = recordList.map(record => 
                      record.category === selectedCategoryDetail 
                        ? { ...record, category: editCategoryName }
                        : record
                    );
                    setRecordList(updatedRecords);
                    
                    // Update category in form templates
                    const updatedForms = medicalFormsList.map(form => 
                      form.category === selectedCategoryDetail 
                        ? { ...form, category: editCategoryName }
                        : form
                    );
                    setMedicalFormsList(updatedForms);
                    
                    setSelectedCategoryDetail(editCategoryName);
                    
                    Animated.timing(editSlideAnim, {
                      toValue: -350,
                      duration: 200,
                      useNativeDriver: false,
                    }).start(() => setShowEditCategoryDrawer(false));
                  }
                }}>
                  <Text style={styles.drawerSaveText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
      
      {/* Add Form Template Drawer */}
      {showAddFormDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addFormSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Form Template</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(addFormSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddFormDrawer(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Category *</Text>
                <View style={styles.categoryDropdownContainer}>
                  <TouchableOpacity style={styles.drawerDropdown} onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}>
                    <Text style={styles.drawerDropdownText}>{newFormTemplate.category}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showCategoryDropdown && (
                    <View style={styles.categoryDropdownMenu}>
                      <ScrollView style={styles.categoryDropdownScroll} showsVerticalScrollIndicator={false}>
                        {recordList.map((record) => (
                          <TouchableOpacity
                            key={record.id}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewFormTemplate({...newFormTemplate, category: record.category});
                              setShowCategoryDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{record.category}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Form Name *</Text>
                <TextInput
                  style={styles.drawerInput}
                  placeholder="Enter form template name"
                  value={newFormTemplate.formName}
                  onChangeText={(text) => setNewFormTemplate({...newFormTemplate, formName: text})}
                />
              </ScrollView>
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  Animated.timing(addFormSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddFormDrawer(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={async () => {
                  if (newFormTemplate.formName.trim()) {
                    try {
                      const formData = {
                        formName: newFormTemplate.formName,
                        category: newFormTemplate.category,
                        type: newFormTemplate.formName,
                        count: 0,
                        createdAt: new Date().toISOString()
                      };
                      
                      const savedForm = await addMedicalForm(formData, userEmail);
                      
                      const newForm = {
                        id: savedForm.id,
                        formName: newFormTemplate.formName,
                        category: newFormTemplate.category
                      };
                      setMedicalFormsList([...medicalFormsList, newForm]);
                      setFormDetails(prev => ({
                        ...prev,
                        [newFormTemplate.formName]: []
                      }));
                      
                      const categoryExists = recordList.some(record => record.category === newFormTemplate.category);
                      if (!categoryExists && newFormTemplate.category !== 'No Category') {
                        const categoryData = {
                          name: newFormTemplate.category,
                          description: `Category for ${newFormTemplate.category} forms`
                        };
                        const savedCategory = await addMedicalCategory(categoryData, userEmail);
                        const newCategory = {
                          id: savedCategory.id,
                          category: newFormTemplate.category,
                          formCount: 1
                        };
                        setRecordList([...recordList, newCategory]);
                      }
                      
                      setNewFormTemplate({ formName: '', category: 'No Category' });
                      Animated.timing(addFormSlideAnim, {
                        toValue: -350,
                        duration: 200,
                        useNativeDriver: false,
                      }).start(() => setShowAddFormDrawer(false));
                    } catch (error) {
                      console.error('Error adding form:', error);
                      alert('Error adding form template');
                    }
                  }
                }}>
                  <Text style={styles.drawerSaveText}>Save Template</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
      
      {/* Add Record Drawer */}
      {showAddRecordDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addRecordSlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Record</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(addRecordSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddRecordDrawer(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Category *</Text>
                <View style={styles.categoryDropdownContainer}>
                  <TouchableOpacity style={styles.drawerDropdown} onPress={() => {
                    setShowRecordCategoryDropdown(!showRecordCategoryDropdown);
                    setShowFormTemplateDropdown(false);
                  }}>
                    <Text style={styles.drawerDropdownText}>{newRecord.category}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showRecordCategoryDropdown && (
                    <View style={styles.categoryDropdownMenu}>
                      <ScrollView style={styles.categoryDropdownScroll} showsVerticalScrollIndicator={false}>
                        {recordList.map((record) => (
                          <TouchableOpacity
                            key={record.id}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewRecord({...newRecord, category: record.category, formTemplate: ''});
                              setShowRecordCategoryDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{record.category}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
                <Text style={styles.fieldLabel}>Form Template *</Text>
                <View style={styles.categoryDropdownContainer}>
                  <TouchableOpacity style={styles.drawerDropdown} onPress={() => {
                    setShowFormTemplateDropdown(!showFormTemplateDropdown);
                    setShowRecordCategoryDropdown(false);
                  }}>
                    <Text style={styles.drawerDropdownText}>{newRecord.formTemplate || 'Select form template'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showFormTemplateDropdown && (
                    <View style={styles.categoryDropdownMenu}>
                      <ScrollView style={styles.categoryDropdownScroll} showsVerticalScrollIndicator={false}>
                        {medicalFormsList
                          .filter(form => form.category === newRecord.category)
                          .sort((a, b) => a.formName.localeCompare(b.formName))
                          .map((form) => (
                          <TouchableOpacity
                            key={form.id}
                            style={styles.dropdownOption}
                            onPress={() => {
                              setNewRecord({...newRecord, formTemplate: form.formName});
                              setShowFormTemplateDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownOptionText}>{form.formName}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </ScrollView>
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  Animated.timing(addRecordSlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddRecordDrawer(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={async () => {
                  if (newRecord.category && newRecord.formTemplate) {
                    try {
                      const recordData = {
                        category: newRecord.category,
                        formTemplate: newRecord.formTemplate,
                        createdAt: new Date().toISOString(),
                        data: {}
                      };
                      
                      await addMedicalRecord(recordData, userEmail);
                      
                      setNewRecord({ category: 'No Category', formTemplate: '' });
                      Animated.timing(addRecordSlideAnim, {
                        toValue: -350,
                        duration: 200,
                        useNativeDriver: false,
                      }).start(() => setShowAddRecordDrawer(false));
                      
                      alert('Record added successfully!');
                    } catch (error) {
                      console.error('Error adding record:', error);
                      alert('Error adding record');
                    }
                  } else {
                    alert('Please select both category and form template');
                  }
                }}>
                  <Text style={styles.drawerSaveText}>Add Record</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
      
      {/* Add Category Drawer */}
      {showAddCategoryDrawer && (
        <Modal visible={true} transparent animationType="none">
          <View style={styles.drawerOverlay}>
            <Animated.View style={[styles.drawer, { left: addCategorySlideAnim }]}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Add New Category</Text>
                <TouchableOpacity style={styles.drawerCloseButton} onPress={() => {
                  Animated.timing(addCategorySlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddCategoryDrawer(false));
                }}>
                  <Text style={styles.drawerCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.drawerForm} showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Category Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter category name"
                  placeholderTextColor="#ccc"
                  value={newCategory.category}
                  onChangeText={(text) => setNewCategory({...newCategory, category: text})}
                />
              </ScrollView>
              <View style={styles.drawerButtons}>
                <TouchableOpacity style={styles.drawerCancelButton} onPress={() => {
                  Animated.timing(addCategorySlideAnim, {
                    toValue: -350,
                    duration: 200,
                    useNativeDriver: false,
                  }).start(() => setShowAddCategoryDrawer(false));
                }}>
                  <Text style={styles.drawerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.drawerSaveButton} onPress={handleAddRecord}>
                  <Text style={styles.drawerSaveText}>Save Category</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {selectedFormPreview && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.formPreviewModalOverlay}>
            <View style={styles.formPreviewModalContent}>
              <View style={styles.formPreviewHeader}>
                <TouchableOpacity style={styles.formPreviewBackButton} onPress={() => setSelectedFormPreview(null)}>
                  <Text style={styles.formPreviewBackText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.formPreviewHeaderTitle}>{selectedFormPreview.formName}</Text>
                <TouchableOpacity style={styles.formPreviewSaveHeaderButton} onPress={() => {
                  // Handle save record functionality
                  alert('Record saved successfully!');
                }}>
                  <Text style={styles.formPreviewSaveHeaderText}>Save Record</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.formPreviewBody} showsVerticalScrollIndicator={false}>
                <View style={styles.formPreviewDisplayArea}>
                  <View style={styles.formPreviewFieldsContainer}>
                  {(formDetails[selectedFormPreview.formName] || []).length === 0 ? (
                    <View style={styles.noFieldsContainer}>
                      <Text style={styles.noFieldsText}>No fields found for this form template</Text>
                      <Text style={styles.noFieldsSubText}>Add fields to this form template to start collecting data</Text>
                    </View>
                  ) : (
                    (formDetails[selectedFormPreview.formName] || []).map((field) => (
                    <View key={field.id} style={styles.formPreviewField}>
                      <Text style={styles.formPreviewFieldLabel}>
                        {field.label}{field.required && ' *'}
                      </Text>
                      {field.type === 'text' && (
                        <TextInput
                          style={styles.formPreviewFieldInput}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          placeholderTextColor="#ccc"
                        />
                      )}
                      {field.type === 'number' && (
                        <TextInput
                          style={styles.formPreviewFieldInput}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          placeholderTextColor="#ccc"
                          keyboardType="numeric"
                        />
                      )}
                      {field.type === 'textarea' && (
                        <TextInput
                          style={[styles.formPreviewFieldInput, styles.formPreviewTextareaInput]}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          placeholderTextColor="#ccc"
                          multiline
                          numberOfLines={3}
                        />
                      )}
                      {(field.type === 'dropdown' || field.type === 'veterinarian_dropdown') && (
                        <View style={styles.previewDropdownContainer}>
                          <TouchableOpacity 
                            style={styles.formPreviewFieldDropdown}
                            onPress={() => {
                              setPreviewDropdownStates(prev => ({
                                ...prev,
                                [field.id]: !prev[field.id]
                              }));
                            }}
                          >
                            <Text style={styles.formPreviewFieldDropdownText}>
                              {field.type === 'veterinarian_dropdown' ? 'Select Veterinarian' : 'Select Option'}
                            </Text>
                            <Text style={styles.dropdownArrow}>▼</Text>
                          </TouchableOpacity>
                          {previewDropdownStates[field.id] && (
                            <View style={styles.previewDropdownMenu}>
                              <ScrollView style={styles.previewDropdownScroll} showsVerticalScrollIndicator={false}>
                                {field.type === 'veterinarian_dropdown' ? (
                                  veterinarians.length > 0 ? veterinarians.map((vet) => (
                                    <TouchableOpacity
                                      key={vet.id}
                                      style={styles.dropdownOption}
                                      onPress={() => {
                                        setPreviewDropdownStates(prev => ({
                                          ...prev,
                                          [field.id]: false
                                        }));
                                      }}
                                    >
                                      <Text style={styles.dropdownOptionText}>{vet.name}</Text>
                                    </TouchableOpacity>
                                  )) : (
                                    <TouchableOpacity style={styles.dropdownOption}>
                                      <Text style={styles.dropdownOptionText}>No veterinarians available</Text>
                                    </TouchableOpacity>
                                  )
                                ) : (
                                  (field.options || []).map((option, index) => (
                                    <TouchableOpacity
                                      key={index}
                                      style={styles.dropdownOption}
                                      onPress={() => {
                                        setPreviewDropdownStates(prev => ({
                                          ...prev,
                                          [field.id]: false
                                        }));
                                      }}
                                    >
                                      <Text style={styles.dropdownOptionText}>{option}</Text>
                                    </TouchableOpacity>
                                  ))
                                )}
                              </ScrollView>
                            </View>
                          )}
                        </View>
                      )}
                      {field.type === 'date' && (
                        field.dateFormat === 'Timestamp' ? (
                          <TouchableOpacity style={styles.formPreviewFieldDatePicker}>
                            <Text style={styles.formPreviewFieldDateText}>{new Date().toLocaleString()}</Text>
                            <Text style={styles.dropdownArrow}>🕒</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity style={styles.formPreviewFieldDatePicker}>
                            <Text style={styles.formPreviewFieldDateText}>Select Date</Text>
                            <Text style={styles.dropdownArrow}>📅</Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  ))
                  )}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 20,
    marginTop: 0,
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
  recordAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23C062',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  recordAddButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  recordSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  recordSearchInput: {
    width: 150,
    fontSize: 12,
    outlineStyle: 'none',
  },
  content: {
    padding: 20,
    paddingBottom: 10,
    zIndex: 3000,
  },
  tableContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  table: {
    backgroundColor: '#fff',
    height: 350,
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
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  headerCellName: {
    flex: 2,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  cell: {
    flex: 1,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cellName: {
    flex: 2,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  dropdownContainer: {
    position: 'relative',
    zIndex: 2001,
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
  tableBody: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 270,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
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
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  modalForm: {
    padding: 20,
    maxHeight: 300,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  halfInput: {
    width: '48%',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  recordCancelButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  recordCancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#23C062',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  saveButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  medicalFormsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 30,
    zIndex: 1,
  },
  medicalFormsHeader: {
    paddingBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  medicalFormsHeaderText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#800000',
  },
  medicalFormsHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  formAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23C062',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  formAddButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  formSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  formSearchInput: {
    width: 150,
    fontSize: 12,
    outlineStyle: 'none',
  },
  medicalFormsContent: {
    flex: 1,
    paddingTop: 15,
  },
  medicalFormsTableContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  medicalFormsTable: {
    backgroundColor: '#fff',
    height: 250,
  },
  medicalFormsTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  medicalFormsTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  medicalFormsHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  medicalFormsHeaderCellName: {
    flex: 2,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  medicalFormsCell: {
    flex: 1,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  medicalFormsCellName: {
    flex: 2,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  medicalFormsTableBody: {
    flex: 1,
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
  medicalFormsPagination: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 20,
    paddingRight: 15,
  },
  medicalFormsPaginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formsDropdownContainer: {
    position: 'relative',
    zIndex: 1001,
  },
  formsDropdownMenu: {
    position: 'absolute',
    top: 0,
    left: 40,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    zIndex: 1002,
    minWidth: 35,
    elevation: 10,
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingLeft: 270,
  },
  detailModalContent: {
    flex: 1,
    marginTop: 20,
    marginRight: 20,
    marginBottom: 20,
    borderRadius: 15,
  },

  returnButton: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  formDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
    flex: 1,
    textAlign: 'center',
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23C062',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addFieldButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
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
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  formDetailSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  formDetailSearchInput: {
    width: 150,
    fontSize: 12,
    outlineStyle: 'none',
  },

  detailHeader: {
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  detailHeaderText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#800000',
  },
  detailHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
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
  detailContent: {
    flex: 1,
    padding: 20,
  },
  detailTableContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    flex: 1,
  },
  detailTable: {
    backgroundColor: '#fff',
    flex: 1,
  },
  detailTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  detailTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  detailCell: {
    flex: 1,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  detailHeaderCellName: {
    flex: 2,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  detailCellName: {
    flex: 2,
    textAlign: 'left',
    fontSize: 12,
    color: '#555',
    paddingRight: 10,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  detailTableBody: {
    flex: 1,
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
  drawerContent: {
    flex: 1,
    padding: 20,
    paddingBottom: 120,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  fieldDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  drawerInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  drawerDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  drawerDropdownText: {
    fontSize: 14,
    color: '#333',
  },
  drawerButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
    gap: 10,
  },
  labelWithAsterisk: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  asterisk: {
    color: '#ff0000',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
    marginTop: -2,
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
  drawerForm: {
    flex: 1,
    padding: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 12,
    backgroundColor: '#fafafa',
  },
  inputTypeDropdownContainer: {
    position: 'relative',
    zIndex: 2001,
  },
  inputTypeDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 2002,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    maxHeight: 200,
  },
  requiredDropdownContainer: {
    position: 'relative',
    zIndex: 1001,
  },
  requiredDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 1002,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  dateFormatDropdownContainer: {
    position: 'relative',
    zIndex: 1501,
  },
  dateFormatDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 1502,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  deleteOptionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addOptionButton: {
    backgroundColor: '#23C062',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  addOptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addFormContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 20,
  },
  addFormInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
    marginBottom: 15,
  },
  addFormButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  categoryDropdownContainer: {
    position: 'relative',
    zIndex: 3001,
  },
  addFormDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    marginBottom: 15,
  },
  addFormDropdownText: {
    fontSize: 14,
    color: '#333',
  },
  categoryDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 3002,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    maxHeight: 200,
  },
  categoryDropdownScroll: {
    maxHeight: 200,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editCategoryButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  editCategoryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteCategoryButton: {
    backgroundColor: '#dc3545',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  deleteCategoryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteFormButton: {
    backgroundColor: '#dc3545',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteFormButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  categoryInfo: {
    flex: 1,
    alignItems: 'center',
  },
  categoryFormCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  formDetailActions: {
    flexDirection: 'row',
    gap: 10,
  },
  previewFormButton: {
    backgroundColor: '#007BFF',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  previewFormButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
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
  formPreviewCategoryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
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
  formPreviewFieldInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    backgroundColor: '#fafafa',
    maxWidth: 300,
  },
  formPreviewFieldDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    maxWidth: 300,
  },
  formPreviewFieldDropdownText: {
    fontSize: 12,
    color: '#666',
  },
  formPreviewFieldDatePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    maxWidth: 300,
  },
  formPreviewFieldDateText: {
    fontSize: 12,
    color: '#666',
  },
  formPreviewTextareaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  previewDropdownContainer: {
    position: 'relative',
    zIndex: 1000000,
  },
  previewDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 1000000,
    elevation: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    maxHeight: 200,
    maxWidth: 300,
  },
  previewDropdownScroll: {
    maxHeight: 200,
  },
  noFieldsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    minHeight: 200,
  },
  noFieldsText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  noFieldsSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 300,
    width: 300,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  fieldActions: {
    flexDirection: 'row',
    gap: 5,
    marginLeft: 10,
  },
  editFieldButton: {
    backgroundColor: '#007bff',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  editFieldButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  deleteFieldButton: {
    backgroundColor: '#dc3545',
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  deleteFieldButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 10,
  },
});