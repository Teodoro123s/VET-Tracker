# VET-Tracker Database Structure

## Root Collections

### `superadmins`
```
superadmins/
├── {docId}
    ├── email: "superadmin@system.com"
    ├── password: "super123"
    ├── name: "System Administrator"
    └── createdAt: timestamp
```

### `subscribers` (System-wide)
```
subscribers/
├── {subscriberId}
    ├── email: "admin@vetclinic.com"
    ├── clinicName: "Veterinary Clinic"
    ├── status: "Active"
    ├── expiryDate: "Jan 15, 2025"
    ├── amount: "₱7,499"
    ├── period: "1 month"
    ├── subscriptionCode: "SUB-VETCLINIC-2024"
    ├── accountCreated: "Jan 1, 2024"
    ├── lastLogin: "2024-01-20 10:30:00"
    ├── contactStatus: "Confirmed"
    ├── dataRetention: "Active"
    ├── username: "vetclinic_admin"
    └── password: "VetClinic2024!"
```

### `tenants` (Admin Credentials Only)
```
tenants/
├── {tenantId}
    ├── email: "admin@clinic.com"
    ├── password: "admin123"
    ├── role: "admin"
    ├── tenantId: "clinic1"
    ├── status: "active"
    └── createdAt: timestamp
```

### `admins` (Admin Profile Info)
```
admins/
├── {adminId}
    ├── email: "admin@clinic.com"
    ├── name: "Dr. Johnson"
    ├── clinicName: "Happy Pets Clinic"
    ├── phone: "555-0100"
    ├── address: "123 Clinic St"
    ├── licenseNumber: "VET-2024-001"
    ├── tenantId: "clinic1"
    ├── clinicId: "clinic_1"
    └── createdAt: timestamp
```

### `veterinarians` (Root Level)
```
veterinarians/
├── {vetId}
    ├── name: "Dr. Michael Smith"
    ├── specialization: "General Practice"
    ├── phone: "555-0101"
    ├── email: "michael.smith@vetclinic.com"
    ├── experience: "8 years"
    ├── clinicId: "clinic_1"
    ├── status: "Active"
    └── createdAt: timestamp
```

### `customers` (Root Level)
```
customers/
├── {customerId}
    ├── name: "Smith, John"
    ├── contact: "555-0123"
    ├── email: "john@email.com"
    ├── address: "123 Main St"
    ├── city: "Springfield"
    ├── clinicId: "clinic_1"
    └── createdAt: timestamp
```

### `pets` (Root Level)
```
pets/
├── {petId}
    ├── name: "Max"
    ├── type: "Dog"
    ├── breed: "Golden Retriever"
    ├── age: "3 years"
    ├── owner: "Smith, John"
    ├── ownerId: "cust_1"
    ├── weight: "65 lbs"
    ├── color: "Golden"
    ├── clinicId: "clinic_1"
    └── createdAt: timestamp
```

### `appointments` (Root Level)
```
appointments/
├── {appointmentId}
    ├── order: "A001"
    ├── customerName: "Smith, John"
    ├── petName: "Max"
    ├── service: "Checkup"
    ├── veterinarianId: "vet_1"
    ├── veterinarian: "Dr. Michael Smith"
    ├── dateTime: timestamp
    ├── status: "Pending|Completed|Cancelled"
    ├── notes: "Annual checkup"
    ├── clinicId: "clinic_1"
    └── createdAt: timestamp
```

### `transactions` (Root Level)
```
transactions/
├── {transactionId}
    ├── customerId: "cust_1"
    ├── customerName: "Smith, John"
    ├── amount: 150.00
    ├── service: "Checkup"
    ├── date: "2024-01-25"
    ├── status: "Completed"
    ├── paymentMethod: "Credit Card"
    ├── veterinarianId: "vet_1"
    ├── clinicId: "clinic_1"
    └── createdAt: timestamp
```

### `medicalForms` (Root Level)
```
medicalForms/
├── {formId}
    ├── type: "Dog Vaccination"
    ├── category: "Vaccination Records"
    ├── count: 5
    ├── lastUpdated: "Today"
    ├── template: "Standard vaccination form for dogs"
    ├── clinicId: "clinic_1"
    └── createdAt: timestamp
```

### `medicalCategories` (Root Level)
```
medicalCategories/
├── {categoryId}
    ├── name: "Vaccination Records"
    ├── description: "Pet vaccination history and schedules"
    ├── clinicId: "clinic_1"
    └── createdAt: timestamp
```

## Tenant-Specific Collections (When Used)
**Path:** `tenants/{tenantId}/{collection}`

### `medicalRecords`
```
tenants/{tenantId}/medicalRecords/
├── {recordId}
    ├── petId: "{petId}"
    ├── petName: "Fluffy"
    ├── category: "Vaccination"
    ├── formTemplate: "Vaccination Form"
    ├── formData: {
    │   ├── vaccine: "Rabies"
    │   ├── date: "2024-01-15"
    │   └── notes: "No adverse reactions"
    │   }
    ├── date: "2024-01-15"
    ├── diagnosis: "Healthy"
    ├── treatment: "Vaccination"
    └── notes: "Annual vaccination"
```

### `formFields`
```
tenants/{tenantId}/formFields/
├── {fieldId}
    ├── formName: "Vaccination Form"
    ├── label: "Vaccine Type"
    ├── type: "text"
    ├── required: true
    └── order: 1
```

### `reasonOptions`
```
tenants/{tenantId}/reasonOptions/
├── {reasonId}
    ├── text: "Annual Checkup"
    └── createdAt: timestamp
```

### `userCredentials`
```
tenants/{tenantId}/userCredentials/
├── {credId}
    ├── email: "vet@clinic.com"
    ├── currentPassword: "hashedPassword"
    ├── pendingPassword: "hashedNewPassword"
    ├── pendingPasswordExpiresAt: timestamp
    └── passwordResetToken: "token123"
```

### `animalTypes`
```
tenants/{tenantId}/animalTypes/
├── {typeId}
    ├── name: "Dog"
    ├── description: "Domestic dog species"
    └── createdAt: timestamp
```

### `breeds`
```
tenants/{tenantId}/breeds/
├── {breedId}
    ├── name: "Golden Retriever"
    ├── animalType: "Dog"
    └── createdAt: timestamp
```

### `staff`
```
tenants/{tenantId}/staff/
├── {staffId}
    ├── name: "Jane Doe"
    ├── role: "staff"
    ├── email: "jane@clinic.com"
    ├── phone: "555-0199"
    └── createdAt: timestamp
```

## Email System Collections

### `mail` (Firebase Extension)
```
mail/
├── {emailId}
    ├── to: ["recipient@email.com"]
    ├── message: {
    │   ├── subject: "Appointment Confirmation"
    │   ├── text: "Your appointment is confirmed"
    │   └── html: "<p>Your appointment is confirmed</p>"
    │   }
    └── delivery: {
        ├── state: "SUCCESS"
        └── info: {...}
        }
```

### `notifications`
```
notifications/
├── {notificationId}
    ├── type: "email_sent"
    ├── recipient: "customer@email.com"
    ├── subject: "Appointment Confirmation"
    ├── timestamp: timestamp
    └── status: "sent"
```

## Authentication Flow

1. **Superadmin:** `superadmins` collection (credentials + info)
2. **Admin Credentials:** `tenants` collection (login only)
3. **Admin Profile:** `admins` collection (profile info)
4. **Veterinarian:** `veterinarians` collection (credentials + info)
5. **Password System:** `tenants/{tenantId}/userCredentials`

## Key Relationships

- **Admin Credentials → Profile:** `tenants.email = admins.email`
- **Customer → Pets:** `pets.ownerId = customers.id`
- **Pet → Medical Records:** `medicalRecords.petId = pets.id`
- **Appointment → Customer:** `appointments.customerName = customers.name`
- **Clinic Isolation:** All data filtered by `clinicId`
- **Tenant System:** Mixed root-level and tenant-specific collections

## Database Architecture Notes

**Hybrid Structure:**
- **Root Collections:** Most data (customers, pets, appointments, veterinarians)
- **Tenant Collections:** Specialized data (medicalRecords, formFields, userCredentials)
- **Clinic Filtering:** Uses `clinicId` field for data isolation
- **Multi-tenant:** Supports multiple clinics in same database