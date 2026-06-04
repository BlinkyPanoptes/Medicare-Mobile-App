import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type PrescriptionButton = {
  label: string;
  icon: string;
  description: string;
  onPress: () => void;
};

const buttons: PrescriptionButton[] = [
  {
    label: "New Prescription",
    icon: "📝",
    description: "Create a new medication order",
    onPress: () => router.push("/consultations/newPrescription"),
  },
   {
    label: "Represcribe",
    icon: "🔄",
    description: "Reissue a previous prescription",
    onPress: () => router.push("/consultations/rePrescribe"),
  },
  {
    label: "Templates",
    icon: "📄",
    description: "Use or manage prescription templates",
    onPress: () => {},
  },
  {
    label: "Formulary",
    icon: "📖",
    description: "View approved medications list",
    onPress: () => {},
  },
];

export default function CreatePrescriptionScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Create Prescription</Text>
      <Text style={styles.subheading}>How would you like to prescribe?</Text>

      <View style={styles.grid}>
        {buttons.map((btn) => (
          <TouchableOpacity
            key={btn.label}
            activeOpacity={0.85}
            style={styles.card}
            onPress={btn.onPress}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{btn.icon}</Text>
            </View>
            <Text style={styles.cardText}>{btn.label}</Text>
            <Text style={styles.cardSubtext}>{btn.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#123524",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 24,
  },
  sub1: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#123524",
    marginBottom: 6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginBottom: 16,
    width: "48%",

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
});
