import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from "expo-router";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "../components/animated-icon";
import "../global.css";

import { AuthProvider, useAuth } from "@/components/context/auth-context";

function RootStack() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Admin bypasses clinic selection entirely
    if (user.role === "admin") {
      router.replace("/admin-dashboard");
      return;
    }

    // Doctor and assistant must select a clinic first
    router.replace("/clinic-selection");
  }, [user, isLoading]);

  if (isLoading) return null;

  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="clinic-selection"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="dashboard"
        options={{
          title: "Main Clinic",
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