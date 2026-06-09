import { useState, useEffect, useMemo } from "react";
import { Alert, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, RefreshControl } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { createPatient, fetchPatients } from "@/api/patient";
import { fetchPatientConsultations } from "@/api/consultation";
import { useAuth } from "@/components/context/auth-context";
import { newPrescriptionStyles as styles } from "@/styles/newPrescriptionStyles";

type PatientRecord = {
  id: number;
  last_name: string;
  first_name: string;
  gender: string;
  birthdate: string;
  email: string;
  phone_number: string;
};

export default function NewPrescriptionScreen() {
  const router = useRouter();
  const { activeClinic } = useAuth();

  // — List state —
  const [isCreating, setIsCreating] = useState(false);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // — Form state —
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
      const res = await fetchPatients();
      const allPatients: PatientRecord[] = res.data.data ?? res.data;

      // Only keep patients who have no consultation history yet
      const consultationChecks = await Promise.all(
        allPatients.map(async (p) => {
          try {
            const cRes = await fetchPatientConsultations(p.id);
            const consultations = cRes.data.data ?? [];
            return consultations.length === 0 ? p : null;
          } catch {
            return p;
          }
        })
      );

      setPatients(consultationChecks.filter((p): p is PatientRecord => p !== null));
    } catch {
      Alert.alert("Error", "Could not load patients.");
    } finally {
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => { loadPatients(); }, []);

  const displayedPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return patients
      .filter((p) =>
        p.first_name.toLowerCase().includes(q) ||
        p.last_name.toLowerCase().includes(q)
      )
      .sort((a, b) => a.last_name.localeCompare(b.last_name));
  }, [patients, searchQuery]);

  const openCreateForm = () => {
    setLastName(""); setFirstName(""); setGender("Female");
    setBirthdate(""); setDateValue(new Date()); setEmail(""); setMobileNumber("");
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

  const handleSaveRecord = async () => {
    if (!lastName.trim() || !firstName.trim() || !birthdate.trim()) {
      Alert.alert("Missing Fields", "Please complete the patient's name and birthdate.");
      return;
    }
    if (!activeClinic) {
      Alert.alert("No Clinic Selected", "Please select a clinic first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createPatient({
        last_name: lastName,
        first_name: firstName,
        gender: gender.toLowerCase(),
        birthdate,
        email,
        phone_number: mobileNumber,
        clinic_id: activeClinic.id,
      });
      const newPatient = response.data.patient;

      // Doctor saves a new patient → go straight to createPrescription
      router.replace({
        pathname: "/consultations/createPrescription",
        params: {
          patientId: newPatient.id.toString(),
          patientName: `${newPatient.last_name}, ${newPatient.first_name}`,
          patientGender: newPatient.gender,
          patientBirthdate: newPatient.birthdate,
        },
      });
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message || "Failed to save patient record.";
      Alert.alert("Error", serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPatient = (patient: PatientRecord) => {
    // Doctor picks an existing patient from the list → go to createPrescription
    router.push({
      pathname: "/consultations/createPrescription",
      params: {
        patientId: patient.id.toString(),
        patientName: `${patient.last_name}, ${patient.first_name}`,
        patientGender: patient.gender,
        patientBirthdate: patient.birthdate,
      },
    });
  };

  // --- VIEW RENDER 1: Patient List ---
  if (!isCreating) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadPatients(true)}
              tintColor="#095c29"
            />
          }
        >
          {/* Search */}
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

          {/* Header row */}
          <View style={styles.listHeaderRow}>
            <Text style={styles.promptHeadline}>
              New Patients{" "}
              <Text style={styles.patientCount}>({displayedPatients.length})</Text>
            </Text>
            <TouchableOpacity style={styles.addPatientBtn} onPress={openCreateForm}>
              <Text style={styles.addPatientBtnText}>+ Add Patient</Text>
            </TouchableOpacity>
          </View>

          {displayedPatients.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchQuery ? "No patients match your search." : "No new patients found."}
            </Text>
          ) : (
            displayedPatients.map((patient) => (
              <TouchableOpacity
                key={patient.id}
                style={styles.patientCard}
                onPress={() => handleSelectPatient(patient)}
                activeOpacity={0.75}
              >
                <View style={styles.cardInfoGroup}>
                  <Text style={styles.cardNameText}>
                    {patient.last_name}, {patient.first_name}
                  </Text>
                  <Text style={styles.cardSubDetails}>
                    {patient.gender
                      ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
                      : "—"}{" "}
                    • DOB: {patient.birthdate}
                  </Text>
                  {patient.phone_number ? (
                    <Text style={styles.cardSubDetails}>📱 +63 {patient.phone_number}</Text>
                  ) : null}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // --- VIEW RENDER 2: Create Patient Form ---
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroller} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.promptHeadline}>Input the details of your patient</Text>

        {/* LAST NAME */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Last Name</Text>
          <View style={styles.inputContainerRow}>
            <TextInput style={styles.fieldInput} value={lastName} onChangeText={setLastName} placeholder="Enter last name" placeholderTextColor="#94a3b8" />
            {lastName.length > 0 && (
              <TouchableOpacity onPress={() => handleClearField("lastName")} style={styles.clearBtnClick}>
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* FIRST NAME */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>First Name</Text>
          <View style={styles.inputContainerRow}>
            <TextInput style={styles.fieldInput} value={firstName} onChangeText={setFirstName} placeholder="Enter first name" placeholderTextColor="#94a3b8" />
            {firstName.length > 0 && (
              <TouchableOpacity onPress={() => handleClearField("firstName")} style={styles.clearBtnClick}>
                <Text style={styles.clearBtnSymbol}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* GENDER */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Gender</Text>
          <View style={styles.radioFlexContainer}>
            <TouchableOpacity style={styles.radioButtonOption} onPress={() => setGender("Male")}>
              <View style={[styles.outerRadioRing, gender === "Male" && styles.activeOuterRing]}>
                {gender === "Male" && <View style={styles.innerRadioDot} />}
              </View>
              <Text style={styles.radioOptionLabelText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.radioButtonOption} onPress={() => setGender("Female")}>
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
          <TouchableOpacity style={styles.inputContainerRow} onPress={() => setShowDatePicker(true)}>
            <TextInput style={styles.fieldInput} value={birthdate} placeholder="Select patient birthdate" placeholderTextColor="#94a3b8" editable={false} pointerEvents="none" />
            <Text style={styles.calendarInlineIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker value={dateValue} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={onDateChange} maximumDate={new Date()} />
        )}

        {/* EMAIL */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Patient's Email Address</Text>
          <View style={styles.inputContainerRow}>
            <TextInput style={styles.fieldInput} value={email} onChangeText={setEmail} placeholder="example@email.com" placeholderTextColor="#94a3b8" autoCapitalize="none" keyboardType="email-address" />
          </View>
        </View>

        {/* MOBILE NUMBER */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelText}>Mobile Number</Text>
          <View style={styles.phoneInputLayoutGroup}>
            <View style={styles.countryCodeBadgePlate}>
              <Text style={styles.countryCodeBadgeLabel}>+63</Text>
            </View>
            <TextInput style={styles.phoneNumberNativeInput} value={mobileNumber} onChangeText={setMobileNumber} placeholder="917 123 4567" placeholderTextColor="#94a3b8" keyboardType="number-pad" />
          </View>
        </View>

        {/* INFO BOX */}
        <View style={styles.infoAlertContainerBox}>
          <Text style={styles.infoBadgeIndicatorIcon}>ⓘ</Text>
          <View style={styles.infoAlertContentBodyTextGroup}>
            <Text style={styles.infoAlertMessageTextInline}>We will send a copy of the prescription to your patient's email or mobile number.</Text>
            <Text style={styles.infoAlertSubtextInline}>If unavailable, you may still continue to create a prescription and use other sharing options.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActionBarWrapper}>
        <TouchableOpacity style={styles.nextActionButtonCall} onPress={handleSaveRecord} disabled={isSubmitting}>
          <Text style={styles.nextActionButtonLabelText}>{isSubmitting ? "SAVING..." : "SAVE RECORD"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}