require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function populateSampleData() {
  try {
    console.log('🔍 Finding tenant for edmo.teodoro.swu@phinmaed.com...');

    const tenantsRef = collection(db, 'tenants');
    const q = query(tenantsRef, where('email', '==', 'edmo.teodoro.swu@phinmaed.com'));
    const tenantSnapshot = await getDocs(q);

    if (tenantSnapshot.empty) {
      console.log('❌ No tenant found for admin email');
      return;
    }

    const tenantDoc = tenantSnapshot.docs[0];
    const tenantId = tenantDoc.id;
    console.log('✅ Found tenant ID:', tenantId);

    // Add sample customers
    console.log('📝 Adding sample customers...');
    const customersRef = collection(db, `tenants/${tenantId}/customers`);

    const sampleCustomers = [
      {
        firstname: 'John',
        surname: 'Doe',
        email: 'john.doe@email.com',
        contact: '09123456789',
        address: '123 Main St, City',
        createdAt: new Date()
      },
      {
        firstname: 'Jane',
        surname: 'Smith',
        email: 'jane.smith@email.com',
        contact: '09987654321',
        address: '456 Oak Ave, Town',
        createdAt: new Date()
      }
    ];

    for (const customer of sampleCustomers) {
      await addDoc(customersRef, customer);
      console.log('✅ Added customer:', customer.firstname, customer.surname);
    }

    // Add sample pets
    console.log('🐾 Adding sample pets...');
    const petsRef = collection(db, `tenants/${tenantId}/pets`);

    const samplePets = [
      {
        name: 'Buddy',
        species: 'Dog',
        breed: 'Golden Retriever',
        age: 3,
        owner: 'john.doe@email.com',
        createdAt: new Date()
      },
      {
        name: 'Whiskers',
        species: 'Cat',
        breed: 'Persian',
        age: 2,
        owner: 'jane.smith@email.com',
        createdAt: new Date()
      },
      {
        name: 'Max',
        species: 'Dog',
        breed: 'German Shepherd',
        age: 5,
        owner: 'john.doe@email.com',
        createdAt: new Date()
      }
    ];

    for (const pet of samplePets) {
      await addDoc(petsRef, pet);
      console.log('✅ Added pet:', pet.name);
    }

    // Add sample appointments
    console.log('📅 Adding sample appointments...');
    const appointmentsRef = collection(db, `tenants/${tenantId}/appointments`);

    const sampleAppointments = [
      {
        petName: 'Buddy',
        customerName: 'John Doe',
        veterinarianEmail: 'edzhel.teodoro25@gmail.com',
        appointmentDate: new Date(Date.now() + 86400000), // Tomorrow
        reason: 'Annual Checkup',
        service: 'General Checkup',
        status: 'Pending',
        notes: 'Regular health check',
        createdAt: new Date()
      },
      {
        petName: 'Whiskers',
        customerName: 'Jane Smith',
        veterinarianEmail: 'edzhel.teodoro25@gmail.com',
        appointmentDate: new Date(Date.now() + 172800000), // Day after tomorrow
        reason: 'Vaccination',
        service: 'Vaccination',
        status: 'Pending',
        notes: 'Annual vaccination',
        createdAt: new Date()
      },
      {
        petName: 'Max',
        customerName: 'John Doe',
        veterinarianEmail: 'edzhel.teodoro25@gmail.com',
        appointmentDate: new Date(Date.now() - 86400000), // Yesterday
        reason: 'Dental Cleaning',
        service: 'Dental Care',
        status: 'Done',
        notes: 'Completed dental cleaning',
        createdAt: new Date()
      }
    ];

    for (const appointment of sampleAppointments) {
      await addDoc(appointmentsRef, appointment);
      console.log('✅ Added appointment for:', appointment.petName);
    }

    console.log('🎉 Sample data populated successfully!');
    console.log('📊 Summary:');
    console.log('- 2 Customers');
    console.log('- 3 Pets');
    console.log('- 3 Appointments');

  } catch (error) {
    console.error('❌ Error populating sample data:', error);
  }
}

populateSampleData();