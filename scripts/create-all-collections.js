const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBPYVDo0etnBXF2xVVnpwsEBeUTvBbB42o",
  authDomain: "vet-management-b322c.firebaseapp.com",
  projectId: "vet-management-b322c",
  storageBucket: "vet-management-b322c.firebasestorage.app",
  messagingSenderId: "775446851492",
  appId: "1:775446851492:web:a2c253063d38547d399b31"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const allData = {
  subscribers: [
    {
      email: 'admin@vetclinic.com',
      clinicName: 'Veterinary Clinic',
      status: 'Active',
      expiryDate: 'Jan 15, 2025',
      amount: '₱7,499',
      period: '1 month',
      subscriptionCode: 'SUB-VETCLINIC-2024',
      accountCreated: 'Jan 1, 2024',
      lastLogin: '2024-01-20 10:30:00',
      contactStatus: 'Confirmed',
      dataRetention: 'Active',
      username: 'vetclinic_admin',
      password: 'VetClinic2024!'
    },
    {
      email: 'manager@petcare.com',
      clinicName: 'Pet Care Center',
      status: 'Active',
      expiryDate: 'Feb 20, 2025',
      amount: '₱12,999',
      period: '3 months',
      subscriptionCode: 'SUB-PETCARE-2024',
      accountCreated: 'Dec 15, 2023',
      lastLogin: '2024-01-19 15:45:00',
      contactStatus: 'Confirmed',
      dataRetention: 'Active',
      username: 'petcare_manager',
      password: 'PetCare2024!'
    }
  ],
  veterinarians: [
    {
      name: 'Dr. Michael Smith',
      specialization: 'General Practice',
      phone: '555-0101',
      email: 'michael.smith@vetclinic.com',
      experience: '8 years',
      clinicId: 'clinic_1',
      status: 'Active',
      createdAt: '2024-01-01T08:00:00Z'
    },
    {
      name: 'Dr. Sarah Johnson',
      specialization: 'Surgery',
      phone: '555-0102',
      email: 'sarah.johnson@vetclinic.com',
      experience: '12 years',
      clinicId: 'clinic_1',
      status: 'Active',
      createdAt: '2024-01-01T08:00:00Z'
    }
  ],
  customers: [
    {
      name: 'Smith, John',
      contact: '555-0123',
      email: 'john@email.com',
      address: '123 Main St',
      city: 'Springfield',
      clinicId: 'clinic_1',
      createdAt: '2024-01-10T10:00:00Z'
    },
    {
      name: 'Johnson, Sarah',
      contact: '555-0124',
      email: 'sarah@email.com',
      address: '456 Oak Ave',
      city: 'Springfield',
      clinicId: 'clinic_1',
      createdAt: '2024-01-12T14:30:00Z'
    }
  ],
  pets: [
    {
      name: 'Max',
      type: 'Dog',
      breed: 'Golden Retriever',
      age: '3 years',
      owner: 'Smith, John',
      ownerId: 'cust_1',
      weight: '65 lbs',
      color: 'Golden',
      clinicId: 'clinic_1',
      createdAt: '2024-01-10T10:30:00Z'
    },
    {
      name: 'Luna',
      type: 'Cat',
      breed: 'Siamese',
      age: '1 year',
      owner: 'Johnson, Sarah',
      ownerId: 'cust_2',
      weight: '7 lbs',
      color: 'Cream',
      clinicId: 'clinic_1',
      createdAt: '2024-01-12T15:00:00Z'
    }
  ],
  appointments: [
    {
      order: 'A001',
      customerName: 'Smith, John',
      petName: 'Max',
      service: 'Checkup',
      veterinarianId: 'vet_1',
      veterinarian: 'Dr. Michael Smith',
      dateTime: '2024-01-25T10:00:00Z',
      status: 'Pending',
      notes: 'Annual checkup',
      clinicId: 'clinic_1',
      createdAt: '2024-01-20T09:00:00Z'
    },
    {
      order: 'A002',
      customerName: 'Johnson, Sarah',
      petName: 'Luna',
      service: 'Vaccination',
      veterinarianId: 'vet_2',
      veterinarian: 'Dr. Sarah Johnson',
      dateTime: '2024-01-24T14:00:00Z',
      status: 'Completed',
      notes: 'Rabies vaccination',
      clinicId: 'clinic_1',
      createdAt: '2024-01-21T11:30:00Z'
    }
  ],
  transactions: [
    {
      customerId: 'cust_1',
      customerName: 'Smith, John',
      amount: 150.00,
      service: 'Checkup',
      date: '2024-01-25',
      status: 'Completed',
      paymentMethod: 'Credit Card',
      veterinarianId: 'vet_1',
      clinicId: 'clinic_1',
      createdAt: '2024-01-25T10:30:00Z'
    },
    {
      customerId: 'cust_2',
      customerName: 'Johnson, Sarah',
      amount: 75.00,
      service: 'Vaccination',
      date: '2024-01-24',
      status: 'Completed',
      paymentMethod: 'Cash',
      veterinarianId: 'vet_2',
      clinicId: 'clinic_1',
      createdAt: '2024-01-24T14:30:00Z'
    }
  ],
  medicalForms: [
    {
      type: 'Dog Vaccination',
      category: 'Vaccination Records',
      count: 23,
      lastUpdated: 'Today',
      template: 'Standard vaccination form for dogs',
      clinicId: 'clinic_1',
      createdAt: '2024-01-01T08:00:00Z'
    },
    {
      type: 'Cat Health Check',
      category: 'Health Checkups',
      count: 18,
      lastUpdated: 'Yesterday',
      template: 'Routine health examination for cats',
      clinicId: 'clinic_1',
      createdAt: '2024-01-01T08:00:00Z'
    }
  ],
  medicalCategories: [
    {
      name: 'Vaccination Records',
      description: 'Pet vaccination history and schedules',
      clinicId: 'clinic_1',
      createdAt: '2024-01-01T08:00:00Z'
    },
    {
      name: 'Health Checkups',
      description: 'Routine health examination records',
      clinicId: 'clinic_1',
      createdAt: '2024-01-01T08:00:00Z'
    }
  ]
};

async function createAllCollections() {
  console.log('Creating all Firestore collections with data...\n');
  
  for (const [collectionName, items] of Object.entries(allData)) {
    console.log(`📁 Creating ${collectionName} collection...`);
    
    for (const item of items) {
      try {
        await addDoc(collection(db, collectionName), item);
        console.log(`  ✓ Added document to ${collectionName}`);
      } catch (error) {
        console.error(`  ✗ Failed to add document to ${collectionName}:`, error.message);
      }
    }
    console.log('');
  }
  
  console.log('🎉 All collections created successfully!');
  console.log('\nCreated collections:');
  console.log('- subscribers (2 documents)');
  console.log('- veterinarians (2 documents)');
  console.log('- customers (2 documents)');
  console.log('- pets (2 documents)');
  console.log('- appointments (2 documents)');
  console.log('- transactions (2 documents)');
  console.log('- medicalForms (2 documents)');
  console.log('- medicalCategories (2 documents)');
}

createAllCollections().catch(console.error);