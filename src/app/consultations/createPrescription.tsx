import apiClient from "@/api/client";
import { createDisease, fetchDiseases } from "@/api/disease";
import { useAuth } from "@/components/context/auth-context";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// — Types —
type Brand = {
  id: number;
  brand_name: string;
};

type Generic = {
  id: number;
  generic_name: string;
  brands: Brand[];
};

type Disease = {
  id: number;
  disease_name: string;
  description: string | null;
};

type DiagnosisEntry = {
  key: string;
  disease_id: number;
  disease_name: string;
  type: "primary" | "secondary";
  symptoms: string;
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

type MedicationEntry = {
  key: string;
  generic_id: number;
  brand_id: number;
  generic_name: string;
  brand_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function CreatePrescriptionScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { activeClinic, user } = useAuth();

  const { patientId, patientName, patientGender, patientBirthdate, prefillMeds, prefillActiveDiagnoses } =
    useLocalSearchParams<{
      patientId: string;
      patientName: string;
      patientGender: string;
      patientBirthdate: string;
      prefillMeds?: string;
      prefillActiveDiagnoses?: string;
    }>();

  // — Generics + Brands —
  const [generics, setGenerics] = useState<Generic[]>([]);
  const [brands, setBrands] = useState<(Brand & { generic_id: number })[]>([]);
  const [genericsLoading, setGenericsLoading] = useState(true);

  // — Diseases —
  const [diseases, setDiseases] = useState<Disease[]>([]);

  // — Active diagnoses from previous consultations (represcribe flow) —
  const [activeDiagnoses, setActiveDiagnoses] = useState<ActiveDiagnosis[]>(() => {
    if (!prefillActiveDiagnoses) return [];
    try {
      return JSON.parse(prefillActiveDiagnoses as string) as ActiveDiagnosis[];
    } catch {
      return [];
    }
  });
  const [updatingDiagnosisId, setUpdatingDiagnosisId] = useState<number | null>(null);

  // — New diagnoses for this consultation —
  const [diagnoses, setDiagnoses] = useState<DiagnosisEntry[]>([]);

  // — Medications —
  const [medications, setMedications] = useState<MedicationEntry[]>(() => {
    if (!prefillMeds) return [];
    try {
      return JSON.parse(prefillMeds as string) as MedicationEntry[];
    } catch {
      return [];
    }
  });

  const [notes, setNotes] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // — Medication modal —
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [selectedGeneric, setSelectedGeneric] = useState<Generic | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [genericPickerVisible, setGenericPickerVisible] = useState(false);
  const [brandPickerVisible, setBrandPickerVisible] = useState(false);
  const [genericSearch, setGenericSearch] = useState("");

  // — Disease modal —
  const [diseaseModalVisible, setDiseaseModalVisible] = useState(false);
  const [diseaseSearch, setDiseaseSearch] = useState("");
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [diagnosisType, setDiagnosisType] = useState<"primary" | "secondary">("primary");
  const [diagnosisSymptoms, setDiagnosisSymptoms] = useState("");
  const [editingDiagnosisKey, setEditingDiagnosisKey] = useState<string | null>(null);

  // — Inline create disease inside disease modal —
  const [showCreateDisease, setShowCreateDisease] = useState(false);
  const [newDiseaseName, setNewDiseaseName] = useState("");
  const [newDiseaseDescription, setNewDiseaseDescription] = useState("");
  const [newDiseaseSymptoms, setNewDiseaseSymptoms] = useState("");
  const [creatingDisease, setCreatingDisease] = useState(false);

  const age = patientBirthdate ? calculateAge(patientBirthdate) : null;
  const capitalizedGender = patientGender
    ? patientGender.charAt(0).toUpperCase() + patientGender.slice(1)
    : "";

  useEffect(() => {
    navigation.setOptions({
      headerTitle: prefillMeds ? "Represcribe" : "Create Prescription",
      headerStyle: { backgroundColor: "#095c29" },
      headerTintColor: "#ffffff",
      headerTitleStyle: { fontWeight: "700", fontSize: 18 },
      headerTitleAlign: "center",
    });
  }, [navigation]);

  // Load generics, brands, diseases on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [genericsRes, brandsRes, diseasesRes] = await Promise.all([
          apiClient.get("/generics"),
          apiClient.get("/brands"),
          fetchDiseases(),
        ]);
        setGenerics(genericsRes.data.data ?? genericsRes.data);
        setBrands(brandsRes.data.data ?? brandsRes.data);
        setDiseases(diseasesRes.data.data ?? diseasesRes.data);
      } catch {
        Alert.alert("Error", "Could not load medications or diseases list.");
      } finally {
        setGenericsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredGenerics = generics.filter((g) =>
    g.generic_name.toLowerCase().includes(genericSearch.toLowerCase())
  );

  const filteredBrands = selectedGeneric
    ? brands.filter((b) => b.generic_id === selectedGeneric.id)
    : [];

  const filteredDiseases = diseases.filter((d) =>
    d.disease_name.toLowerCase().includes(diseaseSearch.toLowerCase())
  );

  // — Medication handlers —
  const openAddModal = () => {
    setEditingKey(null);
    setSelectedGeneric(null);
    setSelectedBrand(null);
    setDosage("");
    setFrequency("");
    setDuration("");
    setInstructions("");
    setModalVisible(true);
  };

  const openEditModal = (med: MedicationEntry) => {
    setEditingKey(med.key);
    const generic = generics.find((g) => g.id === med.generic_id) ?? null;
    const brand = brands.find((b) => b.id === med.brand_id) ?? null;
    setSelectedGeneric(generic);
    setSelectedBrand(brand);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setDuration(med.duration);
    setInstructions(med.instructions);
    setModalVisible(true);
  };

  const handleSaveMedication = () => {
    if (!selectedGeneric || !selectedBrand) {
      Alert.alert("Missing Fields", "Please select a generic and brand.");
      return;
    }
    if (!dosage.trim() || !frequency.trim() || !duration.trim()) {
      Alert.alert("Missing Fields", "Dosage, frequency, and duration are required.");
      return;
    }
    const entry: MedicationEntry = {
      key: editingKey ?? Date.now().toString(),
      generic_id: selectedGeneric.id,
      brand_id: selectedBrand.id,
      generic_name: selectedGeneric.generic_name,
      brand_name: selectedBrand.brand_name,
      dosage,
      frequency,
      duration,
      instructions,
    };
    if (editingKey) {
      setMedications((prev) => prev.map((m) => m.key === editingKey ? entry : m));
    } else {
      setMedications((prev) => [...prev, entry]);
    }
    setModalVisible(false);
  };

  const handleRemoveMedication = (key: string) => {
    Alert.alert("Remove Medication", "Remove this medication from the prescription?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setMedications((prev) => prev.filter((m) => m.key !== key)),
      },
    ]);
  };

  // — Disease handlers —
  const openAddDiseaseModal = () => {
    setEditingDiagnosisKey(null);
    setSelectedDisease(null);
    setDiagnosisType("primary");
    setDiagnosisSymptoms("");
    setDiseaseSearch("");
    setShowCreateDisease(false);
    setNewDiseaseName("");
    setNewDiseaseDescription("");
    setNewDiseaseSymptoms("");
    setDiseaseModalVisible(true);
  };

  const openEditDiseaseModal = (diagnosis: DiagnosisEntry) => {
    setEditingDiagnosisKey(diagnosis.key);
    const disease = diseases.find((d) => d.id === diagnosis.disease_id) ?? null;
    setSelectedDisease(disease);
    setDiagnosisType(diagnosis.type);
    setDiagnosisSymptoms(diagnosis.symptoms);
    setDiseaseSearch("");
    setShowCreateDisease(false);
    setDiseaseModalVisible(true);
  };

  const handleSaveDiagnosis = () => {
    if (!selectedDisease) {
      Alert.alert("Missing Fields", "Please select a disease.");
      return;
    }

    // Prevent duplicate disease in same consultation
    const isDuplicate = diagnoses.some(
      (d) => d.disease_id === selectedDisease.id && d.key !== editingDiagnosisKey
    );
    if (isDuplicate) {
      Alert.alert("Duplicate", "This disease has already been added to this consultation.");
      return;
    }

    const entry: DiagnosisEntry = {
      key: editingDiagnosisKey ?? Date.now().toString(),
      disease_id: selectedDisease.id,
      disease_name: selectedDisease.disease_name,
      type: diagnosisType,
      symptoms: diagnosisSymptoms,
    };

    if (editingDiagnosisKey) {
      setDiagnoses((prev) => prev.map((d) => d.key === editingDiagnosisKey ? entry : d));
    } else {
      setDiagnoses((prev) => [...prev, entry]);
    }
    setDiseaseModalVisible(false);
  };

  const handleRemoveDiagnosis = (key: string) => {
    Alert.alert("Remove Diagnosis", "Remove this diagnosis from the consultation?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setDiagnoses((prev) => prev.filter((d) => d.key !== key)),
      },
    ]);
  };

  const handleCreateDisease = async () => {
    if (!newDiseaseName.trim()) {
      Alert.alert("Missing Fields", "Disease name is required.");
      return;
    }
    setCreatingDisease(true);
    try {
      const res = await createDisease({
        disease_name: newDiseaseName.trim(),
        description: newDiseaseDescription.trim() || null,
        symptoms: newDiseaseSymptoms.trim() || null,
      });
      const created: Disease = res.data.disease;

      // Add to local list and auto-select it
      setDiseases((prev) => [...prev, created]);
      setSelectedDisease(created);
      setShowCreateDisease(false);
      setNewDiseaseName("");
      setNewDiseaseDescription("");
      setNewDiseaseSymptoms("");
      Alert.alert("Success", `"${created.disease_name}" created and selected.`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (Object.values(error.response?.data?.errors ?? {}) as string[][])?.[0]?.[0] ||
        "Could not create disease.";
      Alert.alert("Error", message);
    } finally {
      setCreatingDisease(false);
    }
  };

  // — Update active diagnosis status —
  const handleUpdateDiagnosisStatus = async (
    diagnosis: ActiveDiagnosis,
    newStatus: "ongoing" | "treated" | "referred"
  ) => {
    setUpdatingDiagnosisId(diagnosis.diagnosis_id);
    try {
      await apiClient.patch(
        `/diseases/${diagnosis.disease_id}/diagnoses/${diagnosis.diagnosis_id}`,
        { status: newStatus }
      );
      setActiveDiagnoses((prev) =>
        prev.map((d) =>
          d.diagnosis_id === diagnosis.diagnosis_id ? { ...d, status: newStatus as any } : d
        )
      );
      // Remove from active list if marked as treated
      if (newStatus === "treated") {
        setActiveDiagnoses((prev) =>
          prev.filter((d) => d.diagnosis_id !== diagnosis.diagnosis_id)
        );
      }
      Alert.alert("Updated", `Diagnosis marked as ${newStatus}.`);
    } catch {
      Alert.alert("Error", "Could not update diagnosis status.");
    } finally {
      setUpdatingDiagnosisId(null);
    }
  };

  // — Submit —
  const handleSubmit = async () => {
    if (medications.length === 0) {
      Alert.alert("No Medications", "Please add at least one medication.");
      return;
    }
    if (!activeClinic) {
      Alert.alert("No Clinic", "No active clinic selected.");
      return;
    }

    setIsSubmitting(true);
    try {
      const consultationDate = new Date().toISOString().replace("T", " ").substring(0, 19);

      const payload = {
        patient_id: Number(patientId),
        clinic_id: activeClinic.id,
        consultation_date: consultationDate,
        chief_complaint: chiefComplaint || null,
        notes: notes || null,
        diseases: diagnoses.map((d) => ({
          disease_id: d.disease_id,
          type: d.type,
          status: "ongoing",
          symptoms: d.symptoms || null,
        })),
        prescriptions: medications.map((m) => ({
          generic_id: m.generic_id,
          brand_id: m.brand_id,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions || null,
        })),
      };

      await apiClient.post("/consultations", payload);
      Alert.alert("Success", "Consultation and prescription saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (Object.values(err?.response?.data?.errors ?? {}) as string[][])?.[0]?.[0] ||
        "Failed to save consultation.";
      Alert.alert("Error", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* PATIENT CARD */}
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.patientCard}>
            <View style={styles.patientAvatarCircle}>
              <Text style={styles.patientAvatarText}>
                {(patientName?.split(",")[1]?.trim()[0] ?? "").toUpperCase()}
                {(patientName?.split(",")[0]?.trim()[0] ?? "").toUpperCase()}
              </Text>
            </View>
            <View style={styles.patientCardInfo}>
              <Text style={styles.patientCardCode}>Patient ID: {patientId}</Text>
              <Text style={styles.patientCardName}>{patientName}</Text>
              <Text style={styles.patientCardSub}>
                {capitalizedGender}{age !== null ? ` • ${age} years old` : ""}
              </Text>
            </View>
          </View>

          {/* CHIEF COMPLAINT */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Chief Complaint</Text>
          <TextInput
            style={styles.textArea}
            value={chiefComplaint}
            onChangeText={setChiefComplaint}
            placeholder="e.g. Fever and headache for 3 days"
            placeholderTextColor="#94a3b8"
            multiline
            textAlignVertical="top"
          />

          {/* ACTIVE DIAGNOSES — represcribe flow only */}
          {activeDiagnoses.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Active Diagnoses</Text>
              <Text style={styles.sectionSubtitle}>
                From previous consultations. Update status if condition has changed.
              </Text>
              {activeDiagnoses.map((diag) => (
                <View key={diag.diagnosis_id} style={styles.activeDiagCard}>
                  <View style={styles.activeDiagHeader}>
                    <Text style={styles.activeDiagName}>{diag.disease_name}</Text>
                    <View style={[
                      styles.statusBadge,
                      diag.status === "ongoing" ? styles.statusOngoing : styles.statusReferred
                    ]}>
                      <Text style={styles.statusBadgeText}>{diag.status}</Text>
                    </View>
                  </View>
                  {diag.symptoms ? (
                    <Text style={styles.activeDiagSymptoms}>{diag.symptoms}</Text>
                  ) : null}
                  <Text style={styles.activeDiagType}>
                    {diag.type.charAt(0).toUpperCase() + diag.type.slice(1)} diagnosis
                  </Text>

                  {/* Status update buttons */}
                  <View style={styles.diagStatusRow}>
                    {diag.status !== "treated" && (
                      <TouchableOpacity
                        style={styles.diagStatusBtn}
                        disabled={updatingDiagnosisId === diag.diagnosis_id}
                        onPress={() => handleUpdateDiagnosisStatus(diag, "treated")}
                      >
                        {updatingDiagnosisId === diag.diagnosis_id ? (
                          <ActivityIndicator size="small" color="#095c29" />
                        ) : (
                          <Text style={styles.diagStatusBtnText}>✓ Treated</Text>
                        )}
                      </TouchableOpacity>
                    )}
                    {diag.status !== "referred" && (
                      <TouchableOpacity
                        style={[styles.diagStatusBtn, styles.diagStatusBtnSecondary]}
                        disabled={updatingDiagnosisId === diag.diagnosis_id}
                        onPress={() => handleUpdateDiagnosisStatus(diag, "referred")}
                      >
                        <Text style={[styles.diagStatusBtnText, styles.diagStatusBtnTextSecondary]}>
                          → Refer
                        </Text>
                      </TouchableOpacity>
                    )}
                    {diag.status === "referred" && (
                      <TouchableOpacity
                        style={[styles.diagStatusBtn, { borderColor: "#64748b" }]}
                        disabled={updatingDiagnosisId === diag.diagnosis_id}
                        onPress={() => handleUpdateDiagnosisStatus(diag, "ongoing")}
                      >
                        <Text style={[styles.diagStatusBtnText, { color: "#64748b" }]}>
                          ↩ Ongoing
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* NEW DIAGNOSES */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            Diagnoses <Text style={styles.optionalTag}>(Optional)</Text>
          </Text>

          {diagnoses.length === 0 ? (
            <View style={styles.emptyMedBox}>
              <Text style={styles.emptyMedText}>No diagnoses added yet.</Text>
            </View>
          ) : (
            diagnoses.map((diag) => (
              <View key={diag.key} style={styles.medCard}>
                <View style={styles.activeDiagHeader}>
                  <Text style={styles.medBrandName}>{diag.disease_name}</Text>
                  <View style={[styles.statusBadge, styles.statusOngoing]}>
                    <Text style={styles.statusBadgeText}>{diag.type}</Text>
                  </View>
                </View>
                {diag.symptoms ? (
                  <Text style={styles.medGenericName}>{diag.symptoms}</Text>
                ) : null}
                <View style={styles.medActionRow}>
                  <TouchableOpacity
                    style={styles.changeBtn}
                    onPress={() => openEditDiseaseModal(diag)}
                  >
                    <Text style={styles.changeBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveDiagnosis(diag.key)}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.addMedBtn}
            onPress={openAddDiseaseModal}
            activeOpacity={0.8}
          >
            <Text style={styles.addMedBtnText}>+ ADD DIAGNOSIS</Text>
          </TouchableOpacity>

          {/* MEDICATIONS */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Medications</Text>

          {genericsLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#095c29" />
              <Text style={styles.loadingText}>Loading medications...</Text>
            </View>
          ) : medications.length === 0 ? (
            <View style={styles.emptyMedBox}>
              <Text style={styles.emptyMedText}>No medications added yet.</Text>
            </View>
          ) : (
            medications.map((med) => (
              <View key={med.key} style={styles.medCard}>
                <Text style={styles.medBrandName}>{med.brand_name}</Text>
                <Text style={styles.medGenericName}>{med.generic_name}</Text>
                <Text style={styles.medDetail}>
                  {med.dosage} — {med.frequency} for {med.duration}
                </Text>
                {med.instructions ? (
                  <Text style={styles.medInstructions}>📝 {med.instructions}</Text>
                ) : null}
                <View style={styles.medActionRow}>
                  <TouchableOpacity style={styles.changeBtn} onPress={() => openEditModal(med)}>
                    <Text style={styles.changeBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveMedication(med.key)}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {!genericsLoading && (
            <TouchableOpacity
              style={styles.addMedBtn}
              onPress={openAddModal}
              activeOpacity={0.8}
            >
              <Text style={styles.addMedBtnText}>+ ADD MEDICATION</Text>
            </TouchableOpacity>
          )}

          {/* NOTES */}
          <Text style={styles.notesLabel}>Notes</Text>
          <TextInput
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add clinical notes here..."
            placeholderTextColor="#94a3b8"
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        {/* SUBMIT */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { backgroundColor: "#82b27a" }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.9}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? "SAVING..." : "SAVE CONSULTATION"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ADD / EDIT MEDICATION MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editingKey ? "Edit Medication" : "Add Medication"}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalFieldLabel}>Generic Name *</Text>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setGenericPickerVisible(true)}
              >
                <Text style={selectedGeneric ? styles.selectorBtnText : styles.selectorBtnPlaceholder}>
                  {selectedGeneric ? selectedGeneric.generic_name : "Select a generic..."}
                </Text>
                <Text style={styles.selectorChevron}>▾</Text>
              </TouchableOpacity>

              <Text style={[styles.modalFieldLabel, { marginTop: 14 }]}>Brand Name *</Text>
              <TouchableOpacity
                style={[styles.selectorBtn, !selectedGeneric && styles.selectorBtnDisabled]}
                onPress={() => selectedGeneric && setBrandPickerVisible(true)}
                activeOpacity={selectedGeneric ? 0.75 : 1}
              >
                <Text style={selectedBrand ? styles.selectorBtnText : styles.selectorBtnPlaceholder}>
                  {selectedBrand
                    ? selectedBrand.brand_name
                    : selectedGeneric
                    ? "Select a brand..."
                    : "Pick a generic first"}
                </Text>
                <Text style={styles.selectorChevron}>▾</Text>
              </TouchableOpacity>

              <ModalField label="Dosage *" value={dosage} onChange={setDosage} placeholder="e.g. 500mg" />
              <ModalField label="Frequency *" value={frequency} onChange={setFrequency} placeholder="e.g. 3x a day" />
              <ModalField label="Duration *" value={duration} onChange={setDuration} placeholder="e.g. 7 days" />
              <ModalField label="Instructions (optional)" value={instructions} onChange={setInstructions} placeholder="e.g. Take after meals" />
            </ScrollView>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveMedication}>
              <Text style={styles.modalSaveBtnText}>Save Medication</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* GENERIC PICKER */}
      <Modal
        visible={genericPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGenericPickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setGenericPickerVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Generic</Text>
            <TextInput
              style={styles.pickerSearch}
              placeholder="Search generics..."
              placeholderTextColor="#94a3b8"
              value={genericSearch}
              onChangeText={setGenericSearch}
            />
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              {filteredGenerics.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.pickerItem,
                    selectedGeneric?.id === g.id && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedGeneric(g);
                    setSelectedBrand(null);
                    setGenericSearch("");
                    setGenericPickerVisible(false);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    selectedGeneric?.id === g.id && styles.pickerItemTextSelected,
                  ]}>
                    {g.generic_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* BRAND PICKER */}
      <Modal
        visible={brandPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBrandPickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setBrandPickerVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Brand</Text>
            <Text style={styles.pickerSubtitle}>
              Brands for: {selectedGeneric?.generic_name}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              {filteredBrands.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.pickerItem,
                    selectedBrand?.id === b.id && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedBrand(b);
                    setBrandPickerVisible(false);
                  }}
                >
                  <Text style={[
                    styles.pickerItemText,
                    selectedBrand?.id === b.id && styles.pickerItemTextSelected,
                  ]}>
                    {b.brand_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* DISEASE PICKER MODAL */}
      <Modal
        visible={diseaseModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDiseaseModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDiseaseModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editingDiagnosisKey ? "Edit Diagnosis" : "Add Diagnosis"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {!showCreateDisease ? (
                <>
                  {/* Disease search + list */}
                  <Text style={styles.modalFieldLabel}>Disease *</Text>
                  <TextInput
                    style={styles.pickerSearch}
                    placeholder="Search diseases..."
                    placeholderTextColor="#94a3b8"
                    value={diseaseSearch}
                    onChangeText={setDiseaseSearch}
                  />

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: 180 }}
                    nestedScrollEnabled
                  >
                    {filteredDiseases.length === 0 ? (
                      <Text style={styles.emptyMedText}>No diseases found.</Text>
                    ) : (
                      filteredDiseases.map((d) => (
                        <TouchableOpacity
                          key={d.id}
                          style={[
                            styles.pickerItem,
                            selectedDisease?.id === d.id && styles.pickerItemSelected,
                          ]}
                          onPress={() => setSelectedDisease(d)}
                        >
                          <Text style={[
                            styles.pickerItemText,
                            selectedDisease?.id === d.id && styles.pickerItemTextSelected,
                          ]}>
                            {d.disease_name}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>

                  {/* Create new disease shortcut */}
                  <TouchableOpacity
                    style={styles.createDiseaseLink}
                    onPress={() => setShowCreateDisease(true)}
                  >
                    <Text style={styles.createDiseaseLinkText}>
                      + Create new disease
                    </Text>
                  </TouchableOpacity>

                  {/* Type selector */}
                  <Text style={[styles.modalFieldLabel, { marginTop: 14 }]}>
                    Diagnosis Type *
                  </Text>
                  <View style={styles.typeRow}>
                    {(["primary", "secondary"] as const).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.typeBtn,
                          diagnosisType === t && styles.typeBtnActive,
                        ]}
                        onPress={() => setDiagnosisType(t)}
                      >
                        <Text style={[
                          styles.typeBtnText,
                          diagnosisType === t && styles.typeBtnTextActive,
                        ]}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Symptoms */}
                  <Text style={[styles.modalFieldLabel, { marginTop: 14 }]}>
                    Symptoms (optional)
                  </Text>
                  <TextInput
                    style={[styles.modalFieldInput, { height: 80 }]}
                    value={diagnosisSymptoms}
                    onChangeText={setDiagnosisSymptoms}
                    placeholder="e.g. High fever, productive cough"
                    placeholderTextColor="#94a3b8"
                    multiline
                    textAlignVertical="top"
                  />
                </>
              ) : (
                <>
                  {/* Inline create disease form */}
                  <View style={styles.createDiseaseHeader}>
                    <Text style={styles.modalTitle}>New Disease</Text>
                    <TouchableOpacity onPress={() => setShowCreateDisease(false)}>
                      <Text style={styles.cancelCreateText}>← Back</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalFieldLabel}>Disease Name *</Text>
                  <TextInput
                    style={styles.modalFieldInput}
                    value={newDiseaseName}
                    onChangeText={setNewDiseaseName}
                    placeholder="e.g. Pneumonia"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={[styles.modalFieldLabel, { marginTop: 12 }]}>
                    Description (optional)
                  </Text>
                  <TextInput
                    style={[styles.modalFieldInput, { height: 70 }]}
                    value={newDiseaseDescription}
                    onChangeText={setNewDiseaseDescription}
                    placeholder="Brief description of the disease"
                    placeholderTextColor="#94a3b8"
                    multiline
                    textAlignVertical="top"
                  />

                  <Text style={[styles.modalFieldLabel, { marginTop: 12 }]}>
                    General Symptoms (optional)
                  </Text>
                  <TextInput
                    style={[styles.modalFieldInput, { height: 70 }]}
                    value={newDiseaseSymptoms}
                    onChangeText={setNewDiseaseSymptoms}
                    placeholder="e.g. Fever, cough, fatigue"
                    placeholderTextColor="#94a3b8"
                    multiline
                    textAlignVertical="top"
                  />

                  <TouchableOpacity
                    style={[styles.modalSaveBtn, creatingDisease && { opacity: 0.6 }]}
                    onPress={handleCreateDisease}
                    disabled={creatingDisease}
                  >
                    <Text style={styles.modalSaveBtnText}>
                      {creatingDisease ? "Creating..." : "Create Disease"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>

            {!showCreateDisease && (
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveDiagnosis}
              >
                <Text style={styles.modalSaveBtnText}>Save Diagnosis</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const ModalField = ({
  label, value, onChange, placeholder, keyboardType = "default",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
}) => (
  <View style={styles.modalFieldWrapper}>
    <Text style={styles.modalFieldLabel}>{label}</Text>
    <TextInput
      style={styles.modalFieldInput}
      value={value}
      onChange={(e) => onChange(e.nativeEvent.text)}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      keyboardType={keyboardType}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fb" },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 12 },
  sectionSubtitle: { fontSize: 13, color: "#64748b", marginBottom: 12, marginTop: -8 },
  optionalTag: { fontSize: 13, fontWeight: "400", color: "#94a3b8" },

  // Patient card
  patientCard: { backgroundColor: "#ffffff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  patientAvatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#fef3c7", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fde68a" },
  patientAvatarText: { fontSize: 18, fontWeight: "700", color: "#92400e" },
  patientCardInfo: { flex: 1, gap: 2 },
  patientCardCode: { fontSize: 12, color: "#94a3b8", backgroundColor: "#f1f5f9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  patientCardName: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginTop: 4 },
  patientCardSub: { fontSize: 14, color: "#64748b" },

  // Active diagnosis cards
  activeDiagCard: { backgroundColor: "#fff7ed", borderRadius: 12, borderWidth: 1, borderColor: "#fed7aa", padding: 14, marginBottom: 10 },
  activeDiagHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  activeDiagName: { fontSize: 15, fontWeight: "700", color: "#0f172a", flex: 1 },
  activeDiagSymptoms: { fontSize: 13, color: "#64748b", marginBottom: 4, fontStyle: "italic" },
  activeDiagType: { fontSize: 12, color: "#92400e", fontWeight: "600" },
  diagStatusRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  diagStatusBtn: { flex: 1, borderWidth: 1.5, borderColor: "#095c29", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  diagStatusBtnSecondary: { borderColor: "#f59e0b", },
  diagStatusBtnText: { color: "#095c29", fontWeight: "600", fontSize: 13 },
  diagStatusBtnTextSecondary: { color: "#f59e0b" },

  // Status badges
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusOngoing: { backgroundColor: "#dcfce7" },
  statusReferred: { backgroundColor: "#fef9c3" },
  statusBadgeText: { fontSize: 11, fontWeight: "700", color: "#166534" },

  // Text areas
  textArea: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14, minHeight: 90, fontSize: 15, color: "#0f172a" },

  // Loading / empty
  loadingBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 20, backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  loadingText: { color: "#64748b", fontSize: 14 },
  emptyMedBox: { backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", padding: 24, alignItems: "center" },
  emptyMedText: { color: "#94a3b8", fontSize: 14, fontStyle: "italic" },

  // Med cards
  medCard: { backgroundColor: "#ffffff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, marginBottom: 12 },
  medBrandName: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  medGenericName: { fontSize: 14, color: "#64748b", marginBottom: 6 },
  medDetail: { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 2 },
  medInstructions: { fontSize: 13, color: "#64748b", fontStyle: "italic", marginTop: 4 },
  medActionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  changeBtn: { flex: 1, borderWidth: 1.5, borderColor: "#095c29", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  changeBtnText: { color: "#095c29", fontWeight: "600", fontSize: 14 },
  removeBtn: { flex: 1, backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  removeBtnText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },

  // Add buttons
  addMedBtn: { borderWidth: 1.5, borderColor: "#095c29", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 8, marginBottom: 8 },
  addMedBtnText: { color: "#095c29", fontWeight: "700", fontSize: 15, letterSpacing: 0.5 },

  // Notes
  notesLabel: { fontSize: 15, fontWeight: "600", color: "#475569", marginBottom: 8, marginTop: 24 },

  // Bottom bar
  bottomBar: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12, backgroundColor: "#f5f7fb", borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  submitBtn: { backgroundColor: "#095c29", height: 54, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  submitBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700", letterSpacing: 1 },

  // Modals
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, maxHeight: "85%" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#cbd5e1", alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 16 },
  modalFieldWrapper: { marginBottom: 14, marginTop: 4 },
  modalFieldLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  modalFieldInput: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 15, color: "#0f172a" },
  modalSaveBtn: { backgroundColor: "#095c29", height: 52, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 16 },
  modalSaveBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },

  // Selectors
  selectorBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 14, height: 48 },
  selectorBtnDisabled: { opacity: 0.5 },
  selectorBtnText: { fontSize: 15, color: "#0f172a", flex: 1 },
  selectorBtnPlaceholder: { fontSize: 15, color: "#94a3b8", flex: 1 },
  selectorChevron: { fontSize: 14, color: "#94a3b8", marginLeft: 8 },

  // Pickers
  pickerSearch: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 14, height: 44, fontSize: 15, color: "#0f172a", marginBottom: 12 },
  pickerSubtitle: { fontSize: 13, color: "#64748b", marginBottom: 12 },
  pickerItem: { paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  pickerItemSelected: { backgroundColor: "#f0fdf4" },
  pickerItemText: { fontSize: 15, color: "#334155" },
  pickerItemTextSelected: { color: "#095c29", fontWeight: "700" },

  // Disease create
  createDiseaseLink: { paddingVertical: 12, alignItems: "center" },
  createDiseaseLinkText: { color: "#095c29", fontWeight: "600", fontSize: 14 },
  createDiseaseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cancelCreateText: { color: "#095c29", fontSize: 14, fontWeight: "600" },

  // Diagnosis type selector
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", backgroundColor: "#f8fafc" },
  typeBtnActive: { backgroundColor: "#095c29", borderColor: "#095c29" },
  typeBtnText: { fontWeight: "600", color: "#64748b", fontSize: 14 },
  typeBtnTextActive: { color: "#ffffff" },
});