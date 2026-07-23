import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { InventoryTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function WelcomeBackButton() {
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to welcome"
      style={[
        styles.button,
        { backgroundColor: palette.card, borderColor: palette.border },
      ]}
      onPress={() => router.dismissTo("/home")}
    >
      <Ionicons name="arrow-back" size={18} color={palette.accent} />
      <Text style={[styles.text, { color: palette.text }]}>Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 13,
    fontWeight: "900",
  },
});
