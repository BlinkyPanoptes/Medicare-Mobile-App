import { fetchPatientConsultations } from "@/api/consultation";
import { fetchPatientById } from '@/api/patient';
import { patientDetailsStyles as styles } from "@/styles/patientRecordsStyles";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

type Consultation = {
  id: number;
  consultation_date: string;
  chief_complaint: string | null;
  notes: string | null;
  prescriptions: {
    id: number;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string | null;
    generic: { id: number; generic_name: string };
    brand: { id: number; brand_name: string };
    generic_name_snapshot?: string | null;
    brand_name_snapshot?: string | null;
  }[];
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

export default function PatientDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [patient, setPatient] = useState<any>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const [patientRes, consultRes] = await Promise.all([
          fetchPatientById(id),
          fetchPatientConsultations(Number(id)),
        ]);
        setPatient(patientRes.data.data || patientRes.data);
        const consultData = consultRes.data.data || [];
        setConsultations(consultData);
      } catch (error) {
        Alert.alert("Error", "Could not load patient details.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
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

  const latestConsultation = consultations[0] ?? null;

  // Collect active diagnoses across all consultations — deduplicated by disease_id
  const activeDiagnoses = (() => {
    const seen = new Set<number>();
    const result: {
      diagnosis_id: number;
      disease_id: number;
      disease_name: string;
      status: string;
      type: string;
      symptoms: string | null;
    }[] = [];

    [...consultations].forEach((c) => {
      if (!c.diseases) return;
      c.diseases.forEach((d) => {
        const status = d.pivot?.status;
        if (
          (status === "ongoing" || status === "referred") &&
          !seen.has(d.id)
        ) {
          seen.add(d.id);
          result.push({
            diagnosis_id: d.pivot.id,
            disease_id: d.id,
            disease_name: d.pivot.disease_name_snapshot ?? d.disease_name,
            status,
            type: d.pivot.type,
            symptoms: d.pivot.symptoms ?? null,
          });
        }
      });
    });
    return result;
  })();

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
        <Text style={styles.patientSubInfo}>
          {patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : "—"} 
          {" "} • {patient.birthdate ?? "—"}
        </Text>
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

        {/* ACTIVE DIAGNOSES */}
        {activeDiagnoses.length > 0 && (
          <>
            <View style={styles.sectionDivider} />
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Active Diagnoses</Text>
              <TouchableOpacity
                onPress={() => router.push(`/patient-records/${id}/diagnoses`)}
              >
                <Text style={styles.viewAllBtnText}>View All →</Text>
              </TouchableOpacity>
            </View>
            {activeDiagnoses.map((diag) => (
              <View
                key={diag.diagnosis_id}
                style={{
                  backgroundColor: "#fff7ed",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#fed7aa",
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a", flex: 1 }}>
                    {diag.disease_name}
                  </Text>
                  <View style={{
                    backgroundColor: diag.status === "ongoing" ? "#fef3c7" : "#e0e7ff",
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#334155" }}>
                      {diag.status.charAt(0).toUpperCase() + diag.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: "#92400e", fontWeight: "600" }}>
                  {diag.type.charAt(0).toUpperCase() + diag.type.slice(1)} diagnosis
                </Text>
                {diag.symptoms && (
                  <Text style={{ fontSize: 13, color: "#64748b", marginTop: 4, fontStyle: "italic" }}>
                    {diag.symptoms}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* PRESCRIPTION HISTORY */}
        <View style={styles.sectionDivider} />
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Latest Prescription</Text>
          {consultations.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push(`/patient-records/${id}/prescriptions`)}
            >
              <Text style={styles.viewAllBtnText}>View All History →</Text>
            </TouchableOpacity>
          )}
        </View>

        {latestConsultation && latestConsultation.prescriptions?.length > 0 ? (
          <View style={styles.prescriptionCard}>
            <View style={styles.prescriptionCardHeader}>
              <View style={styles.prescriptionBadge}>
                <Text style={styles.prescriptionBadgeText}>💊 Prescription</Text>
              </View>
              <Text style={styles.prescriptionDate}>{latestConsultation.consultation_date?.split("T")[0]}</Text>
            </View>

            <Text style={styles.prescriptionSectionLabel}>MEDICATIONS</Text>
            {latestConsultation.prescriptions.map((rx) => (
              <Text key={rx.id} style={styles.prescriptionMedItem}>
                • {rx.brand.brand_name} ({rx.generic.generic_name}) — {rx.dosage}, {rx.frequency} for {rx.duration}
              </Text>
            ))}

            {latestConsultation.chief_complaint ? (
              <>
                <Text style={[styles.prescriptionSectionLabel, { marginTop: 10 }]}>CHIEF COMPLAINT</Text>
                <Text style={styles.prescriptionNotes}>{latestConsultation.chief_complaint}</Text>
              </>
            ) : null}

            {latestConsultation.notes ? (
              <>
                <Text style={[styles.prescriptionSectionLabel, { marginTop: 10 }]}>NOTES</Text>
                <Text style={styles.prescriptionNotes}>{latestConsultation.notes}</Text>
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