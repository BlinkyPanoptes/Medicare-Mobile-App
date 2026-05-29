import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StatusBar,
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
      {/* Matches the top status bar overlay to your deep branding green */}
      <StatusBar barStyle="light-content" backgroundColor="#095c29" />

      {/* Top Section: Branding Green Banner Header */}
      <View style={styles.headerBanner}>
        <Image 
          source={require("@/assets/images/CraveCare-Logo.png")} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Section: Light Sheet Container with Curved Corners */}
      <View style={styles.formSheet}>
        <Text style={styles.sheetTitle}>Login</Text>
        <Text style={styles.sheetSubtitle}>Sign in to access your clinic workspace</Text>

        <TextInput
          placeholder="Email Address"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={lockoutTimeLeft === 0 && !isLoading} 
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#9ca3af"
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#095c29", // Base background color matches image_1ad14c.png top banner
  },
  headerBanner: {
    flex: 2, // Controls height proportion of the green banner section
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  logo: {
    width: "100%",
    height: "90%",
  },
  formSheet: {
    flex: 3, // Content section layout allocation
    backgroundColor: "#f5f7fb", // Light container backplate color
    borderTopLeftRadius: 40, // High-radius corner curves matching image_1ad14c.png
    borderTopRightRadius: 40,
    paddingHorizontal: 28,
    paddingTop: 35,
  },
  sheetTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 15,
    color: "#111827",
    
    // Smooth subtle card elevations for iOS & Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    backgroundColor: "#095c29",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
    
    shadowColor: "#095c29",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
});