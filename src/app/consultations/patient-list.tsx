import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { IssuedPrescription, MedicationEntry } from "@/types/transaction";
import { PatientRecord } from "@/types/patient";

type PatientListProps = {
  patients: PatientRecord[];
  prescriptionHistory: Record<string, IssuedPrescription[]>;
  onAddPatient: () => void;
  onEditPatient: (patient: PatientRecord) => void;
  onDeletePatient: (id: string, name: string) => void;
  onSelectPatient: (patient: PatientRecord) => void;
};

export default function PatientList({
  patients,
  prescriptionHistory,
  onAddPatient,
  onEditPatient,
  onDeletePatient,
  onSelectPatient,
}: PatientListProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.content}
      >
        <View style={styles.listHeaderRow}>
          <Text style={styles.promptHeadline}>Registered Patients</Text>
          <TouchableOpacity
            style={styles.addPatientBtn}
            onPress={onAddPatient}
          >
            <Text style={styles.addPatientBtnText}>+ Add Patient</Text>
          </TouchableOpacity>
        </View>

        {patients.length === 0 ? (
          <Text style={styles.emptyText}>
            No patient records found. Click add to begin.
          </Text>
        ) : (
          patients.map((patient) => (
            <TouchableOpacity
              key={patient.id}
              style={styles.patientCard}
              activeOpacity={0.85}
              onPress={() => onSelectPatient(patient)}
            >
              <View style={styles.cardInfoGroup}>
                <Text style={styles.cardNameText}>
                  {patient.lastName}, {patient.firstName}
                </Text>
                <Text style={styles.cardSubDetails}>
                  {patient.gender} • DOB: {patient.birthdate}
                </Text>
                {patient.mobileNumber ? (
                  <Text style={styles.cardSubDetails}>
                    📞 +63 {patient.mobileNumber}
                  </Text>
                ) : null}
                {prescriptionHistory[patient.id]?.length > 0 && (
                  <View style={styles.cardRxHistory}>
                    {prescriptionHistory[patient.id]
                      .slice()
                      .reverse()
                      .slice(0, 1)
                      .map((rx, i) => (
                        <View key={i}>
                          {rx.medications.map((med, j) => (
                            <Text key={j} style={styles.cardRxText}>
                              💊 {med.genericName}{med.brandName ? ` (${med.brandName})` : ""} — {med.dosage}
                            </Text>
                          ))}
                          {rx.notes ? (
                            <Text style={styles.cardRxNotes}>
                              📝 {rx.notes}
                            </Text>
                          ) : null}
                        </View>
                      ))}
                  </View>
                )}
              </View>

              <View style={styles.cardActionsGroup}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => onEditPatient(patient)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() =>
                    onDeletePatient(
                      patient.id,
                      `${patient.firstName} ${patient.lastName}`,
                    )
                  }
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  addPatientBtn: {
    backgroundColor: "#095c29",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addPatientBtnText: {
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
  patientCard: {
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
  cardRxHistory: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  cardRxText: {
    fontSize: 13,
    color: "#095c29",
    fontWeight: "600",
    marginTop: 2,
  },
  cardRxNotes: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
    fontStyle: "italic",
  },
  cardActionsGroup: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
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
});
