const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

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

async function clearMedicalData() {
  try {
    console.log('Starting to clear medical forms and categories...');

    // Clear medical forms
    console.log('Clearing medical forms...');
    const formsSnapshot = await getDocs(collection(db, 'medicalForms'));
    const formsDeletePromises = formsSnapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, 'medicalForms', docSnapshot.id))
    );
    await Promise.all(formsDeletePromises);
    console.log(`Deleted ${formsSnapshot.docs.length} medical forms`);

    // Clear medical categories
    console.log('Clearing medical categories...');
    const categoriesSnapshot = await getDocs(collection(db, 'medicalCategories'));
    const categoriesDeletePromises = categoriesSnapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, 'medicalCategories', docSnapshot.id))
    );
    await Promise.all(categoriesDeletePromises);
    console.log(`Deleted ${categoriesSnapshot.docs.length} medical categories`);

    console.log('Medical data cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing medical data:', error);
    process.exit(1);
  }
}

clearMedicalData();