import { theme } from "@/theme";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
};

export default function SectionHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing?.sm ?? 14,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },

  subtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
});
