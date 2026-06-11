import { fetchDiseasePatients, updateDiagnosisStatus } from "@/api/disease";
import { useAuth } from "@/components/context/auth-context";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import styles from "@/styles/diseasesStyles";

type Prescription = {
  id: number;
  generic: string;
  brand: string;
  dosage: string;
  frequency: string;
  duration: string;
};

type DiagnosisRecord = {
  diagnosis_id: number;
  status: "ongoing" | "treated" | "referred";
  type: "primary" | "secondary";
  symptoms: string | null;
  disease_name: string;
  diagnosed_at: string;
  consultation_id: number;
  patient: {
    id: number;
    first_name: string;
    last_name: string;
    gender: string;
    birthdate: string;
  };
  prescriptions: Prescription[];
};

type Disease = {
  id: number;
  disease_name: string;
  description: string | null;
  deleted_at: string | null;
};

type StatusFilter = "all" | "ongoing" | "referred" | "treated";

export default function DiseaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";

  const [disease, setDisease] = useState<Disease | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchDiseasePatients(Number(id));
      setDisease(res.data.disease);
      setDiagnoses(res.data.diagnoses);

      navigation.setOptions({
        headerTitle: res.data.disease.disease_name,
        headerStyle: { backgroundColor: "#095c29" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "700", fontSize: 18 },
        headerTitleAlign: "center",
      });
    } catch {
      Alert.alert("Error", "Could not load disease details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const filteredDiagnoses = useMemo(() => {
    if (statusFilter === "all") return diagnoses;
    return diagnoses.filter((d) => d.status === statusFilter);
  }, [diagnoses, statusFilter]);

  const handleUpdateStatus = async (
    diagnosis: DiagnosisRecord,
    newStatus: "ongoing" | "treated" | "referred"
  ) => {
    setUpdatingId(diagnosis.diagnosis_id);
    try {
      await updateDiagnosisStatus(Number(id), diagnosis.diagnosis_id, {
        status: newStatus,
      });

      setDiagnoses((prev) =>
        prev.map((d) =>
          d.diagnosis_id === diagnosis.diagnosis_id
            ? { ...d, status: newStatus }
            : d
        )
      );
      Alert.alert("Updated", `Diagnosis marked as ${newStatus}.`);
    } catch {
      Alert.alert("Error", "Could not update diagnosis status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateAge = (birthdate: string) => {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#095c29" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor="#095c29"
          />
        }
      >
        {/* DISEASE INFO CARD */}
        {disease && (
          <View style={styles.diseaseCard}>
            <Text style={styles.diseaseName}>{disease.disease_name}</Text>
            {disease.description && (
              <Text style={styles.diseaseDescription}>{disease.description}</Text>
            )}
            {disease.deleted_at && (
              <View style={styles.archivedBadge}>
                <Text style={styles.archivedBadgeText}>Archived</Text>
              </View>
            )}

            {/* Diagnosis counts */}
            <View style={styles.countRow}>
              <View style={styles.countCard}>
                <Text style={styles.countNumber}>
                  {diagnoses.filter((d) => d.status === "ongoing" || d.status === "referred").length}
                </Text>
                <Text style={styles.countLabel}>Active</Text>
              </View>
              <View style={styles.countDivider} />
              <View style={styles.countCard}>
                <Text style={styles.countNumber}>{diagnoses.length}</Text>
                <Text style={styles.countLabel}>Total</Text>
              </View>
              <View style={styles.countDivider} />
              <View style={styles.countCard}>
                <Text style={styles.countNumber}>
                  {diagnoses.filter((d) => d.status === "treated").length}
                </Text>
                <Text style={styles.countLabel}>Treated</Text>
              </View>
            </View>
          </View>
        )}

        {/* STATUS FILTER TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {(["all", "ongoing", "referred", "treated"] as StatusFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, statusFilter === f && styles.filterTabActive]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterTabText, statusFilter === f && styles.filterTabTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== "all" && (
                  ` (${diagnoses.filter((d) => d.status === f).length})`
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* PATIENT LIST */}
        <Text style={styles.sectionTitle}>
          {filteredDiagnoses.length === 0
            ? "No patients found"
            : `${filteredDiagnoses.length} patient${filteredDiagnoses.length > 1 ? "s" : ""}`}
        </Text>

        {filteredDiagnoses.map((diag) => {
          const isExpanded = expandedId === diag.diagnosis_id;
          const isUpdating = updatingId === diag.diagnosis_id;

          return (
            <View key={diag.diagnosis_id} style={styles.patientCard}>
              {/* PATIENT HEADER — tap to expand */}
              <TouchableOpacity
                style={styles.patientCardHeader}
                onPress={() =>
                  setExpandedId(isExpanded ? null : diag.diagnosis_id)
                }
                activeOpacity={0.75}
              >
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {diag.patient.first_name[0]?.toUpperCase()}
                    {diag.patient.last_name[0]?.toUpperCase()}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>
                    {diag.patient.last_name}, {diag.patient.first_name}
                  </Text>
                  <Text style={styles.patientSub}>
                    {diag.patient.gender.charAt(0).toUpperCase() +
                      diag.patient.gender.slice(1)}{" "}
                    • {calculateAge(diag.patient.birthdate)} yrs
                  </Text>
                  <Text style={styles.diagnosedDate}>
                    Diagnosed: {formatDate(diag.diagnosed_at)}
                  </Text>
                </View>

                {/* Badges */}
                <View style={styles.badgeCol}>
                  <View style={[
                    styles.typeBadge,
                    diag.type === "primary" ? styles.typePrimary : styles.typeSecondary,
                  ]}>
                    <Text style={styles.typeBadgeText}>
                      {diag.type.charAt(0).toUpperCase() + diag.type.slice(1)}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    diag.status === "ongoing"
                      ? styles.statusOngoing
                      : diag.status === "treated"
                      ? styles.statusTreated
                      : styles.statusReferred,
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {diag.status.charAt(0).toUpperCase() + diag.status.slice(1)}
                    </Text>
                  </View>
                  <Text style={styles.expandChevron}>{isExpanded ? "▲" : "▼"}</Text>
                </View>
              </TouchableOpacity>

              {/* EXPANDED — symptoms + medications + status update */}
              {isExpanded && (
                <View style={styles.expandedBody}>

                  {/* Symptoms */}
                  {diag.symptoms && (
                    <View style={styles.symptomsBox}>
                      <Text style={styles.symptomsLabel}>Patient Symptoms</Text>
                      <Text style={styles.symptomsText}>{diag.symptoms}</Text>
                    </View>
                  )}

                  {/* Prescriptions */}
                  <Text style={styles.rxTitle}>
                    Medications from this consultation
                  </Text>
                  {diag.prescriptions.length === 0 ? (
                    <Text style={styles.rxEmpty}>No medications prescribed.</Text>
                  ) : (
                    diag.prescriptions.map((rx) => (
                      <View key={rx.id} style={styles.rxCard}>
                        <Text style={styles.rxBrand}>{rx.brand}</Text>
                        <Text style={styles.rxGeneric}>{rx.generic}</Text>
                        <Text style={styles.rxDetail}>
                          {rx.dosage} — {rx.frequency} for {rx.duration}
                        </Text>
                      </View>
                    ))
                  )}

                  {/* Status update — doctor only */}
                  {isDoctor && (
                    <View style={styles.statusUpdateBox}>
                      <Text style={styles.statusUpdateLabel}>Update Status</Text>
                      <View style={styles.statusBtnRow}>
                        {(["ongoing", "treated", "referred"] as const).map((s) => (
                          <TouchableOpacity
                            key={s}
                            style={[
                              styles.statusBtn,
                              diag.status === s && styles.statusBtnActive,
                              isUpdating && styles.statusBtnDisabled,
                            ]}
                            onPress={() =>
                              diag.status !== s && handleUpdateStatus(diag, s)
                            }
                            disabled={isUpdating || diag.status === s}
                          >
                            {isUpdating && diag.status !== s ? (
                              <ActivityIndicator size="small" color="#095c29" />
                            ) : (
                              <Text style={[
                                styles.statusBtnText,
                                diag.status === s && styles.statusBtnTextActive,
                              ]}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}