# Vet Clinic Management System - Technical Documentation

## Project Overview
A comprehensive React Native veterinary clinic management application built with Expo Router, featuring customer management, appointment scheduling, veterinarian profiles, and medical records system.

## Architecture & Structure

### Core Layout
- **Root Layout** (`app/_layout.tsx`): Main application wrapper with sidebar navigation
- **Sidebar Navigation** (`components/Sidebar.tsx`): Fixed left navigation panel
- **Screen-based Routing**: Expo Router file-based navigation system

## Module Documentation

### 1. Customers Module (`app/customers.tsx`)

#### Features
- **Dual View System**: List view ↔ Detail view with conditional rendering
- **Customer Management**: Add, view, edit customer information
- **Pet Management**: View and manage customer pets with search functionality
- **Responsive Tables**: Pagination, search filters, clickable rows

#### Key Components
```typescript
// State Management
const [selectedCustomer, setSelectedCustomer] = useState(null);
const [searchTerm, setSearchTerm] = useState('');
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);

// Data Structure
customers: { id, name, pets, contact, email, address }
customerPets: { [customerId]: [{ id, name, type, breed, age }] }
```

#### UI Patterns
- **Header**: Title + Add Button + Search Filter
- **Table**: ID | Name | Pets | Contact | Email (clickable rows)
- **Detail View**: Field/Value table + Pets section with ScrollView
- **Modal Forms**: Add customer with validation

### 2. Appointments Module (`app/appointments.tsx`)

#### Features
- **Status Management**: All, Pending, Approved, Due, Completed, Cancelled
- **Action Dropdowns**: Status-specific actions (Approve, Reschedule, Complete, etc.)
- **Responsive Design**: Pagination with ScrollView for large datasets

#### Key Components
```typescript
// Status System
const statusFilters = ['All', 'Pending', 'Approved', 'Due', 'Completed', 'Cancelled'];
const [activeFilter, setActiveFilter] = useState('All');

// Dropdown Actions
const getActionButtons = (status) => {
  // Returns different actions based on appointment status
}
```

#### UI Patterns
- **Filter Tabs**: Horizontal status filter buttons
- **Action Dropdowns**: External positioning (zIndex: 1001-1002)
- **Table Structure**: Date | Time | Customer | Pet | Veterinarian | Status | Actions

### 3. Veterinarians Module (`app/veterinarians.tsx`)

#### Features
- **Profile Management**: View and edit veterinarian details
- **Modal System**: Detail modal + Edit drawer (slide from left)
- **Professional Display**: "Dr." prefix, specializations, experience

#### Key Components
```typescript
// Modal & Drawer States
const [selectedVet, setSelectedVet] = useState(null);
const [showEditDrawer, setShowEditDrawer] = useState(false);
const [drawerAnimation] = useState(new Animated.Value(-350));

// Animation System
const slideIn = () => {
  Animated.timing(drawerAnimation, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  }).start();
};
```

### 4. Medical Records Module (`app/records.tsx`)

#### Features
- **Dual Structure**: Categories ↔ Form Templates
- **Dynamic Forms**: Add fields (Text/Number/Date) to templates
- **Category Management**: Organize forms by medical categories

#### Key Components
```typescript
// Dual Table System
const [activeTable, setActiveTable] = useState('categories');
const [selectedCategory, setSelectedCategory] = useState(null);

// Form Builder
const [formDetails, setFormDetails] = useState({});
const addField = (type) => {
  // Dynamically adds form fields
}
```

#### UI Patterns
- **Tab System**: Categories ↔ Form Templates toggle
- **Add Field Drawer**: Slide animation from left (-350px to 0px)
- **Field Types**: Text Input, Number Input, Date Picker

## Design System & Standards

### Button Standardization
All buttons follow appointments page standard:
```typescript
buttonStyle: {
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 5,
  fontSize: 12
}
```

### Color Scheme
- **Primary**: `#800000` (Maroon)
- **Success**: `#23C062` (Green)
- **Info**: `#007BFF` (Blue)
- **Background**: `#f8f9fa` (Light Gray)

### Dropdown Pattern (Efficient Implementation)
```typescript
dropdownMenu: {
  position: 'absolute',
  top: 0,
  left: 40,
  zIndex: 1002,
  minWidth: 35,
  elevation: 10,
  backgroundColor: '#fff'
}
```

### Table Responsive Design
- **ScrollView Trigger**: When `itemsPerPage >= 20`
- **Fixed Heights**: `height: 390px` for consistent layout
- **Column Flex**: ID (width: 50), Name (flex: 2), Others (flex: 1)

## State Management Patterns

### Conditional Rendering
```typescript
// View Replacement Pattern
{!selectedItem ? <ListView/> : <DetailView/>}

// Modal vs Inline Display
{showModal && <Modal/>}
```

### Search & Pagination
```typescript
// Unified Pattern Across All Modules
const filteredData = data.filter(item =>
  item.name.toLowerCase().includes(searchTerm.toLowerCase())
);
const totalPages = Math.ceil(filteredData.length / itemsPerPage);
const currentData = filteredData.slice(startIndex, endIndex);
```

## File Structure
```
MyApp/
├── app/
│   ├── _layout.tsx          # Root layout with sidebar
│   ├── customers.tsx        # Customer management
│   ├── appointments.tsx     # Appointment scheduling
│   ├── veterinarians.tsx    # Veterinarian profiles
│   ├── records.tsx          # Medical records system
│   └── [other screens]
├── components/
│   └── Sidebar.tsx          # Navigation sidebar
└── assets/
    ├── ic_round-plus.png    # Add button icon
    └── material-symbols_search-rounded.png # Search icon
```

## Data Models

### Customer
```typescript
interface Customer {
  id: number;
  name: string;        // "Surname, Firstname Middlename"
  pets: number;
  contact: string;
  email: string;
  address?: string;
}
```

### Pet
```typescript
interface Pet {
  id: number;
  name: string;
  type: string;        // Dog, Cat, etc.
  breed: string;
  age: string;         // "X years"
}
```

### Appointment
```typescript
interface Appointment {
  id: number;
  date: string;        // "Today", "Tomorrow", "Jan 15"
  time: string;        // "10:00 AM"
  customer: string;
  pet: string;
  veterinarian: string; // "Dr. LastName"
  status: 'Pending' | 'Approved' | 'Due' | 'Completed' | 'Cancelled';
}
```

### Veterinarian
```typescript
interface Veterinarian {
  id: number;
  name: string;        // "Dr. Surname, Firstname"
  specialization: string;
  experience: string;  // "X years"
  contact: string;
  email: string;
}
```

## Key Implementation Notes

### Style Naming Convention
- Prefix all styles with module name to prevent conflicts
- Example: `appointmentAddButton`, `customerSearchContainer`, `vetTableRow`

### Modal Positioning
- Use `paddingLeft: 250px` to avoid sidebar overlap
- Consistent modal sizing: `width: '70%'`, `maxHeight: '80%'`

### Animation Implementation
- Use `Animated.Value` for smooth transitions
- Standard slide duration: `300ms`
- Transform animations for drawer components

### Error Prevention
- Remove `overflow: 'hidden'` from table containers for dropdown visibility
- Use `useState` for form state management to ensure re-rendering
- Proper JSX syntax validation to prevent compilation errors

## Performance Optimizations

### Efficient Rendering
- Conditional ScrollView based on data size
- Pagination to limit DOM elements
- Memoized filter functions for search

### Memory Management
- Proper cleanup of animation listeners
- State reset on component unmount
- Optimized re-renders with dependency arrays

## Future Enhancement Areas

1. **Data Persistence**: Integrate with backend API or local storage
2. **Authentication**: User login and role-based access
3. **Real-time Updates**: WebSocket integration for live data
4. **Mobile Responsiveness**: Enhanced mobile UI/UX
5. **Reporting**: Analytics and report generation
6. **Notifications**: Push notifications for appointments
7. **File Management**: Document and image uploads
8. **Backup System**: Data backup and recovery features

## Development Guidelines

### Code Standards
- Use TypeScript for type safety
- Follow React Native best practices
- Maintain consistent naming conventions
- Document complex logic with comments

### Testing Strategy
- Unit tests for utility functions
- Integration tests for user workflows
- UI testing for responsive design
- Performance testing for large datasets

### Deployment Considerations
- Environment configuration management
- Build optimization for production
- Asset optimization and compression
- Platform-specific configurations (iOS/Android)