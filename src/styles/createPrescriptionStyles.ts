import { COLORS, SIZES, SPACING } from "@/theme"; // Assuming these are your theme tokens
import { StyleSheet } from "react-native";

export const createPrescriptionStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  content: { 
    paddingHorizontal: SPACING.xl, 
    paddingTop: SPACING.lg, 
    paddingBottom: SPACING.xxxl 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: COLORS.text, 
    marginBottom: SPACING.sm 
  },

  // Patient Card
  patientCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: SIZES.radius, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    padding: SPACING.md, 
    flexDirection: "row", 
    alignItems: "center", 
    gap: SPACING.sm 
  },
  patientAvatarCircle: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: "#fef3c7", 
    justifyContent: "center", 
    alignItems: "center", 
    borderWidth: 2, 
    borderColor: "#fde68a" 
  },
  patientAvatarText: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#92400e" 
  },
  patientCardInfo: { 
    flex: 1, 
    gap: 2 
  },
  patientCardCode: { 
    fontSize: 12, 
    color: COLORS.muted, 
    backgroundColor: "#f1f5f9", 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: 3, 
    borderRadius: 6, 
    alignSelf: "flex-start" 
  },
  patientCardName: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: COLORS.text, 
    marginTop: 4 
  },
  patientCardSub: { 
    fontSize: 14, 
    color: COLORS.muted 
  },

  // Text Areas
  textArea: { 
    backgroundColor: COLORS.white, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: SIZES.radius, 
    padding: SPACING.md, 
    minHeight: 90, 
    fontSize: 15, 
    color: COLORS.text 
  },

  // Loading / Empty States
  loadingBox: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: SPACING.sm, 
    padding: SPACING.lg, 
    backgroundColor: COLORS.white, 
    borderRadius: SIZES.radius, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  loadingText: { 
    color: COLORS.muted, 
    fontSize: 14 
  },
  emptyMedBox: { 
    backgroundColor: COLORS.white, 
    borderRadius: SIZES.radius, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    padding: SPACING.xxl, 
    alignItems: "center" 
  },
  emptyMedText: { 
    color: COLORS.disabled, 
    fontSize: 14, 
    fontStyle: "italic" 
  },

  // Med Cards
  medCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: SIZES.radius, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    padding: SPACING.md, 
    marginBottom: SPACING.sm 
  },
  medBrandName: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: COLORS.text, 
    marginBottom: 2 
  },
  medGenericName: { 
    fontSize: 14, 
    color: COLORS.muted, 
    marginBottom: 6 
  },
  medDetail: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: COLORS.text, 
    marginBottom: 2 
  },
  medInstructions: { 
    fontSize: 13, 
    color: COLORS.muted, 
    fontStyle: "italic", 
    marginTop: 4 
  },
  medActionRow: { 
    flexDirection: "row", 
    gap: SPACING.sm, 
    marginTop: SPACING.sm 
  },
  changeBtn: { 
    flex: 1, 
    borderWidth: 1.5, 
    borderColor: COLORS.primary, 
    borderRadius: 8, 
    paddingVertical: 8, 
    alignItems: "center" 
  },
  changeBtnText: { 
    color: COLORS.primary, 
    fontWeight: "600", 
    fontSize: 14 
  },
  removeBtn: { 
    flex: 1, 
    backgroundColor: "#fff1f2", 
    borderWidth: 1, 
    borderColor: "#fecaca", 
    borderRadius: 8, 
    paddingVertical: 8, 
    alignItems: "center" 
  },
  removeBtnText: { 
    color: COLORS.error, 
    fontWeight: "600", 
    fontSize: 14 
  },

  // Add Button
  addMedBtn: { 
    borderWidth: 1.5, 
    borderColor: COLORS.primary, 
    borderRadius: SIZES.radius, 
    paddingVertical: SPACING.md, 
    alignItems: "center", 
    marginTop: SPACING.sm, 
    marginBottom: SPACING.lg 
  },
  addMedBtnText: { 
    color: COLORS.primary, 
    fontWeight: "700", 
    fontSize: 15, 
    letterSpacing: 0.5 
  },

  // Notes
  notesLabel: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: COLORS.muted, 
    marginBottom: SPACING.sm 
  },

  // Bottom Bar
  bottomBar: { 
    paddingHorizontal: SPACING.xl, 
    paddingBottom: SPACING.xxl, 
    paddingTop: SPACING.sm, 
    backgroundColor: COLORS.background, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border 
  },
  submitBtn: { 
    backgroundColor: COLORS.primary, 
    height: 54, 
    borderRadius: SIZES.radius, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  submitBtnText: { 
    color: COLORS.white, 
    fontSize: 16, 
    fontWeight: "700", 
    letterSpacing: 1 
  },

  // Modals
  modalBackdrop: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.45)", 
    justifyContent: "flex-end" 
  },
  modalSheet: { 
    backgroundColor: COLORS.white, 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    paddingHorizontal: SPACING.xl, 
    paddingTop: SPACING.sm, 
    paddingBottom: 36, 
    maxHeight: "85%" 
  },
  modalHandle: { 
    width: 40, 
    height: 4, 
    borderRadius: 2, 
    backgroundColor: "#cbd5e1", 
    alignSelf: "center", 
    marginBottom: SPACING.md 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: COLORS.text, 
    marginBottom: SPACING.md 
  },
  modalFieldWrapper: { 
    marginBottom: SPACING.sm, 
    marginTop: 4 
  },
  modalFieldLabel: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: COLORS.muted, 
    marginBottom: 6 
  },
  modalFieldInput: { 
    backgroundColor: "#f8fafc", 
    borderWidth: 1, 
    borderColor: "#cbd5e1", 
    borderRadius: SIZES.radius, 
    paddingHorizontal: SPACING.md, 
    height: 48, 
    fontSize: 15, 
    color: COLORS.text 
  },
  modalSaveBtn: { 
    backgroundColor: COLORS.primary, 
    height: 52, 
    borderRadius: SIZES.radius, 
    justifyContent: "center", 
    alignItems: "center", 
    marginTop: SPACING.md 
  },
  modalSaveBtnText: { 
    color: COLORS.white, 
    fontSize: 16, 
    fontWeight: "700" 
  },

  // Selectors
  selectorBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    backgroundColor: "#f8fafc", 
    borderWidth: 1, 
    borderColor: "#cbd5e1", 
    borderRadius: SIZES.radius, 
    paddingHorizontal: SPACING.md, 
    height: 48 
  },
  selectorBtnDisabled: { 
    opacity: 0.5 
  },
  selectorBtnText: { 
    fontSize: 15, 
    color: COLORS.text, 
    flex: 1 
  },
  selectorBtnPlaceholder: { 
    fontSize: 15, 
    color: COLORS.disabled, 
    flex: 1 
  },
  selectorChevron: { 
    fontSize: 14, 
    color: COLORS.disabled, 
    marginLeft: SPACING.sm 
  },

  // Pickers
  pickerSearch: { 
    backgroundColor: "#f8fafc", 
    borderWidth: 1, 
    borderColor: "#cbd5e1", 
    borderRadius: SIZES.radius, 
    paddingHorizontal: SPACING.md, 
    height: 44, 
    fontSize: 15, 
    color: COLORS.text, 
    marginBottom: SPACING.sm 
  },
  pickerSubtitle: { 
    fontSize: 13, 
    color: COLORS.muted, 
    marginBottom: SPACING.sm 
  },
  pickerItem: { 
    paddingVertical: 14, 
    paddingHorizontal: 4, 
    borderBottomWidth: 1, 
    borderBottomColor: "#f1f5f9" 
  },
  pickerItemSelected: { 
    backgroundColor: "#f0fdf4" 
  },
  pickerItemText: { 
    fontSize: 15, 
    color: COLORS.text 
  },
  pickerItemTextSelected: { 
    color: COLORS.primary, 
    fontWeight: "700" 
  },

  sectionLabel: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginTop: 20, marginBottom: 4 },
  sectionSubLabel: { fontSize: 13, color: "#64748b", marginBottom: 14 },
  diagnosisCard: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" },
  diagnosisCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  diagnosisName: { fontSize: 15, fontWeight: "700", color: "#0f172a", flex: 1 },
  diagnosisSymptoms: { fontSize: 13, color: "#475569", marginTop: 2 },
  diagnosisTypeBadge: { backgroundColor: "#e2e8f0", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  diagnosisTypePrimary: { backgroundColor: "#dcfce7" },
  diagnosisTypeBadgeText: { fontSize: 11, fontWeight: "700", color: "#475569" },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: "#f1f5f9", alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  typeBtnSelected: { backgroundColor: "#095c29", borderColor: "#095c29" },
  typeBtnText: { fontSize: 14, fontWeight: "600", color: "#475569" },
  typeBtnTextSelected: { color: "#ffffff" },
});