import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { InventoryTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type AuthButtonProps = ComponentProps<typeof Pressable> & {
  label: string;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function AuthButton({
  icon = "arrow-forward",
  label,
  loading = false,
  style,
  ...props
}: AuthButtonProps) {
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.accent, opacity: pressed ? 0.92 : 1 },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 16,
    minHeight: 54,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});
