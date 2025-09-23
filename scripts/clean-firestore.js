const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();

async function cleanFirestore() {
  try {
    console.log('🧹 Cleaning Firestore data...');
    
    // Delete all documents in tenants collection
    const tenantsRef = firestore.collection('tenants');
    const snapshot = await tenantsRef.get();
    
    if (snapshot.empty) {
      console.log('✅ No tenant documents to delete');
    } else {
      const batch = firestore.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ Deleted ${snapshot.docs.length} tenant documents`);
    }
    
    // Clean up any other test collections if they exist
    const collections = ['customers', 'appointments', 'pets', 'veterinarians'];
    
    for (const collectionName of collections) {
      const collectionRef = firestore.collection(collectionName);
      const collectionSnapshot = await collectionRef.get();
      
      if (!collectionSnapshot.empty) {
        const batch = firestore.batch();
        collectionSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`✅ Deleted ${collectionSnapshot.docs.length} documents from ${collectionName}`);
      }
    }
    
    console.log('🎉 Firestore cleanup complete!');
    console.log('📝 The subscriber table should now be empty');
    
  } catch (error) {
    console.error('❌ Error cleaning Firestore:', error);
  }
  
  process.exit(0);
}

cleanFirestore();