"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getErrorMessage, safeStorageGet, safeStorageSet } from "@/lib/api";
import { salesApi } from "@/services/salesApi";
import { CartItem } from "@/types/copian";

interface CartContextValue {
  items: CartItem[];
  count: number;
  cartLoading: boolean;
  sessionId: string;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  refreshCart: () => Promise<void>;
  addToCart: (input: {
    sku: string;
    product_name: string;
    description_line?: string;
    image_url?: string;
    moq?: number;
    moq_unit?: string;
    quantity?: number;
    note?: string;
  }) => Promise<void>;
  updateItem: (id: number, patch: { quantity?: number; note?: string }) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearLocalAfterSubmit: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STARTER_CART = [
  {
    sku: "CPN-HP-88A",
    product_name: "Copian 88A Black Toner Cartridge",
    description_line: "1,500-page ISO yield · MOQ 10 units",
    image_url: "/images/toner-cartridge.png",
    moq: 10,
    moq_unit: "units",
    quantity: 40,
    note: "",
  },
  {
    sku: "CPN-PWD-1KG",
    product_name: "Universal Laser Toner Powder (1kg)",
    description_line: "HP / Canon Monochrome · MOQ 20 bottles",
    image_url: "/images/copian-banner-2.png",
    moq: 20,
    moq_unit: "bottles",
    quantity: 20,
    note: "",
  },
  {
    sku: "CPN-OPC-12A",
    product_name: "Long-Life OPC Drum Cylinder",
    description_line: "12A / 88A / 337 Series · MOQ 25 units",
    image_url: "/images/toner-img-2.png",
    moq: 25,
    moq_unit: "units",
    quantity: 50,
    note: "",
  },
];

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState("default");
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  const loadCart = useCallback(async (sid: string) => {
    try {
      let data = await salesApi.getCart(sid);
      if (data.length === 0 && typeof window !== "undefined" && !safeStorageGet("copian_cart_seeded")) {
        safeStorageSet("copian_cart_seeded", "1");
        for (const item of STARTER_CART) {
          await salesApi.addCartItem({ session_id: sid, ...item });
        }
        data = await salesApi.getCart(sid);
      }
      setItems(data);
    } catch {
      // ignore if backend temporarily unreachable during static build
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    let sid = "default";
    if (typeof window !== "undefined") {
      const existing = safeStorageGet("copian_cart_session");
      if (existing) {
        sid = existing;
      } else {
        sid = `sess-${Math.random().toString(36).slice(2, 10)}`;
        safeStorageSet("copian_cart_session", sid);
      }
    }
    setSessionId(sid);
    loadCart(sid);
  }, [loadCart]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      showToast(getErrorMessage(event.reason, "A network or background action failed safely."));
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, [showToast]);

  const refreshCart = useCallback(async () => {
    await loadCart(sessionId);
  }, [loadCart, sessionId]);

  const addToCart = useCallback(
    async (input: {
      sku: string;
      product_name: string;
      description_line?: string;
      image_url?: string;
      moq?: number;
      moq_unit?: string;
      quantity?: number;
      note?: string;
    }) => {
      try {
        await salesApi.addCartItem({
          session_id: sessionId,
          sku: input.sku,
          product_name: input.product_name,
          description_line: input.description_line || "",
          image_url: input.image_url || "/images/toner-cartridge.png",
          moq: input.moq || 10,
          moq_unit: input.moq_unit || "units",
          quantity: input.quantity || input.moq || 10,
          note: input.note || "",
        });
        await loadCart(sessionId);
        showToast(`Added ${input.sku} (${input.quantity || input.moq || 10} ${input.moq_unit || "units"}) to Inquiry Cart`);
      } catch (err) {
        showToast(getErrorMessage(err, "Unable to add item to Inquiry Cart."));
      }
    },
    [sessionId, loadCart, showToast]
  );

  const updateItem = useCallback(
    async (id: number, patch: { quantity?: number; note?: string }) => {
      let prevSnapshot: CartItem[] = [];
      setItems((prev) => {
        prevSnapshot = prev;
        return prev.map((it) => (it.id === id ? { ...it, ...patch } : it));
      });
      try {
        await salesApi.updateCartItem(id, patch);
      } catch (err) {
        setItems(prevSnapshot);
        showToast(getErrorMessage(err, "Failed to update cart item."));
      }
    },
    [showToast]
  );

  const removeItem = useCallback(
    async (id: number) => {
      let prevSnapshot: CartItem[] = [];
      setItems((prev) => {
        prevSnapshot = prev;
        return prev.filter((it) => it.id !== id);
      });
      try {
        await salesApi.removeCartItem(id);
      } catch (err) {
        setItems(prevSnapshot);
        showToast(getErrorMessage(err, "Failed to remove item from cart."));
      }
    },
    [showToast]
  );

  const clearLocalAfterSubmit = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.length,
        cartLoading,
        sessionId,
        toastMessage,
        showToast,
        refreshCart,
        addToCart,
        updateItem,
        removeItem,
        clearLocalAfterSubmit,
      }}
    >
      {children}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 left-6 z-50 bg-light-inverse-surface text-light-inverse-on-surface px-4 py-3 rounded-md shadow-lg flex items-center gap-3 no-print animate-toast-in"
        >
          <span className="material-symbols-outlined text-success-container text-[20px]" aria-hidden="true">
            check_circle
          </span>
          <span className="font-body text-body-md">{toastMessage}</span>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
