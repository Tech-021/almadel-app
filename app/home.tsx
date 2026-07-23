import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InventoryTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";

const quickLinks = [
  {
    href: "/sale",
    icon: "cart-outline",
    title: "Sale",
    subtitle: "Open the barcode checkout screen",
  },
  {
    href: "/dashboard",
    icon: "analytics-outline",
    title: "Dashboard",
    subtitle: "Sales and stock snapshot",
  },
  {
    href: "/products",
    icon: "cube-outline",
    title: "Products",
    subtitle: "Search and manage catalog",
  },
  {
    href: "/receive",
    icon: "download-outline",
    title: "Receive",
    subtitle: "Add stock quickly",
  },
  {
    href: "/stock",
    icon: "file-tray-stacked-outline",
    title: "Stock",
    subtitle: "Adjust inventory levels",
  },
  {
    href: "/add-product",
    icon: "add-circle-outline",
    title: "Add product",
    subtitle: "Create new inventory item",
  },
];

export default function HomeScreen() {
  const { loading, role, signOut, user } = useAuth();
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  const displayName = useMemo(
    () => user?.fullName ?? user?.email ?? "User",
    [user],
  );

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
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: palette.accent }]}>
            <Ionicons name="scan" size={28} color="#FFFFFF" />
          </View>

          <Text style={[styles.title, { color: palette.text }]}>
            Welcome, {displayName}
          </Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>
            {role === "admin" ? "Admin workspace" : "Staff workspace"} for
            barcode sales, receiving, and stock control.
          </Text>
        </View>

        <View
          style={[
            styles.panel,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <View style={styles.panelHeader}>
            <Text style={[styles.panelTitle, { color: palette.text }]}>
              Quick actions
            </Text>
            <Text style={[styles.panelMeta, { color: palette.muted }]}>
              Jump to the main operational screens.
            </Text>
          </View>

          <View style={styles.quickGrid}>
            {quickLinks.map((item) => (
              <Pressable
                key={item.href}
                style={[
                  styles.quickCard,
                  { backgroundColor: palette.mutedSoft },
                ]}
                onPress={() => router.push(item.href as never)}
              >
                <View
                  style={[
                    styles.quickIcon,
                    { backgroundColor: palette.accentSoft },
                  ]}
                >
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={palette.accent}
                  />
                </View>
                <Text style={[styles.quickTitle, { color: palette.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.quickSubtitle, { color: palette.muted }]}>
                  {item.subtitle}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.rowActions}>
          <Pressable
            style={[
              styles.navButton,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
            onPress={() => router.push("/profile")}
          >
            <Ionicons
              name="person-circle-outline"
              size={18}
              color={palette.accent}
            />
            <Text style={[styles.navButtonText, { color: palette.text }]}>
              Profile
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.navButton,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
            onPress={() => router.push("/settings")}
          >
            <Ionicons
              name="settings-outline"
              size={18}
              color={palette.accent}
            />
            <Text style={[styles.navButtonText, { color: palette.text }]}>
              Settings
            </Text>
          </Pressable>
        </View>

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 22,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 20,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 20,
    height: 60,
    justifyContent: "center",
    marginBottom: 16,
    width: 60,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 8,
  },
  panel: {
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  panelHeader: {
    marginBottom: 14,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  panelMeta: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  quickGrid: {
    gap: 10,
  },
  quickCard: {
    borderRadius: 18,
    padding: 16,
  },
  quickIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 38,
    justifyContent: "center",
    marginBottom: 12,
    width: 38,
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  quickSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 4,
  },
  rowActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  navButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 54,
  },
  navButtonText: {
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
