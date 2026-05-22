import { ScrollView, StyleSheet, Text } from "react-native";

export default function TransactionsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Transactions</Text>
      <Text style={styles.body}>
        Review billing and transaction history for your practice.
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
