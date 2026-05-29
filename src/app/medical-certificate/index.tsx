import { StyleSheet, Text, View } from "react-native";

export default function MedicalCertificateScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medical Certificate</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7f5",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#123524",
  },
});