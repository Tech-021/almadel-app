import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WelcomeBackButton } from "@/components/navigation/welcome-back-button";
import { InventoryTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type AdminScreenShellProps = {
  children: ReactNode;
  eyebrow: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  subtitle: string;
  title: string;
};

export function AdminScreenShell({
  children,
  eyebrow,
  onRefresh,
  refreshing = false,
  subtitle,
  title,
}: AdminScreenShellProps) {
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          alwaysBounceVertical={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          bounces={false}
          contentContainerStyle={styles.container}
          contentInsetAdjustmentBehavior={Platform.OS === "ios" ? "always" : undefined}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
          }
          showsVerticalScrollIndicator
        >
          <WelcomeBackButton />

          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>{eyebrow}</Text>
            <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>{subtitle}</Text>
          </View>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 28,
  },
  header: {
    marginTop: 18,
    marginBottom: 18,
  },
  eyebrow: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 7,
    textTransform: "uppercase",
  },
  title: {
    color: "#0F172A",
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 6,
  },
});
