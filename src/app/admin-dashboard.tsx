import { useAuth } from "@/components/context/auth-context";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "http://172.20.10.2:8000/api";

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"DOCTOR" | "SECRETARY">("DOCTOR");
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleCreateStaff = async () => {
    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      Alert.alert("Validation Error", "All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("userToken");
      if (!token) throw new Error("No authentication token found");

      console.log("APP IS TRYING TO HIT:", `${API_URL}/admin/create-staff`);

      const response = await axios.post(
        `${API_URL}/admin/create-staff`,
        {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          role: role.toUpperCase(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      Alert.alert("Success", response.data.message);

      // Reset form after successful creation
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setRole("DOCTOR");
    } catch (error: any) {
      const message =
        error.response?.data?.error || error.message || "Something went wrong";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>System Overview</Text>
        <Text style={styles.text}>Welcome, {user?.firstName}!</Text>
        <Text style={styles.text}>
          Permission Level: {user?.role.toUpperCase()}
        </Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Manage Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>System Logs</Text>
        </TouchableOpacity>
      </View>

      {/* Create Staff Form - no UI styling, just wired inputs */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />

      {/* Role toggle between DOCTOR and SECRETARY */}
      <TouchableOpacity
        onPress={() => setRole(role === "DOCTOR" ? "SECRETARY" : "DOCTOR")}
      >
        <Text>Role: {role}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleCreateStaff} disabled={loading}>
        <Text>{loading ? "Creating..." : "Create Staff"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f7fb",
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
  logoutButton: {
    backgroundColor: "#dc2626",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: "auto",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
