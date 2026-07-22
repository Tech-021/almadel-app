import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type AuthSession = {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    role: "admin" | "staff";
  };
};

const AUTH_SESSION_KEY = "almadel.auth.session";

function readWebSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

function writeWebSession(session: AuthSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export async function loadAuthSession() {
  if (Platform.OS === "web") {
    return readWebSession();
  }

  const raw = await SecureStore.getItemAsync(AUTH_SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
    return null;
  }
}

export async function saveAuthSession(session: AuthSession | null) {
  if (Platform.OS === "web") {
    writeWebSession(session);
    return;
  }

  if (!session) {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
    return;
  }

  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
}
