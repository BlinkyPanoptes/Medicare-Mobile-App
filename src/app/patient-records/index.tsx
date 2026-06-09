import { useRouter } from "expo-router";
import { createPatient, deletePatient, fetchPatients, updatePatient } from "@/api/patient";
import { useAuth } from "@/components/context/auth-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
  Alert, Platform, RefreshControl, ScrollView,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { patientRecordsStyles as styles } from "@/styles/patientRecordsStyles";

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
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);
  const [patientDatabase, setPatientDatabase] = useState<PatientRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Female");
  const [birthdate, setBirthdate] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());

  const loadPatients = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const response = await fetchPatients();
      const apiData = response.data.data || [];
      const formattedData = apiData.map((p: any) => ({
        id: p.id,
        lastName: p.last_name,
        firstName: p.first_name,
        gender: p.gender
          ? (p.gender.charAt(0).toUpperCase() + p.gender.slice(1)) as "Male" | "Female"
          : "Female",
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

  useEffect(() => { loadPatients(); }, []);

  const displayedPatients = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return patientDatabase
      .filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        `${p.lastName} ${p.firstName}`.toLowerCase().includes(q)
      )
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [patientDatabase, searchQuery]);

  const openCreateForm = () => {
    setLastName(""); setFirstName(""); setGender("Female");
    setBirthdate(""); setDateValue(new Date()); setEmail(""); setMobileNumber("");
    setEditingPatientId(null); setIsCreating(true);
  };

  const openEditForm = (patient: PatientRecord) => {
    setLastName(patient.lastName); setFirstName(patient.firstName);
    setGender(patient.gender); setBirthdate(patient.birthdate);
    setEmail(patient.email); setMobileNumber(patient.mobileNumber);
    const parsedDate = Date.parse(patient.birthdate);
    setDateValue(!isNaN(parsedDate) ? new Date(parsedDate) : new Date());
    setEditingPatientId(patient.id); setIsCreating(true);
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
      last_name: lastName, first_name: firstName,
      gender: gender.toLowerCase(), birthdate, email,
      phone_number: mobileNumber, clinic_id: activeClinic?.id,
    };
    try {
      if (editingPatientId) {
        // EDIT: update and return to list
        await updatePatient(editingPatientId, payload);
        Alert.alert("Success", `Patient data for ${firstName} ${lastName} has been updated.`, [
          { text: "OK", onPress: () => { setIsCreating(false); loadPatients(); } },
        ]);
        await loadPatients();
      } else {
        // CREATE: save patient
        const response = await createPatient(payload);
        const newPatient = response.data.patient;

        if (user?.role === "doctor") {
          // Doctors go straight to createPrescription with the new patient's data
          router.replace({
            pathname: "/consultations/createPrescription",
            params: {
              patientId: newPatient.id.toString(),
              patientName: `${newPatient.last_name}, ${newPatient.first_name}`,
              patientGender: newPatient.gender,
              patientBirthdate: newPatient.birthdate,
            },
          });
        } else {
          // Assistants just return to the patient list
          Alert.alert("Patient Added", `Record saved for ${firstName} ${lastName}.`, [
            { text: "OK", onPress: () => { setIsCreating(false); loadPatients(); } },
          ]);
        }
      }
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.message ||
        (Object.values(err?.response?.data?.errors ?? {}) as string[][])?.[0]?.[0] ||
        "Failed to communicate with the server.";
      Alert.alert("Submission Error", serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePatient = (patientId: number, name: string) => {
    Alert.alert("Delete Patient", `Are you sure you want to permanently remove the file records for ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await deletePatient(patientId);
            await loadPatients();
          } catch (err) {
            Alert.alert("Error", "Could not delete patient. Please try again.");
          }
        },
      },
    ]);
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
              Registered Patients <Text style={styles.patientCount}>({displayedPatients.length})</Text>
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
              <TouchableOpacity
                key={patient.id}
                style={styles.patientCard}
                onPress={() => router.push(`/patient-records/${patient.id}`)}
                activeOpacity={0.75}
              >
                <View style={styles.cardInfoGroup}>
                  <Text style={styles.cardNameText}>{patient.lastName}, {patient.firstName}</Text>
                  <Text style={styles.cardSubDetails}>{patient.gender} • DOB: {patient.birthdate}</Text>
                  {patient.mobileNumber ? (
                    <Text style={styles.cardSubDetails}>📱 +63 {patient.mobileNumber}</Text>
                  ) : null}
                </View>
                <View style={styles.cardActionsGroup}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => { e.stopPropagation(); openEditForm(patient); }}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => { e.stopPropagation(); handleDeletePatient(patient.id, `${patient.firstName} ${patient.lastName}`); }}
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

  // --- VIEW RENDER 2: Create / Edit Form ---
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.promptHeadline}>Input the details of your patient</Text>

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