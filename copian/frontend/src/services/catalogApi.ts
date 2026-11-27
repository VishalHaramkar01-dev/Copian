/**
 * Catalog, Categories, and Printer Compatibility API service helpers.
 */

import { apiFetch } from "@/lib/api";
import { Category, Product } from "@/types/copian";

export const catalogApi = {
  listCategories: () => apiFetch<Category[]>("/api/categories"),

  getCategoryBySlug: (slug: string) =>
    apiFetch<{ category: Category; products: Product[] }>(`/api/categories/${encodeURIComponent(slug)}`),

  listProducts: (params?: {
    q?: string;
    category?: string;
    brand?: string;
    in_stock_only?: boolean;
    status?: string;
    featured?: boolean;
    new_arrival?: boolean;
    sort?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.category) qs.set("category", params.category);
    if (params?.brand) qs.set("brand", params.brand);
    if (params?.in_stock_only) qs.set("in_stock_only", "true");
    if (params?.status) qs.set("status", params.status);
    if (params?.featured !== undefined) qs.set("featured", String(params.featured));
    if (params?.new_arrival !== undefined) qs.set("new_arrival", String(params.new_arrival));
    if (params?.sort) qs.set("sort", params.sort);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<Product[]>(`/api/products${suffix}`);
  },

  getProductDetail: (identifier: string) =>
    apiFetch<{ product: Product; related: Product[] }>(`/api/products/${encodeURIComponent(identifier)}`),

  getCompatibilityBrands: () =>
    apiFetch<{ brands: string[]; models_by_brand: Record<string, { model_name: string }[]> }>(
      "/api/compatibility/brands"
    ),

  findCompatibleProducts: (brand?: string, model?: string) => {
    const qs = new URLSearchParams();
    if (brand) qs.set("brand", brand);
    if (model) qs.set("model", model);
    return apiFetch<{ brand: string; model: string; matches: Product[] }>(
      `/api/compatibility?${qs.toString()}`
    );
  },
};
