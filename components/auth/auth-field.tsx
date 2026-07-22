import type { ComponentProps, ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { InventoryTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type AuthFieldProps = ComponentProps<typeof TextInput> & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  rightAction?: ReactNode;
};

export function AuthField({ icon, label, rightAction, ...props }: AuthFieldProps) {
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: palette.muted }]}>{label}</Text>
      <View style={[styles.shell, { backgroundColor: palette.mutedSoft, borderColor: palette.border }]}>
        <Ionicons name={icon} size={20} color={palette.muted} />
        <TextInput
          placeholderTextColor={palette.muted}
          style={[styles.input, { color: palette.text }]}
          {...props}
        />
        {rightAction}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  shell: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    minHeight: 24,
  },
});
