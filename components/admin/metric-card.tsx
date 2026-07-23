import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { InventoryTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type MetricCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: "blue" | "green" | "red" | "slate";
  value: string;
};

const toneStyles = {
  blue: { backgroundColor: "#EFF6FF", color: "#2563EB" },
  green: { backgroundColor: "#ECFDF5", color: "#0F766E" },
  red: { backgroundColor: "#FEF2F2", color: "#DC2626" },
  slate: { backgroundColor: "#F1F5F9", color: "#334155" },
};

export function MetricCard({ icon, label, tone = "slate", value }: MetricCardProps) {
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];
  const colors = toneStyles[tone];

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.backgroundColor }]}>
        <Ionicons name={icon} size={20} color={colors.color} />
      </View>

      <Text style={[styles.label, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minWidth: 145,
    padding: 16,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: 14,
    height: 38,
    justifyContent: "center",
    marginBottom: 12,
    width: 38,
  },
  label: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  value: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "900",
  },
});
