"use client";

import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, safeStorageGet, safeStorageRemove, safeStorageSet } from "@/lib/api";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface AdminUser {
  id: number;
  name: string;
  initials: string;
  email: string;
  role: string;
  role_slug: string;
  permissions?: Record<string, Record<string, boolean>>;
}

export interface LowStockAlert {
  sku: string;
  name: string;
  available_qty: number;
}

const INITIAL_UNRESOLVED_USER: AdminUser = {
  id: 0,
  name: "ERP Staff",
  initials: "ERP",
  email: "",
  role: "Loading...",
  role_slug: "",
};

let cachedAdminUser: AdminUser | null = null;

export const ADMIN_ROUTE_MODULES: { prefix: string; module: string }[] = [
  { prefix: "/admin/products", module: "Products & Categories" },
  { prefix: "/admin/inventory", module: "Inventory & Stock Ledger" },
  { prefix: "/admin/customers", module: "Customers & Distributors" },
  { prefix: "/admin/distributors", module: "Customers & Distributors" },
  { prefix: "/admin/inquiries", module: "Bulk Inquiries & Quotations" },
  { prefix: "/admin/quotations", module: "Bulk Inquiries & Quotations" },
  { prefix: "/admin/orders", module: "Orders & GST Invoices" },
  { prefix: "/admin/website-seo", module: "Website & SEO" },
  { prefix: "/admin/reports", module: "Reports & Analytics" },
  { prefix: "/admin/roles", module: "Roles & Permissions" },
];

export function resolveModuleForPath(pathname: string): string | null {
  const match = ADMIN_ROUTE_MODULES.find((r) => pathname.startsWith(r.prefix));
  return match ? match.module : null;
}

function persistAdminUser(user: AdminUser | null): void {
  cachedAdminUser = user;
  if (user) {
    safeStorageSet("copian_admin_user", JSON.stringify(user));
  } else {
    safeStorageRemove("copian_admin_user");
  }
}

function readStoredAdminUser(): AdminUser | null {
  if (cachedAdminUser) return cachedAdminUser;
  const raw = safeStorageGet("copian_admin_user");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AdminUser;
    if (parsed && parsed.role_slug) {
      cachedAdminUser = parsed;
      return parsed;
    }
  } catch {
    // ignore invalid cache
  }
  return null;
}

interface AdminAuthContextValue {
  adminUser: AdminUser;
  authReady: boolean;
  unreadInquiries: number | null;
  alerts: LowStockAlert[];
  canViewModule: (moduleKey: string) => boolean;
  canAction: (moduleKey: string, action: "view" | "create" | "edit" | "delete" | "approve" | "export") => boolean;
  switchDemoUser: (email: string, currentPath?: string) => Promise<void>;
  refreshAdminState: (force?: boolean) => Promise<void>;
  signOut: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue>({
  adminUser: INITIAL_UNRESOLVED_USER,
  authReady: false,
  unreadInquiries: null,
  alerts: [],
  canViewModule: () => false,
  canAction: () => false,
  switchDemoUser: async () => {},
  refreshAdminState: async () => {},
  signOut: () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser>(INITIAL_UNRESOLVED_USER);
  const [authReady, setAuthReady] = useState(false);
  const [unreadInquiries, setUnreadInquiries] = useState<number | null>(null);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);

  useIsomorphicLayoutEffect(() => {
    const stored = readStoredAdminUser();
    if (stored) {
      setAdminUser(stored);
      setAuthReady(true);
    }
  }, []);

  const refreshAdminState = useCallback(async (force = false) => {
    try {
      if (!force && typeof window !== "undefined" && window.location.pathname === "/admin/login") {
        setAuthReady(true);
        return;
      }
      const storedToken = safeStorageGet("copian_admin_token");
      if (!storedToken) {
        const demo = await apiFetch<{ access_token: string; user: AdminUser }>("/api/auth/demo-session");
        safeStorageSet("copian_admin_token", demo.access_token);
        persistAdminUser(demo.user);
        setAdminUser(demo.user);
      } else {
        const me = await apiFetch<{ authenticated: boolean; user: AdminUser | null }>("/api/auth/me");
        if (me.authenticated && me.user) {
          persistAdminUser(me.user);
          setAdminUser(me.user);
        } else {
          persistAdminUser(null);
          setAdminUser(INITIAL_UNRESOLVED_USER);
        }
      }
      const dash = await apiFetch<{
        kpis: { awaiting_review_count: number };
        low_stock_products: LowStockAlert[];
      }>("/api/dashboard");
      setUnreadInquiries(dash.kpis.awaiting_review_count);
      setAlerts(dash.low_stock_products || []);
    } catch {
      // ignore if login screen or offline
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    refreshAdminState();
  }, [refreshAdminState]);

  const canActionForUser = useCallback(
    (user: AdminUser, moduleKey: string, action: "view" | "create" | "edit" | "delete" | "approve" | "export"): boolean => {
      if (!user.role_slug) return false;
      if (user.role_slug === "super-admin") return true;
      if (moduleKey === "Roles & Permissions") return false;
      return Boolean(user.permissions?.[moduleKey]?.[action]);
    },
    []
  );

  const canViewModule = useCallback(
    (moduleKey: string) => canActionForUser(adminUser, moduleKey, "view"),
    [adminUser, canActionForUser]
  );

  const canAction = useCallback(
    (moduleKey: string, action: "view" | "create" | "edit" | "delete" | "approve" | "export") =>
      canActionForUser(adminUser, moduleKey, action),
    [adminUser, canActionForUser]
  );

  const switchDemoUser = useCallback(
    async (email: string, currentPath?: string) => {
      try {
        const demo = await apiFetch<{ access_token: string; user: AdminUser }>(
          `/api/auth/demo-session?email=${encodeURIComponent(email)}`
        );
        safeStorageSet("copian_admin_token", demo.access_token);
        persistAdminUser(demo.user);
        setAdminUser(demo.user);
        setAuthReady(true);
        const targetMod = currentPath ? resolveModuleForPath(currentPath) : null;
        if (targetMod && !canActionForUser(demo.user, targetMod, "view")) {
          router.push("/admin");
        }
      } catch {
        // ignore
      }
    },
    [canActionForUser, router]
  );

  const signOut = useCallback(() => {
    safeStorageRemove("copian_admin_token");
    persistAdminUser(null);
    setAdminUser(INITIAL_UNRESOLVED_USER);
    setUnreadInquiries(null);
    setAlerts([]);
    setAuthReady(false);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        authReady,
        unreadInquiries,
        alerts,
        canViewModule,
        canAction,
        switchDemoUser,
        refreshAdminState,
        signOut,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
