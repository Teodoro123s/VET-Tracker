# Species & Breeds Database System

## Overview

The VET-Tracker application now uses a database-driven system for managing species and breeds data, allowing both administrators and veterinarians to add custom entries specific to their clinic's needs.

## Key Features

- **Database Storage**: Species and breeds are stored in Firestore with tenant isolation
- **Role-Based Access**: Both admins and veterinarians can add/edit species and breeds
- **Fallback System**: Static data is used as fallback when database is unavailable
- **Real-time Updates**: Changes are immediately available across the application
- **Migration Support**: Existing clinics can migrate from static to database data

## Architecture

### Database Structure

```
tenants/{tenantId}/
├── animalTypes/          # Species collection
│   ├── {speciesId}
│   │   ├── name: string
│   │   ├── createdAt: string
│   │   ├── createdBy: string
│   │   └── isDefault: boolean
│   └── ...
└── breeds/               # Breeds collection
    ├── {breedId}
    │   ├── name: string
    │   ├── speciesId: string
    │   ├── speciesName: string
    │   ├── createdAt: string
    │   ├── createdBy: string
    │   └── isDefault: boolean
    └── ...
```

### Services

#### `speciesBreedsService.ts`
- `getSpecies(userEmail)` - Get all species for tenant
- `addSpecies(data, userEmail)` - Add new species
- `updateSpecies(id, data, userEmail)` - Update species
- `deleteSpecies(id, userEmail)` - Delete species
- `getBreeds(userEmail)` - Get all breeds for tenant
- `getBreedsBySpecies(userEmail, speciesId)` - Get breeds for specific species
- `addBreed(data, userEmail)` - Add new breed
- `updateBreed(id, data, userEmail)` - Update breed
- `deleteBreed(id, userEmail)` - Delete breed
- `getSpeciesWithBreeds(userEmail)` - Get species with their breeds
- `canManageSpeciesBreeds(userEmail)` - Check permissions

### Components

#### `SpeciesBreedsManager.tsx`
Full-featured modal component for managing species and breeds:
- Tab-based interface (Species/Breeds)
- Add new entries with validation
- List existing entries
- Role-based access control

#### `QuickAddSpeciesBreed.tsx`
Compact button component for quick access:
- Small footprint for embedding in forms
- Opens full manager modal
- Automatic data refresh callback

### Hooks

#### `useSpeciesBreeds.ts`
Custom hook for data management:
- Automatic data loading
- Fallback to static data
- Helper functions for filtering
- Loading and error states
- Refresh functionality

## Usage Examples

### Basic Data Fetching
```typescript
import { useSpeciesBreeds } from '@/hooks/useSpeciesBreeds';

function MyComponent() {
  const { species, breeds, loading, error } = useSpeciesBreeds(userEmail);
  
  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;
  
  return (
    <View>
      {species.map(species => (
        <Text key={species.id}>{species.name}</Text>
      ))}
    </View>
  );
}
```

### Adding Management Interface
```typescript
import SpeciesBreedsManager from '@/components/SpeciesBreedsManager';

function AdminPanel() {
  const [showManager, setShowManager] = useState(false);
  
  return (
    <View>
      <TouchableOpacity onPress={() => setShowManager(true)}>
        <Text>Manage Species & Breeds</Text>
      </TouchableOpacity>
      
      <SpeciesBreedsManager
        userEmail={userEmail}
        visible={showManager}
        onClose={() => setShowManager(false)}
      />
    </View>
  );
}
```

### Quick Add Button
```typescript
import QuickAddSpeciesBreed from '@/components/QuickAddSpeciesBreed';

function PetForm() {
  const { refresh } = useSpeciesBreeds(userEmail);
  
  return (
    <View>
      <Text>Pet Species:</Text>
      <QuickAddSpeciesBreed 
        userEmail={userEmail}
        onDataUpdated={refresh}
      />
      {/* Your form fields */}
    </View>
  );
}
```

## Migration

### For New Tenants
New tenants automatically get default species and breeds data populated when their account is created.

### For Existing Tenants
Run the migration script to populate database with default data:

```bash
# Migrate all tenants
node scripts/migrate-species-breeds.js

# Migrate specific tenant
node scripts/migrate-species-breeds.js TENANT_ID
```

### Migration Script Features
- Checks for existing data to avoid duplicates
- Populates default species and breeds
- Marks migrated data with `isDefault: true`
- Logs progress and errors

## Permissions

### Who Can Manage Species/Breeds
- **Clinic Administrators**: Full access to add, edit, delete
- **Veterinarians**: Full access to add, edit, delete
- **SuperAdmins**: No access (system-level role)

### Permission Check
```typescript
import { canManageSpeciesBreeds } from '@/lib/services/speciesBreedsService';

const canManage = canManageSpeciesBreeds(userEmail);
if (canManage) {
  // Show management interface
}
```

## Fallback System

The system includes multiple fallback layers:

1. **Primary**: Database data for the tenant
2. **Secondary**: Static data from constants file
3. **Error Handling**: Graceful degradation with user notification

### Fallback Triggers
- Database connection issues
- Missing tenant data
- Service errors
- No user authentication

## Best Practices

### For Developers
1. Always use the `useSpeciesBreeds` hook for data access
2. Include fallback handling in components
3. Use `QuickAddSpeciesBreed` in forms where users might need new options
4. Test with both database and fallback data

### For Users
1. Add species before adding breeds
2. Use descriptive names for custom entries
3. Avoid duplicating existing entries
4. Consider other users when adding clinic-wide data

## Troubleshooting

### Common Issues

**Data not loading**
- Check user authentication
- Verify tenant ID resolution
- Check network connectivity
- Review Firestore permissions

**Permission denied**
- Verify user role (not superadmin)
- Check tenant association
- Validate user email format

**Migration issues**
- Ensure Firebase config is correct
- Check Firestore rules
- Verify tenant collection exists

### Debug Tools

Enable debug logging:
```typescript
// In your component
console.log('Species data:', species);
console.log('User can manage:', canManageSpeciesBreeds(userEmail));
```

## Future Enhancements

- Bulk import/export functionality
- Species/breed categories and tags
- Image support for species/breeds
- Usage analytics and recommendations
- Cross-tenant sharing of common entries
- API endpoints for external integrations