import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WelcomeBackButton } from "@/components/navigation/welcome-back-button";
import { InventoryTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getApiBaseUrl } from "@/lib/api-config";

export default function SettingsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.background }]}
    >
      <ScrollView
        alwaysBounceVertical={false}
        bounces={false}
        contentContainerStyle={styles.container}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <WelcomeBackButton />

        <Text style={[styles.eyebrow, { color: palette.accent }]}>
          Settings
        </Text>
        <Text style={[styles.title, { color: palette.text }]}>
          Connection and session
        </Text>

        <View
          style={[
            styles.panel,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <SettingRow
            icon="cloud-outline"
            label="API base URL"
            value={getApiBaseUrl()}
          />
          <SettingRow
            icon="person-outline"
            label="Signed in as"
            value={user?.email ?? "Unknown"}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            label="Session status"
            value={user ? "Active" : "Signed out"}
          />
        </View>

        <View
          style={[
            styles.note,
            { backgroundColor: palette.mutedSoft, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.noteTitle, { color: palette.text }]}>
            Network note
          </Text>
          <Text style={[styles.noteText, { color: palette.muted }]}>
            In development, the app prefers EXPO_PUBLIC_API_URL when provided,
            otherwise it derives the API host from the Expo dev server and maps
            Android emulator loopback correctly.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function SettingRow({ icon, label, value }: SettingRowProps) {
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  return (
    <View style={[styles.row, { borderBottomColor: palette.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={18} color={palette.accent} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: palette.muted }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: palette.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 22,
    paddingBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 18,
  },
  panel: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  rowIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  rowValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  note: {
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    padding: 18,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  noteText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
});
