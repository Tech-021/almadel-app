import { useRouter } from "expo-router";
import { useEffect } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { useAuth } from "@/hooks/use-auth";

export default function AuthScreen() {
  const { initializing, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initializing && session) {
      router.replace("/(tabs)");
    }
  }, [initializing, router, session]);

  if (!initializing && session) {
    return null;
  }

  return <AuthCard />;
}
