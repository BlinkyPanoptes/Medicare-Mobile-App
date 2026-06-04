import { useState, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity,
} from 'react-native';

// Mock data — replace with real API call once consultations endpoint is ready
const MOCK_PRESCRIPTIONS = [
  {
    id: '1',
    date: '2025-05-20',
    medications: [
      'Metformin (Glucophage) — 850mg twice daily with meals',
      'Amoxicillin (Amoxil) — 500mg every 8 hours for 7 days',
    ],
    notes: 'Monitor blood sugar weekly.',
  },
  {
    id: '2',
    date: '2025-03-10',
    medications: ['Losartan — 50mg once daily'],
    notes: 'Follow up in 1 month.',
  },
  {
    id: '3',
    date: '2025-01-05',
    medications: ['Paracetamol — 500mg every 6 hours as needed'],
    notes: '',
  },
];

export default function PrescriptionHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filtered = useMemo(() => {
    return MOCK_PRESCRIPTIONS.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.medications.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.notes.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDate =
        dateFilter === '' || p.date.startsWith(dateFilter);

      return matchesSearch && matchesDate;
    });
  }, [searchQuery, dateFilter]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* SEARCH BAR */}
        <View style={styles.searchBarWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search by medication or notes..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* DATE FILTER */}
        <View style={styles.dateFilterWrapper}>
          <Text style={styles.dateFilterIcon}>📅</Text>
          <TextInput
            style={styles.dateFilterInput}
            placeholder="Filter by date (YYYY-MM or YYYY-MM-DD)"
            placeholderTextColor="#94a3b8"
            value={dateFilter}
            onChangeText={setDateFilter}
          />
          {dateFilter.length > 0 && (
            <TouchableOpacity onPress={() => setDateFilter('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* RESULTS COUNT */}
        <Text style={styles.resultsCount}>
          {filtered.length} prescription{filtered.length !== 1 ? 's' : ''} found
        </Text>

        {/* PRESCRIPTION CARDS */}
        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No prescriptions match your search.</Text>
          </View>
        ) : (
          filtered.map((rx) => (
            <View key={rx.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>💊 Prescription</Text>
                </View>
                <Text style={styles.cardDate}>{rx.date}</Text>
              </View>

              <Text style={styles.sectionLabel}>MEDICATIONS</Text>
              {rx.medications.map((med, i) => (
                <Text key={i} style={styles.medItem}>• {med}</Text>
              ))}

              {rx.notes ? (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 10 }]}>NOTES</Text>
                  <Text style={styles.notes}>{rx.notes}</Text>
                </>
              ) : null}
            </View>
          ))
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  searchBarWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 12, height: 48, marginBottom: 10 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchBarInput: { flex: 1, fontSize: 15, color: "#0f172a" },
  dateFilterWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 12, height: 48, marginBottom: 16 },
  dateFilterIcon: { fontSize: 16, marginRight: 8 },
  dateFilterInput: { flex: 1, fontSize: 15, color: "#0f172a" },
  clearBtn: { padding: 4 },
  clearBtnText: { fontSize: 20, color: "#94a3b8" },

  resultsCount: { fontSize: 13, color: "#64748b", marginBottom: 14 },

  card: { backgroundColor: "#ffffff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, marginBottom: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  badge: { backgroundColor: "#f0fdf4", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "#bbf7d0" },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#095c29" },
  cardDate: { fontSize: 13, color: "#64748b" },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#64748b", letterSpacing: 0.8, marginBottom: 6, textTransform: "uppercase" },
  medItem: { fontSize: 14, color: "#0f172a", lineHeight: 22 },
  notes: { fontSize: 14, color: "#475569", lineHeight: 20 },

  emptyBox: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyIcon: { fontSize: 32 },
  emptyText: { color: "#94a3b8", fontSize: 14, fontStyle: "italic" },
});