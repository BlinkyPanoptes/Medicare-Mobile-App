import { StyleSheet } from "react-native";
import { COLORS, SIZES, GlobalStyles } from "@/theme";

export const loginStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  headerBanner: {
    flex: 2, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 30, paddingTop: 40,
  },
  logo: { width: "100%", height: "90%" },
  formSheet: {
    flex: 3, backgroundColor: COLORS.background,
    borderTopLeftRadius: SIZES.radiusLarge,
    borderTopRightRadius: SIZES.radiusLarge,
    paddingHorizontal: 28, paddingTop: 35,
  },
  sheetTitle: { fontSize: 28, fontWeight: "bold", color: COLORS.text, marginBottom: 6 },
  sheetSubtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 30 },
  input: {
    backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: SIZES.radius, marginBottom: 16, borderWidth: 1,
    borderColor: COLORS.border, fontSize: 15, color: COLORS.text,
  },
  button: { 
    ...GlobalStyles.primaryButton, 
    marginTop: 10 
  },
  buttonText: { 
    ...GlobalStyles.primaryButtonText 
  },
});