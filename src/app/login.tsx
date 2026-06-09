import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/components/context/auth-context";
import { COLORS } from "@/theme";
import { loginStyles as styles } from "@/styles/loginStyles";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

  const { login } = useAuth();

  const isLocked = lockoutTimeLeft > 0;
  const isActionDisabled = isLocked || isLoading;

  useEffect(() => {
    if (!isLocked) return;
    const timer = setInterval(() => setLockoutTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleLogin = async () => {
    if (isLocked) {
      Alert.alert("Locked Out", `Please wait ${formatTime(lockoutTimeLeft)} before trying again.`);
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      setFailedAttempts(0);
      router.replace("/clinic-selection");
    } catch {
      handleFailedAttempt();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFailedAttempt = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    if (nextAttempts >= 5) {
      setLockoutTimeLeft(180);
      Alert.alert("Account Locked", "Too many failed attempts. Suspended for 3 minutes.");
    } else {
      Alert.alert("Login Failed", "Invalid email or password.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.headerBanner}>
        <Image
          source={require("@/assets/images/CraveCare-Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

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
          editable={!isActionDisabled}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          editable={!isActionDisabled}
        />

        <TouchableOpacity
          style={[styles.button, isActionDisabled && { backgroundColor: COLORS.disabled }]}
          onPress={handleLogin}
          disabled={isActionDisabled}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Logging in..." : isLocked ? `Locked (${formatTime(lockoutTimeLeft)})` : "Login"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}