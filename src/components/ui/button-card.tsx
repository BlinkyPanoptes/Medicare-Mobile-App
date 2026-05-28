import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { shadows } from "../../theme/shadows";

type Props = {
  label: string;
  route: any;
  icon: string;
  cardWidth: number;
  description: string;
  allowedRoles?: ("doctor" | "assistant" | "admin")[];
};

export default function ButtonCard({
  label,
  route,
  icon,
  cardWidth,
  description,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.card, { width: `${cardWidth}%` }]}
      onPress={() => router.push(route)}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <Text style={styles.label}>{label}</Text>
      <Text style={styles.sub}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginBottom: 16,

    ...shadows.card,
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.softGreen,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  icon: {
    fontSize: 24,
  },

  label: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },

  sub: {
    fontSize: 12,
    color: colors.muted,
  },
});
