import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthButton } from "@/components/auth/auth-button";
import { AuthField } from "@/components/auth/auth-field";
import { AuthScreenShell } from "@/components/auth/auth-screen-shell";
import { useAuth } from "@/hooks/use-auth";

export default function SignUpScreen() {
  const { initializing, loading, session, signUpStaff } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securePassword, setSecurePassword] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initializing && session) {
      router.replace("/home");
    }
  }, [initializing, session]);

  const submit = async () => {
    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim();

    if (!normalizedName) {
      setError("Please enter your name.");
      return;
    }

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);

    try {
      await signUpStaff({
        email: normalizedEmail,
        password,
        fullName: normalizedName,
        role: "staff",
      });
      router.replace("/home");
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Account creation failed.",
      );
    }
  };

  return (
    <AuthScreenShell
      badge="Create account"
      title="Join the workspace"
      subtitle="Create a staff account to start scanning products and updating stock."
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AuthField
        autoCapitalize="words"
        autoComplete="name"
        icon="person-outline"
        label="Name"
        onChangeText={setFullName}
        placeholder="Full name"
        value={fullName}
      />

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
        placeholder="Enter password"
        rightAction={
          <Pressable
            onPress={() => setSecurePassword((value) => !value)}
            style={styles.iconButton}
          >
            <Text style={styles.eyeLabel}>
              {securePassword ? "Show" : "Hide"}
            </Text>
          </Pressable>
        }
        secureTextEntry={securePassword}
        value={password}
      />

      <AuthField
        autoCapitalize="none"
        autoComplete="password"
        icon="shield-checkmark-outline"
        label="Confirm password"
        onChangeText={setConfirmPassword}
        placeholder="Repeat password"
        secureTextEntry={securePassword}
        value={confirmPassword}
      />

      <AuthButton label="Create Account" loading={loading} onPress={submit} />

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Pressable onPress={() => router.push("/sign-in")}>
          <Text style={styles.footerLink}>Sign In</Text>
        </Pressable>
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
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
  eyeLabel: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "900",
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
