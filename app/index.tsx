import { AuthCard } from "@/components/auth/auth-card";
import { useAuth } from "@/hooks/use-auth";

export default function AuthScreen() {
  const { initializing, session } = useAuth();

  if (initializing || session) {
    return null;
  }

  return <AuthCard />;
}
