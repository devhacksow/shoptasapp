import type {
  Category,
  DeliveryMethod,
  PaymentMethod,
  Product,
  SortKey,
} from "../domain/types";

// Base de l'API. En dev, le proxy Vite gère "/api". En production, définir
// VITE_API_BASE_URL (ex. https://mon-back.onrender.com/api) au build.
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: "user" | "admin";
  favorites: string[];
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface OrderItem {
  productId: string | null;
  name: string;
  color: string;
  size: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl: string;
}

export interface Shipping {
  fullName: string;
  address: string;
  city: string;
  zip: string;
}

export interface Order {
  id: string;
  totalCents: number;
  deliveryCents: number;
  deliveryMethod: string;
  paymentMethod: string;
  status: string;
  shipping: Shipping;
  createdAt: string;
  items: OrderItem[];
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: string;
  created_at: string;
  orders_count: number;
}

export interface AdminOrder {
  id: string;
  buyer: string;
  totalCents: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

export interface AdminStats {
  users: number;
  products: number;
  orders: number;
  revenueCents: number;
  lowStock: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(data?.error || `Erreur ${res.status}`, res.status);
  }
  return data as T;
}

export interface ProductInput {
  name: string;
  categoryId: string;
  priceEuros: number;
  description?: string;
  imageUrl?: string;
  variants: { size: string; stock: number }[];
}

export const api = {
  // --- Catalogue ---
  async getCategories(): Promise<Category[]> {
    const data = await request<{ categories: Category[] }>("/categories");
    return data.categories;
  },

  async getProducts(params: {
    q?: string;
    category?: string | null;
    sort?: SortKey;
    minPrice?: number | null;
    maxPrice?: number | null;
  }): Promise<{ products: Product[]; total: number }> {
    const s = new URLSearchParams();
    if (params.q) s.set("q", params.q);
    if (params.category) s.set("category", params.category);
    if (params.sort) s.set("sort", params.sort);
    if (params.minPrice != null) s.set("minPrice", String(params.minPrice));
    if (params.maxPrice != null) s.set("maxPrice", String(params.maxPrice));
    const qs = s.toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },

  async getProduct(id: string): Promise<Product> {
    const data = await request<{ product: Product }>(`/products/${id}`);
    return data.product;
  },

  async getOptions(): Promise<{
    deliveryMethods: DeliveryMethod[];
    paymentMethods: PaymentMethod[];
  }> {
    return request("/options");
  },

  // --- Authentification ---
  async register(body: {
    email: string;
    username: string;
    password: string;
  }): Promise<AuthResponse> {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async login(body: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async me(): Promise<AuthUser> {
    const data = await request<{ user: AuthUser }>("/auth/me");
    return data.user;
  },

  async googleConfig(): Promise<{ enabled: boolean; clientId: string }> {
    return request("/auth/google/config");
  },

  async loginWithGoogle(credential: string): Promise<AuthResponse> {
    return request("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
  },

  // --- Favoris ---
  async toggleFavorite(productId: string): Promise<string[]> {
    const data = await request<{ favorites: string[] }>(
      `/products/${productId}/favorite`,
      { method: "POST" }
    );
    return data.favorites;
  },

  async myFavorites(): Promise<Product[]> {
    const data = await request<{ products: Product[] }>("/me/favorites");
    return data.products;
  },

  // --- Commandes ---
  async myOrders(): Promise<Order[]> {
    const data = await request<{ orders: Order[] }>("/me/orders");
    return data.orders;
  },

  async checkout(body: {
    shipping: Shipping;
    items: { productId: string; color: string; size: string; quantity: number }[];
    deliveryMethodId: string;
    paymentMethodId: string;
  }): Promise<Order> {
    const data = await request<{ order: Order }>("/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return data.order;
  },

  // --- Paiement Stripe (réel) ---
  async paymentsConfig(): Promise<{ enabled: boolean }> {
    return request("/payments/config");
  },

  async createStripeSession(body: {
    shipping: Shipping;
    items: { productId: string; color: string; size: string; quantity: number }[];
    deliveryMethodId: string;
    paymentMethodId: string;
  }): Promise<{ url: string }> {
    return request("/payments/create-session", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async confirmStripe(sessionId: string): Promise<Order> {
    const data = await request<{ order: Order }>("/payments/confirm", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });
    return data.order;
  },

  // --- Upload ---
  async uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("image", file);
    const headers: Record<string, string> = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const res = await fetch(`${API_BASE}/uploads`, {
      method: "POST",
      headers,
      body: form,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw new ApiError(data?.error || `Erreur ${res.status}`, res.status);
    }
    return data.url as string;
  },

  // --- Administration ---
  async adminStats(): Promise<AdminStats> {
    return (await request<{ stats: AdminStats }>("/admin/stats")).stats;
  },
  async adminUsers(): Promise<AdminUser[]> {
    return (await request<{ users: AdminUser[] }>("/admin/users")).users;
  },
  async adminProducts(): Promise<Product[]> {
    return (await request<{ products: Product[] }>("/admin/products")).products;
  },
  async adminCreateProduct(body: ProductInput): Promise<Product> {
    return (
      await request<{ product: Product }>("/admin/products", {
        method: "POST",
        body: JSON.stringify(body),
      })
    ).product;
  },
  async adminUpdateProduct(id: string, body: ProductInput): Promise<Product> {
    return (
      await request<{ product: Product }>(`/admin/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      })
    ).product;
  },
  async adminDeleteProduct(id: string): Promise<void> {
    await request(`/admin/products/${id}`, { method: "DELETE" });
  },
  async adminOrders(): Promise<AdminOrder[]> {
    return (await request<{ orders: AdminOrder[] }>("/admin/orders")).orders;
  },
  async adminOrderStatuses(): Promise<string[]> {
    return (await request<{ statuses: string[] }>("/admin/order-statuses"))
      .statuses;
  },
  async adminSetOrderStatus(id: string, status: string): Promise<Order> {
    return (
      await request<{ order: Order }>(`/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
    ).order;
  },
};
