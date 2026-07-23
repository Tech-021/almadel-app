import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthButton } from "@/components/auth/auth-button";
import { AuthField } from "@/components/auth/auth-field";
import { AuthScreenShell } from "@/components/auth/auth-screen-shell";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/use-auth";

export default function ForgotPasswordScreen() {
  const { initializing, session } = useAuth();
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!initializing && session) {
      router.replace("/home");
    }
  }, [initializing, session]);

  const submitRequest = () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      toast.error("Invalid email", "Please enter a valid email address.");
      return;
    }

    toast.success(
      "Recovery request prepared",
      `Ask an administrator to reset ${normalizedEmail}.`,
    );
  };

  return (
    <AuthScreenShell
      badge="Account recovery"
      title="Reset password"
      subtitle="Enter your account email and share the request with an administrator."
    >
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

      <View style={styles.helpBox}>
        <Text style={styles.helpTitle}>Admin recovery only</Text>
        <Text style={styles.helpText}>
          Password reset is handled by an administrator for now. This screen
          helps staff prepare the account email before asking for help.
        </Text>
      </View>

      <AuthButton
        icon="send"
        label="Prepare recovery request"
        onPress={submitRequest}
      />

      <View style={styles.footerRow}>
        <Pressable onPress={() => router.push("/sign-in")}>
          <Text style={styles.footerLink}>Back to sign in</Text>
        </Pressable>
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  helpBox: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
    padding: 12,
  },
  helpTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6,
  },
  helpText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  footerRow: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  footerLink: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "900",
  },
});
