import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  const colors = toneStyles[tone];

  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: colors.backgroundColor }]}>
        <Ionicons name={icon} size={20} color={colors.color} />
      </View>

      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minWidth: 145,
    padding: 14,
  },
  iconBox: {
    alignItems: "center",
    borderRadius: 8,
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
