import { ComponentProps } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { InventoryTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type AdminInputProps = ComponentProps<typeof TextInput> & {
  label: string;
};

export function AdminInput({ label, ...props }: AdminInputProps) {
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: palette.muted }]}>{label}</Text>
      <TextInput
        placeholderTextColor="#94A3B8"
        style={[
          styles.input,
          { backgroundColor: palette.mutedSoft, borderColor: palette.border, color: palette.text },
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 13,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 14,
    borderWidth: 1,
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
    minHeight: 50,
    paddingHorizontal: 14,
  },
  label: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 7,
  },
});
