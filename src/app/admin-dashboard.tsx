import apiClient from "@/api/client";
import { useAuth } from "@/components/context/auth-context";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  // — Create User form state —
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"doctor" | "assistant">("doctor");
  const [prcId, setPrcId] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [clinicIds, setClinicIds] = useState("");   // comma-separated input e.g. "1,3"
  const [userLoading, setUserLoading] = useState(false);

  // — Create Clinic form state —
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [clinicLoading, setClinicLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleCreateUser = async () => {
    if (!userEmail || !userPassword || !firstName || !lastName || !phoneNumber || !clinicIds) {
      Alert.alert("Validation Error", "All fields are required.");
      return;
    }
    if (role === "doctor" && !prcId) {
      Alert.alert("Validation Error", "PRC ID is required for doctors.");
      return;
    }

    // Parse comma-separated clinic IDs into a number array
    const parsedClinicIds = clinicIds
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    if (parsedClinicIds.length === 0) {
      Alert.alert("Validation Error", "Enter at least one valid clinic ID.");
      return;
    }

    setUserLoading(true);
    try {
      const payload: any = {
        first_name: firstName,
        last_name: lastName,
        email: userEmail,
        password: userPassword,
        phone_number: phoneNumber,
        role,
        clinic_ids: parsedClinicIds,
      };

      if (role === "doctor") {
        payload.prc_id = prcId;
        payload.specialization = specialization;
      }

      const response = await apiClient.post("/auth/register", payload);
      Alert.alert("Success", response.data.message);

      // Reset form
      setUserEmail("");
      setUserPassword("");
      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setPrcId("");
      setClinicIds("");
      setRole("doctor");
      setSpecialization("");
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Something went wrong";
      Alert.alert("Error", message);
    } finally {
      setUserLoading(false);
    }
  };

  const handleCreateClinic = async () => {
    if (!clinicName) {
      Alert.alert("Validation Error", "Clinic name is required.");
      return;
    }

    setClinicLoading(true);
    try {
      const payload: any = {
        clinic_name: clinicName,
        ...(clinicAddress && { address: clinicAddress }),
        ...(clinicPhone && { phone_number: clinicPhone }),
        ...(doctorId && { doctor_id: parseInt(doctorId, 10) }),
      };

      const response = await apiClient.post("/clinics", payload);
      Alert.alert("Success", `Clinic "${response.data.clinic_name}" created.`);

      // Reset form
      setClinicName("");
      setClinicAddress("");
      setClinicPhone("");
      setDoctorId("");
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Something went wrong";
      Alert.alert("Error", message);
    } finally {
      setClinicLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* — Overview card — */}
      <View style={styles.card}>
        <Text style={styles.title}>System Overview</Text>
        {/* FIX: was user?.firstName — backend returns first_name */}
        <Text style={styles.text}>Welcome, {user?.first_name}!</Text>
        <Text style={styles.text}>Permission Level: {user?.role.toUpperCase()}</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Manage Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>System Logs</Text>
        </TouchableOpacity>
      </View>

      {/* — Create User — */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create Staff Account</Text>

        <TextInput
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          style={styles.input}
        />
        <TextInput
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          style={styles.input}
        />
        <TextInput
          placeholder="Email"
          value={userEmail}
          onChangeText={setUserEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={userPassword}
          onChangeText={setUserPassword}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          placeholder="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          placeholder="Clinic IDs (comma-separated, e.g. 1,3)"
          value={clinicIds}
          onChangeText={setClinicIds}
          keyboardType="numbers-and-punctuation"
          style={styles.input}
        />

        {/* Role toggle */}
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleButton, role === "doctor" && styles.roleButtonActive]}
            onPress={() => setRole("doctor")}
          >
            <Text style={[styles.roleButtonText, role === "doctor" && styles.roleButtonTextActive]}>
              Doctor
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === "assistant" && styles.roleButtonActive]}
            onPress={() => setRole("assistant")}
          >
            <Text style={[styles.roleButtonText, role === "assistant" && styles.roleButtonTextActive]}>
              Assistant
            </Text>
          </TouchableOpacity>
        </View>

        {/* PRC ID — only shown for doctors */}
        {role === "doctor" && (
          <TextInput
            placeholder="PRC ID"
            value={prcId}
            onChangeText={setPrcId}
            style={styles.input}
          />
        )}

        {role === "doctor" && (
          <TextInput
            placeholder="Specialization"
            value={specialization}
            onChangeText={setSpecialization}
            style={styles.input}
          />
        )}

        <TouchableOpacity
          style={[styles.submitButton, userLoading && styles.submitButtonDisabled]}
          onPress={handleCreateUser}
          disabled={userLoading}
        >
          <Text style={styles.submitButtonText}>
            {userLoading ? "Creating..." : "Create Staff Account"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* — Create Clinic — */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Create Clinic</Text>

        <TextInput
          placeholder="Clinic Name"
          value={clinicName}
          onChangeText={setClinicName}
          style={styles.input}
        />
        <TextInput
          placeholder="Address (optional)"
          value={clinicAddress}
          onChangeText={setClinicAddress}
          style={styles.input}
        />
        <TextInput
          placeholder="Phone Number (optional)"
          value={clinicPhone}
          onChangeText={setClinicPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TextInput
          placeholder="Doctor ID (optional)"
          value={doctorId}
          onChangeText={setDoctorId}
          keyboardType="numeric"
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.submitButton, clinicLoading && styles.submitButtonDisabled]}
          onPress={handleCreateClinic}
          disabled={clinicLoading}
        >
          <Text style={styles.submitButtonText}>
            {clinicLoading ? "Creating..." : "Create Clinic"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* — Logout — */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#095c29",
  },
  text: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: "center",
  },
  actionText: {
    fontWeight: "bold",
    color: "#095c29",
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#095c29",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 15,
    color: "#111827",
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  roleButtonActive: {
    backgroundColor: "#095c29",
    borderColor: "#095c29",
  },
  roleButtonText: {
    fontWeight: "600",
    color: "#64748b",
  },
  roleButtonTextActive: {
    color: "#fff",
  },
  submitButton: {
    backgroundColor: "#095c29",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  logoutButton: {
    backgroundColor: "#dc2626",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
});