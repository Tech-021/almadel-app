import { useMemo, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useToast } from "@/components/ui/toaster";
import { InventoryTheme } from "@/constants/theme";
import { AuthMode, UserRole, useAuth } from "@/hooks/use-auth";
import { useColorScheme } from "@/hooks/use-color-scheme";

const roleCopy: Record<UserRole, { title: string; eyebrow: string; helper: string }> = {
  admin: {
    title: "Admin access",
    eyebrow: "Management portal",
    helper: "Admin accounts can review operations and manage the workspace.",
  },
  staff: {
    title: "Staff access",
    eyebrow: "Daily counter flow",
    helper: "Staff can create an account, sign in, scan items, and update stock.",
  },
};

export function AuthCard() {
  const { loading, signIn, signUpStaff } = useAuth();
  const colorScheme = useColorScheme();
  const palette = InventoryTheme[colorScheme ?? "light"];
  const { toast } = useToast();
  const [role, setRole] = useState<UserRole>("staff");
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securePassword, setSecurePassword] = useState(true);

  const isSignUp = mode === "signUp";
  const content = roleCopy[role];

  const title = useMemo(() => {
    if (role === "admin") return "Welcome back, admin";
    return isSignUp ? "Create staff account" : "Welcome back, staff";
  }, [isSignUp, role]);

  const handleRoleChange = (nextRole: UserRole) => {
    setRole(nextRole);

    if (nextRole === "admin") {
      setMode("signIn");
    }
  };

  const submit = async () => {
    if (!email.trim() || !password) {
      toast.error("Missing details", "Please enter your email and password.");
      return;
    }

    if (isSignUp && !fullName.trim()) {
      toast.error("Missing name", "Please enter the staff member name.");
      return;
    }

    try {
      if (isSignUp) {
        await signUpStaff({ email, password, fullName, role: "staff" });
        toast.success("Account created", "Staff account is ready. You can sign in now.");
        setMode("signIn");
        return;
      }

      await signIn({ email, password, role });
      toast.success("Signed in", "Welcome back to Inventory Desk.");
    } catch (error) {
      toast.error(
        "Authentication failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          alwaysBounceVertical={false}
          automaticallyAdjustKeyboardInsets
          bounces={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.container}
          contentInsetAdjustmentBehavior="always"
          overScrollMode="never"
          showsVerticalScrollIndicator
        >
          <View style={styles.brandBlock}>
            <View style={[styles.logoMark, { backgroundColor: palette.accent }]}>
              <Ionicons name="scan" size={28} color="#FFFFFF" />
            </View>

            <Text style={[styles.brandTitle, { color: palette.text }]}>Inventory Desk</Text>
            <Text style={[styles.brandSubtitle, { color: palette.muted }]}>Clean access for barcode sales, stock receiving, and daily inventory control.</Text>
          </View>

          <View style={[styles.panel, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={styles.panelHeader}>
              <Text style={[styles.eyebrow, { color: palette.accent }]}>{content.eyebrow}</Text>
              <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
              <Text style={[styles.helper, { color: palette.muted }]}>{content.helper}</Text>
            </View>

            <View style={styles.roleTabs}>
              <RoleButton active={role === "staff"} icon="people" label="Staff" onPress={() => handleRoleChange("staff")} />
              <RoleButton active={role === "admin"} icon="shield-checkmark" label="Admin" onPress={() => handleRoleChange("admin")} />
            </View>

            {role === "staff" && (
              <View style={styles.modeTabs}>
                <Pressable style={[styles.modeButton, !isSignUp && styles.modeButtonActive]} onPress={() => setMode("signIn")}>
                  <Text style={[styles.modeButtonText, !isSignUp && styles.modeButtonTextActive]}>Sign in</Text>
                </Pressable>

                <Pressable style={[styles.modeButton, isSignUp && styles.modeButtonActive]} onPress={() => setMode("signUp")}>
                  <Text style={[styles.modeButtonText, isSignUp && styles.modeButtonTextActive]}>Sign up</Text>
                </Pressable>
              </View>
            )}

            {isSignUp && (
              <AuthInput
                autoCapitalize="words"
                icon="person-outline"
                label="Full name"
                onChangeText={setFullName}
                placeholder="Staff member name"
                value={fullName}
              />
            )}

            <AuthInput
              autoCapitalize="none"
              autoComplete="email"
              icon="mail-outline"
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="name@example.com"
              value={email}
            />

            <AuthInput
              autoCapitalize="none"
              autoComplete={isSignUp ? "new-password" : "password"}
              icon="lock-closed-outline"
              label="Password"
              onChangeText={setPassword}
              placeholder="Enter password"
              rightAction={
                <Pressable style={styles.iconButton} onPress={() => setSecurePassword((value) => !value)}>
                  <Ionicons name={securePassword ? "eye-outline" : "eye-off-outline"} size={20} color="#64748B" />
                </Pressable>
              }
              secureTextEntry={securePassword}
              value={password}
            />

            <Pressable style={[styles.submitButton, loading && styles.disabledButton]} disabled={loading} onPress={submit}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>{isSignUp ? "Create staff account" : "Sign in"}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </Pressable>

            {role === "admin" && (
              <Text style={styles.adminNote}>Admin registration is disabled. Ask the system owner to create admin accounts.</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type RoleButtonProps = {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function RoleButton({ active, icon, label, onPress }: RoleButtonProps) {
  return (
    <Pressable style={[styles.roleButton, active && styles.roleButtonActive]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={active ? "#0F172A" : "#64748B"} />
      <Text style={[styles.roleButtonText, active && styles.roleButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

type AuthInputProps = ComponentProps<typeof TextInput> & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  rightAction?: ReactNode;
};

function AuthInput({ icon, label, rightAction, ...props }: AuthInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <Ionicons name={icon} size={20} color="#64748B" />
        <TextInput placeholderTextColor="#94A3B8" style={styles.input} {...props} />
        {rightAction}
      </View>
    </View>
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
    flexGrow: 1,
    justifyContent: "flex-start",
    padding: 22,
    paddingBottom: 32,
    paddingTop: 34,
  },
  brandBlock: {
    marginBottom: 22,
  },
  logoMark: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#0F172A",
    marginBottom: 18,
  },
  brandTitle: {
    color: "#0F172A",
    fontSize: 34,
    fontWeight: "900",
  },
  brandSubtitle: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 420,
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  panelHeader: {
    marginBottom: 16,
  },
  eyebrow: {
    color: "#0F766E",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: "#0F172A",
    fontSize: 25,
    fontWeight: "900",
  },
  helper: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 8,
  },
  roleTabs: {
    backgroundColor: "#EEF2F7",
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
    padding: 5,
  },
  roleButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 50,
  },
  roleButtonActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  roleButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "900",
  },
  roleButtonTextActive: {
    color: "#0F172A",
  },
  modeTabs: {
    backgroundColor: "#EEF2F7",
    borderRadius: 8,
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
    padding: 5,
  },
  modeButton: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  modeButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  modeButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "900",
  },
  modeButtonTextActive: {
    color: "#0F172A",
  },
  inputGroup: {
    marginTop: 13,
  },
  inputLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
  },
  inputShell: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: 13,
  },
  input: {
    color: "#0F172A",
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  iconButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#0F766E",
    borderRadius: 8,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 54,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.7,
  },
  adminNote: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 14,
    textAlign: "center",
  },
});
