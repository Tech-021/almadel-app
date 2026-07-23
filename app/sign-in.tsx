import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AuthButton } from "@/components/auth/auth-button";
import { AuthField } from "@/components/auth/auth-field";
import { AuthScreenShell } from "@/components/auth/auth-screen-shell";
import { useAuth } from "@/hooks/use-auth";

type Role = "staff" | "admin";

export default function SignInScreen() {
  const { initializing, loading, session, signIn } = useAuth();
  const [role, setRole] = useState<Role>("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securePassword, setSecurePassword] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initializing && session) {
      router.replace("/home");
    }
  }, [initializing, session]);

  const roleLabel = useMemo(
    () => (role === "admin" ? "Admin access" : "Staff access"),
    [role],
  );

  const submit = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError(null);

    try {
      await signIn({ email: normalizedEmail, password, role });
      router.replace("/home");
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Authentication failed.",
      );
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      "Forgot password",
      "Password reset is not wired in this frontend. Ask an administrator to help recover the account.",
    );
  };

  return (
    <AuthScreenShell
      badge="Sign in"
      title="Welcome back"
      subtitle="Use your staff or admin account to continue to the workspace."
    >
      <View style={styles.roleRow}>
        <RoleChip
          active={role === "staff"}
          icon="people"
          label="Staff"
          onPress={() => setRole("staff")}
        />
        <RoleChip
          active={role === "admin"}
          icon="shield-checkmark"
          label="Admin"
          onPress={() => setRole("admin")}
        />
      </View>

      <Text style={styles.roleHint}>{roleLabel}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AuthField
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        icon="mail-outline"
        label="Email"
        onChangeText={setEmail}
        placeholder="name@example.com"
        value={email}
      />

      <AuthField
        autoCapitalize="none"
        autoComplete="password"
        icon="lock-closed-outline"
        label="Password"
        onChangeText={setPassword}
        placeholder="Enter your password"
        rightAction={
          <Pressable
            onPress={() => setSecurePassword((value) => !value)}
            style={styles.iconButton}
          >
            <Ionicons
              name={securePassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#64748B"
            />
          </Pressable>
        }
        secureTextEntry={securePassword}
        value={password}
      />

      <Pressable
        onPress={handleForgotPassword}
        style={styles.forgotPasswordButton}
      >
        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
      </Pressable>

      <AuthButton label="Login" loading={loading} onPress={submit} />

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Don&apos;t have an account?</Text>
        <Pressable onPress={() => router.push("/sign-up")}>
          <Text style={styles.footerLink}>Create Account</Text>
        </Pressable>
      </View>
    </AuthScreenShell>
  );
}

type RoleChipProps = {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function RoleChip({ active, icon, label, onPress }: RoleChipProps) {
  return (
    <Pressable
      style={[styles.roleChip, active && styles.roleChipActive]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={active ? "#FFFFFF" : "#64748B"} />
      <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  roleChip: {
    alignItems: "center",
    backgroundColor: "#EEF2F7",
    borderRadius: 999,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14,
  },
  roleChipActive: {
    backgroundColor: "#2563EB",
  },
  roleChipText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "900",
  },
  roleChipTextActive: {
    color: "#FFFFFF",
  },
  roleHint: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  error: {
    color: "#B91C1C",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 30,
    minWidth: 30,
  },
  forgotPasswordButton: {
    alignSelf: "flex-start",
    marginBottom: 14,
    marginTop: -4,
  },
  forgotPasswordText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "800",
  },
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 14,
  },
  footerText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  footerLink: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "900",
  },
});
