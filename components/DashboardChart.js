import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;
export default function DashboardChart({ 
  type, 
  data, 
  title, 
  width = screenWidth * 0.4, 
  height = 180,
  loading = false 
}) {
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(123, 42, 59, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#7B2A3B'
    }
  };

  const renderChart = () => {
    if (loading || !data) {
      return (
        
          
          
            {loading ? 'Loading...' : 'No Data'}
          
        
      );
    }

    try {
      switch (type) {
        case 'line':
          return (
            
          );
        case 'bar':
          return (
            
          );
        case 'pie':
          return (
            
          );
        default (
            
              Invalid Chart Type
            
          );
      }
    } catch (error) {
      console.error('Chart rendering error:', error);
      return (
        
          
          Chart Error
        
      );
    }
  };

  return (
    
      {title}
      
        {renderChart()}
      
    
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius,
    padding,
    shadowColor: '#000',
    shadowOffset: { width, height},
    shadowOpacity: 0.08,
    shadowRadius,
    elevation,
  },
  title: {
    fontSize,
    fontWeight: '700',
    color: '#111827',
    marginBottom,
    textAlign: 'center',
  },
  chartArea: {
    flex,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chart: {
    marginVertical,
    borderRadius,
  },
  chartPlaceholder: {
    flex,
    width: '100%',
    minHeight,
  },
  placeholderText: {
    fontSize,});