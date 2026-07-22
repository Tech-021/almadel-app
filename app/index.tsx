import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { AuthScreenShell } from "@/components/auth/auth-screen-shell";
import { AuthButton } from "@/components/auth/auth-button";
import { useAuth } from "@/hooks/use-auth";

export default function AuthScreen() {
  const { initializing, session } = useAuth();

  useEffect(() => {
    if (!initializing && session) {
      router.replace("/home");
    }
  }, [initializing, session]);

  if (initializing) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <AuthScreenShell
      badge="Inventory control"
      title="Manage stock, sales, and staff in one workspace"
      subtitle="A clean barcode inventory app for sign in, receiving, sales, and admin access."
    >
      <View style={styles.actions}>
        <AuthButton label="Sign In" onPress={() => router.push("/sign-in")} />

        <Pressable style={styles.secondaryButton} onPress={() => router.push("/sign-up")}>
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </Pressable>
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  actions: {
    gap: 12,
    marginTop: 10,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#D6E2FF",
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 54,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "800",
  },
});
