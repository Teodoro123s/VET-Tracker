# MAROON THEME PROTOCOL - VET-TRACKER DESIGN SYSTEM

## Overview
This document establishes the unified maroon theme protocol for all VET-Tracker interfaces, ensuring consistent visual identity across SuperAdmin, Client, and Veterinarian platforms.

## Color Palette

### Primary Maroon Variations
```typescript
maroon: {
  darkest: '#4A0012',    // SuperAdmin primary
  dark: '#5D0017',       // SuperAdmin secondary  
  primary: '#800020',    // Client primary
  light: '#A0002A',      // Veterinarian primary
  lighter: '#D4002F',    // Accent color
  pale: '#F5E6EA',       // Light backgrounds
  ghost: '#FDF7F8',      // Very light backgrounds
}
```

## Interface-Specific Color Assignments

### SuperAdmin Interface
- **Primary**: `#4A0012` (Darkest maroon)
- **Secondary**: `#5D0017` (Dark maroon)
- **Usage**: Sidebar, primary buttons, headers
- **Authority Level**: Highest (darkest shade)

### Client Interface  
- **Primary**: `#800020` (Primary maroon)
- **Secondary**: `#A0002A` (Light maroon)
- **Usage**: Sidebar, primary buttons, headers
- **Authority Level**: Medium (standard maroon)

### Veterinarian Interface
- **Primary**: `#A0002A` (Light maroon)
- **Secondary**: `#D4002F` (Lighter maroon)
- **Usage**: Mobile interface, buttons, headers
- **Authority Level**: Standard (lighter shade)

## Component Implementation

### Sidebars
```typescript
// SuperAdmin Sidebar
backgroundColor: MaroonThemeProtocol.colors.superadmin.primary    // #4A0012
borderColor: MaroonThemeProtocol.colors.superadmin.secondary      // #5D0017

// Client Sidebar  
backgroundColor: MaroonThemeProtocol.colors.client.primary        // #800020
borderColor: MaroonThemeProtocol.colors.client.secondary          // #A0002A

// Veterinarian Sidebar
backgroundColor: MaroonThemeProtocol.colors.veterinarian.primary  // #A0002A
borderColor: MaroonThemeProtocol.colors.veterinarian.secondary    // #D4002F
```

### Buttons
```typescript
// Primary Button (All Interfaces)
backgroundColor: '#800020'
color: '#FFFFFF'
borderColor: '#800020'

// Secondary Button (All Interfaces)
backgroundColor: '#FFFFFF'
color: '#800020'
borderColor: '#800020'
```

### Text Colors
```typescript
text: {
  primary: '#800020',    // Maroon text
  secondary: '#A0002A',  // Light maroon text
  muted: '#718096',      // Gray text
  inverse: '#FFFFFF',    // White text
  dark: '#1A202C',       // Dark gray
}
```

## Implementation Files

### Core Theme Files
- `constants/MaroonTheme.ts` - Main theme protocol
- `constants/Colors.ts` - Updated color constants
- `constants/Typography.ts` - Typography with theme exports

### Component Updates
- `components/SuperAdminSidebar.tsx` - Darkest maroon theme
- `components/Sidebar.tsx` - Client maroon theme  
- `components/VetSidebar.tsx` - Light maroon theme
- `components/LoginWeb.tsx` - Unified maroon login
- `components/LoginMobile.tsx` - Unified maroon login

## Usage Guidelines

### Import Theme Protocol
```typescript
import { MaroonThemeProtocol } from '@/constants/Typography';
```

### Apply Interface Colors
```typescript
// Get interface-specific colors
const colors = MaroonThemeProtocol.colors.client;
backgroundColor: colors.primary
```

### Component Styling
```typescript
// Use predefined component styles
const buttonStyle = MaroonThemeProtocol.components.button.primary;
```

## Visual Hierarchy

1. **SuperAdmin** - Darkest maroon (`#4A0012`) - Highest authority
2. **Client** - Primary maroon (`#800020`) - Administrative authority  
3. **Veterinarian** - Light maroon (`#A0002A`) - Operational authority

## Benefits

✅ **Unified Visual Identity** - Consistent maroon branding across all interfaces
✅ **Clear Authority Levels** - Color intensity indicates user privilege level
✅ **Maintainable Code** - Centralized theme management
✅ **Scalable Design** - Easy to extend for new interfaces
✅ **Professional Appearance** - Cohesive veterinary clinic branding

## Implementation Status

- ✅ MaroonTheme protocol created
- ✅ SuperAdminSidebar updated
- ✅ Client Sidebar updated  
- ✅ VetSidebar created
- ✅ Color constants updated
- 🔄 Login components (in progress)
- 🔄 Dashboard components (pending)
- 🔄 Form components (pending)

This protocol ensures all VET-Tracker interfaces maintain consistent maroon theming while providing visual distinction between user roles and authority levels.