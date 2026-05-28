import { router } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/components/context/auth-context";
import { User } from "@/types/user";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useAuth();

  //temporary test login, replace later with real auth logic
  const handleLogin = () => {
    const doctorPassword = "12345678";
    const assistantPassword = "12345678";
    const adminPassword = "12345678";

    const doctorUser: User = {
      id: "1",
      firstName: "",
      lastName: "",
      email: "doctor@cravecare.com",
      phoneNumber: "",
      role: "doctor",
    };

    const assistantUser: User = {
      id: "2",
      firstName: "",
      lastName: "",
      email: "assistant@cravecare.com",
      phoneNumber: "",
      role: "assistant",
    };

    const adminUser: User = {
      id: "3",
      firstName: "",
      lastName: "",
      email: "admin@cravecare.com",
      phoneNumber: "",
      role: "admin",
    };

    if (email === doctorUser.email && password === doctorPassword) {
      login(doctorUser);
      router.replace("/dashboard"); // go to dashboard
    } else if (
      email === assistantUser.email &&
      password === assistantPassword
    ) {
      login(assistantUser);
      router.replace("/dashboard"); // go to dashboard
    } else if (email === adminUser.email && password === adminPassword) {
      login(adminUser);
      router.replace("/dashboard"); // replace with admin dashboard later
    } else {
      alert("Invalid email or password");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CraveCare{"\n"}E-Medical Record System</Text>
      <Text style={styles.subtitle}>Login to continue</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f7fb",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#095c29",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
