import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// 1. Import the Native DateTimePicker component
import DateTimePicker from "@react-native-community/datetimepicker";

import { useAuth } from "@/components/context/auth-context";

type PatientRecord = {
  id: string;
  lastName: string;
  firstName: string;
  gender: "Male" | "Female";
  birthdate: string;
  email: string;
  mobileNumber: string;
};

export default function PatientRecordsScreen() {
  const { user } = useAuth();

  // Management & UI View Control States
  const [isCreating, setIsCreating] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);

  // Form Inputs State Management
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Female");
  const [birthdate, setBirthdate] = useState(""); 
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Added states for managing calendar visibility and date reference object
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());

  // Local Hardcoded Mock Database Array State
  const [patientDatabase, setPatientDatabase] = useState<PatientRecord[]>([
    {
      id: "1",
      lastName: "Soratorio",
      firstName: "Agnes",
      gender: "Female",
      birthdate: "January 25, 1954",
      email: "agnes.soratorio@example.com",
      mobileNumber: "9171234567",
    },
  ]);

  // Open Form Sheet for Creating a Brand New Patient
  const openCreateForm = () => {
    setLastName("");
    setFirstName("");
    setGender("Female");
    setBirthdate("");
    setDateValue(new Date()); // Reset date object
    setEmail("");
    setMobileNumber("");
    setEditingPatientId(null);
    setIsCreating(true);
  };

  // Open Form Sheet pre-populated with Selected Patient Data for Updates
  const openEditForm = (patient: PatientRecord) => {
    setLastName(patient.lastName);
    setFirstName(patient.firstName);
    setGender(patient.gender);
    setBirthdate(patient.birthdate);
    
    // Attempt to parse existing string date back into Date object if valid
    const parsedDate = Date.parse(patient.birthdate);
    setDateValue(!isNaN(parsedDate) ? new Date(parsedDate) : new Date());
    
    setEditingPatientId(patient.id);
    setIsCreating(true);
  };

  const handleClearField = (field: "lastName" | "firstName") => {
    if (field === "lastName") setLastName("");
    if (field === "firstName") setFirstName("");
  };

  // 3. Date picker change handler logic
  const onDateChange = (event: any, selectedDate?: Date) => {
    // For Android, selecting a date or closing the dialog turns off visibility
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setDateValue(selectedDate);
      
      // Format options to match your exact format: "January 25, 1954"
      const formatted = selectedDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      setBirthdate(formatted);
    }
  };

  // Save Actions: Handles both Creating and Updating Records
  const handleSaveSubmit = async () => {
    if (!lastName.trim() || !firstName.trim() || !birthdate.trim()) {
      Alert.alert("Missing Fields", "Please complete the patient's name and birthdate.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingPatientId) {
        setPatientDatabase((prev) =>
          prev.map((item) =>
            item.id === editingPatientId
              ? { ...item, lastName, firstName, gender, birthdate, email, mobileNumber }
              : item
          )
        );
        
        Alert.alert(
          "Success", 
          `Patient data for ${firstName} ${lastName} has been modified successfully.`,
          [{ text: "OK", onPress: () => setIsCreating(false) }]
        );
      } else {
        const newPatient: PatientRecord = {
          id: Date.now().toString(),
          lastName,
          firstName,
          gender,
          birthdate,
          email,
          mobileNumber,
        };
        setPatientDatabase((prev) => [...prev, newPatient]);
        
        Alert.alert(
          "Patient Added", 
          `Record saved for ${firstName} ${lastName} in the directory.`,
          [{ text: "OK", onPress: () => setIsCreating(false) }]
        );
      }
    } catch (err: any) {
      Alert.alert("Submission Error", "Could not process form database schema parameters.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE Handling Logic Action Process
  const handleDeletePatient = (id: string, name: string) => {
    Alert.alert(
      "Delete Patient",
      `Are you sure you want to permanently remove the file records for ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setPatientDatabase((prev) => prev.filter((p) => p.id !== id));
          },
        },
      ]
    );
  };

  // --- VIEW RENDER 1: Patient Management Dashboard List View ---
  if (!isCreating) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scroller} contentContainerStyle={styles.content}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.promptHeadline}>Registered Patients</Text>
            <TouchableOpacity style={styles.addPatientBtn} onPress={openCreateForm}>
              <Text style={styles.addPatientBtnText}>+ Add Patient</Text>
            </TouchableOpacity>
          </View>

          {patientDatabase.length === 0 ? (
            <Text style={styles.emptyText}>No patient records found. Click add to begin.</Text>
          ) : (
            patientDatabase.map((patient) => (
              <View key={patient.id} style={styles.patientCard}>
                <View style={styles.cardInfoGroup}>
                  <Text style={styles.cardNameText}>
                    {patient.lastName}, {patient.firstName}
                  </Text>
                  <Text style={styles.cardSubDetails}>
                    {patient.gender} • DOB: {patient.birthdate}
                  </Text>
                  {patient.mobileNumber ? (
                    <Text style={styles.cardSubDetails}>📞 +63 {patient.mobileNumber}</Text>
                  ) : null}
                </View>

                <View style={styles.cardActionsGroup}>
                  <TouchableOpacity style={styles.editButton} onPress={() => openEditForm(patient)}>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePatient(patient.id, `${patient.firstName} ${patient.lastName}`)}
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

  // --- VIEW RENDER 2: Create or Edit Dynamic Form Fields View ---
  return (
    <View style={styles.container}>
      {/* HEADER NAVBAR INTERFACE CONTROLS */}
      <View style={styles.navbarContainer}>
        <TouchableOpacity onPress={() => setIsCreating(false)} style={styles.navActionArea}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navbarTitle}>
          {editingPatientId ? "Edit Patient Details" : "Add New Patient"}
        </Text>
        <TouchableOpacity onPress={() => setIsCreating(false)} style={styles.navActionArea}>
          <Text style={styles.cancelActionText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroller} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.promptHeadline}>Input the details of your patient</Text>

        {/* LAST NAME INPUT */}
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
              <TouchableOpacity onPress={() => handleClearField("lastName")} style={styles.clearBtnClick}>
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* FIRST NAME INPUT */}
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
              <TouchableOpacity onPress={() => handleClearField("firstName")} style={styles.clearBtnClick}>
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* GENDER DYNAMIC RADIO CONTROLS */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Gender</Text>
          <View style={styles.radioFlexContainer}>
            <TouchableOpacity 
              style={styles.radioButtonOption} 
              onPress={() => setGender("Male")}
              activeOpacity={0.8}
            >
              <View style={[styles.outerRadioRing, gender === "Male" && styles.activeOuterRing]}>
                {gender === "Male" && <View style={styles.innerRadioDot} />}
              </View>
              <Text style={styles.radioOptionLabelText}>Male</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.radioButtonOption} 
              onPress={() => setGender("Female")}
              activeOpacity={0.8}
            >
              <View style={[styles.outerRadioRing, gender === "Female" && styles.activeOuterRing]}>
                {gender === "Female" && <View style={styles.innerRadioDot} />}
              </View>
              <Text style={styles.radioOptionLabelText}>Female</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BIRTHDATE INPUT CONTAINER (CHANGED TO INTERACTIVE BUTTON TIER) */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Birthdate</Text>
          <TouchableOpacity 
            style={styles.inputContainerRow} 
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <TextInput
              style={styles.fieldInput}
              value={birthdate}
              placeholder="Select patient birthdate"
              placeholderTextColor="#94a3b8"
              editable={false} // Prevents keyboard layout from opening manually
              pointerEvents="none" // Forces touch to bubble straight to the parent opacity wrapper
            />
            <Text style={styles.calendarInlineIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Conditionally injected standard platform datetime picker layer */}
        {showDatePicker && (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
            maximumDate={new Date()} // Restricts doctors from selecting future dates
          />
        )}

        {/* EMAIL ADDRESS INPUT */}
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

        {/* MOBILE NUMBER INPUT */}
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

        {/* INFORMATIONAL INFO SHEET BOX */}
        <View style={styles.infoAlertContainerBox}>
          <Text style={styles.infoBadgeIndicatorIcon}>ⓘ</Text>
          <View style={styles.infoAlertContentBodyTextGroup}>
            <Text style={styles.infoAlertMessageTextInline}>
              We will send a copy of the prescription to your patient's email or mobile number.
            </Text>
            <Text style={styles.infoAlertSubtextInline}>
              If email or mobile number is not available, you may still continue to create a prescription and send it using other sharing options.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* SUBMIT BUTTON */}
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
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  navbarContainer: {
    flexDirection: "row",
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  navActionArea: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    justifyContent: "center",
  },
  backArrowText: {
    fontSize: 24,
    color: "#095c29", 
    fontWeight: "500",
  },
  navbarTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#374151",
  },
  cancelActionText: {
    fontSize: 15,
    color: "#f87171",
    fontWeight: "500",
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
  fieldInput: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
    height: "100%",
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
  calendarInlineIcon: {
    fontSize: 18,
    color: "#94a3b8",
  },
  radioFlexContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
    paddingVertical: 4,
  },
  radioButtonOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
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
  activeOuterRing: {
    borderColor: "#095c29",
  },
  innerRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#095c29",
  },
  radioOptionLabelText: {
    fontSize: 16,
    color: "#334155",
    fontWeight: "500",
  },
  phoneInputLayoutGroup: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
  },
  countryCodeBadgePlate: {
    width: 65,
    height: "100%",
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderRightWidth: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  countryCodeBadgeLabel: {
    fontSize: 16,
    color: "#334155",
    fontWeight: "500",
  },
  phoneNumberNativeInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 14,
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