import { useAuth } from "@/components/context/auth-context";
import { ButtonCard, Card } from "@/components/ui";
import { theme } from "@/theme";
import { UserRole } from "@/types/user";
import { router } from "expo-router";
import {
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

  // Destructure both user data and logout function cleanly at once
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // determines number of button columns based on screen width
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

  // Filter buttons based on user role
  const filterByRole = (btn: ButtonItem) => {
    if (!btn.allowedRoles) return true; // if no roles specified, show to all
    if (!user) return false; // if no user, hide role-specific buttons
    return btn.allowedRoles.includes(
      btn.allowedRoles.includes(user.role) ? user.role : (user.role as any),
    );
  };

  const filteredClinicButtons = clinicButtons.filter(filterByRole);
  const filteredDrugButtons = drugButtons.filter(filterByRole);

  // Helper to display a clean avatar name placeholder depending on user role
  const getAvatarText = () => {
    if (!user) return "EMR";
    if (user.role === "doctor") return "DOC";
    if (user.role === "assistant") return "AST";
    return "ADM";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Good Day,{" "}
            {user
              ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                "Staff"
              : "Staff"}{" "}
            👋
          </Text>
          <Text style={styles.title}>Medical Dashboard</Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getAvatarText()}</Text>
        </View>
      </View>

      {/* WELCOME CARD */}
      <Card style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Welcome to CraveCare EMR</Text>
        <Text style={styles.welcomeText}>
          Manage patients, consultations, transactions, and drug information in
          one organized workspace.
        </Text>
      </Card>

      {/* CLINIC */}
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

      {/* DRUGS */}
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
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
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
});
