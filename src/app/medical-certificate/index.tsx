import { useAuth } from "@/components/context/auth-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Print from "expo-print";
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { MedicalCertificate } from "@/types/medical-certificate";
import { Patient } from "@/types/patient";

import { MOCK_MEDICAL_CERTIFICATES, MOCK_PATIENTS, MOCK_USER } from "@/mocks";
// ── Types ─────────────────────────────────────────────────────────────────────

const testPatients = MOCK_PATIENTS;
const testUser = MOCK_USER;
const testMedicalCertificates = MOCK_MEDICAL_CERTIFICATES;
const testClinic = testUser.clinic;

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateCertificateId = () =>
  Math.random().toString(36).substring(2, 18).toUpperCase();

const calculateAge = (birthdate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthdate.getDate())
  ) {
    age--;
  }
  return age;
};

const formatDisplayDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

// ── PDF HTML Generator ────────────────────────────────────────────────────────

const generateMedicalCertificateHTML = (
  cert: MedicalCertificate,
  doctorName: string,
  specialty: string,
  clinicName: string,
  clinicAddress: string,
  clinicContact: string,
  prcNumber: string,
): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #000;
      padding: 40px 50px;
      max-width: 700px;
      margin: 0 auto;
    }
    .doctor-name {
      font-size: 18pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 2px;
    }
    .specialty {
      font-size: 11pt;
      text-align: center;
      color: #444;
      margin-bottom: 14px;
    }
    .clinic-name {
      font-size: 12pt;
      font-weight: bold;
      text-align: center;
    }
    .clinic-detail {
      font-size: 10pt;
      text-align: center;
      color: #444;
    }
    .double-line {
      border: none;
      border-top: 3px double #000;
      margin: 14px 0;
    }
    .date-row {
      text-align: right;
      font-size: 11pt;
      margin-bottom: 20px;
    }
    .title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      letter-spacing: 2px;
      margin: 20px 0 20px 0;
    }
    .body-text {
      font-size: 12pt;
      line-height: 1.8;
      margin-bottom: 24px;
      text-align: justify;
    }
    .signature {
      text-align: right;
      margin-top: 40px;
      font-size: 12pt;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="doctor-name">${doctorName}</div>
  <div class="specialty">${specialty}</div>
  <div class="clinic-name">${clinicName}</div>
  <div class="clinic-detail">${clinicAddress}</div>
  <div class="clinic-detail">Tel No.: ${clinicContact}</div>
  <hr class="double-line" />
  <div class="date-row">Date: ${formatDisplayDate(new Date(cert.dateIssued))}</div>
  <div class="title">MEDICAL CERTIFICATE</div>
  <div class="body-text">
    To whom it may concern,<br/><br/>
    This is to certify that <strong>${cert.patient.lastName}, ${cert.patient.firstName}</strong> has consulted me on <strong>${formatDisplayDate(new Date(cert.dateIssued))}</strong> with the following diagnosis:<br/><br/>
    <strong>Diagnosis:</strong> ${cert.diagnosis}<br/><br/>
    <strong>Recommendation(s):</strong> ${cert.recommendation}<br/><br/>
    This certificate is issued upon the request of the patient.<br/>
    Thank you.
  </div>
  <div class="signature">
    ${doctorName}<br/>
    ${specialty}<br/>
    Lic No.: ${prcNumber}
  </div>
</body>
</html>
`;

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MedicalCertificateScreen() {
  const { user } = useAuth();

  const [isCreating, setIsCreating] = useState(false);

  // Patient picker modal
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  // Patient info fields
  const [patientLastName, setPatientLastName] = useState("");
  const [patientFirstName, setPatientFirstName] = useState("");
  const [patientGender, setPatientGender] = useState<"Male" | "Female">(
    "Female",
  );

  // Single source of truth for birthdate — always a Date | null
  const [birthdateObj, setBirthdateObj] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());

  // Derived display string — never stored separately
  const birthdateDisplay = birthdateObj ? formatDisplayDate(birthdateObj) : "";

  // Certificate fields
  const [complaints, setComplaints] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Issued certificates history
  const [certificates, setCertificates] = useState<MedicalCertificate[]>(
    testMedicalCertificates,
  );

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewCert, setPreviewCert] = useState<MedicalCertificate | null>(null);

  // ── Patient search filter (useMemo) ─────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) return testPatients;
    return testPatients.filter(
      (p) =>
        p.lastName.toLowerCase().includes(query) ||
        p.firstName.toLowerCase().includes(query),
    );
  }, [patientSearch]);

  // ── Autofill from selected patient ─────────────────────────────────────────
  const handleSelectPatient = (patient: Patient) => {
    setPatientLastName(patient.lastName);
    setPatientFirstName(patient.firstName);
    setPatientGender(patient.gender as "Male" | "Female");
    setBirthdateObj(patient.birthdate); // already a Date
    setDateValue(patient.birthdate); // already a Date
    setShowPatientPicker(false);
    setPatientSearch("");
  };

  // ── Date picker ─────────────────────────────────────────────────────────────
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      setBirthdateObj(selectedDate);
      setDateValue(selectedDate);
    }
  };

  // ── Reset form ──────────────────────────────────────────────────────────────
  const openCreateForm = () => {
    setPatientLastName("");
    setPatientFirstName("");
    setPatientGender("Female");
    setBirthdateObj(null);
    setDateValue(new Date());
    setComplaints("");
    setDiagnosis("");
    setRecommendation("");
    setIsCreating(true);
  };

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const handleExportPDF = (cert: MedicalCertificate) => {
    setPreviewCert(cert);
    setShowPreview(true);
  };

  const handlePrint = async () => {
    if (!previewCert) return;

    const doctorName = user
      ? `${user.firstName} ${user.lastName}`
      : "Physician";
    const specialty = user?.specialty ?? "General Practice";
    const clinicName = user?.clinic?.name ?? "Clinic";
    const clinicAddress = user?.clinic?.address ?? "";
    const clinicContact = user?.clinic?.contactNumber ?? "";
    const prcNumber = user?.prcNumber ?? "N/A";

    const html = generateMedicalCertificateHTML(
      previewCert,
      doctorName,
      specialty,
      clinicName,
      clinicAddress,
      clinicContact,
      prcNumber,
    );

    try {
      await Print.printAsync({ html });
    } catch (err: any) {
      Alert.alert("Print Failed", err?.message ?? JSON.stringify(err));
    }
  };

  // ── Issue certificate ───────────────────────────────────────────────────────
  const handleIssue = async () => {
    if (
      !patientLastName.trim() ||
      !patientFirstName.trim() ||
      !birthdateObj || // check the Date object, not a string
      !complaints.trim() ||
      !diagnosis.trim() ||
      !recommendation.trim()
    ) {
      Alert.alert(
        "Missing Fields",
        "Please complete all fields before issuing.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const age = calculateAge(birthdateObj);

      const newCert: MedicalCertificate = {
        id: generateCertificateId(),
        type: "medical-certificate",
        createdBy: testUser,
        dateIssued: new Date(),
        patient: {
          id: generateCertificateId(),
          createdBy: testUser,
          firstName: patientFirstName.trim(),
          lastName: patientLastName.trim(),
          gender: patientGender,
          birthdate: birthdateObj,
          email: "",
          phoneNumber: "",
          clinic: testClinic!,
        },
        complaints,
        diagnosis,
        recommendation,
      };

      setCertificates((prev) => [newCert, ...prev]);

      Alert.alert(
        "Certificate Issued",
        `Medical certificate for ${newCert.patient.firstName} ${newCert.patient.lastName} has been issued.`,
        [
          {
            text: "Export PDF",
            onPress: () => {
              setIsCreating(false);
              handleExportPDF(newCert);
            },
          },
          { text: "Done", onPress: () => setIsCreating(false) },
        ],
      );
    } catch (err) {
      Alert.alert("Error", "Could not issue the certificate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {!isCreating ? (
        <View style={styles.container}>
          <ScrollView
            style={styles.scroller}
            contentContainerStyle={styles.content}
          >
            <View style={styles.listHeaderRow}>
              <Text style={styles.promptHeadline}>Medical Certificates</Text>
              <TouchableOpacity style={styles.addBtn} onPress={openCreateForm}>
                <Text style={styles.addBtnText}>+ Issue New</Text>
              </TouchableOpacity>
            </View>

            {certificates.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📄</Text>
                <Text style={styles.emptyText}>No certificates issued yet.</Text>
                <Text style={styles.emptySubtext}>
                  Tap "+ Issue New" to create a medical certificate.
                </Text>
              </View>
            ) : (
              certificates.map((cert) => (
                <View key={cert.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardName}>
                      {cert.patient.lastName}, {cert.patient.firstName}
                    </Text>
                    <Text style={styles.cardDate}>
                      {formatDisplayDate(new Date(cert.dateIssued))}
                    </Text>
                  </View>
                  <Text style={styles.cardDetail} numberOfLines={1}>
                    🩺 {cert.diagnosis}
                  </Text>
                  <Text style={styles.cardDetail} numberOfLines={1}>
                    📋 {cert.recommendation}
                  </Text>
                  <Text style={styles.cardId}>ID: {cert.id}</Text>
                  <TouchableOpacity
                    style={styles.exportBtn}
                    onPress={() => handleExportPDF(cert)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.exportBtnText}>📤 Export PDF</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.container}>
          <ScrollView
            style={styles.scroller}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.promptHeadline}>Issue a Medical Certificate</Text>

        {/* SELECT PATIENT BUTTON */}
        <TouchableOpacity
          style={styles.selectPatientBtn}
          onPress={() => setShowPatientPicker(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.selectPatientIcon}>👤</Text>
          <Text style={styles.selectPatientText}>
            Select from Patient Records
          </Text>
          <Text style={styles.selectPatientChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.orDivider}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or enter manually</Text>
          <View style={styles.orLine} />
        </View>

        {/* LAST NAME */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Patient's Last Name</Text>
          <View style={styles.inputContainerRow}>
            <TextInput
              style={styles.fieldInput}
              value={patientLastName}
              onChangeText={setPatientLastName}
              placeholder="Enter last name"
              placeholderTextColor="#94a3b8"
            />
            {patientLastName.length > 0 && (
              <TouchableOpacity
                onPress={() => setPatientLastName("")}
                style={styles.clearBtnClick}
              >
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* FIRST NAME */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Patient's First Name</Text>
          <View style={styles.inputContainerRow}>
            <TextInput
              style={styles.fieldInput}
              value={patientFirstName}
              onChangeText={setPatientFirstName}
              placeholder="Enter first name"
              placeholderTextColor="#94a3b8"
            />
            {patientFirstName.length > 0 && (
              <TouchableOpacity
                onPress={() => setPatientFirstName("")}
                style={styles.clearBtnClick}
              >
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* GENDER */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Gender</Text>
          <View style={styles.radioFlexContainer}>
            {(["Male", "Female"] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={styles.radioButtonOption}
                onPress={() => setPatientGender(g)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.outerRadioRing,
                    patientGender === g && styles.activeOuterRing,
                  ]}
                >
                  {patientGender === g && <View style={styles.innerRadioDot} />}
                </View>
                <Text style={styles.radioOptionLabelText}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* BIRTHDATE */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>
            Date of Birth{" "}
            {birthdateObj && (
              <Text style={styles.ageInline}>
                ({calculateAge(birthdateObj)} years old)
              </Text>
            )}
          </Text>
          <TouchableOpacity
            style={styles.inputContainerRow}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <TextInput
              style={styles.fieldInput}
              value={birthdateDisplay} // derived from birthdateObj
              placeholder="Select date of birth"
              placeholderTextColor="#94a3b8"
              editable={false}
              pointerEvents="none"
            />
            <Text style={styles.calendarInlineIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* COMPLAINTS */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Complaints</Text>
          <View style={[styles.inputContainerRow, styles.textAreaContainer]}>
            <TextInput
              style={[styles.fieldInput, styles.textArea]}
              value={complaints}
              onChangeText={setComplaints}
              placeholder="Patient's chief complaints (e.g. fever and nasal catarrh)"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* DIAGNOSIS */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Diagnosis</Text>
          <View style={[styles.inputContainerRow, styles.textAreaContainer]}>
            <TextInput
              style={[styles.fieldInput, styles.textArea]}
              value={diagnosis}
              onChangeText={setDiagnosis}
              placeholder="Clinical diagnosis (e.g. Upper Respiratory Tract Infection)"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* RECOMMENDATION */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Recommendation</Text>
          <View style={[styles.inputContainerRow, styles.textAreaContainer]}>
            <TextInput
              style={[styles.fieldInput, styles.textArea]}
              value={recommendation}
              onChangeText={setRecommendation}
              placeholder="Doctor's recommendation (e.g. rest for 5 days)"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* INFO BOX */}
        <View style={styles.infoAlertContainerBox}>
          <Text style={styles.infoBadgeIndicatorIcon}>ⓘ</Text>
          <View style={styles.infoAlertContentBodyTextGroup}>
            <Text style={styles.infoAlertMessageTextInline}>
              Issuing this certificate will generate a unique certificate ID.
            </Text>
            <Text style={styles.infoAlertSubtextInline}>
              After issuing, you can export the certificate as a PDF to print,
              share, or send via email.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ISSUE BUTTON */}
      <View style={styles.bottomActionBarWrapper}>
        <TouchableOpacity
          style={[
            styles.nextActionButtonCall,
            isSubmitting && { backgroundColor: "#82b27a" },
          ]}
          onPress={handleIssue}
          disabled={isSubmitting}
          activeOpacity={0.9}
        >
          <Text style={styles.nextActionButtonLabelText}>
            {isSubmitting ? "ISSUING..." : "ISSUE CERTIFICATE"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* PATIENT PICKER MODAL */}
      <Modal
        visible={showPatientPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPatientPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Patient</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPatientPicker(false);
                  setPatientSearch("");
                }}
              >
                <Text style={styles.modalDoneText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Text style={styles.modalSearchIcon}>🔍</Text>
              <TextInput
                style={styles.modalSearchInput}
                value={patientSearch}
                onChangeText={setPatientSearch}
                placeholder="Search by name..."
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
              {patientSearch.length > 0 && (
                <TouchableOpacity
                  onPress={() => setPatientSearch("")}
                  style={styles.clearBtnClick}
                >
                  <Text style={styles.clearBtnSymbol}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredPatients}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.modalEmptyText}>
                  No patients match "{patientSearch}".
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.patientPickerRow}
                  onPress={() => handleSelectPatient(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.patientPickerAvatar}>
                    <Text style={styles.patientPickerAvatarText}>
                      {item.firstName[0]}
                      {item.lastName[0]}
                    </Text>
                  </View>
                  <View style={styles.patientPickerInfo}>
                    <Text style={styles.patientPickerName}>
                      {item.lastName}, {item.firstName}
                    </Text>
                    <Text style={styles.patientPickerSub}>
                      {item.gender} • {formatDisplayDate(item.birthdate)}
                    </Text>
                  </View>
                  <Text style={styles.patientPickerChevron}>›</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
        </View>
      )}
      {showPreview && previewCert && (
        <Modal
          visible={showPreview}
          animationType="slide"
          transparent
          onRequestClose={() => setShowPreview(false)}
        >
          <View style={styles.previewOverlay}>
            <View style={styles.previewSheet}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>Preview</Text>
                <TouchableOpacity onPress={() => setShowPreview(false)}>
                  <Text style={styles.previewCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.previewContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.previewDoctorName}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text style={styles.previewSpecialty}>
                  {user?.specialty ?? "General Practice"}
                </Text>
                <Text style={styles.previewClinicName}>
                  {user?.clinic?.name}
                </Text>
                <Text style={styles.previewClinicDetail}>
                  {user?.clinic?.address}
                </Text>
                <Text style={styles.previewClinicDetail}>
                  Tel No.: {user?.clinic?.contactNumber}
                </Text>
                <View style={styles.previewDoubleLine} />
                <Text style={styles.previewDate}>
                  Date: {formatDisplayDate(new Date(previewCert.dateIssued))}
                </Text>
                <Text style={styles.previewTitleText}>
                  MEDICAL CERTIFICATE
                </Text>
                <View style={styles.previewBody}>
                  <Text style={styles.previewBodyText}>
                    To whom it may concern,{"\n\n"}
                    This is to certify that{" "}
                    <Text style={styles.previewBold}>
                      {previewCert.patient.lastName},{" "}
                      {previewCert.patient.firstName}
                    </Text>{" "}
                    has consulted me on{" "}
                    <Text style={styles.previewBold}>
                      {formatDisplayDate(
                        new Date(previewCert.dateIssued),
                      )}
                    </Text>{" "}
                    with the following diagnosis:
                    {"\n\n"}
                    <Text style={styles.previewBold}>Diagnosis:</Text>{" "}
                    {previewCert.diagnosis}
                    {"\n\n"}
                    <Text style={styles.previewBold}>
                      Recommendation(s):
                    </Text>{" "}
                    {previewCert.recommendation}
                    {"\n\n"}
                    This certificate is issued upon the request of the
                    patient.
                    {"\n"}
                    Thank you.
                  </Text>
                </View>
                <View style={styles.previewSignature}>
                  <Text style={styles.previewSignatureText}>
                    {user?.firstName} {user?.lastName}
                    {"\n"}
                    {user?.specialty ?? "General Practice"}
                    {"\n"}
                    Lic No.: {user?.prcNumber ?? "N/A"}
                  </Text>
                </View>
              </ScrollView>
              <View style={styles.previewFooter}>
                <TouchableOpacity
                  style={styles.previewBackBtn}
                  onPress={() => setShowPreview(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.previewBackBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.previewPrintBtn}
                  onPress={handlePrint}
                  activeOpacity={0.8}
                >
                  <Text style={styles.previewPrintBtnText}>Print</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  scroller: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40 },

  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  promptHeadline: { fontSize: 20, fontWeight: "700", color: "#1e293b" },
  addBtn: {
    backgroundColor: "#095c29",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  emptyState: { alignItems: "center", marginTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  emptySubtext: { fontSize: 14, color: "#64748b", textAlign: "center" },

  card: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  cardName: { fontSize: 16, fontWeight: "700", color: "#0f172a", flex: 1 },
  cardDate: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
    marginLeft: 8,
  },
  cardDetail: { fontSize: 13, color: "#475569", lineHeight: 18 },
  cardId: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  exportBtn: {
    marginTop: 10,
    backgroundColor: "#095c29",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  exportBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  selectPatientBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1.5,
    borderColor: "#095c29",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  selectPatientIcon: { fontSize: 18 },
  selectPatientText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#095c29",
  },
  selectPatientChevron: { fontSize: 20, color: "#095c29", fontWeight: "600" },

  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  orLine: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  orText: { fontSize: 13, color: "#94a3b8", fontWeight: "500" },

  fieldWrapper: { marginBottom: 20 },
  fieldLabelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  ageInline: { fontSize: 13, fontWeight: "400", color: "#095c29" },
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
    minHeight: 90,
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  fieldInput: { flex: 1, fontSize: 16, color: "#0f172a", height: "100%" },
  textArea: { height: undefined, minHeight: 66 },
  clearBtnClick: { padding: 4, justifyContent: "center", alignItems: "center" },
  clearBtnSymbol: { fontSize: 20, color: "#94a3b8" },
  calendarInlineIcon: { fontSize: 18, color: "#94a3b8" },

  radioFlexContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
    paddingVertical: 4,
  },
  radioButtonOption: { flexDirection: "row", alignItems: "center", gap: 8 },
  outerRadioRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  activeOuterRing: { borderColor: "#095c29" },
  innerRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#095c29",
  },
  radioOptionLabelText: { fontSize: 16, color: "#334155", fontWeight: "500" },

  infoAlertContainerBox: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  infoBadgeIndicatorIcon: {
    fontSize: 18,
    color: "#095c29",
    fontWeight: "bold",
    marginTop: 1,
  },
  infoAlertContentBodyTextGroup: { flex: 1, gap: 8 },
  infoAlertMessageTextInline: {
    fontSize: 14,
    color: "#166534",
    lineHeight: 20,
    fontWeight: "500",
  },
  infoAlertSubtextInline: { fontSize: 13, color: "#3f6212", lineHeight: 18 },

  bottomActionBarWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
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

  // Preview modal
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  previewSheet: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  previewTitle: { fontSize: 17, fontWeight: "700", color: "#1e293b" },
  previewCloseText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#095c29",
  },
  previewContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  previewDoctorName: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#0f172a",
    marginBottom: 2,
  },
  previewSpecialty: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    color: "#475569",
    marginBottom: 16,
  },
  previewClinicName: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    color: "#334155",
  },
  previewClinicDetail: {
    fontSize: 11,
    textAlign: "center",
    color: "#64748b",
  },
  previewDoubleLine: {
    borderTopWidth: 3,
    borderTopColor: "#000",
    marginVertical: 14,
  },
  previewDate: {
    fontSize: 11,
    textAlign: "right",
    color: "#475569",
    marginBottom: 16,
  },
  previewTitleText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 2,
    color: "#0f172a",
    marginBottom: 16,
  },
  previewBody: { marginBottom: 24 },
  previewBodyText: {
    fontSize: 12,
    lineHeight: 22,
    color: "#1e293b",
    textAlign: "justify",
  },
  previewBold: { fontWeight: "700" },
  previewSignature: {
    alignItems: "flex-end",
    marginTop: 20,
    marginBottom: 8,
  },
  previewSignatureText: {
    fontSize: 12,
    lineHeight: 20,
    color: "#0f172a",
    textAlign: "right",
  },
  previewFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: "#f8fafc",
  },
  previewBackBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  previewBackBtnText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 15,
  },
  previewPrintBtn: {
    flex: 1,
    backgroundColor: "#095c29",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  previewPrintBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#1e293b" },
  modalDoneText: { fontSize: 15, fontWeight: "700", color: "#ef4444" },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 12,
  },
  modalSearchIcon: { fontSize: 16, marginRight: 8 },
  modalSearchInput: { flex: 1, fontSize: 15, color: "#0f172a", height: "100%" },
  modalEmptyText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 30,
    fontSize: 14,
  },

  patientPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  patientPickerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#095c29",
    justifyContent: "center",
    alignItems: "center",
  },
  patientPickerAvatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  patientPickerInfo: { flex: 1, gap: 3 },
  patientPickerName: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  patientPickerSub: { fontSize: 13, color: "#64748b" },
  patientPickerChevron: { fontSize: 22, color: "#cbd5e1", fontWeight: "400" },
});
