import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InventoryTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type AuthScreenShellProps = {
  badge?: string;
  children: ReactNode;
  footer?: ReactNode;
  subtitle: string;
  title: string;
};

export function AuthScreenShell({
  badge,
  children,
  footer,
  subtitle,
  title,
}: AuthScreenShellProps) {
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.background }]}
    >
      <View
        style={[styles.orbLarge, { backgroundColor: palette.accentSoft }]}
      />
      <View
        style={[styles.orbSmall, { backgroundColor: palette.warningSoft }]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          alwaysBounceVertical={false}
          automaticallyAdjustKeyboardInsets
          bounces={false}
          contentContainerStyle={styles.container}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View
              style={[styles.logoMark, { backgroundColor: palette.accent }]}
            >
              <Ionicons name="scan" size={28} color="#FFFFFF" />
            </View>

            <Text style={[styles.brandTitle, { color: palette.text }]}>
              Inventory Desk
            </Text>
            <Text style={[styles.brandSubtitle, { color: palette.muted }]}>
              {subtitle}
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            {badge ? (
              <Text style={[styles.badge, { color: palette.accent }]}>
                {badge}
              </Text>
            ) : null}
            <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
            <Text style={[styles.description, { color: palette.muted }]}>
              {subtitle}
            </Text>

            <View style={styles.content}>{children}</View>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
    paddingBottom: 32,
    paddingTop: 20,
  },
  hero: {
    marginBottom: 18,
  },
  logoMark: {
    alignItems: "center",
    borderRadius: 20,
    height: 60,
    justifyContent: "center",
    marginBottom: 16,
    width: 60,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: "900",
  },
  brandSubtitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 460,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  badge: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
  },
  description: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 8,
  },
  content: {
    marginTop: 18,
  },
  footer: {
    marginTop: 18,
  },
  orbLarge: {
    borderRadius: 999,
    height: 190,
    opacity: 0.55,
    position: "absolute",
    right: -70,
    top: -30,
    width: 190,
  },
  orbSmall: {
    borderRadius: 999,
    bottom: 110,
    height: 110,
    left: -50,
    opacity: 0.5,
    position: "absolute",
    width: 110,
  },
});
