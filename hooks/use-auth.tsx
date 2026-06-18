import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api, ApiUser } from "@/lib/api";

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
  session: boolean;
  token: string | null;
  user: ApiUser | null;
  role: UserRole | null;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signUpStaff: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getUserRole(user: ApiUser | null): UserRole | null {
  const role = user?.role;

  return role === "admin" || role === "staff" ? role : null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    setInitializing(false);
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);

    try {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async ({ email, password, role }: AuthCredentials) => {
    setLoading(true);

    try {
      const response = await api.signIn(email, password, role);

      setToken(response.token);
      setUser(response.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const signUpStaff = useCallback(async ({ email, password, fullName }: SignUpCredentials) => {
    setLoading(true);

    try {
      const response = await api.signUpStaff(email, password, fullName);

      setToken(response.token);
      setUser(response.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      loading,
      session: Boolean(token && user),
      token,
      user,
      role: getUserRole(user),
      signIn,
      signUpStaff,
      signOut,
    }),
    [initializing, loading, signIn, signOut, signUpStaff, token, user]
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
