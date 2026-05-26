import { ButtonCard, Card } from "@/components/ui";
import { theme } from "@/theme";
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

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

export default function Dashboard() {
  const { width } = useWindowDimensions();

  const getColumns = () => {
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    if (width >= 600) return 3;
    return 2;
  };

  const columns = getColumns();

  const cardWidth = 100 / columns - 2;

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Day 👋</Text>
          <Text style={styles.title}>Medical Dashboard</Text>
        </View>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>DR</Text>
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
        {clinicButtons.map((btn) => (
          <ButtonCard
            key={btn.route}
            label={btn.label}
            route={btn.route}
            icon={btn.icon}
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
        {drugButtons.map((btn) => (
          <ButtonCard
            key={btn.route}
            label={btn.label}
            route={btn.route}
            icon={btn.icon}
            cardWidth={cardWidth}
          />
        ))}
      </View>
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
    fontSize: 16,
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
});
