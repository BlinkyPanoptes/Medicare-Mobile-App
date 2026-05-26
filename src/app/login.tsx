import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/components/context/auth-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // 🔒 Throttling states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0); // remaining seconds

  const { login } = useAuth();

  // Handle countdown timer decrement if user is locked out
  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setLockoutTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  // Format seconds into MM:SS for user visibility
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleLogin = () => {
    // 1. Guard check if user is currently under cooldown
    if (lockoutTimeLeft > 0) {
      alert(`Too many failed attempts. Please wait ${formatTime(lockoutTimeLeft)} before trying again.`);
      return;
    }

    const doctorEmail = "doctor@cravecare.com";
    const doctorPassword = "12345678";

    const assistantEmail = "assistant@cravecare.com";
    const assistantPassword = "12345678";

    const adminEmail = "admin@cravecare.com";
    const adminPassword = "12345678";

    const isDoctor = email === doctorEmail && password === doctorPassword;
    const isAssistant = email === assistantEmail && password === assistantPassword;
    const isAdmin = email === adminEmail && password === adminPassword;

    if (isDoctor || isAssistant || isAdmin) {
      // Success path: Reset tracking metrics
      setFailedAttempts(0);
      
      if (isDoctor) {
        login({ email, role: "doctor" });
      } else if (isAssistant) {
        login({ email, role: "assistant" });
      } else if (isAdmin) {
        login({ email, role: "admin" });
      }
      router.replace("/dashboard");
    } else {
      // Failure path: Increment tracker increments
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (nextAttempts >= 5) {
        setLockoutTimeLeft(180); // ⏱️ Lockout duration set to 3 minutes (180 seconds)
        alert("Too many failed attempts. Login has been suspended for 3 minutes.");
      } else {
        alert(`Invalid email or password. Try Again!`);
      }
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
        keyboardType="email-address"
        editable={lockoutTimeLeft === 0} // Optional visual disabled cue during lock
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        editable={lockoutTimeLeft === 0} // Optional visual disabled cue during lock
      />

      <TouchableOpacity 
        style={[
          styles.button, 
          lockoutTimeLeft > 0 && { backgroundColor: "#6b7280", opacity: 0.7 } // Muted gray style state for locking layout
        ]} 
        onPress={handleLogin}
        disabled={lockoutTimeLeft > 0}
      >
        <Text style={styles.buttonText}>
          {lockoutTimeLeft > 0 ? `Locked Out (${formatTime(lockoutTimeLeft)})` : "Login"}
        </Text>
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