import { collection, doc, setDoc, getDocs, query, orderBy, where, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
// Add new subscription period
export async function addSubscriptionPeriod(
  tenantId,
  email,
  clinicName,
  period,
  amount,
  paymentImage)  {
  console.log('addSubscriptionPeriod called with paymentImage:', paymentImage ? 'YES' : 'NO');
  console.log('paymentImage type:', typeof paymentImage);
  console.log('paymentImage length:', paymentImage?.length || 0);
  try {
    // Check for existing active period for this tenant
    const activePeriodsQuery = query(
      collection(db, 'subscriptionPeriods'),
      where('email', '==', email),
      where('status', '==', 'active')
    );
    
    const activePeriodsSnapshot = await getDocs(activePeriodsQuery);
    const hasActivePeriod = !activePeriodsSnapshot.empty;
    
    // Calculate period duration in days
    const periodDays = getPeriodDays(period);
    const now = new Date();
    
    let startDate;
    let status;
    
    if (hasActivePeriod) {
      // If there's an active period, queue this one
      const activePeriod = activePeriodsSnapshot.docs[0].data();
      const activePeriodEndDate = activePeriod.endDate instanceof Date ? activePeriod.endDate : activePeriod.endDate.toDate();
      startDate = new Date(activePeriodEndDate.getTime());
      status = 'queued';
    } else {
      // No active period, start immediately from creation date
      startDate = now;
      status = 'active';
    }
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + periodDays);
    
    // Create subscription period
    const periodRef = doc(collection(db, 'subscriptionPeriods'));
    const subscriptionPeriod= {
      id: periodRef.id,
      tenantId,
      email,
      clinicName,
      period,
      amount,
      startDate,
      endDate,
      status,
      createdAt: now,
      activatedAt: status === 'active' ? now : null};
    
    await setDoc(periodRef, {
      ...subscriptionPeriod,
      startDate: Timestamp.fromDate(new Date(startDate.getTime())),
      endDate: Timestamp.fromDate(new Date(endDate.getTime())),
      createdAt: Timestamp.fromDate(new Date(now.getTime())),
      activatedAt: status === 'active' ? Timestamp.fromDate(new Date(now.getTime())) : null });
    
    // Create transaction record
    const transactionRef = doc(collection(db, 'transactions'));
    const transaction = {
      id: transactionRef.id,
      tenantId,
      email,
      clinicName,
      type: hasActivePeriod ? 'extension' : 'new',
      period,
      amount,
      status: 'paid',
      paymentStatus: 'completed',
      paymentImage: paymentImage,
      createdAt: now,
      subscriptionPeriodId: periodRef.id
    };
    
    console.log('Creating transaction with paymentImage:', paymentImage ? 'YES' : 'NO');
    
    await setDoc(transactionRef, {
      id: transactionRef.id,
      tenantId: tenantId,
      email: email,
      clinicName: clinicName,
      type: hasActivePeriod ? 'extension' : 'new',
      period: period,
      amount: amount,
      price: amount, // Store price field for revenue calculations
      status: 'paid',
      paymentStatus: 'completed',
      paymentImage: paymentImage || null,
      createdAt: Timestamp.fromDate(new Date(now.getTime())),
      subscriptionPeriodId: periodRef.id
    });
    
    console.log('Transaction saved to database:', {
      id: transactionRef.id,
      paymentImage: paymentImage ? 'YES' : 'NO',
      paymentImageLength: paymentImage?.length || 0,
      email: email,
      period: period
    });
    
    console.log('FINAL CHECK - paymentImage before save:', paymentImage ? paymentImage.substring(0, 50) + '...' : 'NULL');
    
    // Verify the transaction was saved correctly
    try {
      const { doc: docRef, getDoc } = await import('firebase/firestore');
      const savedDoc = await getDoc(docRef(db, 'transactions', transactionRef.id));
      if (savedDoc.exists()) {
        const savedData = savedDoc.data();
        console.log('Verification - Transaction in database has paymentImage:', savedData.paymentImage ? 'YES' : 'NO');
        console.log('Verification - All fields in saved transaction:', Object.keys(savedData));
      } else {
        console.log('Verification - Transaction document not found!');
      }
    } catch (verifyError) {
      console.error('Verification error:', verifyError);
    }
    
    return {
      success: true,
      message: status === 'active' 
        ? `Subscription activated immediately for ${period}`
        : `Subscription queued. Will start after current period expires on ${startDate.toLocaleDateString()}`,
      periodId: transactionRef.id
    };
    
  } catch (error) {
    console.error('Error adding subscription period:', error);
    return {
      success: false,
      message: `Failed to add subscription period: ${error.message}`
    };
  }
}

// Get active subscription periods only
export async function getActiveSubscriptionPeriods()  {
  try {
    const activeQuery = query(
      collection(db, 'subscriptionPeriods'),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(activeQuery);
    const periods = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate() || new Date(),
      endDate: doc.data().endDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      activatedAt: doc.data().activatedAt?.toDate()
    }));
    
    // Sort by createdAt in memory
    return periods.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching active periods:', error);
    return [];
  }
}

// Get all transaction history (latest to oldest)
export async function getAllTransactions()  {
  try {
    const transactionsCollection = collection(db, 'transactions');
    const snapshot = await getDocs(transactionsCollection);
    
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
    
    // Sort by createdAt in memory (latest first)
    return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

// Check and activate queued periods (run periodically)
export async function activateQueuedPeriods()  {
  try {
    const now = new Date();
    
    // Get all active periods and filter expired ones in memory
    const activeQuery = query(
      collection(db, 'subscriptionPeriods'),
      where('status', '==', 'active')
    );
    
    const activeSnapshot = await getDocs(activeQuery);
    const expiredDocs = activeSnapshot.docs.filter(doc => {
      const endDate = doc.data().endDate;
      return endDate && endDate.toMillis() < now.getTime();
    });
    
    // Mark expired periods as expired and activate queued ones
    for (const expiredDoc of expiredDocs) {
      await updateDoc(doc(db, 'subscriptionPeriods', expiredDoc.id), {
        status: 'expired'
      });
      
      // Check for queued periods for this tenant
      const queuedQuery = query(
        collection(db, 'subscriptionPeriods'),
        where('tenantId', '==', expiredDoc.data().tenantId),
        where('status', '==', 'queued')
      );
      
      const queuedSnapshot = await getDocs(queuedQuery);
      if (!queuedSnapshot.empty) {
        const queuedPeriods = queuedSnapshot.docs.sort((a, b) => {
          const aCreated = a.data().createdAt;
          const bCreated = b.data().createdAt;
          if (!aCreated || !bCreated) return 0;
          return aCreated.toMillis() - bCreated.toMillis();
        });
        const nextPeriod = queuedPeriods[0];
        await updateDoc(doc(db, 'subscriptionPeriods', nextPeriod.id), {
          status: 'active',
          activatedAt: Timestamp.fromDate(now)
        });
      }
    }
  } catch (error) {
    console.error('Error activating queued periods:', error);
  }
}

// Helper function to convert period to days
function getPeriodDays(period) {
  switch (period) {
    case '1 month': return 30;
    case '6 months': return 180;
    case '1 year': return 365;
    case '2 years': return 730;
    default: return 30;
  }
}

// Get subscription status for a tenant
export async function getTenantSubscriptionStatus(tenantId)  {
  try {
    const activeQuery = query(
      collection(db, 'subscriptionPeriods'),
      where('tenantId', '==', tenantId),
      where('status', '==', 'active')
    );
    
    const queuedQuery = query(
      collection(db, 'subscriptionPeriods'),
      where('tenantId', '==', tenantId),
      where('status', '==', 'queued')
    );
    
    const [activeSnapshot, queuedSnapshot] = await Promise.all([
      getDocs(activeQuery),
      getDocs(queuedQuery)
    ]);
    
    const activePeriod = activeSnapshot.empty ? undefined : {
      id: activeSnapshot.docs[0].id,
      ...activeSnapshot.docs[0].data(),
      startDate: activeSnapshot.docs[0].data().startDate.toDate(),
      endDate: activeSnapshot.docs[0].data().endDate.toDate(),
      createdAt: activeSnapshot.docs[0].data().createdAt.toDate(),
      activatedAt: activeSnapshot.docs[0].data().activatedAt?.toDate()
    };
    
    const queuedPeriods = queuedSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate.toDate(),
      endDate: doc.data().endDate.toDate(),
      createdAt: doc.data().createdAt.toDate()
    })).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    return {
      hasActive: !activeSnapshot.empty,
      hasQueued: !queuedSnapshot.empty,
      activePeriod,
      queuedPeriods
    };
  } catch (error) {
    console.error('Error getting tenant subscription status:', error);
    return {
      hasActive: false,
      hasQueued: false,
      activePeriod: null,
      queuedPeriods: []
    };
  }
}