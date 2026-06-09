import { fetchPatientDiagnoses } from "@/api/patient";
import { prescriptionHistoryStyles as styles } from "@/styles/prescriptionHistoryStyles";
import { useLocalSearchParams, useNavigation } from "expo-router";
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
  disease_id: number;
  disease_name: string;
  type: "primary" | "secondary";
  status: "ongoing" | "treated" | "referred";
  symptoms: string | null;
  diagnosed_at: string;
  consultation_id: number;
  chief_complaint: string | null;
  notes: string | null;
  prescriptions: Prescription[];
};

type StatusFilter = "all" | "ongoing" | "referred" | "treated";

export default function DiagnosisHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const [diagnoses, setDiagnoses] = useState<DiagnosisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Diagnosis History",
      headerStyle: { backgroundColor: "#095c29" },
      headerTintColor: "#ffffff",
      headerTitleStyle: { fontWeight: "700", fontSize: 18 },
      headerTitleAlign: "center",
    });
  }, [navigation]);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const res = await fetchPatientDiagnoses(Number(id));
        setDiagnoses(res.data ?? []);
      } catch {
        Alert.alert("Error", "Could not load diagnosis history.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const filtered = useMemo(() => {
    return diagnoses.filter((d) => {
      const matchesSearch =
        searchQuery === "" ||
        d.disease_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.symptoms?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.chief_complaint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.prescriptions.some(
          (rx) =>
            rx.generic.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rx.brand.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesDate =
        dateFilter === "" || d.diagnosed_at.startsWith(dateFilter);

      const matchesStatus =
        statusFilter === "all" || d.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [diagnoses, searchQuery, dateFilter, statusFilter]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#095c29" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* SEARCH */}
        <View style={styles.historySearchWrapper}>
          <TextInput
            style={styles.historySearchInput}
            placeholder="Search by disease, symptoms, or medications..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* DATE FILTER */}
        <View style={styles.historyDateFilterWrapper}>
          <TextInput
            style={styles.historyDateFilterInput}
            placeholder="Filter by date (YYYY-MM-DD)"
            placeholderTextColor="#94a3b8"
            value={dateFilter}
            onChangeText={setDateFilter}
          />
        </View>

        {/* STATUS FILTER */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {(["all", "ongoing", "referred", "treated"] as StatusFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setStatusFilter(f)}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 16,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: statusFilter === f ? "#095c29" : "#e2e8f0",
                backgroundColor: statusFilter === f ? "#095c29" : "#ffffff",
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: "600",
                color: statusFilter === f ? "#ffffff" : "#64748b",
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== "all" && ` (${diagnoses.filter((d) => d.status === f).length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.resultsCount}>
          {filtered.length} diagnosis{filtered.length !== 1 ? "es" : ""} found
        </Text>

        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No diagnoses match your search.</Text>
          </View>
        ) : (
          filtered.map((d) => (
            <View key={d.diagnosis_id} style={styles.historyCard}>

              {/* HEADER */}
              <View style={styles.cardHeader}>
                <View style={[
                  styles.badge,
                  {
                    backgroundColor:
                      d.status === "ongoing"
                        ? "#fef3c7"
                        : d.status === "treated"
                        ? "#dcfce7"
                        : "#e0e7ff",
                  },
                ]}>
                  <Text style={[styles.badgeText, {
                    color:
                      d.status === "ongoing"
                        ? "#92400e"
                        : d.status === "treated"
                        ? "#166534"
                        : "#3730a3",
                  }]}>
                    {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                  </Text>
                </View>
                <Text style={styles.cardDate}>
                  {d.diagnosed_at?.split("T")[0]}
                </Text>
              </View>

              {/* DISEASE NAME + TYPE */}
              <Text style={[styles.historySectionLabel, { marginTop: 8 }]}>
                DIAGNOSIS
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 2 }}>
                {d.disease_name}
              </Text>
              <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                {d.type.charAt(0).toUpperCase() + d.type.slice(1)} diagnosis
              </Text>

              {/* SYMPTOMS */}
              {d.symptoms && (
                <>
                  <Text style={styles.historySectionLabel}>PATIENT SYMPTOMS</Text>
                  <Text style={styles.historyNotes}>{d.symptoms}</Text>
                </>
              )}

              {/* CHIEF COMPLAINT */}
              {d.chief_complaint && (
                <>
                  <Text style={styles.historySectionLabel}>CHIEF COMPLAINT</Text>
                  <Text style={styles.historyNotes}>{d.chief_complaint}</Text>
                </>
              )}

              {/* MEDICATIONS */}
              {d.prescriptions.length > 0 && (
                <>
                  <Text style={styles.historySectionLabel}>MEDICATIONS</Text>
                  {d.prescriptions.map((rx) => (
                    <Text key={rx.id} style={styles.historyMedItem}>
                      • {rx.brand} ({rx.generic}) — {rx.dosage}, {rx.frequency} for {rx.duration}
                    </Text>
                  ))}
                </>
              )}

              {/* NOTES */}
              {d.notes && (
                <>
                  <Text style={styles.historySectionLabel}>NOTES</Text>
                  <Text style={styles.historyNotes}>{d.notes}</Text>
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}