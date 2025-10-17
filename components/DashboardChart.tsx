import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

interface DashboardChartProps {
  type: 'line' | 'bar' | 'pie';
  data: any;
  title: string;
  width?: number;
  height?: number;
  loading?: boolean;
}

export default function DashboardChart({ 
  type, 
  data, 
  title, 
  width = screenWidth * 0.4, 
  height = 180,
  loading = false 
}: DashboardChartProps) {
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
        <View style={styles.chartPlaceholder}>
          <Ionicons 
            name={type === 'line' ? 'trending-up' : type === 'bar' ? 'bar-chart' : 'pie-chart'} 
            size={32} 
            color="#7B2A3B" 
          />
          <Text style={styles.placeholderText}>
            {loading ? 'Loading...' : 'No Data'}
          </Text>
        </View>
      );
    }

    try {
      switch (type) {
        case 'line':
          return (
            <LineChart
              data={data}
              width={width}
              height={height}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          );
        case 'bar':
          return (
            <BarChart
              data={data}
              width={width}
              height={height}
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          );
        case 'pie':
          return (
            <PieChart
              data={data}
              width={width}
              height={height}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 10]}
              absolute
            />
          );
        default:
          return (
            <View style={styles.chartPlaceholder}>
              <Text style={styles.placeholderText}>Invalid Chart Type</Text>
            </View>
          );
      }
    } catch (error) {
      console.error('Chart rendering error:', error);
      return (
        <View style={styles.chartPlaceholder}>
          <Ionicons name="alert-circle" size={32} color="#EF4444" />
          <Text style={styles.placeholderText}>Chart Error</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartArea}>
        {renderChart()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    width: '100%',
    minHeight: 120,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B2A3B',
    marginTop: 8,
  },
});