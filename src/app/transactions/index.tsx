import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Clinic } from "@/types/clinic";
import { User } from "@/types/user";

// ── Mock Data ─────────────────────────────────────────────────────────────────

const testClinic: Clinic = {
  id: "1",
  name: "Crave Medical Center",
  address: "JS Bldg. Lacson-Galo St., Bacolod City",
  contactNumber: "09171231234",
};
const testUser: User = {
  id: "1",
  firstName: "Kenneth",
  lastName: "Pedrajas",
  email: "pedkenneth@gmail.com",
  phoneNumber: "09958533900",
  role: "doctor",
  prcNumber: "1234567890", // doctors only
  specialty: "Pulmonary", // doctors only
  clinic: testClinic,
};

import { Patient } from "@/types/patient";

import { Transaction } from "@/types/transaction";

import { Brand } from "@/types/brand";
import { Generic } from "@/types/generic";

const MOCK_PATIENTS: Patient[] = [
  {
    id: "1",
    createdBy: testUser,
    lastName: "Soratorio",
    firstName: "Agnes",
    gender: "Female",
    birthdate: new Date("1954-01-25"),
    email: "agnes.soratorio@example.com",
    phoneNumber: "09123456789",
    clinic: testClinic,
  },
  {
    id: "2",
    createdBy: testUser,
    lastName: "Dela Cruz",
    firstName: "Juan",
    gender: "Male",
    birthdate: new Date("1990-03-10"),
    email: "juan.dela.cruz@example.com",
    phoneNumber: "09234567890",
    clinic: testClinic,
  },
  {
    id: "3",
    createdBy: testUser,
    lastName: "Santos",
    firstName: "Maria",
    gender: "Female",
    birthdate: new Date("1985-07-04"),
    email: "maria.santos@example.com",
    phoneNumber: "09345678901",
    clinic: testClinic,
  },
];

const MOCK_GENERICS: Generic[] = [
  {
    id: "1",
    name: "Amoxicillin",
    uses: "Used to treat bacterial infections such as pneumonia, bronchitis, and urinary tract infections.",
  },
  {
    id: "2",
    name: "Ibuprofen",
    uses: "Used to reduce fever and treat pain or inflammation caused by various conditions such as headache, toothache, arthritis, and menstrual cramps.",
  },
  {
    id: "3",
    name: "Metformin",
    uses: "Used to treat type 2 diabetes by helping to control blood sugar levels.",
  },
];

const MOCK_BRANDS: Brand[] = [
  { id: "1", generics: [MOCK_GENERICS[0]], name: "Amoxil" },
  { id: "2", generics: [MOCK_GENERICS[1]], name: "Advil" },
  { id: "3", generics: [MOCK_GENERICS[2]], name: "Glucophage" },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    type: "prescription",
    createdBy: testUser,
    dateIssued: new Date("2025-05-01"),
    patient: MOCK_PATIENTS[0],
    medications: [
      {
        generic: MOCK_GENERICS[0],
        brand: MOCK_BRANDS[0],
        dosage: "500mg every 8 hours for 7 days",
      },
    ],
    notes: "Take with food. Complete the full antibiotic course.",
  },
  {
    id: "2",
    type: "medical-certificate",
    createdBy: testUser,
    dateIssued: new Date("2025-05-03"),
    patient: MOCK_PATIENTS[1],
    complaints:
      "Patient presented with symptoms of acute bronchitis, including persistent cough, mild fever, and fatigue.",
    diagnosis: "Acute Bronchitis",
    recommendation:
      "Patient is cleared to return to work. No physical restrictions.",
  },
  {
    id: "3",
    type: "prescription",
    createdBy: testUser,
    dateIssued: new Date("2025-05-10"),
    patient: MOCK_PATIENTS[2],
    medications: [
      {
        generic: MOCK_GENERICS[1],
        brand: MOCK_BRANDS[1],
        dosage: "400mg every 6 hours as needed for pain",
      },
    ],
    notes: "Avoid on empty stomach.",
  },
  {
    id: "4",
    type: "medical-certificate",
    createdBy: testUser,
    dateIssued: new Date("2025-05-15"),
    patient: MOCK_PATIENTS[0],
    complaints:
      "Patient presented with symptoms of acute bronchitis, including persistent cough, mild fever, and fatigue.",
    diagnosis: "Acute Bronchitis",
    recommendation:
      "Patient is cleared to return to work. No physical restrictions.",
  },
  {
    id: "5",
    type: "prescription",
    createdBy: testUser,
    dateIssued: new Date("2025-05-20"),
    patient: MOCK_PATIENTS[1],
    medications: [
      {
        generic: MOCK_GENERICS[2],
        brand: MOCK_BRANDS[2],
        dosage: "850mg twice daily with meals",
      },
      {
        generic: MOCK_GENERICS[0],
        brand: MOCK_BRANDS[0],
        dosage: "500mg every 8 hours for 7 days",
      },
    ],
    notes: "Monitor blood sugar weekly.",
  },
];

// ── End of Mock Data ─────────────────────────────────────────────────────────────────

// ── Filter Types ──────────────────────────────────────────────────────────────
type TypeFilter = "all" | "prescription" | "medical-certificate";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (date: Date) => {
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
        if (date && !t.dateIssued.toISOString().includes(date)) return false;

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
                  {transaction.medications.map((medications, i) => (
                    <Text key={i} style={styles.detailText}>
                      • {medications.generic.name} ({medications.brand.name}) —{" "}
                      {medications.dosage}
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
                  <Text style={styles.detailLabel}>Complaints</Text>
                  <Text style={styles.detailText}>
                    {transaction.complaints}
                  </Text>

                  <Text style={styles.detailLabel}>Diagnosis</Text>
                  <Text style={styles.detailText}>{transaction.diagnosis}</Text>

                  <Text style={styles.detailLabel}>Recommendation</Text>
                  <Text style={styles.detailText}>
                    {transaction.recommendation}
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
