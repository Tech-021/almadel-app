import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { WelcomeBackButton } from "@/components/navigation/welcome-back-button";
import { useToast } from "@/components/ui/toaster";
import { InventoryTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function AccountScreen() {
  const { loading, role, signOut, user } = useAuth();
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];
  const { toast } = useToast();

  const handleSignOut = () => {
    Alert.alert("Sign out", "Do you want to leave this session?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          toast.success("Signed out", "You have left this session.");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <View style={styles.container}>
        <WelcomeBackButton />

        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: palette.accent }]}>
            <Ionicons name={role === "admin" ? "shield-checkmark" : "person"} size={30} color="#FFFFFF" />
          </View>

          <Text style={[styles.title, { color: palette.text }]}>Account</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>Signed in workspace profile</Text>
        </View>

        <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <InfoRow icon="mail-outline" label="Email" value={user?.email ?? "Unknown"} />
          <InfoRow icon="id-card-outline" label="Role" value={role ?? "Staff"} />
          <InfoRow icon="checkmark-circle-outline" label="Status" value="Active session" />
        </View>

        <Pressable style={[styles.signOutButton, loading && styles.disabledButton]} disabled={loading} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={21} color="#FFFFFF" />
          <Text style={styles.signOutText}>{loading ? "Signing out..." : "Sign out"}</Text>
        </Pressable>
      </View>
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
        <Ionicons name={icon} size={19} color={palette.accent} />
      </View>

      <View style={styles.infoTextBlock}>
        <Text style={[styles.infoLabel, { color: palette.muted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: palette.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  container: {
    flex: 1,
    padding: 22,
  },
  header: {
    marginTop: 18,
    marginBottom: 22,
  },
  avatar: {
    width: 62,
    height: 62,
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 8,
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    color: "#0F172A",
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 6,
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoRow: {
    alignItems: "center",
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 13,
    padding: 16,
  },
  infoIcon: {
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  infoTextBlock: {
    flex: 1,
  },
  infoLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  infoValue: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  signOutButton: {
    alignItems: "center",
    backgroundColor: "#DC2626",
    borderRadius: 8,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 54,
  },
  signOutText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.7,
  },
});
