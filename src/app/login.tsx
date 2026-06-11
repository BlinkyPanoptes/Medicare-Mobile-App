import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
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

  const [activeField, setActiveField] = useState<"email" | "password" | null>(null);
  const [floatingValue, setFloatingValue] = useState("");
  const floatingRef = useRef<TextInput>(null);

  const { login } = useAuth();

  const isLocked = lockoutTimeLeft > 0;
  const isActionDisabled = isLocked || isLoading;

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (activeField !== null) {
        dismissFloating();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [activeField, floatingValue]);

  useEffect(() => {
    if (!isLocked) return;
    const timer = setInterval(() => setLockoutTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidHide", () => {
      if (activeField !== null) dismissFloating();
    });
    return () => sub.remove();
  }, [activeField, floatingValue]);

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

  const openFloating = (field: "email" | "password") => {
    setFloatingValue(field === "email" ? email : password);
    setActiveField(field);
  };

  const dismissFloating = () => {
    if (activeField === "email") setEmail(floatingValue);
    if (activeField === "password") setPassword(floatingValue);
    setActiveField(null);
    Keyboard.dismiss();
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

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => !isActionDisabled && openFloating("email")}
        >
          <TextInput
            placeholder="Email Address"
            placeholderTextColor="#9ca3af"
            value={email}
            style={styles.input}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => !isActionDisabled && openFloating("password")}
        >
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            secureTextEntry
            style={styles.input}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isActionDisabled && { backgroundColor: COLORS.disabled }]}
          onPress={handleLogin}
          disabled={isActionDisabled}
        >
          <Text style={styles.buttonText}>
            {isLoading
              ? "Logging in..."
              : isLocked
              ? `Locked (${formatTime(lockoutTimeLeft)})`
              : "Login"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={activeField !== null}
        transparent
        animationType="none"
        onRequestClose={dismissFloating}
        onShow={() => {
          // This forces focus specifically after the Modal is visible
          setTimeout(() => {
            floatingRef.current?.focus();
          }, 100);
        }}
      >
        <TouchableWithoutFeedback onPress={dismissFloating}>
          <View style={styles.floatingBackdrop} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.floatingBar}>
            <Text style={styles.floatingLabel}>
              {activeField === "email" ? "Email Address" : "Password"}
            </Text>
            <View style={styles.floatingInputRow}>
              <TextInput
                ref={floatingRef}
                value={floatingValue}
                onChangeText={setFloatingValue}
                onSubmitEditing={dismissFloating}
                secureTextEntry={activeField === "password"}
                autoCapitalize="none"
                keyboardType={activeField === "email" ? "email-address" : "default"}
                style={styles.floatingDisplayText}
              />
              <TouchableOpacity style={styles.floatingSubmitBtn} onPress={dismissFloating}>
                <Text style={styles.floatingSubmitIcon}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}