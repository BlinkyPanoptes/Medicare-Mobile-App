import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "../components/animated-icon";
import "../global.css";

import { AuthProvider, useAuth } from "@/components/context/auth-context";

function RootStack() {
  const { user } = useAuth();

  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="dashboard"
        options={{
          // Safely updates title dynamically using only the email string
          title: user
            ? `Welcome, ${user.role === "doctor" ? "Dr. " : ""}${user.firstName}`
            : "Welcome",
          ...headerStyles,
        }}
      />

      <Stack.Screen
        name="admin-dashboard"
        options={{
          title: "Admin Control Panel",
          ...headerStyles,
        }}
      />

      <Stack.Screen
        name="patient-records"
        options={{
          title: "Patient Records",
          ...headerStyles,
        }}
      />

      <Stack.Screen
        name="consultations"
        options={{
          title: "Consultations",
          ...headerStyles,
        }}
      />

      {/* ✅ Added: Register the nested script module route file layout */}
      <Stack.Screen
        name="consultations/newPrescription"
        options={{
          title: "New Prescription",
          ...headerStyles,
        }}
      />

      <Stack.Screen
        name="transactions"
        options={{
          title: "Transactions",
          ...headerStyles,
        }}
      />

      <Stack.Screen
        name="brand-directory"
        options={{
          title: "Brand Directory",
          ...headerStyles,
        }}
      />

      <Stack.Screen
        name="generics"
        options={{
          title: "Generics",
          ...headerStyles,
        }}
      />

      <Stack.Screen
        name="diseases"
        options={{
          title: "Diseases",
          ...headerStyles,
        }}
      />

      {/* ✅ Added: Registered the core medical-certificate layout configuration */}
      <Stack.Screen
        name="medical-certificate"
        options={{
          title: "Medical Certificate",
          ...headerStyles,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </ThemeProvider>
  );
}

const headerStyles = {
  headerStyle: { backgroundColor: "#095c29" },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "bold" as const },
};
