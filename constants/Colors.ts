// MAROON THEME PROTOCOL - Universal Design System
export const Colors = {
  // Primary maroon palette
  primary: '#800020',      // Primary maroon
  secondary: '#A0002A',    // Light maroon
  accent: '#D4002F',       // Lighter maroon
  
  // Background colors
  background: '#FFFFFF',   // Pure white
  surface: '#FFFFFF',      // Pure white
  card: '#FFFFFF',         // Pure white
  
  // Maroon variations
  maroon: {
    dark: '#5D0017',       // Dark maroon (SuperAdmin)
    primary: '#800020',    // Primary maroon (Client)
    light: '#A0002A',      // Light maroon (Veterinarian)
    lighter: '#D4002F',    // Lighter maroon
    pale: '#F5E6EA',       // Very light maroon
  },
  
  // Text colors
  text: {
    primary: '#800020',    // Maroon text
    secondary: '#A0002A',  // Light maroon text
    muted: '#718096',      // Gray text
    inverse: '#FFFFFF',    // White text
    dark: '#1A202C',       // Dark gray
  },
  
  // Border colors
  border: {
    light: '#F5E6EA',     // Light maroon border
    medium: '#D4002F',    // Medium maroon border
    dark: '#800020',      // Dark maroon border
  },
  
  // Status colors
  status: {
    success: '#10B981',   // Green
    warning: '#F59E0B',   // Orange
    error: '#DC2626',     // Maroon-tinted red
    info: '#800020',      // Maroon info
  },
  
  // Interactive states
  interactive: {
    hover: '#F5E6EA',     // Light maroon hover
    pressed: '#D4002F',   // Maroon pressed
    disabled: '#E5E7EB',  // Gray disabled
  },
  
  // Interface-specific colors
  interfaces: {
    superadmin: {
      primary: '#5D0017',   // Dark maroon
      secondary: '#800020', // Primary maroon
      background: '#FFFFFF',
    },
    client: {
      primary: '#800020',   // Primary maroon
      secondary: '#A0002A', // Light maroon
      background: '#FFFFFF',
    },
    veterinarian: {
      primary: '#A0002A',   // Light maroon
      secondary: '#D4002F', // Lighter maroon
      background: '#FFFFFF',
    }
  }
};

// Maroon Theme Protocol Components
export const MaroonTheme = {
  button: {
    primary: {
      backgroundColor: '#800020',
      color: '#FFFFFF',
      borderColor: '#800020',
    },
    secondary: {
      backgroundColor: '#FFFFFF',
      color: '#800020',
      borderColor: '#800020',
    }
  },
  
  sidebar: {
    background: '#800020',
    text: '#FFFFFF',
    border: '#A0002A',
  },
  
  header: {
    background: '#FFFFFF',
    text: '#800020',
    border: '#F5E6EA',
  }
};