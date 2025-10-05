// MAROON THEME PROTOCOL - Universal Design System for VET-Tracker
// This protocol ensures consistent maroon theming across all interfaces

export const MaroonThemeProtocol = {
  // Core Maroon Palette
  colors: {
    // Primary maroon variations
    maroon: {
      darkest: '#4A0012',    // SuperAdmin primary
      dark: '#5D0017',       // SuperAdmin secondary  
      primary: '#800020',    // Client primary
      light: '#A0002A',      // Veterinarian primary
      lighter: '#D4002F',    // Accent color
      pale: '#F5E6EA',       // Light backgrounds
      ghost: '#FDF7F8',      // Very light backgrounds
    },
    
    // Interface-specific assignments
    superadmin: {
      primary: '#4A0012',
      secondary: '#5D0017',
      accent: '#800020',
      background: '#FFFFFF',
      surface: '#FDF7F8',
    },
    
    client: {
      primary: '#800020',
      secondary: '#A0002A', 
      accent: '#D4002F',
      background: '#FFFFFF',
      surface: '#FFFFFF',
    },
    
    veterinarian: {
      primary: '#A0002A',
      secondary: '#D4002F',
      accent: '#800020',
      background: '#FFFFFF',
      surface: '#FDF7F8',
    },
    
    // Universal colors
    text: {
      primary: '#800020',
      secondary: '#A0002A',
      muted: '#718096',
      inverse: '#FFFFFF',
      dark: '#1A202C',
    },
    
    background: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#F5E6EA',
    
    // Status colors (maroon-tinted)
    status: {
      success: '#10B981',
      warning: '#F59E0B', 
      error: '#DC2626',
      info: '#800020',
    }
  },

  // Component Styles Protocol
  components: {
    // Button styles
    button: {
      primary: {
        backgroundColor: '#800020',
        color: '#FFFFFF',
        borderColor: '#800020',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
      },
      secondary: {
        backgroundColor: '#FFFFFF',
        color: '#800020',
        borderColor: '#800020',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
      },
      disabled: {
        backgroundColor: '#E5E7EB',
        color: '#9CA3AF',
        borderColor: '#E5E7EB',
      }
    },

    // Sidebar styles
    sidebar: {
      container: {
        backgroundColor: '#800020',
        borderRightColor: '#A0002A',
        borderRightWidth: 1,
      },
      item: {
        borderBottomColor: '#A0002A',
        borderBottomWidth: 1,
      },
      text: {
        color: '#FFFFFF',
      },
      hover: {
        backgroundColor: '#A0002A',
      }
    },

    // Header styles  
    header: {
      container: {
        backgroundColor: '#FFFFFF',
        borderBottomColor: '#F5E6EA',
        borderBottomWidth: 1,
      },
      text: {
        color: '#800020',
      }
    },

    // Card styles
    card: {
      container: {
        backgroundColor: '#FFFFFF',
        borderColor: '#F5E6EA',
        borderWidth: 1,
        borderRadius: 12,
        shadowColor: '#800020',
        shadowOpacity: 0.1,
      }
    },

    // Input styles
    input: {
      container: {
        backgroundColor: '#FFFFFF',
        borderColor: '#F5E6EA',
        borderWidth: 1,
        borderRadius: 8,
      },
      focused: {
        borderColor: '#800020',
        borderWidth: 2,
      },
      text: {
        color: '#1A202C',
      },
      placeholder: {
        color: '#718096',
      }
    }
  },

  // Interface-specific overrides
  interfaces: {
    superadmin: {
      sidebar: {
        backgroundColor: '#4A0012',
        borderColor: '#5D0017',
      },
      primary: '#4A0012',
      secondary: '#5D0017',
    },
    
    client: {
      sidebar: {
        backgroundColor: '#800020', 
        borderColor: '#A0002A',
      },
      primary: '#800020',
      secondary: '#A0002A',
    },
    
    veterinarian: {
      sidebar: {
        backgroundColor: '#A0002A',
        borderColor: '#D4002F', 
      },
      primary: '#A0002A',
      secondary: '#D4002F',
    }
  }
};

// Helper function to get interface-specific colors
export const getInterfaceColors = (interfaceType: 'superadmin' | 'client' | 'veterinarian') => {
  return MaroonThemeProtocol.colors[interfaceType];
};

// Helper function to get component styles
export const getComponentStyle = (component: string, variant: string = 'primary') => {
  return MaroonThemeProtocol.components[component]?.[variant] || {};
};

export default MaroonThemeProtocol;