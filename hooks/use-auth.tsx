import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "staff";
export type AuthMode = "signIn" | "signUp";

type AuthCredentials = {
  email: string;
  password: string;
  role: UserRole;
};

type SignUpCredentials = AuthCredentials & {
  fullName: string;
};

type AuthContextValue = {
  initializing: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signUpStaff: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getUserRole(user: User | null): UserRole | null {
  const role = user?.user_metadata?.role;

  return role === "admin" || role === "staff" ? role : null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      setSession(data.session);
      setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setInitializing(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async ({ email, password, role }: AuthCredentials) => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      const accountRole = getUserRole(data.user);

      if (role === "admin" && accountRole !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Only admin accounts can use admin login.");
      }

      if (role === "staff" && accountRole === "admin") {
        await supabase.auth.signOut();
        throw new Error("Please use admin login for this account.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const signUpStaff = useCallback(async ({ email, password, fullName }: SignUpCredentials) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: "staff",
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      loading,
      session,
      user: session?.user ?? null,
      role: getUserRole(session?.user ?? null),
      signIn,
      signUpStaff,
      signOut,
    }),
    [initializing, loading, session, signIn, signOut, signUpStaff]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
