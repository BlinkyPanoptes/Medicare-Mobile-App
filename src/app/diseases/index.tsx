import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Disease } from "@/types/disease";

export default function DiseasesScreen() {
  // Management & UI View Control States
  const [isCreating, setIsCreating] = useState(false);
  const [editingDiseaseId, setEditingDiseaseId] = useState<string | null>(null);

  // Form Inputs State Management
  const [name, setName] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local Hardcoded Mock Database Array State
  const [diseaseDatabase, setDiseaseDatabase] = useState<Disease[]>([
    {
      id: "1",
      name: "Influenza",
      symptoms:
        "Fever, chills, muscle aches, cough, congestion, runny nose, headaches, fatigue",
    },
  ]);

  // Open Form Sheet for Creating a Brand New Disease
  const openCreateForm = () => {
    setName("");
    setSymptoms("");
    setEditingDiseaseId(null);
    setIsCreating(true);
  };

  // Open Form Sheet pre-populated with Selected Disease Data for Updates
  const openEditForm = (disease: Disease) => {
    setName(disease.name);
    setSymptoms(disease.symptoms);
    setEditingDiseaseId(disease.id);
    setIsCreating(true);
  };

  const handleClearField = (field: "name" | "symptoms") => {
    if (field === "name") setName("");
    if (field === "symptoms") setSymptoms("");
  };

  // Save Actions: Handles both Creating and Updating Records
  const handleSaveSubmit = async () => {
    if (!name.trim() || !symptoms.trim()) {
      Alert.alert(
        "Missing Fields",
        "Please complete the disease name and symptoms.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingDiseaseId) {
        setDiseaseDatabase((prev) =>
          prev.map((item) =>
            item.id === editingDiseaseId ? { ...item, name, symptoms } : item,
          ),
        );

        Alert.alert(
          "Success",
          `Disease record for ${name} has been modified successfully.`,
          [{ text: "OK", onPress: () => setIsCreating(false) }],
        );
      } else {
        const newDisease: Disease = {
          id: Date.now().toString(),
          name,
          symptoms,
        };
        setDiseaseDatabase((prev) => [...prev, newDisease]);

        Alert.alert(
          "Disease Added",
          `Record saved for ${name} in the directory.`,
          [{ text: "OK", onPress: () => setIsCreating(false) }],
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Submission Error",
        "Could not process form database schema parameters.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE Handling Logic Action Process
  const handleDeleteDisease = (id: string, name: string) => {
    Alert.alert(
      "Delete Disease",
      `Are you sure you want to permanently remove the record for ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setDiseaseDatabase((prev) => prev.filter((d) => d.id !== id));
          },
        },
      ],
    );
  };

  // --- VIEW RENDER 1: Disease List View ---
  if (!isCreating) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={styles.content}
        >
          <View style={styles.listHeaderRow}>
            <Text style={styles.promptHeadline}>Disease Directory</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openCreateForm}>
              <Text style={styles.addBtnText}>+ Add Disease</Text>
            </TouchableOpacity>
          </View>

          {diseaseDatabase.length === 0 ? (
            <Text style={styles.emptyText}>
              No disease records found. Click add to begin.
            </Text>
          ) : (
            diseaseDatabase.map((disease) => (
              <View key={disease.id} style={styles.card}>
                <View style={styles.cardInfoGroup}>
                  <Text style={styles.cardNameText}>{disease.name}</Text>
                  <Text style={styles.cardSubDetails} numberOfLines={2}>
                    🩻 {disease.symptoms}
                  </Text>
                </View>

                <View style={styles.cardActionsGroup}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditForm(disease)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                      handleDeleteDisease(disease.id, disease.name)
                    }
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // --- VIEW RENDER 2: Create or Edit Form ---
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.promptHeadline}>
          {editingDiseaseId ? "Edit Disease Record" : "Add a New Disease"}
        </Text>

        {/* DISEASE NAME INPUT */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Disease Name</Text>
          <View style={styles.inputContainerRow}>
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter disease name"
              placeholderTextColor="#94a3b8"
            />
            {name.length > 0 && (
              <TouchableOpacity
                onPress={() => handleClearField("name")}
                style={styles.clearBtnClick}
              >
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* DISEASE SYMPTOMS INPUT */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Disease Symptoms</Text>
          <View style={[styles.inputContainerRow, styles.textAreaContainer]}>
            <TextInput
              style={[styles.fieldInput, styles.textArea]}
              value={symptoms}
              onChangeText={setSymptoms}
              placeholder="Describe the symptoms of this disease"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {symptoms.length > 0 && (
              <TouchableOpacity
                onPress={() => handleClearField("symptoms")}
                style={[
                  styles.clearBtnClick,
                  { alignSelf: "flex-start", marginTop: 4 },
                ]}
              >
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* INFO BOX */}
        <View style={styles.infoAlertContainerBox}>
          <Text style={styles.infoBadgeIndicatorIcon}>ⓘ</Text>
          <View style={styles.infoAlertContentBodyTextGroup}>
            <Text style={styles.infoAlertMessageTextInline}>
              Provide a clear and complete list of symptoms.
            </Text>
            <Text style={styles.infoAlertSubtextInline}>
              This information will be used as a reference during patient
              consultations and diagnosis.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* SUBMIT BUTTON */}
      <View style={styles.bottomActionBarWrapper}>
        <TouchableOpacity
          style={[
            styles.nextActionButtonCall,
            isSubmitting && { backgroundColor: "#82b27a" },
          ]}
          onPress={handleSaveSubmit}
          disabled={isSubmitting}
          activeOpacity={0.9}
        >
          <Text style={styles.nextActionButtonLabelText}>
            {isSubmitting ? "PROCESSING..." : "SAVE RECORD"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
    marginBottom: 25,
  },
  promptHeadline: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  addBtn: {
    backgroundColor: "#095c29",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 40,
    fontSize: 15,
  },
  card: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfoGroup: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  cardNameText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardSubDetails: {
    fontSize: 14,
    color: "#64748b",
  },
  cardActionsGroup: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#e2e8f0",
  },
  editButtonText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 13,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#fee2e2",
  },
  deleteButtonText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 13,
  },
  fieldWrapper: {
    marginBottom: 20,
  },
  fieldLabelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  inputContainerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 52,
  },
  textAreaContainer: {
    height: "auto",
    minHeight: 120,
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
    height: "100%",
  },
  textArea: {
    height: undefined,
    minHeight: 96,
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
  infoAlertContainerBox: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  infoBadgeIndicatorIcon: {
    fontSize: 18,
    color: "#095c29",
    fontWeight: "bold",
    marginTop: 1,
  },
  infoAlertContentBodyTextGroup: {
    flex: 1,
    gap: 8,
  },
  infoAlertMessageTextInline: {
    fontSize: 14,
    color: "#166534",
    lineHeight: 20,
    fontWeight: "500",
  },
  infoAlertSubtextInline: {
    fontSize: 13,
    color: "#3f6212",
    lineHeight: 18,
  },
  bottomActionBarWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: "#ffffff",
  },
  nextActionButtonCall: {
    backgroundColor: "#095c29",
    height: 54,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#095c29",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  nextActionButtonLabelText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
