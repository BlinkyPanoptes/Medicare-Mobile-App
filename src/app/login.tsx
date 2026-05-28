import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
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
  const [isLoading, setIsLoading] = useState(false);
  
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0); 

  // Pulling login function from your real backend context
  const { login } = useAuth();

  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setLockoutTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleLogin = async () => {
    if (lockoutTimeLeft > 0) {
      Alert.alert("Locked Out", `Please wait ${formatTime(lockoutTimeLeft)} before trying again.`);
      return;
    }

    setIsLoading(true);

    try {
      // Connects to the real backend database
      await login(email, password);
      
      setFailedAttempts(0);
      router.replace("/dashboard");

    } catch (error: any) {
      if (error.response) {
        console.log("SERVER REJECTED LOGIN:", error.response.data);
        handleFailedAttempt();
      } else {
        console.error("NETWORK ERROR:", error.message);
        Alert.alert("Connection Error", "Ensure your server is running and reachable.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFailedAttempt = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    if (nextAttempts >= 5) {
      setLockoutTimeLeft(180); 
      Alert.alert("Account Locked", "Too many failed attempts. Login has been suspended for 3 minutes.");
    } else {
      Alert.alert("Login Failed", "Invalid email or password. Try Again!");
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
        editable={lockoutTimeLeft === 0 && !isLoading} 
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        editable={lockoutTimeLeft === 0 && !isLoading} 
      />

      <TouchableOpacity 
        style={[
          styles.button, 
          (lockoutTimeLeft > 0 || isLoading) && { backgroundColor: "#6b7280", opacity: 0.7 }
        ]} 
        onPress={handleLogin}
        disabled={lockoutTimeLeft > 0 || isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Logging in..." : lockoutTimeLeft > 0 ? `Locked Out (${formatTime(lockoutTimeLeft)})` : "Login"}
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