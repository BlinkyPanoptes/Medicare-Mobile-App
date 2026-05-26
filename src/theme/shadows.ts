import { Platform } from "react-native";

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    android: {
      elevation: 3,
    },
  }),
};
