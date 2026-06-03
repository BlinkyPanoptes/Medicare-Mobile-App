import { createPatient, deletePatient, fetchPatients, updatePatient } from "@/api/patient";
import { useAuth } from "@/components/context/auth-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type PatientRecord = {
  id: number;
  lastName: string;
  firstName: string;
  gender: "Male" | "Female";
  birthdate: string;
  email: string;
  mobileNumber: string;
};

export default function PatientRecordsScreen() {
  const { user, activeClinic } = useAuth();

  const [isCreating, setIsCreating] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);
  const [patientDatabase, setPatientDatabase] = useState<PatientRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // ✅ single declaration, inside component

  // Form Inputs
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Female");
  const [birthdate, setBirthdate] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());

  // --- DATA LOADING ---

  const loadPatients = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const response = await fetchPatients();
      // Collect all pages if paginated, or just use .data.data
      const apiData = response.data.data || [];
      const formattedData = apiData.map((p: any) => ({
        id: p.id,
        lastName: p.last_name,
        firstName: p.first_name,
        gender: p.gender ? (p.gender.charAt(0).toUpperCase() + p.gender.slice(1)) as "Male" | "Female" : "Female",
        birthdate: p.birthdate,
        email: p.email ?? "",
        mobileNumber: p.phone_number ?? "",
      }));
      setPatientDatabase(formattedData);
    } catch (error) {
      console.error("Error fetching patients:", error);
      Alert.alert("Network Error", "Could not load patients. Check your connection.");
    } finally {
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // --- SEARCH & SORT ---

  const displayedPatients = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return patientDatabase
      .filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        `${p.lastName} ${p.firstName}`.toLowerCase().includes(q)
      )
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [patientDatabase, searchQuery]);

  // --- FORM HELPERS ---

  const openCreateForm = () => {
    setLastName("");
    setFirstName("");
    setGender("Female");
    setBirthdate("");
    setDateValue(new Date());
    setEmail("");
    setMobileNumber("");
    setEditingPatientId(null);
    setIsCreating(true);
  };

  const openEditForm = (patient: PatientRecord) => {
    setLastName(patient.lastName);
    setFirstName(patient.firstName);
    setGender(patient.gender);
    setBirthdate(patient.birthdate);
    setEmail(patient.email);
    setMobileNumber(patient.mobileNumber);
    const parsedDate = Date.parse(patient.birthdate);
    setDateValue(!isNaN(parsedDate) ? new Date(parsedDate) : new Date());
    setEditingPatientId(patient.id);
    setIsCreating(true);
  };

  const handleClearField = (field: "lastName" | "firstName") => {
    if (field === "lastName") setLastName("");
    if (field === "firstName") setFirstName("");
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      setDateValue(selectedDate);
      setBirthdate(selectedDate.toISOString().split("T")[0]);
    }
  };

  // --- CRUD ACTIONS ---

  const handleSaveSubmit = async () => {
    if (!lastName.trim() || !firstName.trim() || !birthdate.trim()) {
      Alert.alert("Missing Fields", "Please complete the patient's name and birthdate.");
      return;
    }

    if (!activeClinic) {
      Alert.alert("No Clinic Selected", "Please select a clinic before adding a patient.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      last_name: lastName,
      first_name: firstName,
      gender: gender.toLowerCase(),
      birthdate,
      email,
      phone_number: mobileNumber,
      clinic_id: activeClinic?.id,
    };
    console.log("PAYLOAD:", JSON.stringify(payload));

    try {
      if (editingPatientId) {
        await updatePatient(editingPatientId, payload);
        Alert.alert("Success", `Patient data for ${firstName} ${lastName} has been updated.`, [
          { text: "OK", onPress: () => { setIsCreating(false); loadPatients(); } },
        ]);
      } else {
        await createPatient(payload);
        Alert.alert("Patient Added", `Record saved for ${firstName} ${lastName}.`, [
          { text: "OK", onPress: () => { setIsCreating(false); loadPatients(); } },
        ]);
      }
      await loadPatients();
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.message || (Object.values(err?.response?.data?.errors ?? {}) as string[][])?.[0]?.[0] ||
        "Failed to communicate with the server.";
      Alert.alert("Submission Error", serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePatient = (patientId: number, name: string) => {
    Alert.alert(
      "Delete Patient",
      `Are you sure you want to permanently remove the file records for ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePatient(patientId);
              await loadPatients();
            } catch (err) {
              Alert.alert("Error", "Could not delete patient. Please try again.");
            }
          },
        },
      ]
    );
  };

  // --- VIEW RENDER 1: Patient List ---

  if (!isCreating) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadPatients(true)}
              tintColor="#095c29"
            />
          }
        >
          {/* SEARCH BAR */}
          <View style={styles.searchBarWrapper}>
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search patients by name..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtnClick}>
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.listHeaderRow}>
            <Text style={styles.promptHeadline}>
              Registered Patients{" "}
              <Text style={styles.patientCount}>({displayedPatients.length})</Text>
            </Text>
            <TouchableOpacity style={styles.addPatientBtn} onPress={openCreateForm}>
              <Text style={styles.addPatientBtnText}>+ Add Patient</Text>
            </TouchableOpacity>
          </View>

          {displayedPatients.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchQuery ? "No patients match your search." : "No patient records found."}
            </Text>
          ) : (
            displayedPatients.map((patient) => (
              <View key={patient.id} style={styles.patientCard}>
                <View style={styles.cardInfoGroup}>
                  <Text style={styles.cardNameText}>
                    {patient.lastName}, {patient.firstName}
                  </Text>
                  <Text style={styles.cardSubDetails}>
                    {patient.gender} • DOB: {patient.birthdate}
                  </Text>
                  {patient.mobileNumber ? (
                    <Text style={styles.cardSubDetails}>📱 +63 {patient.mobileNumber}</Text>
                  ) : null}
                </View>

                <View style={styles.cardActionsGroup}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditForm(patient)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                      handleDeletePatient(
                        patient.id,
                        `${patient.firstName} ${patient.lastName}`
                      )
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

  // --- VIEW RENDER 2: Create / Edit Form ---

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.promptHeadline}>Input the details of your patient</Text>

        {/* LAST NAME */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Last Name</Text>
          <View style={styles.inputContainerRow}>
            <TextInput
              style={styles.fieldInput}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor="#94a3b8"
            />
            {lastName.length > 0 && (
              <TouchableOpacity
                onPress={() => handleClearField("lastName")}
                style={styles.clearBtnClick}
              >
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* FIRST NAME */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>First Name</Text>
          <View style={styles.inputContainerRow}>
            <TextInput
              style={styles.fieldInput}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor="#94a3b8"
            />
            {firstName.length > 0 && (
              <TouchableOpacity
                onPress={() => handleClearField("firstName")}
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
            <TouchableOpacity style={styles.radioButtonOption} onPress={() => setGender("Male")} activeOpacity={0.8}>
              <View style={[styles.outerRadioRing, gender === "Male" && styles.activeOuterRing]}>
                {gender === "Male" && <View style={styles.innerRadioDot} />}
              </View>
              <Text style={styles.radioOptionLabelText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.radioButtonOption} onPress={() => setGender("Female")} activeOpacity={0.8}>
              <View style={[styles.outerRadioRing, gender === "Female" && styles.activeOuterRing]}>
                {gender === "Female" && <View style={styles.innerRadioDot} />}
              </View>
              <Text style={styles.radioOptionLabelText}>Female</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BIRTHDATE */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Birthdate</Text>
          <TouchableOpacity style={styles.inputContainerRow} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
            <TextInput
              style={styles.fieldInput}
              value={birthdate}
              placeholder="Select patient birthdate"
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

        {/* EMAIL */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Patient's Email Address</Text>
          <View style={styles.inputContainerRow}>
            <TextInput
              style={styles.fieldInput}
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* MOBILE NUMBER */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Mobile Number</Text>
          <View style={styles.phoneInputLayoutGroup}>
            <View style={styles.countryCodeBadgePlate}>
              <Text style={styles.countryCodeBadgeLabel}>+63</Text>
            </View>
            <TextInput
              style={[styles.fieldInput, styles.phoneNumberNativeInput]}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              placeholder="917 123 4567"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* INFO BOX */}
        <View style={styles.infoAlertContainerBox}>
          <Text style={styles.infoBadgeIndicatorIcon}>ⓘ</Text>
          <View style={styles.infoAlertContentBodyTextGroup}>
            <Text style={styles.infoAlertMessageTextInline}>
              We will send a copy of the prescription to your patient's email or mobile number.
            </Text>
            <Text style={styles.infoAlertSubtextInline}>
              If email or mobile number is not available, you may still continue to create a
              prescription and send it using other sharing options.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* SAVE BUTTON */}
      <View style={styles.bottomActionBarWrapper}>
        <TouchableOpacity
          style={[styles.nextActionButtonCall, isSubmitting && { backgroundColor: "#82b27a" }]}
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
  container: { flex: 1, backgroundColor: "#ffffff" },
  scroller: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40 },
  searchBarWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    height: "100%",
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  promptHeadline: { fontSize: 20, fontWeight: "700", color: "#1e293b" },
  patientCount: { fontSize: 16, fontWeight: "500", color: "#64748b" },
  addPatientBtn: {
    backgroundColor: "#095c29",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addPatientBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  emptyText: { textAlign: "center", color: "#64748b", marginTop: 40, fontSize: 15 },
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
  cardInfoGroup: { flex: 1, gap: 4 },
  cardNameText: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  cardSubDetails: { fontSize: 14, color: "#64748b" },
  cardActionsGroup: { flexDirection: "row", gap: 8, marginLeft: 12, alignItems: "center" },
  editButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: "#e2e8f0" },
  editButtonText: { color: "#334155", fontWeight: "600", fontSize: 13 },
  deleteButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: "#fee2e2" },
  deleteButtonText: { color: "#ef4444", fontWeight: "600", fontSize: 13 },
  fieldWrapper: { marginBottom: 20 },
  fieldLabelText: { fontSize: 15, fontWeight: "600", color: "#475569", marginBottom: 8 },
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
  fieldInput: { flex: 1, fontSize: 16, color: "#0f172a", height: "100%" },
  clearBtnClick: { padding: 4, justifyContent: "center", alignItems: "center" },
  clearBtnSymbol: { fontSize: 20, color: "#94a3b8" },
  calendarInlineIcon: { fontSize: 18, color: "#94a3b8" },
  radioFlexContainer: { flexDirection: "row", alignItems: "center", gap: 28, paddingVertical: 4 },
  radioButtonOption: { flexDirection: "row", alignItems: "center", gap: 8 },
  outerRadioRing: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: "#cbd5e1", justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff",
  },
  activeOuterRing: { borderColor: "#095c29" },
  innerRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#095c29" },
  radioOptionLabelText: { fontSize: 16, color: "#334155", fontWeight: "500" },
  phoneInputLayoutGroup: { flexDirection: "row", alignItems: "center", height: 52 },
  countryCodeBadgePlate: {
    width: 65, height: "100%", backgroundColor: "#f1f5f9",
    borderWidth: 1, borderColor: "#cbd5e1",
    borderTopLeftRadius: 10, borderBottomLeftRadius: 10,
    borderRightWidth: 0, justifyContent: "center", alignItems: "center",
  },
  countryCodeBadgeLabel: { fontSize: 16, color: "#334155", fontWeight: "500" },
  phoneNumberNativeInput: {
    backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1",
    borderTopRightRadius: 10, borderBottomRightRadius: 10, paddingHorizontal: 14,
  },
  infoAlertContainerBox: {
    flexDirection: "row", backgroundColor: "#f0fdf4", borderRadius: 12,
    padding: 14, gap: 12, marginTop: 12, borderWidth: 1, borderColor: "#dcfce7",
  },
  infoBadgeIndicatorIcon: { fontSize: 18, color: "#095c29", fontWeight: "bold", marginTop: 1 },
  infoAlertContentBodyTextGroup: { flex: 1, gap: 8 },
  infoAlertMessageTextInline: { fontSize: 14, color: "#166534", lineHeight: 20, fontWeight: "500" },
  infoAlertSubtextInline: { fontSize: 13, color: "#3f6212", lineHeight: 18 },
  bottomActionBarWrapper: {
    paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12,
    backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: "#f1f5f9",
  },
  nextActionButtonCall: {
    backgroundColor: "#095c29", height: 54, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#095c29", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
  },
  nextActionButtonLabelText: { color: "#ffffff", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
});