import { formatINR, formatINRLakhs } from "@/core/pricing";

export { formatINR, formatINRLakhs };
export type {
  Article,
  CartItem,
  Category,
  CmsResponse,
  DashboardData,
  Distributor,
  Faq,
  HomepageSettings,
  Order,
  OrderItem,
  OrderTimelineEvent,
  Product,
  ProductVariant,
  Quotation,
  QuoteItem,
} from "@/types/copian";

const RAW_API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

export function getApiBase(): string {
  if (typeof window === "undefined") {
    return RAW_API_BASE.replace("://localhost:", "://127.0.0.1:");
  }
  const host = window.location.hostname;
  const isLocalHost = host === "localhost" || host === "127.0.0.1";
  const envPointsLocal =
    RAW_API_BASE.includes("://localhost") || RAW_API_BASE.includes("://127.0.0.1");
  // When accessed through a tunnel/remote host (e.g. ngrok) while env targets local backend,
  // send requests same-origin so Next.js rewrites proxy /api/* cleanly without CORS/interstitial blocks.
  if (!isLocalHost && envPointsLocal) {
    return "";
  }
  return RAW_API_BASE;
}

export const API_BASE = getApiBase();

const DEFAULT_TIMEOUT_MS = 15000;

export function safeStorageGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeStorageSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota or privacy mode errors
  }
}

export function safeStorageRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage errors
  }
}

export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}

let sessionInitPromise: Promise<string | null> | null = null;

async function ensureAdminToken(): Promise<string | null> {
  const existing = safeStorageGet("copian_admin_token");
  if (existing) return existing;
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  if (!path.startsWith("/admin") || path === "/admin/login") return null;

  if (!sessionInitPromise) {
    const base = getApiBase();
    const ngrokHeaders: Record<string, string> = base.includes("ngrok")
      ? { "ngrok-skip-browser-warning": "true" }
      : {};
    sessionInitPromise = fetch(`${base}/api/auth/demo-session`, {
      cache: "no-store",
      headers: ngrokHeaders,
    })
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 403 && window.location.pathname !== "/admin/login") {
            window.location.href = "/admin/login";
          }
          return null;
        }
        const data = await r.json();
        if (data?.access_token) {
          safeStorageSet("copian_admin_token", data.access_token);
          if (data?.user) {
            safeStorageSet("copian_admin_user", JSON.stringify(data.user));
          }
          return data.access_token as string;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        sessionInitPromise = null;
      });
  }
  return sessionInitPromise;
}

export async function downloadAuthenticatedFile(path: string, fallbackFilename: string): Promise<void> {
  const token = safeStorageGet("copian_admin_token") || (await ensureAdminToken());
  const base = getApiBase();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(base.includes("ngrok") ? { "ngrok-skip-browser-warning": "true" } : {}),
  };
  const res = await fetch(`${base}${path}`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fallbackFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const token = safeStorageGet("copian_admin_token") || (await ensureAdminToken());
  const base = getApiBase();

  const headers: Record<string, string> = {
    ...(options?.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(base.includes("ngrok") ? { "ngrok-skip-browser-warning": "true" } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...options,
      headers,
      cache: "no-store",
      signal: options?.signal ?? controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Server request timed out. Please check your connection and retry.");
    }
    throw new Error("Unable to reach Copian server. Please verify the API is online.");
  }
  clearTimeout(timer);

  if (!res.ok) {
    if (res.status === 401) {
      safeStorageRemove("copian_admin_token");
      safeStorageRemove("copian_admin_user");
    }
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data.detail || msg;
    } catch {
      // ignore parse failure on non-JSON error payloads
    }
    throw new Error(msg);
  }

  if (res.status === 204) {
    return {} as T;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    if (!text) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  return res.json();
}
