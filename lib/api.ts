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
  method?: "DELETE" | "GET" | "POST" | "PATCH";
  token?: string | null;
};

const API_URL = getApiBaseUrl();

async function request<T>(path: string, options: ApiOptions = {}) {
  const url = `${API_URL}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
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
    return request<Product | null>(
      `/products/barcode/${encodeURIComponent(barcode)}`,
      { token },
    );
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
