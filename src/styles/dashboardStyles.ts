import { StyleSheet } from "react-native";
import { COLORS, SIZES, SHADOWS, GlobalStyles } from "@/theme";

export const dashboardStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greeting: { fontSize: 14, color: COLORS.muted, marginBottom: 4 },
  title: { fontSize: 30, fontWeight: "bold", color: COLORS.text },
  // Clinic switcher button
  clinicSwitcherBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#f0fdf4",
    borderWidth: 1, borderColor: "#bbf7d0", borderRadius: SIZES.radius,
    paddingHorizontal: 12, paddingVertical: 8, gap: 8, maxWidth: 150,
  },
  clinicSwitcherIcon: { fontSize: 22 },
  clinicSwitcherTextGroup: { flexShrink: 1 },
  clinicSwitcherLabel: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  clinicSwitcherSub: { fontSize: 11, color: "#4ade80", marginTop: 1 },
  // Welcome card
  welcomeCard: { backgroundColor: COLORS.primary, borderRadius: 22, padding: 22, marginBottom: 30 },
  welcomeTitle: { color: COLORS.white, fontSize: 20, fontWeight: "700", marginBottom: 10 },
  welcomeText: { color: COLORS.white, fontSize: 14, lineHeight: 22 },
  // Sections
  sectionHeader: { marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  sectionSubtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  // Logout
  logoutButton: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 16, marginTop: 10,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#fca5a5", ...SHADOWS.soft,
  },
  logoutButtonText: { color: COLORS.error, fontSize: 15, fontWeight: "700" },
  // Clinic switcher modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: COLORS.background, borderTopLeftRadius: 28,
    borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#cbd5e1", alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 20 },
  modalClinicList: { gap: 10 },
  modalCard: { ...GlobalStyles.card, flexDirection: "row", overflow: "hidden" },
  modalCardSelected: { borderColor: COLORS.primary, backgroundColor: "#f0fdf4" },
  modalCardDisabled: { opacity: 0.55 },
  modalCardAccent: { width: 5, backgroundColor: "#cbd5e1" },
  modalCardAccentSelected: { backgroundColor: COLORS.primary },
  modalCardAccentDisabled: { backgroundColor: COLORS.border },
  modalCardBody: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16,
  },
  modalCardName: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 3 },
  modalCardNameDisabled: { color: "#94a3b8" },
  modalCardAddress: { fontSize: 13, color: COLORS.muted },
  modalCardAddressDisabled: { color: "#b0bac9" },
  badgeActive: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeActiveText: { fontSize: 12, fontWeight: "700", color: COLORS.white },
  badgeAvailable: { backgroundColor: "#dcfce7", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeAvailableText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  badgeDisabled: { backgroundColor: "#f1f5f9", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeDisabledText: { fontSize: 12, fontWeight: "600", color: "#94a3b8" },
  modalDismissBtn: { marginTop: 16, backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 14, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  modalDismissBtnText: { fontSize: 15, fontWeight: "600", color: COLORS.muted },
});