/**
 * Admin Dashboard, CMS, Catalog Metadata, Warehouses, Customers, Distributors & User Management API helpers.
 */

import { apiFetch } from "@/lib/api";
import { Article, CmsResponse, DashboardData, Distributor } from "@/types/copian";

export const adminApi = {
  getDashboard: (range: string) =>
    apiFetch<DashboardData>(`/api/dashboard?range=${encodeURIComponent(range)}`),

  getCms: () => apiFetch<CmsResponse>("/api/cms"),

  updateCms: (payload: Record<string, unknown>) =>
    apiFetch("/api/cms", { method: "PUT", body: JSON.stringify(payload) }),

  listArticles: () => apiFetch<Article[]>("/api/articles"),

  listDistributors: (activeOnly = false) =>
    apiFetch<Distributor[]>(`/api/distributors${activeOnly ? "?active_only=true" : ""}`),

  createCategory: (payload: Record<string, unknown>) =>
    apiFetch("/api/categories", { method: "POST", body: JSON.stringify(payload) }),

  deleteCategory: (id: number) => apiFetch(`/api/categories/${id}`, { method: "DELETE" }),

  createPrinterModel: (payload: { brand: string; model_name: string; series?: string }) =>
    apiFetch("/api/compatibility/models", { method: "POST", body: JSON.stringify(payload) }),

  deletePrinterModel: (id: number) =>
    apiFetch(`/api/compatibility/models/${id}`, { method: "DELETE" }),

  createWarehouse: (payload: { name: string; code: string; city: string }) =>
    apiFetch("/api/inventory/warehouses", { method: "POST", body: JSON.stringify(payload) }),

  listContactMessages: () =>
    apiFetch<{
      id: number;
      full_name: string;
      company_name: string;
      email: string;
      phone: string;
      inquiry_type: string;
      message: string;
      status: string;
      created_at: string;
    }[]>("/api/contact"),

  updateContactStatus: (id: number, status: string) =>
    apiFetch(`/api/contact/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),

  updateCustomer: (id: number, payload: Record<string, unknown>) =>
    apiFetch(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  createAdminUser: (payload: { name: string; email: string; password: string; role_id: number }) =>
    apiFetch("/api/roles/users", { method: "POST", body: JSON.stringify(payload) }),

  updateAdminUser: (id: number, payload: { role_id?: number; is_active?: boolean }) =>
    apiFetch(`/api/roles/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
};
