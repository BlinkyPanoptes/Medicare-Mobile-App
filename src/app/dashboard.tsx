import { useAuth } from "@/components/context/auth-context";
import { ButtonCard, Card } from "@/components/ui";
import { theme } from "@/theme";
import { Clinic } from "@/types/clinic";
import { UserRole } from "@/types/user";
import { router } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

type ButtonRoute =
  | "/patient-records"
  | "/consultations"
  | "/transactions"
  | "/brand-directory"
  | "/generics"
  | "/diseases"
  | "/medical-certificate";

type ButtonItem = {
  label: string;
  route: ButtonRoute;
  icon: string;
  description: string;
  allowedRoles?: UserRole[];
};

export default function Dashboard() {
  const { width } = useWindowDimensions();
  // FIX: pull clinics, activeClinic, selectClinic from context — remove local CLINICS array
  const { user, logout, clinics, activeClinic, selectClinic } = useAuth();

  const [clinicModalVisible, setClinicModalVisible] = useState(false);

  // FIX: logout is async — must be awaited
  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  // FIX: call selectClinic from context instead of setting local state
  // All clinics from backend are valid — no isAvailable check needed
  const handleSelectClinic = async (clinic: Clinic) => {
    await selectClinic(clinic);
    setClinicModalVisible(false);
  };

  const getColumns = () => {
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    if (width >= 600) return 3;
    return 2;
  };

  const columns = getColumns();
  const cardWidth = 100 / columns - 2;

  const clinicButtons: ButtonItem[] = [
    {
      label: "Patient Records",
      route: "/patient-records",
      icon: "🩺",
      description: "View and manage patient information",
      allowedRoles: ["doctor", "assistant"],
    },
    {
      label: "Consultations",
      route: "/consultations",
      icon: "📋",
      description: "Manage prescriptions and medical certificates",
      allowedRoles: ["doctor"],
    },
    {
      label: "Transactions",
      route: "/transactions",
      icon: "💳",
      description: "View previous consultations",
      allowedRoles: ["doctor", "assistant"],
    },
    {
      label: "Medical Certificate",
      route: "/medical-certificate",
      icon: "📄",
      description: "Generate verified medical clearance files",
      allowedRoles: ["doctor"],
    },
  ];

  const drugButtons: ButtonItem[] = [
    {
      label: "Brand Directory",
      route: "/brand-directory",
      icon: "💊",
      description: "View and manage branded medications",
      allowedRoles: ["doctor", "assistant"],
    },
    {
      label: "Generics",
      route: "/generics",
      icon: "🧪",
      description: "View and manage generic medications",
      allowedRoles: ["doctor", "assistant"],
    },
    {
      label: "Diseases",
      route: "/diseases",
      icon: "🦠",
      description: "View and manage disease information",
      allowedRoles: ["doctor", "assistant"],
    },
  ];

  const filterByRole = (btn: ButtonItem) => {
    if (!btn.allowedRoles) return true;
    if (!user) return false;
    return btn.allowedRoles.includes(user.role);
  };

  const filteredClinicButtons = clinicButtons.filter(filterByRole);
  const filteredDrugButtons = drugButtons.filter(filterByRole);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.greeting}>
              Good Day, {user ? (user.role === "doctor" ? `Dr. ${user.first_name}` : user.first_name) : "Staff"}! 👋
            </Text>
            {/* FIX: was activeClinic.name from local state — now from context */}
            <Text style={styles.title}>{activeClinic?.clinic_name ?? "Select a Clinic"}</Text>
          </View>

          {/* CLINIC SWITCHER BUTTON — only show if user has more than one clinic */}
          {clinics.length > 1 && (
            <TouchableOpacity
              style={styles.clinicSwitcherBtn}
              onPress={() => setClinicModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.clinicSwitcherIcon}>🏥</Text>
              <View style={styles.clinicSwitcherTextGroup}>
                <Text style={styles.clinicSwitcherLabel} numberOfLines={1}>
                  {activeClinic?.clinic_name ?? "Select"}
                </Text>
                <Text style={styles.clinicSwitcherSub}>Tap to switch</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* WELCOME CARD */}
        <Card style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to CraveCare EMR</Text>
          <Text style={styles.welcomeText}>
            Manage patients, consultations, transactions, and drug information in
            one organized workspace.
          </Text>
        </Card>

        {/* CLINIC SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Clinic Management</Text>
          <Text style={styles.sectionSubtitle}>Core operations</Text>
        </View>

        <View style={styles.grid}>
          {filteredClinicButtons.map((btn) => (
            <ButtonCard
              key={btn.route}
              label={btn.label}
              route={btn.route}
              icon={btn.icon}
              description={btn.description}
              cardWidth={cardWidth}
            />
          ))}
        </View>

        {/* DRUGS SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Drug Information</Text>
          <Text style={styles.sectionSubtitle}>Medication references</Text>
        </View>

        <View style={styles.grid}>
          {filteredDrugButtons.map((btn) => (
            <ButtonCard
              key={btn.route}
              label={btn.label}
              route={btn.route}
              icon={btn.icon}
              description={btn.description}
              cardWidth={cardWidth}
            />
          ))}
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Log Out Session</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* CLINIC SWITCHER MODAL */}
      <Modal
        visible={clinicModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setClinicModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setClinicModalVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>

            <View style={styles.sheetHandle} />

            <Text style={styles.modalTitle}>Switch Clinic</Text>
            <Text style={styles.modalSubtitle}>Select your active branch for this session.</Text>

            <View style={styles.modalClinicList}>
              {/* FIX: map over real clinics from context — no isAvailable logic */}
              {clinics.map((clinic) => {
                const isSelected = clinic.id === activeClinic?.id;
                return (
                  <TouchableOpacity
                    key={clinic.id}
                    style={[
                      styles.modalCard,
                      isSelected && styles.modalCardSelected,
                    ]}
                    onPress={() => handleSelectClinic(clinic)}
                    activeOpacity={0.75}
                  >
                    <View style={[
                      styles.modalCardAccent,
                      isSelected && styles.modalCardAccentSelected,
                    ]} />

                    <View style={styles.modalCardBody}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalCardName}>
                          {clinic.clinic_name}
                        </Text>
                        {clinic.address && (
                          <Text style={styles.modalCardAddress}>
                            {clinic.address}
                          </Text>
                        )}
                      </View>

                      {isSelected ? (
                        <View style={styles.badgeActive}>
                          <Text style={styles.badgeActiveText}>Active</Text>
                        </View>
                      ) : (
                        <View style={styles.badgeAvailable}>
                          <Text style={styles.badgeAvailableText}>Switch</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setClinicModalVisible(false)}
            >
              <Text style={styles.modalDismissBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.muted,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  clinicSwitcherBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    maxWidth: 150,
  },
  clinicSwitcherIcon: {
    fontSize: 22,
  },
  clinicSwitcherTextGroup: {
    flexShrink: 1,
  },
  clinicSwitcherLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#095c29",
  },
  clinicSwitcherSub: {
    fontSize: 11,
    color: "#4ade80",
    marginTop: 1,
  },
  welcomeCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 22,
    padding: 22,
    marginBottom: 30,
  },
  welcomeTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  welcomeText: {
    color: theme.colors.white,
    fontSize: 14,
    lineHeight: 22,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fca5a5",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  logoutButtonText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#f5f7fb",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#cbd5e1",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
  },
  modalClinicList: {
    gap: 10,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  modalCardSelected: {
    borderColor: "#095c29",
    backgroundColor: "#f0fdf4",
  },
  modalCardAccent: {
    width: 5,
    backgroundColor: "#cbd5e1",
  },
  modalCardAccentSelected: {
    backgroundColor: "#095c29",
  },
  modalCardBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalCardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 3,
  },
  modalCardAddress: {
    fontSize: 13,
    color: "#64748b",
  },
  badgeActive: {
    backgroundColor: "#095c29",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeActiveText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  badgeAvailable: {
    backgroundColor: "#dcfce7",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeAvailableText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#095c29",
  },
  modalDismissBtn: {
    marginTop: 16,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalDismissBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
});