/**
 * Sales, Cart, Inquiries, Quotations, Orders, and Contact Desk API helpers.
 */

import { apiFetch } from "@/lib/api";
import { CartItem, Order, Quotation, TrackResult } from "@/types/copian";

export const salesApi = {
  getCart: (sessionId: string) =>
    apiFetch<CartItem[]>(`/api/cart?session_id=${encodeURIComponent(sessionId)}`),

  addCartItem: (payload: Record<string, unknown>) =>
    apiFetch("/api/cart", { method: "POST", body: JSON.stringify(payload) }),

  updateCartItem: (id: number, patch: { quantity?: number; note?: string }) =>
    apiFetch(`/api/cart/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  removeCartItem: (id: number) => apiFetch(`/api/cart/${id}`, { method: "DELETE" }),

  listQuotations: () => apiFetch<Quotation[]>("/api/quotations"),

  createQuotation: (payload: Record<string, unknown>) =>
    apiFetch<Quotation>("/api/quotations", { method: "POST", body: JSON.stringify(payload) }),

  updateQuotation: (id: number, payload: Record<string, unknown>) =>
    apiFetch<Quotation>(`/api/quotations/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  sendQuotation: (id: number) => apiFetch<Quotation>(`/api/quotations/${id}/send`, { method: "POST" }),

  convertQuotationToOrder: (id: number) =>
    apiFetch<{ id: number }>(`/api/quotations/${id}/convert-order`, { method: "POST" }),

  listOrders: () => apiFetch<Order[]>("/api/orders"),

  updateOrder: (id: number, patch: Record<string, unknown>) =>
    apiFetch<Order>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  submitContact: (payload: Record<string, unknown>) =>
    apiFetch("/api/contact", { method: "POST", body: JSON.stringify(payload) }),

  trackOrder: (reference_code: string, contact: string) =>
    apiFetch<TrackResult>("/api/track", {
      method: "POST",
      body: JSON.stringify({ reference_code, contact }),
    }),
};
