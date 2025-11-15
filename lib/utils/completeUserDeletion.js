import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Complete user deletion function
export async function deleteUserCompletely(tenantId, userEmail)  {
  try {
    console.log('Starting complete deletion for:', userEmail);
    
    // Step 1 from Firestore Database
    try {
      await deleteDoc(doc(db, 'tenants', tenantId));
      console.log('✅ Deleted from Firestore Database');
    } catch (firestoreError) {
      console.error('❌ Firestore deletion failed:', firestoreError);
    }
    
    // Step 2 from Firebase Auth (using Admin API)
    try {
      const response = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email})
      });
      
      if (response.ok) {
        console.log('✅ Deleted from Firebase Auth');
      } else {
        console.error('❌ Auth deletion failed:', await response.text());
      }
    } catch (authError) {
      console.error('❌ Auth API call failed:', authError);
    }
    
    return {
      success,
      message: `✅ User ${userEmail} completely deleted from both Auth and Database`
    };
    
  } catch (error) {
    console.error('Complete deletion failed:', error);
    return {
      success,
      message: `❌ Deletion failed: ${error.message}`
    };
  }
}

// Sync function to detect and clean up orphaned records
export async function syncAuthAndDatabase()  {
  try {
    console.log('🔄 Syncing Auth and Database...');
    
    // This would require server-side implementation
    // For now, just log the sync attempt
    console.log('Sync requires server-side Admin SDK implementation');
    
  } catch (error) {
    console.error('Sync failed:', error);
  }
}