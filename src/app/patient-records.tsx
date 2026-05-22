import { ScrollView, StyleSheet, Text } from "react-native";

export default function PatientRecordsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Patient Records</Text>
      <Text style={styles.body}>
        View and manage patient records for your clinic here.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 12,
    color: "#1e2a38",
  },
  body: {
    fontSize: 16,
    color: "#34495e",
    lineHeight: 24,
  },
});
