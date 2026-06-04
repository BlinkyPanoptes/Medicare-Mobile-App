import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import {
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

type Medication = {
  id: string;
  brandName: string;
  genericName: string;
  dosage: string;
  quantity: string;
  sig: string;
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
  const { patientId, patientName, patientGender, patientBirthdate } =
    useLocalSearchParams<{
      patientId: string;
      patientName: string;
      patientGender: string;
      patientBirthdate: string;
    }>();

  // Header Configuration
  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Create Prescription",
      headerStyle: {
        backgroundColor: "#095c29",
      },
      headerTintColor: "#ffffff",
      headerTitleStyle: {
        fontWeight: "700",
        fontSize: 18,
      },
      headerTitleAlign: "center",
    });
  }, [navigation]);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [dosage, setDosage] = useState("");
  const [quantity, setQuantity] = useState("");
  const [sig, setSig] = useState("");
  const [instructions, setInstructions] = useState("");

  const age = patientBirthdate ? calculateAge(patientBirthdate) : null;
  const capitalizedGender = patientGender
    ? patientGender.charAt(0).toUpperCase() + patientGender.slice(1)
    : "";

  const openAddModal = () => {
    setEditingMedId(null);
    setBrandName(""); setGenericName(""); setDosage("");
    setQuantity(""); setSig(""); setInstructions("");
    setModalVisible(true);
  };

  const openEditModal = (med: Medication) => {
    setEditingMedId(med.id);
    setBrandName(med.brandName); setGenericName(med.genericName);
    setDosage(med.dosage); setQuantity(med.quantity);
    setSig(med.sig); setInstructions(med.instructions);
    setModalVisible(true);
  };

  const handleSaveMedication = () => {
    if (!brandName.trim() || !dosage.trim()) {
      Alert.alert("Missing Fields", "Brand name and dosage are required.");
      return;
    }
    const medData: Medication = {
      id: editingMedId ?? Date.now().toString(),
      brandName, genericName, dosage, quantity, sig, instructions,
    };
    if (editingMedId) {
      setMedications((prev) => prev.map((m) => m.id === editingMedId ? medData : m));
    } else {
      setMedications((prev) => [...prev, medData]);
    }
    setModalVisible(false);
  };

  const handleRemoveMedication = (id: string) => {
    Alert.alert("Remove Medication", "Remove this medication from the prescription?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => setMedications((prev) => prev.filter((m) => m.id !== id)) },
    ]);
  };

  const handleNext = async () => {
    if (medications.length === 0) {
      Alert.alert("No Medications", "Please add at least one medication.");
      return;
    }
    Alert.alert("Prescription Ready", "Prescription has been prepared successfully.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Current Prescription Information</Text>
          {medications.length === 0 ? (
            <View style={styles.emptyMedBox}>
              <Text style={styles.emptyMedText}>No medications added yet.</Text>
            </View>
          ) : (
            medications.map((med) => (
              <View key={med.id} style={styles.medCard}>
                <Text style={styles.medBrandName}>{med.brandName}</Text>
                {med.genericName ? <Text style={styles.medGenericName}>{med.genericName}</Text> : null}
                <Text style={styles.medDosage}>{med.dosage}{med.quantity ? ` #${med.quantity}` : ""}</Text>
                {med.sig ? <Text style={styles.medSig}>Sig. {med.sig}</Text> : null}
                {med.instructions ? <Text style={styles.medInstructions}>{med.instructions}</Text> : null}
                <View style={styles.medActionRow}>
                  <TouchableOpacity style={styles.changeBtn} onPress={() => openEditModal(med)}>
                    <Text style={styles.changeBtnText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveMedication(med.id)}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity style={styles.addMedBtn} onPress={openAddModal} activeOpacity={0.8}>
            <Text style={styles.addMedBtnText}>+ ADD</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveTemplateBtn} activeOpacity={0.8}>
            <Text style={styles.saveTemplateBtnText}>💾  SAVE TEMPLATE</Text>
          </TouchableOpacity>

          <Text style={styles.notesLabel}>Notes:</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add clinical notes here..."
            placeholderTextColor="#94a3b8"
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={[styles.nextBtn, isSubmitting && { backgroundColor: "#82b27a" }]} onPress={handleNext} disabled={isSubmitting} activeOpacity={0.9}>
            <Text style={styles.nextBtnText}>{isSubmitting ? "PROCESSING..." : "NEXT"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingMedId ? "Edit Medication" : "Add Medication"}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <ModalField label="Brand Name *" value={brandName} onChange={setBrandName} placeholder="e.g. Lipitor" />
              <ModalField label="Generic Name" value={genericName} onChange={setGenericName} placeholder="e.g. Atorvastatin" />
              <ModalField label="Dosage *" value={dosage} onChange={setDosage} placeholder="e.g. Tablet 20mg" />
              <ModalField label="Quantity" value={quantity} onChange={setQuantity} placeholder="e.g. 5" keyboardType="number-pad" />
              <ModalField label="Sig (Instructions)" value={sig} onChange={setSig} placeholder="e.g. 1 Tablet, once a day for 5 days" />
              <ModalField label="Additional Instructions" value={instructions} onChange={setInstructions} placeholder="e.g. Take after meals" />
            </ScrollView>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveMedication}>
              <Text style={styles.modalSaveBtnText}>Save Medication</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const ModalField = ({ label, value, onChange, placeholder, keyboardType = "default" }: any) => (
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
  patientCard: { backgroundColor: "#ffffff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, flexDirection: "row", alignItems: "center", gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  patientAvatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#fef3c7", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fde68a" },
  patientAvatarText: { fontSize: 18, fontWeight: "700", color: "#92400e" },
  patientCardInfo: { flex: 1, gap: 2 },
  patientCardCode: { fontSize: 12, color: "#94a3b8", backgroundColor: "#f1f5f9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  patientCardName: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginTop: 4 },
  patientCardSub: { fontSize: 14, color: "#64748b" },
  emptyMedBox: { backgroundColor: "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", padding: 24, alignItems: "center" },
  emptyMedText: { color: "#94a3b8", fontSize: 14, fontStyle: "italic" },
  medCard: { backgroundColor: "#ffffff", borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  medBrandName: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 2 },
  medGenericName: { fontSize: 14, color: "#64748b", marginBottom: 6 },
  medDosage: { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 2 },
  medSig: { fontSize: 14, color: "#475569", marginBottom: 2 },
  medInstructions: { fontSize: 13, color: "#64748b", fontStyle: "italic", marginBottom: 10 },
  medActionRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  changeBtn: { flex: 1, borderWidth: 1.5, borderColor: "#095c29", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  changeBtnText: { color: "#095c29", fontWeight: "600", fontSize: 14 },
  removeBtn: { flex: 1, backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  removeBtnText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },
  addMedBtn: { borderWidth: 1.5, borderColor: "#095c29", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 14 },
  addMedBtnText: { color: "#095c29", fontWeight: "700", fontSize: 15, letterSpacing: 0.5 },
  saveTemplateBtn: { borderWidth: 1.5, borderColor: "#095c29", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  saveTemplateBtnText: { color: "#095c29", fontWeight: "700", fontSize: 15, letterSpacing: 0.5 },
  notesLabel: { fontSize: 15, fontWeight: "600", color: "#475569", marginTop: 20, marginBottom: 8 },
  notesInput: { backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10, padding: 14, minHeight: 100, fontSize: 15, color: "#0f172a" },
  bottomBar: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12, backgroundColor: "#f5f7fb", borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  nextBtn: { backgroundColor: "#095c29", height: 54, borderRadius: 10, justifyContent: "center", alignItems: "center", shadowColor: "#095c29", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  nextBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700", letterSpacing: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, maxHeight: "85%" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#cbd5e1", alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 16 },
  modalFieldWrapper: { marginBottom: 14 },
  modalFieldLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  modalFieldInput: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 15, color: "#0f172a" },
  modalSaveBtn: { backgroundColor: "#095c29", height: 52, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 16 },
  modalSaveBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
});