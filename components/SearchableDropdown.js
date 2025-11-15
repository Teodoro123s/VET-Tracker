import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';

export default function SearchableDropdown({
  options,
  placeholder = 'Select option',
  onSelect,
  selectedValue,
  style,
  disabled = false,
  zIndex = 1000
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    const filtered = options.filter(option =>
      option.label.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchText, options]);

  const selectedOption = options.find(opt => opt.value === selectedValue);

  const handleSelect = (option) => {
    onSelect(option);
    setIsOpen(false);
    setSearchText('');
  };

  return (
    
       !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        
          {selectedOption ? selectedOption.label }
        
        ▼
      

      {isOpen && (
        
          
          
            {filteredOptions.length === 0 ? (
              
                No options found
              
            ) : (
              filteredOptions.map((option) => (
                 handleSelect(option)}
                >
                  {option.label}
                
              ))
            )}
          
        
      )}
    
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth,
    borderColor: '#ddd',
    borderRadius,
    padding,
    backgroundColor: '#fff',
  },
  disabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  dropdownText: {
    fontSize,
    color: '#333',
    flex,
  },
  arrow: {
    fontSize,
    color: '#666',
    fontWeight: 'bold',
  },
  dropdownMenu: {
    position: 'absolute',
    top,
    left,
    right,
    backgroundColor: '#fff',
    borderWidth,
    borderColor: '#ddd',
    borderRadius,
    elevation,
    shadowColor: '#000',
    shadowOffset: { width, height},
    shadowOpacity: 0.15,
    shadowRadius,
    maxHeight,
  },
  searchInput: {
    borderBottomWidth,
    borderBottomColor: '#eee',
    padding,
    fontSize,
    backgroundColor: '#f8f9fa',
  },
  optionsList: {
    maxHeight,
  },
  option: {
    paddingHorizontal,
    paddingVertical,
    borderBottomWidth,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize,
    color: '#333',
  },
  noResults: {
    padding,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize,
    color: '#999',
    fontStyle: 'italic',
  },
});