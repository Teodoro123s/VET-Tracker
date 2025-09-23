const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, Timestamp } = require('firebase/firestore');

// Firebase config - replace with your actual config
const firebaseConfig = {
  // Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestSubscriptions() {
  try {
    console.log('Creating test subscription periods...');

    // Test subscription 1
    const subscription1 = {
      tenantId: 'vetclinic',
      email: 'admin@vetclinic.com',
      clinicName: 'Veterinary Clinic',
      period: '1 month',
      amount: '₱7,499',
      startDate: Timestamp.fromDate(new Date('2024-12-15')),
      endDate: Timestamp.fromDate(new Date('2025-01-15')),
      status: 'active',
      createdAt: Timestamp.fromDate(new Date('2024-12-15')),
      activatedAt: Timestamp.fromDate(new Date('2024-12-15'))
    };

    // Test subscription 2
    const subscription2 = {
      tenantId: 'petcare',
      email: 'admin@petcare.com',
      clinicName: 'Pet Care Center',
      period: '6 months',
      amount: '₱44,994',
      startDate: Timestamp.fromDate(new Date('2024-07-01')),
      endDate: Timestamp.fromDate(new Date('2025-01-01')),
      status: 'active',
      createdAt: Timestamp.fromDate(new Date('2024-07-01')),
      activatedAt: Timestamp.fromDate(new Date('2024-07-01'))
    };

    // Create documents
    await setDoc(doc(collection(db, 'subscriptionPeriods')), subscription1);
    await setDoc(doc(collection(db, 'subscriptionPeriods')), subscription2);

    // Create corresponding transactions
    const transaction1 = {
      tenantId: 'vetclinic',
      email: 'admin@vetclinic.com',
      clinicName: 'Veterinary Clinic',
      type: 'new',
      period: '1 month',
      amount: '₱7,499',
      status: 'paid',
      createdAt: Timestamp.fromDate(new Date('2024-12-15')),
      subscriptionPeriodId: 'sub-1'
    };

    const transaction2 = {
      tenantId: 'petcare',
      email: 'admin@petcare.com',
      clinicName: 'Pet Care Center',
      type: 'new',
      period: '6 months',
      amount: '₱44,994',
      status: 'paid',
      createdAt: Timestamp.fromDate(new Date('2024-07-01')),
      subscriptionPeriodId: 'sub-2'
    };

    await setDoc(doc(collection(db, 'transactions')), transaction1);
    await setDoc(doc(collection(db, 'transactions')), transaction2);

    console.log('✅ Test subscription periods and transactions created successfully!');
  } catch (error) {
    console.error('❌ Error creating test subscriptions:', error);
  }
}

createTestSubscriptions();