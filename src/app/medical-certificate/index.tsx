import { useAuth } from "@/components/context/auth-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as MailComposer from "expo-mail-composer";
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

// ── Types ─────────────────────────────────────────────────────────────────────

type PatientRecord = {
  id: string;
  lastName: string;
  firstName: string;
  gender: "Male" | "Female";
  birthdate: string; // "January 25, 1954"
};

type MedicalCertificateRecord = {
  id: string;
  patientLastName: string;
  patientFirstName: string;
  patientAge: string;
  patientGender: "Male" | "Female";
  dateIssued: string;
  complaints: string;
  diagnosis: string;
  recommendation: string;
};

// ── Mock patient database (replace with real data source later) ───────────────
const MOCK_PATIENTS: PatientRecord[] = [
  {
    id: "1",
    lastName: "Soratorio",
    firstName: "Agnes",
    gender: "Female",
    birthdate: "January 25, 1954",
  },
  {
    id: "2",
    lastName: "Dela Cruz",
    firstName: "Juan",
    gender: "Male",
    birthdate: "March 10, 1990",
  },
  {
    id: "3",
    lastName: "Santos",
    firstName: "Maria",
    gender: "Female",
    birthdate: "July 4, 1985",
  },
];

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

const formatIssuedDateTime = (date: Date) => {
  const d = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const t = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  });
  return `${d}\n${t}`;
};

// ── PDF HTML Generator ────────────────────────────────────────────────────────

const generateMedicalCertificateHTML = (
  cert: MedicalCertificateRecord,
  doctorName: string,
  specialty: string,
  clinicName: string,
  clinicRoom: string,
  clinicCity: string,
  clinicProvince: string,
  clinicContact: string,
  prcNumber: string,
  issuedAt: Date,
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
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .clinic-name { font-size: 16pt; font-weight: bold; letter-spacing: 0.5px; }
    .clinic-sub { font-size: 10pt; margin-top: 2px; color: #333; }
    .doctor-name { font-size: 14pt; font-weight: bold; margin-top: 10px; }
    .doctor-specialty { font-size: 10pt; font-style: italic; color: #444; }
    .cert-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      font-size: 10pt;
      color: #444;
    }
    .cert-id { font-size: 9pt; color: #666; }
    .cert-date { text-align: right; white-space: pre-line; font-size: 10pt; }
    .title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      letter-spacing: 2px;
      text-decoration: underline;
      margin: 20px 0 24px 0;
    }
    .patient-block { margin-bottom: 20px; }
    .patient-line { font-size: 11pt; margin-bottom: 4px; }
    .patient-line span { font-weight: bold; }
    .section { margin-bottom: 18px; }
    .section-label { font-size: 12pt; font-weight: bold; margin-bottom: 6px; }
    .section-content { font-size: 11pt; line-height: 1.6; padding-left: 8px; }
    .disclaimer {
      text-align: center;
      font-size: 10pt;
      color: #444;
      margin: 28px 0 32px 0;
      font-style: italic;
    }
    .signature-block { margin-top: 40px; text-align: center; }
    .signature-line {
      width: 220px;
      border-top: 1.5px solid #000;
      margin: 0 auto 6px auto;
    }
    .signature-name { font-size: 12pt; font-weight: bold; }
    .signature-prc { font-size: 10pt; color: #444; }
    .footer-note {
      margin-top: 36px;
      border-top: 1px solid #ccc;
      padding-top: 10px;
      font-size: 8.5pt;
      color: #555;
      line-height: 1.5;
    }
    .end-tag {
      text-align: center;
      font-size: 9pt;
      color: #666;
      margin-top: 16px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-name">${clinicName}</div>
    <div class="clinic-sub">${clinicRoom}</div>
    <div class="clinic-sub">${clinicCity}, ${clinicProvince}</div>
    <div class="clinic-sub">Tel No.: ${clinicContact}</div>
    <div class="doctor-name">${doctorName}</div>
    <div class="doctor-specialty">${specialty}</div>
  </div>
  <div class="cert-meta">
    <div class="cert-id">MEDICAL CERTIFICATE ID: ${cert.id}</div>
    <div class="cert-date">${formatIssuedDateTime(issuedAt)}</div>
  </div>
  <div class="title">MEDICAL CERTIFICATE</div>
  <div class="patient-block">
    <div class="patient-line"><span>Patient:</span> ${cert.patientLastName}, ${cert.patientFirstName}</div>
    <div class="patient-line"><span>Age:</span> ${cert.patientAge} years old</div>
    <div class="patient-line"><span>Gender:</span> ${cert.patientGender}</div>
  </div>
  <div class="section">
    <div class="section-label">Complaints:</div>
    <div class="section-content">${cert.complaints}</div>
  </div>
  <div class="section">
    <div class="section-label">Diagnosis:</div>
    <div class="section-content">${cert.diagnosis}</div>
  </div>
  <div class="section">
    <div class="section-label">Recommendation:</div>
    <div class="section-content">${cert.recommendation}</div>
  </div>
  <div class="disclaimer">
    This certificate is issued upon the request of the above patient for whatever purpose it may serve,
    except for medico-legal reasons.
  </div>
  <div class="signature-block">
    <div class="signature-line"></div>
    <div class="signature-name">${doctorName}</div>
    <div class="signature-prc">PRC No.: ${prcNumber}</div>
  </div>
  <div class="footer-note">
    <strong>Note to User:</strong> The information contained in this medical certificate is confidential
    and intended solely for the named patient. Unauthorized reproduction or alteration of this document
    is strictly prohibited and may be subject to legal action.
  </div>
  <div class="end-tag">(End of Medical Certificate)</div>
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
  const [birthdate, setBirthdate] = useState("");
  const [birthdateObj, setBirthdateObj] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());

  // Certificate fields
  const [complaints, setComplaints] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Issued certificates history
  const [certificates, setCertificates] = useState<MedicalCertificateRecord[]>(
    [],
  );

  // ── Patient search filter (useMemo) ─────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) return MOCK_PATIENTS;
    return MOCK_PATIENTS.filter(
      (p) =>
        p.lastName.toLowerCase().includes(query) ||
        p.firstName.toLowerCase().includes(query),
    );
  }, [patientSearch]);

  // ── Autofill from selected patient ─────────────────────────────────────────
  const handleSelectPatient = (patient: PatientRecord) => {
    setPatientLastName(patient.lastName);
    setPatientFirstName(patient.firstName);
    setPatientGender(patient.gender);

    // Parse birthdate string back to Date object for age calculation
    const parsed = new Date(patient.birthdate);
    if (!isNaN(parsed.getTime())) {
      setBirthdateObj(parsed);
      setDateValue(parsed);
      setBirthdate(patient.birthdate);
    } else {
      // Fallback: just set the display string without age calculation
      setBirthdate(patient.birthdate);
      setBirthdateObj(null);
    }

    setShowPatientPicker(false);
    setPatientSearch("");
  };

  // ── Date picker ─────────────────────────────────────────────────────────────
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      setDateValue(selectedDate);
      setBirthdateObj(selectedDate);
      setBirthdate(formatDisplayDate(selectedDate));
    }
  };

  // ── Reset form ──────────────────────────────────────────────────────────────
  const openCreateForm = () => {
    setPatientLastName("");
    setPatientFirstName("");
    setPatientGender("Female");
    setBirthdate("");
    setBirthdateObj(null);
    setDateValue(new Date());
    setComplaints("");
    setDiagnosis("");
    setRecommendation("");
    setIsCreating(true);
  };

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const handleExportPDF = async (cert: MedicalCertificateRecord) => {
    const doctorName = user
      ? `${user.firstName} ${user.lastName}, MD`
      : "Physician";
    const specialty = user?.specialty ?? "General Practice";
    const clinicName = user?.clinic?.name ?? "CraveCare Clinic";
    const clinicRoom = user?.clinic?.room ?? "";
    const clinicCity = user?.clinic?.city ?? "";
    const clinicProvince = user?.clinic?.province ?? "";
    const clinicContact = user?.clinic?.contactNumber ?? "";
    const prcNumber = user?.prcNumber ?? "N/A";
    const issuedAt = new Date();

    const html = generateMedicalCertificateHTML(
      cert,
      doctorName,
      specialty,
      clinicName,
      clinicRoom,
      clinicCity,
      clinicProvince,
      clinicContact,
      prcNumber,
      issuedAt,
    );

    Alert.alert(
      "Export Medical Certificate",
      "Choose how to export this certificate.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "📤 Share / Print",
          onPress: async () => {
            try {
              await Print.printAsync({ html });
            } catch (err: any) {
              Alert.alert("Print Failed", err?.message ?? JSON.stringify(err));
            }
          },
        },
        {
          text: "📧 Send via Email",
          onPress: async () => {
            try {
              const { uri } = await Print.printToFileAsync({ html });
              const isAvailable = await MailComposer.isAvailableAsync();
              if (!isAvailable) {
                Alert.alert(
                  "Email Unavailable",
                  "No email client is configured on this device.",
                );
                return;
              }
              await MailComposer.composeAsync({
                subject: `Medical Certificate — ${cert.patientFirstName} ${cert.patientLastName}`,
                body: `Please find attached the medical certificate for ${cert.patientFirstName} ${cert.patientLastName}.`,
                attachments: [uri],
              });
            } catch (err) {
              Alert.alert("Email Failed", "Could not open email composer.");
            }
          },
        },
      ],
    );
  };

  // ── Issue certificate ───────────────────────────────────────────────────────
  const handleIssue = async () => {
    if (
      !patientLastName.trim() ||
      !patientFirstName.trim() ||
      !birthdate.trim() ||
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
      const age = birthdateObj ? calculateAge(birthdateObj) : 0;

      const newCert: MedicalCertificateRecord = {
        id: generateCertificateId(),
        patientLastName,
        patientFirstName,
        patientAge: age.toString(),
        patientGender,
        dateIssued: new Date().toISOString(),
        complaints,
        diagnosis,
        recommendation,
      };

      setCertificates((prev) => [newCert, ...prev]);

      Alert.alert(
        "Certificate Issued",
        `Medical certificate for ${patientFirstName} ${patientLastName} has been issued.`,
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

  // ── VIEW 1: Certificate History List ───────────────────────────────────────
  if (!isCreating) {
    return (
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
                    {cert.patientLastName}, {cert.patientFirstName}
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
    );
  }

  // ── VIEW 2: Issue Form ──────────────────────────────────────────────────────
  return (
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
              value={birthdate}
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
            {/* Modal Header */}
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

            {/* Patient Search */}
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

            {/* Patient List */}
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
                      {item.gender} • {item.birthdate}
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

  // Select patient button
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

  // OR divider
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

  // Patient picker modal
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
