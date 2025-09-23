const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPYVDo0etnBXF2xVVnpwsEBeUTvBbB42o",
  authDomain: "vet-management-b322c.firebaseapp.com",
  projectId: "vet-management-b322c",
  storageBucket: "vet-management-b322c.firebasestorage.app",
  messagingSenderId: "775446851492",
  appId: "1:775446851492:web:a2c253063d38547d399b31"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data
const veterinarians = [
  {
    name: 'Dr. Michael Smith',
    specialization: 'General Practice',
    phone: '555-0101',
    email: 'michael.smith@vetclinic.com',
    experience: '8 years',
    status: 'Active'
  },
  {
    name: 'Dr. Sarah Johnson',
    specialization: 'Surgery',
    phone: '555-0102',
    email: 'sarah.johnson@vetclinic.com',
    experience: '12 years',
    status: 'Active'
  },
  {
    name: 'Dr. Emily Brown',
    specialization: 'Emergency Medicine',
    phone: '555-0103',
    email: 'emily.brown@vetclinic.com',
    experience: '6 years',
    status: 'Active'
  },
  {
    name: 'Dr. James Wilson',
    specialization: 'Dermatology',
    phone: '555-0104',
    email: 'james.wilson@vetclinic.com',
    experience: '10 years',
    status: 'Active'
  }
];

const customers = [
  {
    name: 'Smith, John',
    contact: '555-0123',
    email: 'john@email.com',
    address: '123 Main St',
    city: 'Springfield',
    pets: 2
  },
  {
    name: 'Johnson, Sarah',
    contact: '555-0124',
    email: 'sarah@email.com',
    address: '456 Oak Ave',
    city: 'Springfield',
    pets: 1
  },
  {
    name: 'Williams, Robert',
    contact: '555-0125',
    email: 'robert@email.com',
    address: '789 Pine St',
    city: 'Springfield',
    pets: 3
  },
  {
    name: 'Davis, Maria',
    contact: '555-0126',
    email: 'maria@email.com',
    address: '321 Elm St',
    city: 'Springfield',
    pets: 1
  },
  {
    name: 'Miller, David',
    contact: '555-0127',
    email: 'david@email.com',
    address: '654 Maple Ave',
    city: 'Springfield',
    pets: 2
  }
];

const pets = [
  {
    name: 'Max',
    type: 'Dog',
    breed: 'Golden Retriever',
    age: '3 years',
    owner: 'Smith, John',
    weight: '65 lbs',
    color: 'Golden'
  },
  {
    name: 'Bella',
    type: 'Dog',
    breed: 'Labrador',
    age: '2 years',
    owner: 'Smith, John',
    weight: '55 lbs',
    color: 'Black'
  },
  {
    name: 'Luna',
    type: 'Cat',
    breed: 'Siamese',
    age: '1 year',
    owner: 'Johnson, Sarah',
    weight: '7 lbs',
    color: 'Cream'
  },
  {
    name: 'Charlie',
    type: 'Dog',
    breed: 'Beagle',
    age: '4 years',
    owner: 'Williams, Robert',
    weight: '30 lbs',
    color: 'Brown and White'
  },
  {
    name: 'Whiskers',
    type: 'Cat',
    breed: 'Persian',
    age: '5 years',
    owner: 'Williams, Robert',
    weight: '12 lbs',
    color: 'White'
  },
  {
    name: 'Rocky',
    type: 'Dog',
    breed: 'Bulldog',
    age: '6 years',
    owner: 'Williams, Robert',
    weight: '50 lbs',
    color: 'Brindle'
  },
  {
    name: 'Mittens',
    type: 'Cat',
    breed: 'Maine Coon',
    age: '3 years',
    owner: 'Davis, Maria',
    weight: '15 lbs',
    color: 'Gray'
  },
  {
    name: 'Buddy',
    type: 'Dog',
    breed: 'German Shepherd',
    age: '5 years',
    owner: 'Miller, David',
    weight: '75 lbs',
    color: 'Brown and Black'
  },
  {
    name: 'Shadow',
    type: 'Cat',
    breed: 'British Shorthair',
    age: '2 years',
    owner: 'Miller, David',
    weight: '10 lbs',
    color: 'Gray'
  }
];

const appointments = [
  {
    order: 'A001',
    customerName: 'Smith, John',
    petName: 'Max',
    service: 'Checkup',
    veterinarian: 'Dr. Michael Smith',
    dateTime: 'Jan 25, 2024\n10:00 AM',
    status: 'Pending',
    notes: 'Annual checkup'
  },
  {
    order: 'A002',
    customerName: 'Johnson, Sarah',
    petName: 'Luna',
    service: 'Vaccination',
    veterinarian: 'Dr. Sarah Johnson',
    dateTime: 'Jan 24, 2024\n2:00 PM',
    status: 'Completed',
    notes: 'Rabies vaccination'
  },
  {
    order: 'A003',
    customerName: 'Williams, Robert',
    petName: 'Charlie',
    service: 'Dental Cleaning',
    veterinarian: 'Dr. Emily Brown',
    dateTime: 'Jan 26, 2024\n9:00 AM',
    status: 'Approved',
    notes: 'Routine dental cleaning'
  },
  {
    order: 'A004',
    customerName: 'Davis, Maria',
    petName: 'Mittens',
    service: 'Surgery',
    veterinarian: 'Dr. Sarah Johnson',
    dateTime: 'Jan 27, 2024\n11:00 AM',
    status: 'Due',
    notes: 'Spay surgery'
  },
  {
    order: 'A005',
    customerName: 'Miller, David',
    petName: 'Buddy',
    service: 'Emergency Care',
    veterinarian: 'Dr. Emily Brown',
    dateTime: 'Jan 23, 2024\n3:30 PM',
    status: 'Completed',
    notes: 'Emergency visit for injury'
  }
];

const transactions = [
  {
    customerName: 'Smith, John',
    amount: 150.00,
    service: 'Checkup',
    date: '2024-01-25',
    status: 'Completed',
    paymentMethod: 'Credit Card'
  },
  {
    customerName: 'Johnson, Sarah',
    amount: 75.00,
    service: 'Vaccination',
    date: '2024-01-24',
    status: 'Completed',
    paymentMethod: 'Cash'
  },
  {
    customerName: 'Williams, Robert',
    amount: 200.00,
    service: 'Dental Cleaning',
    date: '2024-01-26',
    status: 'Pending',
    paymentMethod: 'Credit Card'
  },
  {
    customerName: 'Miller, David',
    amount: 350.00,
    service: 'Emergency Care',
    date: '2024-01-23',
    status: 'Completed',
    paymentMethod: 'Debit Card'
  }
];

const subscribers = [
  {
    email: 'admin@vetclinic.com',
    clinicName: 'Springfield Veterinary Clinic',
    status: 'Active',
    expiryDate: 'Jan 15, 2025',
    amount: '₱7,499',
    period: '1 month'
  }
];



async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Add veterinarians
    console.log('Adding veterinarians...');
    for (const vet of veterinarians) {
      await addDoc(collection(db, 'veterinarians'), vet);
    }

    // Add customers
    console.log('Adding customers...');
    for (const customer of customers) {
      await addDoc(collection(db, 'customers'), customer);
    }

    // Add pets
    console.log('Adding pets...');
    for (const pet of pets) {
      await addDoc(collection(db, 'pets'), pet);
    }

    // Add appointments
    console.log('Adding appointments...');
    for (const appointment of appointments) {
      await addDoc(collection(db, 'appointments'), appointment);
    }



    // Add transactions
    console.log('Adding transactions...');
    for (const transaction of transactions) {
      await addDoc(collection(db, 'transactions'), transaction);
    }

    // Add subscribers
    console.log('Adding subscribers...');
    for (const subscriber of subscribers) {
      await addDoc(collection(db, 'subscribers'), subscriber);
    }

    console.log('Database seeding completed successfully!');
    console.log('Added:');
    console.log(`- ${veterinarians.length} veterinarians`);
    console.log(`- ${customers.length} customers`);
    console.log(`- ${pets.length} pets`);
    console.log(`- ${appointments.length} appointments`);

    console.log(`- ${transactions.length} transactions`);
    console.log(`- ${subscribers.length} subscribers`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();