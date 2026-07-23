import type {
    Product,
    ProductDraft,
    SaleRecord,
    StockAdjustmentDraft,
} from "@/types/inventory";

import { getApiBaseUrl } from "@/lib/api-config";

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
  cacheTtlMs?: number;
  forceRefresh?: boolean;
  method?: "DELETE" | "GET" | "POST" | "PATCH";
  token?: string | null;
};

const API_URL = getApiBaseUrl();
const apiCache = new Map<string, { expiresAt: number; payload: unknown }>();

function cacheKey(path: string, token?: string | null) {
  return `${token ?? "public"}:${path}`;
}

function clearApiCache() {
  apiCache.clear();
}

async function request<T>(path: string, options: ApiOptions = {}) {
  const url = `${API_URL}${path}`;
  const method = options.method ?? "GET";
  const key = cacheKey(path, options.token);
  const cached = apiCache.get(key);
  const shouldUseCache =
    method === "GET" && Boolean(options.cacheTtlMs) && !options.forceRefresh;

  if (shouldUseCache && cached && cached.expiresAt > Date.now()) {
    return cached.payload as T;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    if (__DEV__) {
      console.log("Request failed:", url, error);
    }

    if (cached) {
      return cached.payload as T;
    }

    throw new Error(
      `Cannot connect to server at ${API_URL}. Check your network, API_PORT, and EXPO_PUBLIC_API_URL.`,
    );
  }

  const text = await response.text();
  let payload: { message?: string } | T | null = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(
        `API returned non-JSON from ${url}. Restart the API server and check EXPO_PUBLIC_API_URL.`,
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

  if (method === "GET" && options.cacheTtlMs) {
    apiCache.set(key, {
      expiresAt: Date.now() + options.cacheTtlMs,
      payload,
    });
  }

  return payload as T;
}

export const api = {
  async addProduct(draft: ProductDraft, token?: string | null) {
    const product = await request<Product>("/products", {
      body: draft,
      method: "POST",
      token,
    });

    clearApiCache();
    return product;
  },

  async addStock(draft: StockAdjustmentDraft, token?: string | null) {
    const product = await request<Product>("/stock/add", {
      body: draft,
      method: "POST",
      token,
    });

    clearApiCache();
    return product;
  },

  async checkout(items: CheckoutItem[], token?: string | null) {
    const sale = await request<{ saleId: number }>("/sales/checkout", {
      body: {
        items: items.map((item) => ({
          barcode: item.barcode,
          quantity: item.quantity,
        })),
      },
      method: "POST",
      token,
    });

    clearApiCache();
    return sale;
  },

  getDashboard(token?: string | null, forceRefresh = false) {
    return request<{
      products: Product[];
      sales: SaleRecord[];
    }>("/dashboard", {
      cacheTtlMs: 20_000,
      forceRefresh,
      token,
    });
  },

  getProducts(token?: string | null, forceRefresh = false) {
    return request<Product[]>("/products", {
      cacheTtlMs: 45_000,
      forceRefresh,
      token,
    });
  },

  async deleteProduct(productId: number, token?: string | null) {
    const result = await request<{ deleted: true }>(`/products/${productId}`, {
      method: "DELETE",
      token,
    });

    clearApiCache();
    return result;
  },

  getProductByBarcode(barcode: string, token?: string | null) {
    return request<Product | null>(
      `/products/barcode/${encodeURIComponent(barcode)}`,
      { token },
    );
  },

  async receiveOneStock(barcode: string, token?: string | null) {
    const product = await request<Product>("/stock/receive-one", {
      body: { barcode },
      method: "POST",
      token,
    });

    clearApiCache();
    return product;
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
