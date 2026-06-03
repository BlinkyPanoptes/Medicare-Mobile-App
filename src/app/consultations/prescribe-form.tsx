import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { PatientRecord } from "@/types/patient";
import { MedicationEntry } from "@/types/transaction";

type PrescribeFormProps = {
  patient: PatientRecord;
  medications: MedicationEntry[];
  genericName: string;
  brandName: string;
  medicineDosage: string;
  prescriptionNotes: string;
  isIssuing: boolean;
  onGenericNameChange: (v: string) => void;
  onBrandNameChange: (v: string) => void;
  onDosageChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onAddMedication: () => void;
  onRemoveMedication: (index: number) => void;
  onIssuePrescription: () => void;
  onCancel: () => void;
};

export default function PrescribeForm({
  patient,
  medications,
  genericName,
  brandName,
  medicineDosage,
  prescriptionNotes,
  isIssuing,
  onGenericNameChange,
  onBrandNameChange,
  onDosageChange,
  onNotesChange,
  onAddMedication,
  onRemoveMedication,
  onIssuePrescription,
  onCancel,
}: PrescribeFormProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.patientSummaryCard}>
          <Text style={styles.patientSummaryName}>
            {patient.lastName}, {patient.firstName}
          </Text>
          <Text style={styles.patientSummaryDetails}>
            {patient.gender} • DOB: {patient.birthdate}
          </Text>
          {patient.mobileNumber ? (
            <Text style={styles.patientSummaryDetails}>
              📞 +63 {patient.mobileNumber}
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Medications</Text>

        {medications.map((med, i) => (
          <View key={i} style={styles.medicationRow}>
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>{med.genericName}</Text>
              {med.brandName ? <Text style={styles.medicationDosage}>{med.brandName}</Text> : null}
              <Text style={styles.medicationDosage}>{med.dosage}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeMedBtn}
              onPress={() => onRemoveMedication(i)}
            >
              <Text style={styles.removeMedBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.addMedicationSection}>
          <TextInput
            style={styles.medInput}
            value={genericName}
            onChangeText={onGenericNameChange}
            placeholder="Generic name"
            placeholderTextColor="#94a3b8"
          />
          <TextInput
            style={styles.medInput}
            value={brandName}
            onChangeText={onBrandNameChange}
            placeholder="Brand name (optional)"
            placeholderTextColor="#94a3b8"
          />
          <TextInput
            style={styles.medInput}
            value={medicineDosage}
            onChangeText={onDosageChange}
            placeholder="Dosage (e.g. 500mg twice daily)"
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity
            style={styles.addMedBtn}
            onPress={onAddMedication}
            activeOpacity={0.9}
          >
            <Text style={styles.addMedBtnText}>+ ADD MEDICATION</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Notes / Instructions</Text>
          <TextInput
            style={[styles.fieldInput, styles.notesInput]}
            value={prescriptionNotes}
            onChangeText={onNotesChange}
            placeholder="e.g. Take with food, complete the full course..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={styles.bottomActionBarWrapper}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.9}
        >
          <Text style={styles.cancelButtonLabelText}>CANCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.nextActionButtonCall,
            isIssuing && { backgroundColor: "#82b27a" },
          ]}
          onPress={onIssuePrescription}
          disabled={isIssuing}
          activeOpacity={0.9}
        >
          <Text style={styles.nextActionButtonLabelText}>
            {isIssuing ? "ISSUING..." : "ISSUE PRESCRIPTION"}
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
  patientSummaryCard: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  patientSummaryName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  patientSummaryDetails: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  medicationRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  medicationInfo: {
    flex: 1,
    gap: 2,
  },
  medicationName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  medicationDosage: {
    fontSize: 13,
    color: "#64748b",
  },
  removeMedBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#fee2e2",
    marginLeft: 12,
  },
  removeMedBtnText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 13,
  },
  addMedicationSection: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  medInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
    color: "#0f172a",
  },
  addMedBtn: {
    backgroundColor: "#095c29",
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addMedBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  notesInput: {
    height: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  scroller: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
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
  fieldInput: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
    height: "100%",
  },
  bottomActionBarWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  cancelButton: {
    backgroundColor: "#ffffff",
    height: 54,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginBottom: 10,
  },
  cancelButtonLabelText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
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
