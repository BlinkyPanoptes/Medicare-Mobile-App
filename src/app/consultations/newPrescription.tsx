// import DateTimePicker from "@react-native-community/datetimepicker";
import { createPatient } from "@/api/patient";
import { useAuth } from "@/components/context/auth-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
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

export default function NewPrescriptionScreen() {
  const router = useRouter();
  const { activeClinic } = useAuth();

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Female");
  const [birthdate, setBirthdate] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());

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
      Alert.alert(
        "Missing Fields",
        "Please complete the patient's name and birthdate.",
      );
      return;
    }
    if (!activeClinic) {
      Alert.alert("No Clinic Selected", "Please select a clinic first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        last_name: lastName,
        first_name: firstName,
        gender: gender.toLowerCase(),
        birthdate,
        email,
        phone_number: mobileNumber,
        clinic_id: activeClinic.id,
      };

      const response = await createPatient(payload);
      const newPatient = response.data.patient;

      // ✅ Redirect to prescription builder with the new patient's data
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
      const serverMessage =
        err?.response?.data?.message ||
        (
          Object.values(err?.response?.data?.errors ?? {}) as string[][]
        )?.[0]?.[0] ||
        "Failed to save patient record.";
      Alert.alert("Error", serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.promptHeadline}>
          Input the details of your patient
        </Text>

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
            <TouchableOpacity
              style={styles.radioButtonOption}
              onPress={() => setGender("Male")}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.outerRadioRing,
                  gender === "Male" && styles.activeOuterRing,
                ]}
              >
                {gender === "Male" && <View style={styles.innerRadioDot} />}
              </View>
              <Text style={styles.radioOptionLabelText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioButtonOption}
              onPress={() => setGender("Female")}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.outerRadioRing,
                  gender === "Female" && styles.activeOuterRing,
                ]}
              >
                {gender === "Female" && <View style={styles.innerRadioDot} />}
              </View>
              <Text style={styles.radioOptionLabelText}>Female</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BIRTHDATE */}
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
              We will send a copy of the prescription to your patient's email or
              mobile number.
            </Text>
            <Text style={styles.infoAlertSubtextInline}>
              If email or mobile number is not available, you may still continue
              to create a prescription and send it using other sharing options.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActionBarWrapper}>
        <TouchableOpacity
          style={[
            styles.nextActionButtonCall,
            isSubmitting && { backgroundColor: "#82b27a" },
          ]}
          onPress={handleSaveRecord}
          disabled={isSubmitting}
          activeOpacity={0.9}
        >
          <Text style={styles.nextActionButtonLabelText}>
            {isSubmitting ? "SAVING..." : "SAVE RECORD"}
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
  promptHeadline: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 20,
  },
  fieldWrapper: { marginBottom: 20 },
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
  fieldInput: { flex: 1, fontSize: 16, color: "#0f172a", height: "100%" },
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
  countryCodeBadgeLabel: { fontSize: 16, color: "#334155", fontWeight: "500" },
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
});
