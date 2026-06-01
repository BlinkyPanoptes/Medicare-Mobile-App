import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Transaction } from "@/types/transaction";

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    type: "prescription",
    dateIssued: "2025-05-01",
    patient: { firstName: "Agnes", lastName: "Soratorio" },
    medications: [
      { name: "Paracetamol", dosage: "500mg twice daily" },
      { name: "Amoxicillin", dosage: "250mg three times daily" },
    ],
    notes: "Take with food. Complete the full antibiotic course.",
  },
  {
    id: "2",
    type: "medical-certificate",
    dateIssued: "2025-05-03",
    patient: { firstName: "Juan", lastName: "Dela Cruz" },
    medicalNotes:
      "Patient is cleared to return to work. No physical restrictions.",
  },
  {
    id: "3",
    type: "prescription",
    dateIssued: "2025-05-10",
    patient: { firstName: "Maria", lastName: "Santos" },
    medications: [{ name: "Ibuprofen", dosage: "400mg as needed" }],
    notes: "Avoid on empty stomach.",
  },
  {
    id: "4",
    type: "medical-certificate",
    dateIssued: "2025-05-15",
    patient: { firstName: "Agnes", lastName: "Soratorio" },
    medicalNotes:
      "Patient diagnosed with mild hypertension. Advised lifestyle changes.",
  },
  {
    id: "5",
    type: "prescription",
    dateIssued: "2025-05-20",
    patient: { firstName: "Carlos", lastName: "Reyes" },
    medications: [
      { name: "Metformin", dosage: "500mg once daily" },
      { name: "Cetirizine", dosage: "10mg at bedtime" },
    ],
    notes: "Monitor blood sugar weekly.",
  },
];

// ── Filter Types ──────────────────────────────────────────────────────────────
type TypeFilter = "all" | "prescription" | "medical-certificate";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getPatientFullName = (t: Transaction) =>
  `${t.patient.firstName} ${t.patient.lastName}`.toLowerCase();

// ── Screen ────────────────────────────────────────────────────────────────────
export default function TransactionsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD or partial

  // ── useMemo filter ─────────────────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const date = dateFilter.trim();

    return (
      MOCK_TRANSACTIONS.filter((t) => {
        // Filter by type
        if (typeFilter !== "all" && t.type !== typeFilter) return false;

        // Filter by date (partial match — e.g. "2025-05" matches all of May)
        if (date && !t.dateIssued.includes(date)) return false;

        // Filter by patient name search
        if (query && !getPatientFullName(t).includes(query)) return false;

        return true;
      })
        // Sort newest first
        .sort(
          (a, b) =>
            new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime(),
        )
    );
  }, [searchQuery, typeFilter, dateFilter]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.promptHeadline}>Transaction History</Text>
          <Text style={styles.recordCount}>
            {filteredTransactions.length} record
            {filteredTransactions.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* PATIENT SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by patient name..."
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearBtnClick}
            >
              <Text style={styles.clearBtnSymbol}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* DATE FILTER */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>📅 Date</Text>
          <View style={styles.dateInputContainer}>
            <TextInput
              style={styles.dateInput}
              value={dateFilter}
              onChangeText={setDateFilter}
              placeholder="YYYY-MM-DD or YYYY-MM"
              placeholderTextColor="#94a3b8"
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
            />
            {dateFilter.length > 0 && (
              <TouchableOpacity
                onPress={() => setDateFilter("")}
                style={styles.clearBtnClick}
              >
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* TYPE FILTER PILLS */}
        <View style={styles.pillRow}>
          {(["all", "prescription", "medical-certificate"] as TypeFilter[]).map(
            (t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pill, typeFilter === t && styles.pillActive]}
                onPress={() => setTypeFilter(t)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pillText,
                    typeFilter === t && styles.pillTextActive,
                  ]}
                >
                  {t === "all"
                    ? "All"
                    : t === "prescription"
                      ? "💊 Prescription"
                      : "📄 Med. Certificate"}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>

        {/* TRANSACTION LIST */}
        {filteredTransactions.length === 0 ? (
          <Text style={styles.emptyText}>
            No transactions match your filters.
          </Text>
        ) : (
          filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.card}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.typeBadge,
                    transaction.type === "prescription"
                      ? styles.typeBadgePrescription
                      : styles.typeBadgeCertificate,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      transaction.type === "prescription"
                        ? styles.typeBadgeTextPrescription
                        : styles.typeBadgeTextCertificate,
                    ]}
                  >
                    {transaction.type === "prescription"
                      ? "💊 Prescription"
                      : "📄 Med. Certificate"}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {formatDate(transaction.dateIssued)}
                </Text>
              </View>

              {/* Patient */}
              <Text style={styles.patientName}>
                {transaction.patient.lastName}, {transaction.patient.firstName}
              </Text>

              {/* Prescription-specific details */}
              {transaction.type === "prescription" && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.detailLabel}>Medications</Text>
                  {transaction.medications.map((med, i) => (
                    <Text key={i} style={styles.detailText}>
                      • {med.name} — {med.dosage}
                    </Text>
                  ))}
                  {transaction.notes ? (
                    <>
                      <Text style={styles.detailLabel}>Notes</Text>
                      <Text style={styles.detailText}>{transaction.notes}</Text>
                    </>
                  ) : null}
                </>
              )}

              {/* Medical Certificate-specific details */}
              {transaction.type === "medical-certificate" && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.detailLabel}>Medical Notes</Text>
                  <Text style={styles.detailText}>
                    {transaction.medicalNotes}
                  </Text>
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scroller: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  promptHeadline: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  recordCount: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    height: "100%",
  },
  clearBtnClick: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  clearBtnSymbol: {
    fontSize: 20,
    color: "#94a3b8",
  },

  // Date filter
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    width: 60,
  },
  dateInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    height: "100%",
  },

  // Type filter pills
  pillRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  pillActive: {
    backgroundColor: "#095c29",
    borderColor: "#095c29",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  pillTextActive: {
    color: "#ffffff",
  },

  // Empty
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 40,
    fontSize: 15,
  },

  // Cards
  card: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  typeBadgePrescription: {
    backgroundColor: "#dbeafe",
  },
  typeBadgeCertificate: {
    backgroundColor: "#fef9c3",
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  typeBadgeTextPrescription: {
    color: "#1d4ed8",
  },
  typeBadgeTextCertificate: {
    color: "#854d0e",
  },
  dateText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  patientName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
    marginBottom: 2,
  },
});
