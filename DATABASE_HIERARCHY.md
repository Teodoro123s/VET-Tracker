# VET-Tracker Database Hierarchy

## Hierarchical Structure

```
superadmins/
├── {superadminId}
    ├── email: "superadmin@system.com"
    ├── password: "super123"
    ├── name: "System Administrator"
    ├── createdAt: timestamp
    ├── subscriptions/
    │   └── {subscriptionId}
    │       ├── clinicName: "Veterinary Clinic"
    │       ├── status: "Active"
    │       ├── expiryDate: "Jan 15, 2025"
    │       ├── amount: "₱7,499"
    │       ├── period: "1 month"
    │       └── subscriptionCode: "SUB-VETCLINIC-2024"
    └── tenants/
        └── {tenantId}
            ├── email: "admin@clinic.com"
            ├── password: "admin123"
            ├── role: "admin"
            ├── status: "active"
            ├── createdAt: timestamp
            ├── admins/
            │   └── {adminId}
            │       ├── name: "Dr. Johnson"
            │       ├── clinicName: "Happy Pets Clinic"
            │       ├── phone: "555-0100"
            │       ├── address: "123 Clinic St"
            │       ├── licenseNumber: "VET-2024-001"
            │       └── veterinarians/
            │           └── {vetId}
            │               ├── name: "Dr. Michael Smith"
            │               ├── specialization: "General Practice"
            │               ├── phone: "555-0101"
            │               ├── email: "michael.smith@vetclinic.com"
            │               ├── password: "vet123"
            │               ├── experience: "8 years"
            │               ├── role: "veterinarian"
            │               ├── mobileAccess: true
            │               └── assignedBy: "admin_1"
            ├── customers/
            │   └── {customerId}
            │       ├── name: "Smith, John"
            │       ├── contact: "555-0123"
            │       ├── email: "john@email.com"
            │       ├── address: "123 Main St"
            │       └── city: "Springfield"
            ├── pets/
            │   └── {petId}
            │       ├── name: "Max"
            │       ├── type: "Dog"
            │       ├── breed: "Golden Retriever"
            │       ├── age: "3 years"
            │       ├── owner: "Smith, John"
            │       ├── ownerId: "cust_1"
            │       ├── weight: "65 lbs"
            │       └── color: "Golden"
            ├── appointments/
            │   └── {appointmentId}
            │       ├── order: "A001"
            │       ├── customerName: "Smith, John"
            │       ├── petName: "Max"
            │       ├── service: "Checkup"
            │       ├── veterinarian: "Dr. Michael Smith"
            │       ├── dateTime: timestamp
            │       ├── status: "Pending"
            │       └── notes: "Annual checkup"
            ├── medicalRecords/
            │   └── {recordId}
            │       ├── petId: "pet_1"
            │       ├── petName: "Max"
            │       ├── category: "Vaccination"
            │       ├── diagnosis: "Healthy"
            │       ├── treatment: "Vaccination"
            │       └── date: "2024-01-15"
            ├── transactions/
            │   └── {transactionId}
            │       ├── customerName: "Smith, John"
            │       ├── amount: 150.00
            │       ├── service: "Checkup"
            │       ├── date: "2024-01-25"
            │       ├── status: "Completed"
            │       └── paymentMethod: "Credit Card"
            ├── medicalForms/
            │   └── {formId}
            │       ├── type: "Dog Vaccination"
            │       ├── category: "Vaccination Records"
            │       ├── count: 5
            │       └── template: "Standard vaccination form"
            ├── reasonOptions/
            │   └── {reasonId}
            │       ├── text: "Annual Checkup"
            │       └── createdAt: timestamp
            └── userCredentials/
                └── {credId}
                    ├── email: "vet@clinic.com"
                    ├── currentPassword: "hashedPassword"
                    └── passwordResetToken: "token123"
```

## Global Collections (Outside Hierarchy)

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

## Path Structure

**Superadmin Level:**
- `superadmins/{superadminId}`

**Subscription Level:**
- `superadmins/{superadminId}/subscriptions/{subscriptionId}`

**Tenant Level:**
- `superadmins/{superadminId}/tenants/{tenantId}`

**Clinic Data:**
- `superadmins/{superadminId}/tenants/{tenantId}/customers/{customerId}`
- `superadmins/{superadminId}/tenants/{tenantId}/pets/{petId}`
- `superadmins/{superadminId}/tenants/{tenantId}/appointments/{appointmentId}`

**Veterinarian Data:**
- `superadmins/{superadminId}/tenants/{tenantId}/admins/{adminId}/veterinarians/{vetId}`

## Authentication Flow

1. **Superadmin:** `superadmins/{id}`
2. **Admin:** `superadmins/{id}/tenants/{tenantId}` + `admins/{adminId}`
3. **Veterinarian:** `superadmins/{id}/tenants/{tenantId}/admins/{adminId}/veterinarians/{vetId}`

## Benefits

- **Complete Isolation:** Each tenant's data fully separated
- **Hierarchical Security:** Access control at each level
- **Scalable:** Easy to add new clinics under superadmin
- **Clean Structure:** Logical parent-child relationships