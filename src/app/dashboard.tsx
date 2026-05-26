import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { useAuth } from "@/components/context/auth-context";

type ButtonRoute =
  | "/patient-records"
  | "/consultations"
  | "/transactions"
  | "/brand-directory"
  | "/generics"
  | "/diseases";

type ButtonItem = {
  label: string;
  route: ButtonRoute;
  icon: string;
};

type ButtonCardProps = ButtonItem;

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // ✅ smarter responsive column system
  const getColumns = () => {
    if (width >= 1024) return 4; // large tablets / desktop-like
    if (width >= 768) return 3; // tablets
    if (width >= 600) return 3; // phone landscape
    return 2; // phone portrait
  };

  const columns = getColumns();
  const cardWidth = `${100 / columns - 2}%`;

  const clinicButtons: ButtonItem[] = [
    { label: "Patient Records", route: "/patient-records", icon: "🩺" },
    { label: "Consultations", route: "/consultations", icon: "📋" },
    { label: "Transactions", route: "/transactions", icon: "💳" },
  ];

  const drugButtons: ButtonItem[] = [
    { label: "Brand Directory", route: "/brand-directory", icon: "💊" },
    { label: "Generics", route: "/generics", icon: "🧪" },
    { label: "Diseases", route: "/diseases", icon: "🦠" },
  ];

  const ButtonCard = ({ label, route, icon }: ButtonCardProps) => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, { flexBasis: `${100 / columns - 2}%` }]}
        onPress={() => router.push(route)}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>

        <Text style={styles.cardText}>{label}</Text>
        <Text style={styles.cardSubtext}>Open Module</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Day 👋</Text>
          <Text style={styles.title}>Medical Dashboard</Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>DR</Text>
        </View>
      </View>

      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Welcome to CraveCare EMR</Text>
        <Text style={styles.welcomeText}>
          Manage patients, consultations, transactions, and drug information in
          one organized workspace.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Clinic Management</Text>
        <Text style={styles.sectionSubtitle}>Core operations</Text>
      </View>

      <View style={styles.grid}>
        {clinicButtons.map((btn) => (
          <ButtonCard key={btn.route} {...btn} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Drug Information</Text>
        <Text style={styles.sectionSubtitle}>Medication references</Text>
      </View>

      <View style={styles.grid}>
        {drugButtons.map((btn) => (
          <ButtonCard key={btn.route} {...btn} />
        ))}
      </View>
      
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
    backgroundColor: "#f4f7f5",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#123524",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#095c29",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  welcomeCard: {
    backgroundColor: "#095c29",
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
    color: "#d8e8dd",
    fontSize: 14,
    lineHeight: 22,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginBottom: 16,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#eef6f1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 24,
  },
  cardText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    color: "#6b7280",
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