import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';

interface Option {
  id: string | number;
  label: string;
  value: any;
}

interface SearchableDropdownProps {
  options: Option[];
  placeholder?: string;
  onSelect: (option: Option) => void;
  selectedValue?: any;
  style?: any;
  disabled?: boolean;
  zIndex?: number;
}

export default function SearchableDropdown({
  options,
  placeholder = 'Select option',
  onSelect,
  selectedValue,
  style,
  disabled = false,
  zIndex = 1000
}: SearchableDropdownProps) {
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

  const handleSelect = (option: Option) => {
    onSelect(option);
    setIsOpen(false);
    setSearchText('');
  };

  return (
    <View style={[styles.container, { zIndex }, style]}>
      <TouchableOpacity
        style={[styles.dropdown, disabled && styles.disabled]}
        onPress={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <Text style={styles.dropdownText}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.dropdownMenu, { zIndex: zIndex + 1 }]}>
          <TextInput
            style={styles.searchInput}
            placeholder="Type to search..."
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
          />
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {filteredOptions.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No options found</Text>
              </View>
            ) : (
              filteredOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.option}
                  onPress={() => handleSelect(option)}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
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
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  disabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  dropdownText: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  arrow: {
    fontSize: 8,
    color: '#666',
    fontWeight: 'bold',
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
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    maxHeight: 200,
  },
  searchInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 10,
    fontSize: 12,
    backgroundColor: '#f8f9fa',
  },
  optionsList: {
    maxHeight: 150,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 12,
    color: '#333',
  },
  noResults: {
    padding: 15,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});