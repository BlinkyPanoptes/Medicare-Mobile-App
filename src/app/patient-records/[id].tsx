import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchPatientById } from '@/api/patient';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';

// Mock prescriptions — replace with real API call once consultations endpoint is ready
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
];

export default function PatientDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const loadPatient = async () => {
      try {
        const response = await fetchPatientById(id);
        setPatient(response.data.data || response.data);
      } catch (error) {
        Alert.alert("Error", "Could not load patient details.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadPatient();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#095c29" />
        <Text style={styles.loaderText}>Loading patient profile...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.notFoundText}>Patient not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnFallback}>
          <Text style={styles.backBtnFallbackText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const latestPrescription = MOCK_PRESCRIPTIONS[0] ?? null;

  return (
    <View style={styles.container}>
      {/* PROFILE BANNER */}
      <View style={styles.profileBanner}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>
            {(patient.first_name?.[0] ?? "").toUpperCase()}
            {(patient.last_name?.[0] ?? "").toUpperCase()}
          </Text>
        </View>
        <Text style={styles.patientFullName}>{patient.first_name} {patient.last_name}</Text>
        <Text style={styles.patientSubInfo}>{patient.gender ?? "—"} • {patient.birthdate ?? "—"}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* CONTACT INFO */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <DetailField label="Email Address" value={patient.email || "N/A"} />
        <DetailField label="Mobile Number" value={patient.phone_number ? `+63 ${patient.phone_number}` : "N/A"} />

        {/* PERSONAL INFO */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <DetailField label="Last Name" value={patient.last_name} />
        <DetailField label="First Name" value={patient.first_name} />
        <DetailField label="Gender" value={patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : "N/A"} />
        <DetailField label="Birthdate" value={patient.birthdate} />

        {/* PRESCRIPTION HISTORY */}
        <View style={styles.sectionDivider} />
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Latest Prescription</Text>
          {MOCK_PRESCRIPTIONS.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push(`/patient-records/${id}/prescriptions`)}
            >
              <Text style={styles.viewAllBtnText}>View All History →</Text>
            </TouchableOpacity>
          )}
        </View>

        {latestPrescription ? (
          <View style={styles.prescriptionCard}>
            {/* Card header */}
            <View style={styles.prescriptionCardHeader}>
              <View style={styles.prescriptionBadge}>
                <Text style={styles.prescriptionBadgeText}>💊 Prescription</Text>
              </View>
              <Text style={styles.prescriptionDate}>{latestPrescription.date}</Text>
            </View>

            {/* Medications */}
            <Text style={styles.prescriptionSectionLabel}>MEDICATIONS</Text>
            {latestPrescription.medications.map((med, i) => (
              <Text key={i} style={styles.prescriptionMedItem}>• {med}</Text>
            ))}

            {/* Notes */}
            {latestPrescription.notes ? (
              <>
                <Text style={[styles.prescriptionSectionLabel, { marginTop: 10 }]}>NOTES</Text>
                <Text style={styles.prescriptionNotes}>{latestPrescription.notes}</Text>
              </>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyHistoryBox}>
            <Text style={styles.emptyHistoryIcon}>📋</Text>
            <Text style={styles.emptyHistoryText}>No prescription history found.</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const DetailField = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldValueBox}>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff", gap: 12 },
  loaderText: { color: "#64748b", fontSize: 14 },
  notFoundText: { fontSize: 16, color: "#64748b" },
  backBtnFallback: { marginTop: 8 },
  backBtnFallbackText: { color: "#095c29", fontWeight: "600", fontSize: 15 },

  profileBanner: { backgroundColor: "#095c29", alignItems: "center", paddingTop: 28, paddingBottom: 32, paddingHorizontal: 24 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  avatarInitials: { fontSize: 26, fontWeight: "700", color: "#ffffff" },
  patientFullName: { fontSize: 22, fontWeight: "700", color: "#ffffff", marginBottom: 4 },
  patientSubInfo: { fontSize: 14, color: "#bbf7d0" },

  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#095c29", marginTop: 8 },
  sectionDivider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 20 },

  viewAllBtn: { paddingVertical: 4, paddingHorizontal: 10, backgroundColor: "#f0fdf4", borderRadius: 8, borderWidth: 1, borderColor: "#bbf7d0" },
  viewAllBtnText: { fontSize: 13, fontWeight: "600", color: "#095c29" },

  fieldWrapper: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 },
  fieldValueBox: { minHeight: 50, justifyContent: "center", paddingHorizontal: 14, backgroundColor: "#f8fafc", borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  fieldValue: { fontSize: 16, color: "#0f172a" },

  // --- PRESCRIPTION CARD ---
  prescriptionCard: { backgroundColor: "#ffffff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  prescriptionCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  prescriptionBadge: { backgroundColor: "#f0fdf4", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "#bbf7d0" },
  prescriptionBadgeText: { fontSize: 12, fontWeight: "700", color: "#095c29" },
  prescriptionDate: { fontSize: 13, color: "#64748b" },
  prescriptionSectionLabel: { fontSize: 11, fontWeight: "700", color: "#64748b", letterSpacing: 0.8, marginBottom: 6, textTransform: "uppercase" },
  prescriptionMedItem: { fontSize: 14, color: "#0f172a", lineHeight: 22 },
  prescriptionNotes: { fontSize: 14, color: "#475569", lineHeight: 20 },

  emptyHistoryBox: { alignItems: "center", paddingVertical: 28, backgroundColor: "#f8fafc", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", gap: 8 },
  emptyHistoryIcon: { fontSize: 28 },
  emptyHistoryText: { color: "#94a3b8", fontSize: 14, fontStyle: "italic" },
});