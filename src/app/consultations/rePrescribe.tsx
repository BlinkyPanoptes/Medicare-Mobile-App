import { fetchPatientConsultations } from "@/api/consultation";
import { fetchPatients } from "@/api/patient";
import { useRouter } from "expo-router";
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

type Patient = {
  id: number;
  first_name: string;
  last_name: string;
  gender: string;
  birthdate: string;
};

type Prescription = {
  id: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  generic_name_snapshot?: string | null;
  brand_name_snapshot?: string | null;
  generic: { id: number; generic_name: string };
  brand: { id: number; brand_name: string };
};

type Consultation = {
  id: number;
  consultation_date: string;
  prescriptions: Prescription[];
};

export default function ReprescribeScreen() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Per-patient loading state when tapping a patient card
  const [loadingPatientId, setLoadingPatientId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchPatients();
        setPatients(res.data.data ?? res.data);
      } catch {
        Alert.alert("Error", "Could not load patients.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter(
      (p) =>
        p.first_name.toLowerCase().includes(query) ||
        p.last_name.toLowerCase().includes(query),
    );
  }, [patients, searchQuery]);

  const handleSelectPatient = async (patient: Patient) => {
    setLoadingPatientId(patient.id);
    try {
      // Fetch this patient's consultation history
      const res = await fetchPatientConsultations(patient.id);
      const consultations: Consultation[] = res.data.data ?? [];

      // Find the most recent consultation that has at least one prescription
      const latestWithRx = [...consultations]
        .reverse()
        .find((c) => c.prescriptions && c.prescriptions.length > 0);

      // Build prefill param — empty array if no prescription history exists
      // createPrescription.tsx handles both cases: prefilled and blank
      const prefillMeds = latestWithRx
        ? latestWithRx.prescriptions.map((rx) => ({
            key: rx.id.toString(),
            generic_id: rx.generic?.id ?? 0,
            brand_id: rx.brand?.id ?? 0,
            
            // ✅ Read from the snapshot if the relationship is missing
            generic_name: rx.generic?.generic_name ?? rx.generic_name_snapshot ?? "Unknown",
            brand_name: rx.brand?.brand_name ?? rx.brand_name_snapshot ?? "Unknown",
            
            dosage: rx.dosage,
            frequency: rx.frequency,
            duration: rx.duration,
            instructions: rx.instructions ?? "",
            }))
        : [];

      router.push({
        pathname: "/consultations/createPrescription",
        params: {
          patientId: patient.id.toString(),
          patientName: `${patient.last_name}, ${patient.first_name}`,
          patientGender: patient.gender,
          patientBirthdate: patient.birthdate,
          // Pass prefill as JSON string — createPrescription.tsx parses this
          prefillMeds: JSON.stringify(prefillMeds),
        },
      });
    } catch {
      Alert.alert("Error", "Could not load patient history.");
    } finally {
      setLoadingPatientId(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* SEARCH */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search patient by name..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#095c29" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {filteredPatients.length === 0 && patients.length === 0 ? (
            <Text style={styles.emptyText}>No patients found in this clinic.</Text>
          ) : filteredPatients.length === 0 ? (
            <Text style={styles.emptyText}>No patients match "{searchQuery}".</Text>
          ) : (
            filteredPatients.map((patient) => (
              <TouchableOpacity
                key={patient.id}
                style={styles.card}
                onPress={() => handleSelectPatient(patient)}
                activeOpacity={0.75}
                disabled={loadingPatientId === patient.id}
              >
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {patient.first_name[0]?.toUpperCase()}
                    {patient.last_name[0]?.toUpperCase()}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>
                    {patient.last_name}, {patient.first_name}
                  </Text>
                  <Text style={styles.cardSub}>
                    {patient.gender
                      ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
                      : "—"}{" "}
                    • {patient.birthdate ?? "—"}
                  </Text>
                </View>

                {/* Loading indicator or arrow */}
                {loadingPatientId === patient.id ? (
                  <ActivityIndicator size="small" color="#095c29" />
                ) : (
                  <Text style={styles.chevron}>›</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb" },
  searchWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", paddingHorizontal: 16, paddingVertical: 10 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: "#0f172a", height: 40 },
  clearBtn: { padding: 4 },
  clearBtnText: { fontSize: 20, color: "#94a3b8" },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  emptyText: { textAlign: "center", color: "#64748b", marginTop: 40, fontSize: 15 },
  card: { backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#dcfce7", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 15, fontWeight: "700", color: "#095c29" },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  cardSub: { fontSize: 13, color: "#64748b" },
  chevron: { fontSize: 22, color: "#cbd5e1", fontWeight: "300" },
});