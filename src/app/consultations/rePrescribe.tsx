import { fetchPatientConsultations } from "@/api/consultation";
import { fetchPatients } from "@/api/patient";
import { rePrescribeStyles as styles } from "@/styles/rePrescribeStyles";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
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

type ActiveDiagnosis = {
  diagnosis_id: number;
  disease_id: number;
  disease_name: string;
  status: "ongoing" | "referred";
  type: string;
  symptoms: string | null;
  consultation_id: number;
};

// Update existing Consultation type to include diseases
type Consultation = {
  id: number;
  consultation_date: string;
  prescriptions: Prescription[];
  diseases?: {
    id: number;
    disease_name: string;
    pivot: {
      id: number;
      type: string;
      status: string;
      symptoms: string | null;
      disease_name_snapshot: string | null;
    };
  }[];
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
      const res = await fetchPatientConsultations(patient.id);
      const consultations: Consultation[] = res.data.data ?? [];

      // Find most recent consultation with prescriptions for prefill
      const latestWithRx = consultations
      .find((c) => c.prescriptions && c.prescriptions.length > 0);

      const prefillMeds = latestWithRx
        ? latestWithRx.prescriptions.map((rx) => ({
            key: rx.id.toString(),
            generic_id: rx.generic?.id ?? 0,
            brand_id: rx.brand?.id ?? 0,
            generic_name: rx.generic?.generic_name ?? rx.generic_name_snapshot ?? "Unknown",
            brand_name: rx.brand?.brand_name ?? rx.brand_name_snapshot ?? "Unknown",
            dosage: rx.dosage,
            frequency: rx.frequency,
            duration: rx.duration,
            instructions: rx.instructions ?? "",
          }))
        : [];

      // Collect all active diagnoses (ongoing/referred) across all consultations
      const activeDiagnoses: ActiveDiagnosis[] = [];
      const seenDiseaseIds = new Set<number>();

      consultations.forEach((c) => {
      if (!c.diseases) return;
      c.diseases.forEach((d) => {
          const status = d.pivot?.status;
          const diseaseId = d.id;
          // Only include ongoing/referred, deduplicate by disease_id (keep most recent)
          if (
            (status === "ongoing" || status === "referred") &&
            !seenDiseaseIds.has(diseaseId)
          ) {
            seenDiseaseIds.add(diseaseId);
            activeDiagnoses.push({
              diagnosis_id: d.pivot.id,
              disease_id: d.id,
              disease_name: d.pivot.disease_name_snapshot ?? d.disease_name ?? "Unknown",
              status,
              type: d.pivot.type,
              symptoms: d.pivot.symptoms ?? null,
              consultation_id: c.id,
            });
          }
        });
      });

      router.push({
        pathname: "/consultations/createPrescription",
        params: {
          patientId: patient.id.toString(),
          patientName: `${patient.last_name}, ${patient.first_name}`,
          patientGender: patient.gender,
          patientBirthdate: patient.birthdate,
          prefillMeds: JSON.stringify(prefillMeds),
          prefillActiveDiagnoses: JSON.stringify(activeDiagnoses),
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