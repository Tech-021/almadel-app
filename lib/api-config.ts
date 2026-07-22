import Constants from "expo-constants";
import { Platform } from "react-native";

const DEFAULT_API_PORT = process.env.EXPO_PUBLIC_API_PORT?.trim() || "4000";

function withoutTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function hostnameFromHostUri(hostUri: string) {
  const host = hostUri.replace(/^https?:\/\//, "").split("/")[0];

  if (host.startsWith("[")) {
    return host.slice(1, host.indexOf("]"));
  }

  return host.split(":")[0];
}

function getExpoDevServerHost() {
  const hostUri = Constants.expoConfig?.hostUri;

  if (!hostUri) {
    return null;
  }

  const hostname = hostnameFromHostUri(hostUri);

  if (!hostname) {
    return null;
  }

  if (Platform.OS === "android" && isLoopbackHost(hostname)) {
    return "10.0.2.2";
  }

  return hostname;
}

function getWebOriginHost() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.location.hostname || null;
}

function validateConfiguredUrl(url: string | undefined) {
  if (!url) {
    return null;
  }

  const normalized = withoutTrailingSlash(url.trim());

  try {
    return new URL(normalized).toString().replace(/\/+$/, "");
  } catch {
    if (__DEV__) {
      console.warn(`Ignoring invalid EXPO_PUBLIC_API_URL value: ${url}`);
    }

    return null;
  }
}

export function getApiBaseUrl() {
  const configuredUrl = validateConfiguredUrl(process.env.EXPO_PUBLIC_API_URL);

  if (configuredUrl) {
    return configuredUrl;
  }

  if (__DEV__) {
    if (Platform.OS === "web") {
      const webHost = getWebOriginHost();

      if (webHost) {
        return `http://${webHost}:${DEFAULT_API_PORT}`;
      }
    }

    const devServerHost = getExpoDevServerHost();

    if (devServerHost) {
      return `http://${devServerHost}:${DEFAULT_API_PORT}`;
    }
  }

  return `http://localhost:${DEFAULT_API_PORT}`;
}
