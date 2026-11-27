"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StorefrontShell from "@/components/StorefrontShell";
import { BuyerPortalSkeleton } from "@/components/Skeleton";
import { useCart } from "@/components/CartContext";
import { apiFetch, formatINR, getApiBase, getErrorMessage, safeStorageGet, safeStorageRemove, safeStorageSet } from "@/lib/api";

interface BuyerPortalData {
  customer: {
    id: number;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    gstin: string;
    city: string;
    state: string;
    classification: string;
    credit_limit: number;
    credit_used: number;
    credit_available: number;
    overdue_30d_amount: number;
    overdue_count: number;
  };
  orders: {
    id: number;
    order_code: string;
    invoice_code: string;
    total_amount: number;
    payment_status: string;
    fulfilment_status: string;
    courier_name: string;
    tracking_number: string;
    created_at: string;
    items: { sku: string; product_name: string; quantity: number; unit_price: number; line_total: number }[];
  }[];
  quotations: {
    id: number;
    quote_code: string;
    status: string;
    valid_until: string;
    grand_total: number;
  }[];
  inquiries: {
    id: number;
    inquiry_code: string;
    status: string;
    delivery_city: string;
    created_at: string;
  }[];
}

export default function BuyerAccountPortalPage() {
  const router = useRouter();
  const { addToCart, showToast } = useCart();

  const [email, setEmail] = useState("");
  const [verification, setVerification] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialChecking, setInitialChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portal, setPortal] = useState<BuyerPortalData | null>(null);

  const loadPortal = useCallback(async (token: string) => {
    try {
      const res = await apiFetch<BuyerPortalData>("/api/buyer/portal", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPortal(res);
    } catch {
      safeStorageRemove("copian_buyer_token");
      setPortal(null);
    } finally {
      setInitialChecking(false);
    }
  }, []);

  useEffect(() => {
    const tok = safeStorageGet("copian_buyer_token");
    if (tok) {
      loadPortal(tok);
    } else {
      setInitialChecking(false);
    }
  }, [loadPortal]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !verification.trim()) {
      setError("Enter your registered business email along with phone digits or GSTIN.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ access_token: string }>("/api/buyer/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), verification: verification.trim() }),
      });
      safeStorageSet("copian_buyer_token", res.access_token);
      await loadPortal(res.access_token);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to verify buyer account."));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId: number, invoiceCode: string) => {
    const tok = safeStorageGet("copian_buyer_token");
    if (!tok) return;
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/buyer/orders/${orderId}/pdf`, {
        headers: {
          Authorization: `Bearer ${tok}`,
          ...(base.includes("ngrok") ? { "ngrok-skip-browser-warning": "true" } : {}),
        },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `COPIAN-Invoice-${invoiceCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to download GST invoice PDF."));
    }
  };

  const handleReorder = async (items: { sku: string; product_name: string; quantity: number }[]) => {
    try {
      for (const it of items) {
        await addToCart({
          sku: it.sku,
          product_name: it.product_name,
          quantity: it.quantity,
        });
      }
      showToast(`Added ${items.length} SKU(s) to your Inquiry Cart for re-order.`);
      router.push("/inquiry-cart");
    } catch (err) {
      showToast(getErrorMessage(err, "Unable to copy items into cart."));
    }
  };

  const signOutBuyer = () => {
    safeStorageRemove("copian_buyer_token");
    setPortal(null);
  };

  return (
    <StorefrontShell>
      <div className="max-w-[1160px] w-full mx-auto px-4 md:px-6 py-10 flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-mono-sm text-light-primary uppercase tracking-wider">
              B2B Dealer &amp; Corporate Account Portal
            </span>
            <h1 className="font-headline text-headline-lg text-light-on-surface mt-1">
              {portal ? portal.customer.company_name : "Dealer & Enterprise Account Portal"}
            </h1>
            <p className="font-body text-body-md text-light-on-surface-variant mt-1">
              {portal
                ? `${portal.customer.classification} · ${portal.customer.city}${portal.customer.state ? `, ${portal.customer.state}` : ""} · GSTIN ${portal.customer.gstin || "Pending"}`
                : "Sign in using your registered business email and phone digits or GSTIN to download GST invoices, check 30-day credit balances, and one-click re-order."}
            </p>
          </div>
          {portal && (
            <button
              type="button"
              onClick={signOutBuyer}
              className="px-4 py-2 rounded border border-light-outline-variant text-label-md hover:bg-light-surface-container-low"
            >
              Sign Out
            </button>
          )}
        </div>

        {initialChecking ? (
          <BuyerPortalSkeleton />
        ) : !portal ? (
          <div className="max-w-lg bg-light-surface-container-lowest border border-light-outline-variant rounded-lg p-6 sm:p-8 flex flex-col gap-5">
            {error && (
              <div className="p-3 rounded bg-light-error-container text-light-on-error-container text-body-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="font-body text-label-md">Business Email</span>
                <input
                  type="email"
                  required
                  placeholder="orders@deccanoffice.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded border border-light-outline-variant px-3 py-2 text-body-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-body text-label-md">Registered Phone Digits (4+) or GSTIN</span>
                <input
                  type="text"
                  required
                  placeholder="2311 or 29AAACD1234F1Z5"
                  value={verification}
                  onChange={(e) => setVerification(e.target.value)}
                  className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container"
              >
                {loading ? "Verifying..." : "Open Buyer Portal"}
              </button>
            </form>
            <div className="border-t border-light-outline-variant pt-3 flex items-center justify-between gap-2 text-body-sm text-light-on-surface-variant">
              <span>Demo Dealer: orders@deccanoffice.in / 2311</span>
              <button
                type="button"
                onClick={() => {
                  setEmail("orders@deccanoffice.in");
                  setVerification("2311");
                }}
                className="text-light-primary font-medium hover:underline"
              >
                Fill Demo
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Credit Limit Ledger */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4">
                <span className="text-label-sm text-light-on-surface-variant block">30-Day Credit Limit</span>
                <span className="font-headline text-title-lg font-semibold mt-1 block">
                  {formatINR(portal.customer.credit_limit)}
                </span>
              </div>
              <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4">
                <span className="text-label-sm text-light-on-surface-variant block">Unpaid / Utilized</span>
                <span className="font-headline text-title-lg font-semibold text-warning mt-1 block">
                  {formatINR(portal.customer.credit_used)}
                </span>
              </div>
              <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4">
                <span className="text-label-sm text-light-on-surface-variant block">Available Balance</span>
                <span className="font-headline text-title-lg font-semibold text-success mt-1 block">
                  {formatINR(portal.customer.credit_available)}
                </span>
              </div>
              <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4">
                <span className="text-label-sm text-light-on-surface-variant block">Overdue (30d+)</span>
                <span
                  className={`font-headline text-title-lg font-semibold mt-1 block ${
                    portal.customer.overdue_count > 0 ? "text-light-error" : "text-light-on-surface"
                  }`}
                >
                  {formatINR(portal.customer.overdue_30d_amount)}
                </span>
              </div>
            </section>

            {/* Orders & One-Click Re-Order */}
            <section className="flex flex-col gap-4">
              <h2 className="font-headline text-title-lg">Your Orders &amp; Tax Invoices</h2>
              {portal.orders.length === 0 ? (
                <div className="p-6 rounded border border-light-outline-variant bg-light-surface-container-lowest text-body-sm text-light-on-surface-variant">
                  No confirmed orders yet. Browse our <Link href="/products" className="text-light-primary hover:underline">B2B Catalogue</Link> to request a quotation.
                </div>
              ) : (
                <div className="space-y-4">
                  {portal.orders.map((o) => (
                    <article
                      key={o.id}
                      className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col gap-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-light-outline-variant/60 pb-3">
                        <div>
                          <span className="font-mono text-mono-md text-light-primary">
                            {o.order_code} · Inv #{o.invoice_code}
                          </span>
                          <p className="text-body-sm text-light-on-surface-variant">
                            Status: <span className="font-medium text-light-on-surface">{o.fulfilment_status}</span> · Payment:{" "}
                            <span className="font-medium text-light-on-surface">{o.payment_status}</span>
                            {o.tracking_number ? ` · ${o.courier_name || "Courier"} (${o.tracking_number})` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-title-md font-semibold mr-2">
                            {formatINR(o.total_amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(o.id, o.invoice_code)}
                            className="px-3 py-1.5 rounded border border-light-outline-variant text-label-md hover:bg-light-surface-container-low"
                          >
                            Download PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorder(o.items)}
                            className="px-3.5 py-1.5 rounded bg-light-primary text-light-on-primary text-label-md hover:bg-light-primary-container"
                          >
                            Re-Order to Cart
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-body-sm">
                        {o.items.map((it, idx) => (
                          <div key={`${it.sku}-${idx}`} className="p-2.5 rounded bg-light-surface-container-low flex justify-between gap-2">
                            <span className="truncate font-mono text-mono-sm">{it.sku}</span>
                            <span className="font-mono shrink-0">× {it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
