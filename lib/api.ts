import type { Product, ProductDraft, SaleRecord, StockAdjustmentDraft } from "@/types/inventory";
import Constants from "expo-constants";
import { Platform } from "react-native";

export type ApiUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: "admin" | "staff";
};

export type AuthResponse = {
  token: string;
  user: ApiUser;
};

export type CheckoutItem = Product & {
  quantity: number;
  total: number;
};

type ApiOptions = {
  body?: unknown;
  method?: "DELETE" | "GET" | "POST" | "PATCH";
  token?: string | null;
};

const DEFAULT_API_PORT = "4000";
const CONFIGURED_API_URL = process.env.EXPO_PUBLIC_API_URL?.trim();

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

function getApiUrl() {
  if (__DEV__ && Platform.OS !== "web") {
    const devServerHost = getExpoDevServerHost();

    if (devServerHost) {
      return `http://${devServerHost}:${DEFAULT_API_PORT}`;
    }
  }

  return withoutTrailingSlash(CONFIGURED_API_URL ?? `http://localhost:${DEFAULT_API_PORT}`);
}

const API_URL = getApiUrl();

async function request<T>(path: string, options: ApiOptions = {}) {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let payload: { message?: string } | T | null = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(
        `API returned non-JSON from ${url}. Restart the API server and check EXPO_PUBLIC_API_URL.`
      );
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? payload.message
        : undefined;

    throw new Error(message ?? `Request failed: ${response.status}`);
  }

  return payload as T;
}

export const api = {
  addProduct(draft: ProductDraft, token?: string | null) {
    return request<Product>("/products", {
      body: draft,
      method: "POST",
      token,
    });
  },

  addStock(draft: StockAdjustmentDraft, token?: string | null) {
    return request<Product>("/stock/add", {
      body: draft,
      method: "POST",
      token,
    });
  },

  checkout(items: CheckoutItem[], token?: string | null) {
    return request<{ saleId: number }>("/sales/checkout", {
      body: { items },
      method: "POST",
      token,
    });
  },

  getDashboard(token?: string | null) {
    return request<{
      products: Product[];
      sales: SaleRecord[];
    }>("/dashboard", { token });
  },

  getProducts(token?: string | null) {
    return request<Product[]>("/products", { token });
  },

  deleteProduct(productId: number, token?: string | null) {
    return request<{ deleted: true }>(`/products/${productId}`, {
      method: "DELETE",
      token,
    });
  },

  getProductByBarcode(barcode: string, token?: string | null) {
    return request<Product | null>(`/products/barcode/${encodeURIComponent(barcode)}`, { token });
  },

  receiveOneStock(barcode: string, token?: string | null) {
    return request<Product>("/stock/receive-one", {
      body: { barcode },
      method: "POST",
      token,
    });
  },

  signIn(email: string, password: string, role: "admin" | "staff") {
    return request<AuthResponse>("/auth/sign-in", {
      body: { email, password, role },
      method: "POST",
    });
  },

  signUpStaff(email: string, password: string, fullName: string) {
    return request<AuthResponse>("/auth/staff/sign-up", {
      body: { email, password, fullName },
      method: "POST",
    });
  },
};
