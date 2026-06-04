import { fetchPatientConsultations } from "@/api/consultation";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Prescription = {
  id: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  generic: { id: number; generic_name: string };
  brand: { id: number; brand_name: string };
};

type Consultation = {
  id: number;
  consultation_date: string;
  chief_complaint: string | null;
  notes: string | null;
  prescriptions: Prescription[];
};

export default function PrescriptionHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetchPatientConsultations(Number(id));
        setConsultations(res.data.data || []);
      } catch {
        Alert.alert("Error", "Could not load prescription history.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Only show consultations that have at least one prescription
  const filtered = useMemo(() => {
    return consultations
      .filter((c) => c.prescriptions && c.prescriptions.length > 0)
      .filter((c) => {
        const matchesDate =
          dateFilter === "" || c.consultation_date.startsWith(dateFilter);

        const matchesSearch =
          searchQuery === "" ||
          c.prescriptions.some(
            (rx) =>
              rx.generic.generic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              rx.brand.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              rx.dosage.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          c.chief_complaint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.notes?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesDate && matchesSearch;
      });
  }, [consultations, searchQuery, dateFilter]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#095c29" />
        <Text style={styles.loaderText}>Loading prescription history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* SEARCH */}
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
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
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
            <TouchableOpacity onPress={() => setDateFilter("")} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.resultsCount}>
          {filtered.length} consultation{filtered.length !== 1 ? "s" : ""} with prescriptions
        </Text>

        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No prescriptions match your search.</Text>
          </View>
        ) : (
          filtered.map((consultation) => (
            <View key={consultation.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>💊 Prescription</Text>
                </View>
                <Text style={styles.cardDate}>
                  {consultation.consultation_date?.split("T")[0]}
                </Text>
              </View>

              {consultation.chief_complaint ? (
                <>
                  <Text style={styles.sectionLabel}>CHIEF COMPLAINT</Text>
                  <Text style={styles.notes}>{consultation.chief_complaint}</Text>
                </>
              ) : null}

              <Text style={[styles.sectionLabel, { marginTop: 10 }]}>MEDICATIONS</Text>
              {consultation.prescriptions.map((rx) => (
                <Text key={rx.id} style={styles.medItem}>
                  • {rx.brand.brand_name} ({rx.generic.generic_name}) — {rx.dosage},{" "}
                  {rx.frequency} for {rx.duration}
                  {rx.instructions ? `\n  📝 ${rx.instructions}` : ""}
                </Text>
              ))}

              {consultation.notes ? (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 10 }]}>NOTES</Text>
                  <Text style={styles.notes}>{consultation.notes}</Text>
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
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff", gap: 12 },
  loaderText: { color: "#64748b", fontSize: 14 },
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