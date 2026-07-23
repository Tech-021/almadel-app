import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WelcomeBackButton } from "@/components/navigation/welcome-back-button";
import { InventoryTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function ProfileScreen() {
  const { loading, role, signOut, user } = useAuth();
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

        <Text style={[styles.eyebrow, { color: palette.accent }]}>Profile</Text>
        <Text style={[styles.title, { color: palette.text }]}>
          Your account
        </Text>

        <View
          style={[
            styles.panel,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <InfoRow
            icon="person-outline"
            label="Name"
            value={user?.fullName ?? "Unknown"}
          />
          <InfoRow
            icon="mail-outline"
            label="Email"
            value={user?.email ?? "Unknown"}
          />
          <InfoRow
            icon="id-card-outline"
            label="Role"
            value={role ?? "staff"}
          />
        </View>

        <Pressable
          style={[
            styles.linkButton,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="settings-outline" size={18} color={palette.accent} />
          <Text style={[styles.linkButtonText, { color: palette.text }]}>
            Open settings
          </Text>
        </Pressable>

        <Pressable
          style={[styles.signOutButton, { backgroundColor: palette.danger }]}
          disabled={loading}
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.signOutText}>
            {loading ? "Signing out..." : "Sign out"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type InfoRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function InfoRow({ icon, label, value }: InfoRowProps) {
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  return (
    <View style={[styles.infoRow, { borderBottomColor: palette.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={18} color={palette.accent} />
      </View>
      <View style={styles.infoTextBlock}>
        <Text style={[styles.infoLabel, { color: palette.muted }]}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color: palette.text }]}>{value}</Text>
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
    marginBottom: 16,
    overflow: "hidden",
  },
  infoRow: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  infoIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  infoTextBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  linkButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: 16,
    minHeight: 54,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  signOutButton: {
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 54,
  },
  signOutText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});
