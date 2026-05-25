import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "../components/animated-icon";
import "../global.css";

import { AuthProvider, useAuth } from "@/components/context/auth-context";

function RootStack() {
  const { user } = useAuth();

  return (
    <Stack>
      {!user ? (
        <Stack.Screen name="index" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen
          name="dashboard"
          options={{
            title:
              user.role === "doctor"
                ? "Welcome, Doctor Pedrajas"
                : "Welcome, Assistant Dudz",
            headerStyle: { backgroundColor: "#095c29" },
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "bold" },
          }}
        />
      )}
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
