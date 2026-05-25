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
          title:
            user?.role === "doctor"
              ? "Welcome, Dr. Pedrajas" //replace with actual doctor name
              : "Welcome, Mr. Dudz", //replace with actual assistant name
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
