import { useEffect, useMemo, useState } from "react";
import {
  Alert, Platform, RefreshControl, ScrollView,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useAuth } from "@/components/context/auth-context";
import { fetchQueue, addToQueue, removeFromQueue } from "@/api/queue";
import { createPatient, updatePatient } from "@/api/patient";
import { fetchPatientConsultations } from "@/api/consultation";
import { currentQueueStyles as styles } from "@/styles/currentQueueStyles";
import DateTimePicker from "@react-native-community/datetimepicker";

type QueueEntry = {
  queue_id: number;
  queued_at: string;
  patient: {
    id: number;
    first_name: string;
    last_name: string;
    gender: string;
    birthdate: string;
    phone_number: string;
    email: string;
  };
};

export default function CurrentQueueScreen() {
  const router = useRouter();
  const { user, activeClinic } = useAuth();

  const isDoctor = user?.role === "doctor";

  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [patientStatusMap, setPatientStatusMap] = useState<Record<number, "new" | "old">>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Female");
  const [birthdate, setBirthdate] = useState("");
  const [dateValue, setDateValue] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [civilStatus, setCivilStatus] = useState<"Single" | "Married" | "Divorced" | "Separated" | "Widowed" | "Minor">("Single");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [temp, setTemp] = useState("");
  const [bp, setBp] = useState("");
  const [allergies, setAllergies] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const loadQueue = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const res = await fetchQueue();
      const entries: QueueEntry[] = res.data.data ?? [];
      setQueue(entries);

      // Batch-check consultation history to determine new/old status
      const statusEntries = await Promise.all(
        entries.map(async (entry) => {
          try {
            const cRes = await fetchPatientConsultations(entry.patient.id);
            const consultations = cRes.data.data ?? [];
            return [entry.patient.id, consultations.length > 0 ? "old" : "new"] as const;
          } catch {
            return [entry.patient.id, "new"] as const;
          }
        })
      );
      setPatientStatusMap(Object.fromEntries(statusEntries));
    } catch {
      Alert.alert("Error", "Could not load queue.");
    } finally {
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && activeClinic) loadQueue();
  }, [user, activeClinic]);

  const filteredQueue = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return queue;
    return queue.filter((entry) =>
      entry.patient.first_name.toLowerCase().includes(q) ||
      entry.patient.last_name.toLowerCase().includes(q)
    );
  }, [queue, searchQuery]);

  const resetForm = () => {
    setEditingPatientId(null);
    setLastName(""); setFirstName(""); setGender("Female");
    setBirthdate(""); setDateValue(new Date());
    setCivilStatus("Single"); setHeight(""); setWeight("");
    setTemp(""); setBp(""); setAllergies("");
    setEmail(""); setMobileNumber("");
  };

  const openAddForm = () => {
    resetForm();
    setShowAddForm(true);
  };

  const openEditForm = (entry: QueueEntry) => {
    const p = entry.patient;
    setEditingPatientId(p.id);
    setLastName(p.last_name);
    setFirstName(p.first_name);
    setGender(
      p.gender
        ? ((p.gender.charAt(0).toUpperCase() + p.gender.slice(1)) as "Male" | "Female")
        : "Female"
    );
    setBirthdate(p.birthdate ?? "");
    const parsed = Date.parse(p.birthdate);
    setDateValue(!isNaN(parsed) ? new Date(parsed) : new Date());
    setCivilStatus("Single"); setHeight(""); setWeight("");
    setTemp(""); setBp(""); setAllergies("");
    setEmail(p.email ?? "");
    setMobileNumber(p.phone_number ?? "");
    setShowAddForm(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      setDateValue(selectedDate);
      setBirthdate(selectedDate.toISOString().split("T")[0]);
    }
  };

  const handleSaveAndAddToQueue = async () => {
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
      civil_status: civilStatus.toLowerCase(),
      height,
      weight,
      allergies,
      temperature: temp,
      blood_pressure: bp,
      clinic_id: activeClinic?.id,
    };

    try {
      if (editingPatientId) {
        // Edit existing patient — update only, no re-queue
        await updatePatient(editingPatientId, payload);
        setShowAddForm(false);
        await loadQueue();
        Alert.alert("Updated", `Patient record for ${firstName} ${lastName} has been updated.`);
      } else {
        // New patient — create then add to queue
        const response = await createPatient(payload);
        const newPatient = response.data.patient;
        await addToQueue(newPatient.id);
        setShowAddForm(false);
        await loadQueue();

        if (isDoctor) {
          // Doctor goes straight to prescription
          // Re-fetch queue to get the queue_id for the newly added patient
          const freshQueue = await fetchQueue();
          const freshEntries: QueueEntry[] = freshQueue.data.data ?? [];
          const matchedEntry = freshEntries.find((e) => e.patient.id === newPatient.id);
          router.push({
            pathname: "/consultations/createPrescription",
            params: {
              patientId: newPatient.id.toString(),
              patientName: `${newPatient.last_name}, ${newPatient.first_name}`,
              patientGender: newPatient.gender,
              patientBirthdate: newPatient.birthdate,
              queueId: matchedEntry ? matchedEntry.queue_id.toString() : "",
            },
          });
        } else {
          // Assistant stays in queue
          Alert.alert("Success", `${firstName} ${lastName} has been added to the queue.`);
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (Object.values(err?.response?.data?.errors ?? {}) as string[][])?.[0]?.[0] ||
        "Could not save patient.";
      Alert.alert("Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromQueue = (queueId: number, name: string) => {
    Alert.alert(
      "Remove from Queue",
      `Remove ${name} from today's queue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove", style: "destructive",
          onPress: async () => {
            try {
              await removeFromQueue(queueId);
              await loadQueue();
            } catch {
              Alert.alert("Error", "Could not remove patient from queue.");
            }
          },
        },
      ]
    );
  };

  const handleCardPress = (entry: QueueEntry) => {
    if (!isDoctor) return; // Assistants cannot start a prescription
    router.push({
      pathname: "/consultations/createPrescription",
      params: {
        patientId: entry.patient.id.toString(),
        patientName: `${entry.patient.last_name}, ${entry.patient.first_name}`,
        patientGender: entry.patient.gender,
        patientBirthdate: entry.patient.birthdate,
        queueId: entry.queue_id.toString(),
      },
    });
  };

  // ─── VIEW: Add / Edit Patient Form ───────────────────────────────────────
  if (showAddForm) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.promptHeadline}>
            {editingPatientId ? "Edit Patient Details" : "Input the details of your patient"}
          </Text>

          {/* Last Name */}
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
                <TouchableOpacity onPress={() => setLastName("")} style={styles.clearBtnClick}>
                  <Text style={styles.clearBtnSymbol}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* First Name */}
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
                <TouchableOpacity onPress={() => setFirstName("")} style={styles.clearBtnClick}>
                  <Text style={styles.clearBtnSymbol}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Gender */}
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

          {/* Birthdate */}
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

          {/* Civil Status */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelText}>Civil Status</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {(["Single", "Married", "Divorced", "Separated", "Widowed", "Minor"] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
                    civilStatus === status
                      ? { backgroundColor: "#dcfce7", borderColor: "#166534" }
                      : { backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" },
                  ]}
                  onPress={() => setCivilStatus(status)}
                >
                  <Text style={{ color: civilStatus === status ? "#166534" : "#475569" }}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Height & Weight */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={[styles.fieldWrapper, { flex: 1 }]}>
              <Text style={styles.fieldLabelText}>Height (cm)</Text>
              <View style={styles.inputContainerRow}>
                <TextInput
                  style={styles.fieldInput}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="e.g. 170"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
            <View style={[styles.fieldWrapper, { flex: 1 }]}>
              <Text style={styles.fieldLabelText}>Weight (kg)</Text>
              <View style={styles.inputContainerRow}>
                <TextInput
                  style={styles.fieldInput}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="e.g. 70"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          </View>

          {/* Temp & BP */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={[styles.fieldWrapper, { flex: 1 }]}>
              <Text style={styles.fieldLabelText}>Temp (°C)</Text>
              <View style={styles.inputContainerRow}>
                <TextInput
                  style={styles.fieldInput}
                  value={temp}
                  onChangeText={setTemp}
                  keyboardType="decimal-pad"
                  placeholder="36.5"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
            <View style={[styles.fieldWrapper, { flex: 1 }]}>
              <Text style={styles.fieldLabelText}>Blood Pressure</Text>
              <View style={styles.inputContainerRow}>
                <TextInput
                  style={styles.fieldInput}
                  value={bp}
                  onChangeText={setBp}
                  placeholder="120/80"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          </View>

          {/* Allergies */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelText}>Allergies</Text>
            <TextInput
              style={[styles.fieldInput, {
                height: 80,
                textAlignVertical: "top",
                paddingTop: 10,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: 10,
              }]}
              value={allergies}
              onChangeText={setAllergies}
              placeholder="List any allergies or type 'None'..."
              placeholderTextColor="#94a3b8"
              multiline={true}
              numberOfLines={4}
            />
          </View>

          {/* Email */}
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

          {/* Mobile Number */}
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

          {/* Info Alert */}
          <View style={styles.infoAlertContainerBox}>
            <Text style={styles.infoBadgeIndicatorIcon}>ⓘ</Text>
            <View style={styles.infoAlertContentBodyTextGroup}>
              <Text style={styles.infoAlertMessageTextInline}>
                We will send a copy of the prescription to your patient's email or mobile number.
              </Text>
              <Text style={styles.infoAlertSubtextInline}>
                If email or mobile number is not available, you may still continue and send it using other sharing options.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.bottomActionBarWrapper}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setShowAddForm(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextActionButtonCall, isSubmitting && { backgroundColor: "#82b27a" }]}
            onPress={handleSaveAndAddToQueue}
            disabled={isSubmitting}
            activeOpacity={0.9}
          >
            <Text style={styles.nextActionButtonLabelText}>
              {isSubmitting
                ? "PROCESSING..."
                : editingPatientId
                ? "SAVE CHANGES"
                : "ADD TO QUEUE"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── VIEW: Main Queue List ────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadQueue(true)}
            tintColor="#095c29"
          />
        }
      >
        {/* Search */}
        <View style={styles.searchBarWrapper}>
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search queue by name..."
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

        {/* Header */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.promptHeadline}>
            Today's Queue{" "}
            <Text style={styles.patientCount}>({filteredQueue.length})</Text>
          </Text>
          <TouchableOpacity style={styles.addPatientBtn} onPress={openAddForm}>
            <Text style={styles.addPatientBtnText}>+ Add Patient</Text>
          </TouchableOpacity>
        </View>

        {filteredQueue.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchQuery ? "No patients match your search." : "No patients in queue today."}
          </Text>
        ) : (
          filteredQueue.map((entry, index) => (
            <TouchableOpacity
              key={entry.queue_id}
              style={styles.patientCard}
              onPress={() => handleCardPress(entry)}
              activeOpacity={isDoctor ? 0.75 : 1}
            >
              {/* Queue number badge */}
              <View style={styles.queueBadge}>
                <Text style={styles.queueBadgeText}>{index + 1}</Text>
              </View>

              <View style={styles.cardInfoGroup}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <Text style={styles.cardNameText}>
                    {entry.patient.last_name}, {entry.patient.first_name}
                  </Text>
                  {patientStatusMap[entry.patient.id] !== undefined && (
                    <View style={{
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: patientStatusMap[entry.patient.id] === "new" ? "#dcfce7" : "#f1f5f9",
                      borderWidth: 1,
                      borderColor: patientStatusMap[entry.patient.id] === "new" ? "#86efac" : "#cbd5e1",
                    }}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: patientStatusMap[entry.patient.id] === "new" ? "#166534" : "#475569",
                      }}>
                        {patientStatusMap[entry.patient.id] === "new" ? "new" : "old"}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSubDetails}>
                  {entry.patient.gender
                    ? entry.patient.gender.charAt(0).toUpperCase() + entry.patient.gender.slice(1)
                    : "—"}{" "}
                  • DOB: {entry.patient.birthdate}
                </Text>
                {entry.patient.phone_number ? (
                  <Text style={styles.cardSubDetails}>📱 +63 {entry.patient.phone_number}</Text>
                ) : null}
                {isDoctor && (
                  <Text style={styles.cardSubDetails}>Tap to start prescription →</Text>
                )}
              </View>

              <View style={[styles.cardActionsGroup, { flexDirection: "column" }]}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={(e) => { e.stopPropagation(); openEditForm(entry); }}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveFromQueue(
                      entry.queue_id,
                      `${entry.patient.first_name} ${entry.patient.last_name}`
                    );
                  }}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}