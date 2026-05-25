import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
};

type ButtonCardProps = ButtonItem;

export default function Dashboard() {
  const ClinicButtons: ButtonItem[] = [
    { label: "Patient Records", route: "/patient-records" },
    { label: "Consultations", route: "/consultations" },
    { label: "Transactions", route: "/transactions" },
  ];

  const DrugButtons: ButtonItem[] = [
    { label: "Brand Directory", route: "/brand-directory" },
    { label: "Generics", route: "/generics" },
    { label: "Diseases", route: "/diseases" },
  ];

  const ButtonCard = ({ label, route }: ButtonCardProps) => {
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(route)}>
        <Text style={styles.cardText}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Medical Records Dashboard</Text>

      <Text style={styles.sectionTitle}>Clinic Management</Text>
      <View style={styles.grid}>
        {ClinicButtons.map((btn) => (
          <ButtonCard key={btn.route} label={btn.label} route={btn.route} />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Drug Information</Text>
      <View style={styles.grid}>
        {DrugButtons.map((btn) => (
          <ButtonCard key={btn.route} label={btn.label} route={btn.route} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  doctorButton: {
    backgroundColor: "#095c29",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    minHeight: 50,
  },

  doctorButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1e2a38",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    color: "#34495e",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#ffffff",
    width: "48%",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2c3e50",
    textAlign: "center",
  },
});
