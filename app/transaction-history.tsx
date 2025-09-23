import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import SearchableDropdown from '@/components/SearchableDropdown';
import { getAllTransactions, TransactionRecord } from '../lib/subscriptionService';

interface TransactionWithPeriod extends TransactionRecord {
  periodStatus?: 'active' | 'queued' | 'expired' | 'cancelled';
  daysRemaining?: number;
  startDate?: Date;
  endDate?: Date;
}

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionWithPeriod[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithPeriod[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time subscription to transactions and subscription periods
  useEffect(() => {
    const unsubscribeTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const transactionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as TransactionRecord[];

      // Get subscription periods to match with transactions
      const unsubscribePeriods = onSnapshot(collection(db, 'subscriptionPeriods'), (periodsSnapshot) => {
        const periods = periodsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate?.toDate() || new Date(),
          endDate: doc.data().endDate?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        // Merge transaction data with period information
        const enrichedTransactions = transactionData.map(transaction => {
          const relatedPeriod = periods.find(p => p.id === transaction.subscriptionPeriodId);
          const now = new Date();
          
          let daysRemaining = 0;
          if (relatedPeriod && relatedPeriod.endDate) {
            daysRemaining = Math.max(0, Math.ceil((relatedPeriod.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          }

          return {
            ...transaction,
            periodStatus: relatedPeriod?.status,
            daysRemaining,
            startDate: relatedPeriod?.startDate,
            endDate: relatedPeriod?.endDate
          } as TransactionWithPeriod;
        });

        // Sort by creation date (latest first)
        const sortedTransactions = enrichedTransactions.sort((a, b) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        );

        setTransactions(sortedTransactions);
        setIsLoading(false);
      });

      return () => unsubscribePeriods();
    });

    return () => unsubscribeTransactions();
  }, []);

  // Filter transactions based on search and filters
  useEffect(() => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.tenantId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(transaction => transaction.periodStatus === statusFilter.toLowerCase());
    }

    // Type filter
    if (typeFilter !== 'All') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter.toLowerCase());
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [transactions, searchTerm, statusFilter, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active': return [styles.statusBadge, styles.activeBadge];
      case 'queued': return [styles.statusBadge, styles.queuedBadge];
      case 'expired': return [styles.statusBadge, styles.expiredBadge];
      case 'cancelled': return [styles.statusBadge, styles.cancelledBadge];
      default: return [styles.statusBadge, styles.unknownBadge];
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'active': return [styles.statusText, styles.activeText];
      case 'queued': return [styles.statusText, styles.queuedText];
      case 'expired': return [styles.statusText, styles.expiredText];
      case 'cancelled': return [styles.statusText, styles.cancelledText];
      default: return [styles.statusText, styles.unknownText];
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'new': return '#28a745';
      case 'renewal': return '#007bff';
      case 'extension': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <View style={styles.container}>
      <SuperAdminSidebar />
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Transaction History</Text>
          <View style={styles.headerActions}>
            <View style={styles.searchContainer}>
              <Image source={require('@/assets/material-symbols_search-rounded.png')} style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search by email, clinic, or tenant ID..."
                placeholderTextColor="#bbb"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.tableContainer}>
            <View style={styles.tableTopRow}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.returnButton} onPress={() => router.push('/superadmin')}>
                  <Image source={require('@/assets/Vector.png')} style={styles.returnIcon} />
                </TouchableOpacity>
                <Text style={styles.detailTitle}>All Subscription Transactions</Text>
                <View style={styles.filterButtons}>
                  <SearchableDropdown
                    options={[
                      { id: 'all', label: 'All Status', value: 'All' },
                      { id: 'active', label: 'Active', value: 'Active' },
                      { id: 'queued', label: 'Queued', value: 'Queued' },
                      { id: 'expired', label: 'Expired', value: 'Expired' },
                      { id: 'cancelled', label: 'Cancelled', value: 'Cancelled' }
                    ]}
                    selectedValue={statusFilter}
                    onSelect={(option) => setStatusFilter(option.value)}
                    style={{ minWidth: 120, marginRight: 10 }}
                    zIndex={200}
                  />
                  <SearchableDropdown
                    options={[
                      { id: 'all', label: 'All Types', value: 'All' },
                      { id: 'new', label: 'New', value: 'New' },
                      { id: 'renewal', label: 'Renewal', value: 'Renewal' },
                      { id: 'extension', label: 'Extension', value: 'Extension' }
                    ]}
                    selectedValue={typeFilter}
                    onSelect={(option) => setTypeFilter(option.value)}
                    style={{ minWidth: 120 }}
                    zIndex={100}
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, {flex: 1.5}]}>Date</Text>
              <Text style={[styles.headerCell, {flex: 2}]}>Email/Clinic</Text>
              <Text style={[styles.headerCell, {flex: 1}]}>Type</Text>
              <Text style={[styles.headerCell, {flex: 1}]}>Period</Text>
              <Text style={[styles.headerCell, {flex: 1}]}>Amount</Text>
              <Text style={[styles.headerCell, {flex: 1}]}>Status</Text>
              <Text style={[styles.headerCell, {flex: 1}]}>Days Left</Text>
            </View>
            
            <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading transactions...</Text>
                </View>
              ) : paginatedTransactions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No transactions found</Text>
                </View>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <View key={transaction.id} style={styles.tableRow}>
                    <View style={[styles.cell, {flex: 1.5}]}>
                      <Text style={styles.cellText}>{transaction.createdAt.toLocaleDateString()}</Text>
                      <Text style={styles.cellSubText}>{transaction.createdAt.toLocaleTimeString()}</Text>
                    </View>
                    <View style={[styles.cell, {flex: 2}]}>
                      <Text style={styles.cellText} numberOfLines={1}>{transaction.email}</Text>
                      <Text style={styles.cellSubText} numberOfLines={1}>{transaction.clinicName}</Text>
                    </View>
                    <View style={[styles.cell, {flex: 1}]}>
                      <View style={[styles.typeBadge, { backgroundColor: getTypeColor(transaction.type) }]}>
                        <Text style={styles.typeText}>{transaction.type.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={[styles.cellText, {flex: 1}]}>{transaction.period}</Text>
                    <Text style={[styles.cellText, {flex: 1}]}>{transaction.amount}</Text>
                    <View style={[styles.statusCell, {flex: 1}]}>
                      <View style={getStatusBadgeStyle(transaction.periodStatus || 'unknown')}>
                        <Text style={getStatusTextStyle(transaction.periodStatus || 'unknown')}>
                          {(transaction.periodStatus || 'Unknown').charAt(0).toUpperCase() + (transaction.periodStatus || 'unknown').slice(1)}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.cell, {flex: 1}]}>
                      {transaction.periodStatus === 'active' && transaction.daysRemaining !== undefined ? (
                        <Text style={styles.cellText}>
                          {transaction.daysRemaining} days
                        </Text>
                      ) : transaction.periodStatus === 'queued' ? (
                        <Text style={styles.cellText}>Queued</Text>
                      ) : (
                        <Text style={styles.cellText}>-</Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            
            <View style={styles.paginationContainer}>
              <View style={styles.paginationControls}>
                <Text style={styles.paginationLabel}>Show:</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(!showDropdown)}>
                    <Text style={styles.dropdownText}>{itemsPerPage}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                  {showDropdown && (
                    <View style={styles.dropdownMenu}>
                      {[5, 10, 20, 50].map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={styles.dropdownOption}
                          onPress={() => {
                            setItemsPerPage(option);
                            setCurrentPage(1);
                            setShowDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <Text style={styles.paginationLabel}>entries</Text>
                
                <TouchableOpacity style={styles.pageBtn} onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}>
                  <Text style={styles.pageBtnText}>Prev</Text>
                </TouchableOpacity>
                <TextInput 
                  style={styles.pageInput}
                  value={currentPage.toString()}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    const page = parseInt(text);
                    if (page >= 1) setCurrentPage(page);
                  }}
                />
                <Text style={styles.pageOf}>of {totalPages}</Text>
                <TouchableOpacity style={styles.pageBtn} onPress={() => setCurrentPage(currentPage + 1)}>
                  <Text style={styles.pageBtnText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#800000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  searchInput: {
    width: 250,
    fontSize: 14,
    outlineStyle: 'none',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tableContainer: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  tableTopRow: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1,
  },
  returnButton: {
    backgroundColor: '#800000',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  returnIcon: {
    width: 16,
    height: 16,
    tintColor: '#ffffff',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
    flex: 1,
  },
  filterButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  tableBody: {
    height: 250,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  headerCell: {
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingRight: 10,
  },
  cell: {
    paddingRight: 10,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  cellSubText: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  typeBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  typeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  statusCell: {
    paddingRight: 10,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: '#28a745',
  },
  queuedBadge: {
    backgroundColor: '#ffc107',
  },
  expiredBadge: {
    backgroundColor: '#dc3545',
  },
  cancelledBadge: {
    backgroundColor: '#6c757d',
  },
  unknownBadge: {
    backgroundColor: '#17a2b8',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  activeText: {
    color: '#fff',
  },
  queuedText: {
    color: '#000',
  },
  expiredText: {
    color: '#fff',
  },
  cancelledText: {
    color: '#fff',
  },
  unknownText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  paginationContainer: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 20,
    paddingRight: 15,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationLabel: {
    fontSize: 10,
    color: '#666',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 100,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 35,
  },
  dropdownText: {
    fontSize: 10,
    marginRight: 2,
  },
  dropdownArrow: {
    fontSize: 8,
    color: '#666',
    fontWeight: 'bold',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 0,
    left: 40,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    zIndex: 101,
    minWidth: 35,
    elevation: 5,
  },
  dropdownOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 10,
    textAlign: 'center',
  },
  pageBtn: {
    backgroundColor: '#800000',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },
  pageBtnText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  pageInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    width: 25,
    textAlign: 'center',
    fontSize: 10,
  },
  pageOf: {
    fontSize: 10,
    color: '#666',
  },
});