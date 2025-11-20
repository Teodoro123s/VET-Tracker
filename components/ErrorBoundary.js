import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError, error };
  }

  componentDidCatch(error, errorInfo) {
    // Ignore IOException and update-related errors
    if (error.message?.includes('IOException') || 
        error.message?.includes('Failed to download') ||
        error.message?.includes('remote update')) {
      console.log('Ignoring update-related error:', error.message);
      this.setState({ hasError });
      return;
    }
    
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && 
        !this.state.error?.message?.includes('IOException') &&
        !this.state.error?.message?.includes('Failed to download')) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>Please restart the app</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex,
    justifyContent: 'center',
    alignItems: 'center',
    padding,
  },
  title: {
    fontSize,
    fontWeight: 'bold',
    marginBottom,
  },
  message: {
    fontSize,
    textAlign: 'center',
  },
});
