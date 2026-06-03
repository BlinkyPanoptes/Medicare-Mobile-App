import { useAuth } from "@/components/context/auth-context";
import { ButtonCard, Card } from "@/components/ui";
import { theme } from "@/theme";
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

const CLINICS = [
  { id: '1', name: 'Main Clinic', address: 'Primary Branch', isAvailable: true },
  { id: '2', name: 'Second Branch', address: 'Coming Soon', isAvailable: false },
  { id: '3', name: 'Third Branch', address: 'Coming Soon', isAvailable: false },
];

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const { user, logout } = useAuth();

  const [clinicModalVisible, setClinicModalVisible] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState('1');

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const handleSelectClinic = (clinic: typeof CLINICS[0]) => {
    if (!clinic.isAvailable) {
      return; // do nothing for unavailable — badge already signals it
    }
    setSelectedClinicId(clinic.id);
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
    return btn.allowedRoles.includes(
      btn.allowedRoles.includes(user.role) ? user.role : (user.role as any),
    );
  };

  const filteredClinicButtons = clinicButtons.filter(filterByRole);
  const filteredDrugButtons = drugButtons.filter(filterByRole);

  const activeClinic = CLINICS.find(c => c.id === selectedClinicId) ?? CLINICS[0];

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
              Good Day, {user ? `Dr. ${user.first_name}` : "Staff"}! 👋
            </Text>
            <Text style={styles.title}>{activeClinic.name}</Text>
          </View>

          {/* CLINIC SWITCHER BUTTON */}
          <TouchableOpacity
            style={styles.clinicSwitcherBtn}
            onPress={() => setClinicModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.clinicSwitcherIcon}>🏥</Text>
            <View style={styles.clinicSwitcherTextGroup}>
              <Text style={styles.clinicSwitcherLabel} numberOfLines={1}>
                {activeClinic.name}
              </Text>
              <Text style={styles.clinicSwitcherSub}>Tap to switch</Text>
            </View>
          </TouchableOpacity>
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
        {/* Dim backdrop — tap to dismiss */}
        <Pressable style={styles.modalBackdrop} onPress={() => setClinicModalVisible(false)}>
          {/* Stop tap propagation on the sheet itself */}
          <Pressable style={styles.modalSheet} onPress={() => {}}>

            {/* Sheet handle */}
            <View style={styles.sheetHandle} />

            <Text style={styles.modalTitle}>Switch Clinic</Text>
            <Text style={styles.modalSubtitle}>Select your active branch for this session.</Text>

            <View style={styles.modalClinicList}>
              {CLINICS.map((clinic) => {
                const isSelected = clinic.id === selectedClinicId;
                return (
                  <TouchableOpacity
                    key={clinic.id}
                    style={[
                      styles.modalCard,
                      isSelected && styles.modalCardSelected,
                      !clinic.isAvailable && styles.modalCardDisabled,
                    ]}
                    onPress={() => handleSelectClinic(clinic)}
                    activeOpacity={clinic.isAvailable ? 0.75 : 1}
                  >
                    {/* Accent bar */}
                    <View style={[
                      styles.modalCardAccent,
                      isSelected ? styles.modalCardAccentSelected : null,
                      !clinic.isAvailable ? styles.modalCardAccentDisabled : null,
                    ]} />

                    <View style={styles.modalCardBody}>
                      <View style={{ flex: 1 }}>
                        <Text style={[
                          styles.modalCardName,
                          !clinic.isAvailable && styles.modalCardNameDisabled,
                        ]}>
                          {clinic.name}
                        </Text>
                        <Text style={[
                          styles.modalCardAddress,
                          !clinic.isAvailable && styles.modalCardAddressDisabled,
                        ]}>
                          {clinic.address}
                        </Text>
                      </View>

                      {isSelected ? (
                        <View style={styles.badgeActive}>
                          <Text style={styles.badgeActiveText}>Active</Text>
                        </View>
                      ) : clinic.isAvailable ? (
                        <View style={styles.badgeAvailable}>
                          <Text style={styles.badgeAvailableText}>Switch</Text>
                        </View>
                      ) : (
                        <View style={styles.badgeDisabled}>
                          <Text style={styles.badgeDisabledText}>Coming Soon</Text>
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

  // --- CLINIC SWITCHER BUTTON ---
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

  // --- CARDS & SECTIONS (unchanged) ---
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

  // --- MODAL ---
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
  modalCardDisabled: {
    opacity: 0.55,
  },
  modalCardAccent: {
    width: 5,
    backgroundColor: "#cbd5e1",
  },
  modalCardAccentSelected: {
    backgroundColor: "#095c29",
  },
  modalCardAccentDisabled: {
    backgroundColor: "#e2e8f0",
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
  modalCardNameDisabled: {
    color: "#94a3b8",
  },
  modalCardAddress: {
    fontSize: 13,
    color: "#64748b",
  },
  modalCardAddressDisabled: {
    color: "#b0bac9",
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
  badgeDisabled: {
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeDisabledText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
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