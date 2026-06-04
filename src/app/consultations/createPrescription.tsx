import apiClient from "@/api/client";
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

// — Types matching backend schema —
type Brand = {
  id: number;
  brand_name: string;
};

type Generic = {
  id: number;
  generic_name: string;
  brands: Brand[];
};

type MedicationEntry = {
  key: string;           // local UI key only, not sent to backend
  generic_id: number;
  brand_id: number;
  generic_name: string;  // display only
  brand_name: string;    // display only
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

  const { patientId, patientName, patientGender, patientBirthdate, prefillMeds } =
    useLocalSearchParams<{
      patientId: string;
      patientName: string;
      patientGender: string;
      patientBirthdate: string;
      prefillMeds?: string;  // JSON string of MedicationEntry[] — passed from represcribe
    }>();

  // — Generics loaded from API —
  const [generics, setGenerics] = useState<Generic[]>([]);
  const [genericsLoading, setGenericsLoading] = useState(true);

  // — Medications added to this consultation —
  // Initialize directly from prefillMeds if coming from represcribe flow,
  // so the list renders immediately with no empty-state flash.
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

  // — Add/Edit modal state —
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Modal form fields
  const [selectedGeneric, setSelectedGeneric] = useState<Generic | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");

  // Generic/brand picker sub-modal
  const [genericPickerVisible, setGenericPickerVisible] = useState(false);
  const [brandPickerVisible, setBrandPickerVisible] = useState(false);
  const [genericSearch, setGenericSearch] = useState("");

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

  // Load generics with nested brands on mount
  useEffect(() => {
    const loadGenerics = async () => {
      try {
        const res = await apiClient.get("/generics");
        // Handle both paginated and non-paginated response
        setGenerics(res.data.data ?? res.data);
      } catch {
        Alert.alert("Error", "Could not load medications list.");
      } finally {
        setGenericsLoading(false);
      }
    };
    loadGenerics();
  }, []);

  const filteredGenerics = generics.filter((g) =>
    g.generic_name.toLowerCase().includes(genericSearch.toLowerCase())
  );

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
    const brand = generic?.brands.find((b) => b.id === med.brand_id) ?? null;
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
      // consultation_date is set to now — no user input needed
      const consultationDate = new Date().toISOString().replace("T", " ").substring(0, 19);

      const payload = {
        patient_id: Number(patientId),
        clinic_id: activeClinic.id,
        consultation_date: consultationDate,
        chief_complaint: chiefComplaint || null,
        notes: notes || null,
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
                <Text style={styles.medDetail}>{med.dosage} — {med.frequency} for {med.duration}</Text>
                {med.instructions ? (
                  <Text style={styles.medInstructions}>📝 {med.instructions}</Text>
                ) : null}
                <View style={styles.medActionRow}>
                  <TouchableOpacity style={styles.changeBtn} onPress={() => openEditModal(med)}>
                    <Text style={styles.changeBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveMedication(med.key)}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {!genericsLoading && (
            <TouchableOpacity style={styles.addMedBtn} onPress={openAddModal} activeOpacity={0.8}>
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

              {/* GENERIC SELECTOR */}
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

              {/* BRAND SELECTOR — only active after generic is picked */}
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
                    // Reset brand if generic changes
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
              {(selectedGeneric?.brands ?? []).map((b) => (
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
      onChangeText={onChange}
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

  // Patient card
  patientCard: { backgroundColor: "#ffffff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, flexDirection: "row", alignItems: "center", gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  patientAvatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#fef3c7", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fde68a" },
  patientAvatarText: { fontSize: 18, fontWeight: "700", color: "#92400e" },
  patientCardInfo: { flex: 1, gap: 2 },
  patientCardCode: { fontSize: 12, color: "#94a3b8", backgroundColor: "#f1f5f9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  patientCardName: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginTop: 4 },
  patientCardSub: { fontSize: 14, color: "#64748b" },

  // Text areas
  textArea: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14, minHeight: 90, fontSize: 15, color: "#0f172a" },

  // Loading / empty states
  loadingBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 20, backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  loadingText: { color: "#64748b", fontSize: 14 },
  emptyMedBox: { backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", padding: 24, alignItems: "center" },
  emptyMedText: { color: "#94a3b8", fontSize: 14, fontStyle: "italic" },

  // Med cards
  medCard: { backgroundColor: "#ffffff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  medBrandName: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  medGenericName: { fontSize: 14, color: "#64748b", marginBottom: 6 },
  medDetail: { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 2 },
  medInstructions: { fontSize: 13, color: "#64748b", fontStyle: "italic", marginTop: 4 },
  medActionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  changeBtn: { flex: 1, borderWidth: 1.5, borderColor: "#095c29", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  changeBtnText: { color: "#095c29", fontWeight: "600", fontSize: 14 },
  removeBtn: { flex: 1, backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  removeBtnText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },

  // Add button
  addMedBtn: { borderWidth: 1.5, borderColor: "#095c29", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 14, marginBottom: 24 },
  addMedBtnText: { color: "#095c29", fontWeight: "700", fontSize: 15, letterSpacing: 0.5 },

  // Notes
  notesLabel: { fontSize: 15, fontWeight: "600", color: "#475569", marginBottom: 8 },

  // Bottom bar
  bottomBar: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12, backgroundColor: "#f5f7fb", borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  submitBtn: { backgroundColor: "#095c29", height: 54, borderRadius: 10, justifyContent: "center", alignItems: "center", shadowColor: "#095c29", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
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
});