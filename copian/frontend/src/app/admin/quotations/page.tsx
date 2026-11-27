"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthContext";
import { useCart } from "@/components/CartContext";
import { AdminQuotationsPageSkeleton, Skeleton } from "@/components/Skeleton";
import { computeGstBreakdown, formatINR } from "@/core/pricing";
import ProformaPreviewCard from "@/features/quotations/ProformaPreviewCard";
import { downloadAuthenticatedFile, getErrorMessage } from "@/lib/api";
import { catalogApi } from "@/services/catalogApi";
import { salesApi } from "@/services/salesApi";
import { Product, Quotation, QuoteItem } from "@/types/copian";

function QuotationsContent() {
  const { canAction } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");
  const { showToast } = useCart();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("Apex Managed Print Pvt. Ltd.");
  const [customerGstin, setCustomerGstin] = useState("");
  const [validUntil, setValidUntil] = useState("2026-12-10");
  const [gstRate, setGstRate] = useState(18);
  const [discount, setDiscount] = useState(1050);
  const [shipping, setShipping] = useState(800);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [status, setStatus] = useState("Draft");
  const [quoteCode, setQuoteCode] = useState("QT-2026-0842");

  const selectQuote = (q: Quotation) => {
    setActiveId(q.id);
    setQuoteCode(q.quote_code);
    setCustomerName(q.customer_name);
    setCustomerGstin(q.customer_gstin || "");
    setValidUntil(q.valid_until || "2026-12-10");
    setGstRate(q.gst_rate || 18);
    setDiscount(q.discount_amount || 0);
    setShipping(q.shipping_amount || 0);
    setStatus(q.status);
    setItems(q.items || []);
  };

  const load = async () => {
    try {
      const [qRes, pRes] = await Promise.all([
        salesApi.listQuotations(),
        catalogApi.listProducts(),
      ]);
      setQuotations(qRes);
      setProducts(pRes);
      if (qRes.length > 0) {
        const match = requestedId ? qRes.find((x) => String(x.id) === requestedId) : null;
        selectQuote(match || qRes[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedId]);

  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unit_price, 0);
  const { gstAmount, grandTotal } = computeGstBreakdown({
    subtotal,
    discountAmount: discount,
    shippingAmount: shipping,
    gstRate,
  });

  const saveQuotation = async () => {
    const payload = {
      customer_name: customerName,
      valid_until: validUntil,
      gst_rate: gstRate,
      gst_label: `${gstRate}% IGST / CGST+SGST`,
      discount_amount: discount,
      shipping_amount: shipping,
      items: items.map((i) => ({
        sku: i.sku,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
    };
    try {
      if (activeId) {
        const updated = await salesApi.updateQuotation(activeId, payload);
        selectQuote(updated);
        showToast(`Saved quotation ${updated.quote_code}`);
      } else {
        const created = await salesApi.createQuotation(payload);
        await load();
        selectQuote(created);
        showToast(`Created quotation ${created.quote_code}`);
      }
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to save quotation."));
    }
  };

  const sendPdfQuotation = async () => {
    try {
      if (activeId) {
        const sent = await salesApi.sendQuotation(activeId);
        selectQuote(sent);
      }
      showToast(`Marked ${quoteCode} as Sent — opening printable PDF view.`);
      setTimeout(() => window.print(), 300);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to mark quotation as Sent."));
    }
  };

  const shareWhatsApp = () => {
    const text = `Copian B2B Proforma Quotation ${quoteCode} for ${customerName}: Subtotal ${formatINR(
      subtotal
    )}, Grand Total (incl. ${gstRate}% GST) ${formatINR(grandTotal)}. Valid until ${validUntil}.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const convertToOrder = async () => {
    if (!activeId) return;
    try {
      const ord = await salesApi.convertQuotationToOrder(activeId);
      router.push(`/admin/orders?id=${ord.id}`);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to convert quotation to order."));
    }
  };

  const addLineItem = () => {
    const p = products[0];
    setItems((prev) => [
      ...prev,
      {
        sku: p?.sku || "CPN-HP-88A",
        product_name: p?.name || "Copian 88A Black Toner",
        quantity: p?.moq || 10,
        unit_price: p?.dealer_price || 420,
        line_total: (p?.moq || 10) * (p?.dealer_price || 420),
      },
    ]);
  };

  return (
    <AdminShell
      breadcrumb={["Sales & CRM", "Quotation Builder"]}
      headerRight={
        <div className="flex flex-wrap items-center gap-2 max-w-full no-print">
          <select
            aria-label="Select quotation"
            value={activeId || ""}
            onChange={(e) => {
              if (e.target.value === "new") {
                setActiveId(null);
                setQuoteCode("NEW DRAFT");
                setStatus("Draft");
                return;
              }
              const q = quotations.find((x) => x.id === Number(e.target.value));
              if (q) selectQuote(q);
            }}
            className="rounded border border-light-outline-variant px-2.5 py-1.5 font-mono text-mono-sm max-w-[180px] sm:max-w-xs truncate"
          >
            {quotations.map((q) => (
              <option key={q.id} value={q.id}>
                {q.quote_code} — {q.customer_name}
              </option>
            ))}
            <option value="new">+ Create New Quote</option>
          </select>
          <button
            type="button"
            onClick={shareWhatsApp}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded border border-light-outline-variant text-label-sm sm:text-label-md hover:bg-light-surface-container-low"
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={sendPdfQuotation}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded bg-light-primary text-light-on-primary text-label-sm sm:text-label-md hover:bg-light-primary-container"
          >
            Send PDF
          </button>
          {activeId && canAction("Bulk Inquiries & Quotations", "export") && (
            <button
              type="button"
              onClick={() =>
                downloadAuthenticatedFile(`/api/quotations/${activeId}/pdf`, `COPIAN-Quote-${quoteCode}.pdf`).catch(
                  (err) => showToast(getErrorMessage(err, "Failed to download PDF quotation."))
                )
              }
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded border border-light-outline-variant text-label-sm sm:text-label-md hover:bg-light-surface-container-low"
            >
              Download A4 PDF
            </button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Builder Controls */}
        <section className="lg:col-span-7 min-w-0 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 sm:p-6 flex flex-col gap-5 no-print">
          {loading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-56" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
              <Skeleton className="h-44 w-full" />
            </div>
          ) : (
            <>
          <div className="flex items-center justify-between">
            <h1 className="font-headline text-headline-sm text-light-on-surface">Quotation {quoteCode}</h1>
            <span
              className={`px-2.5 py-1 rounded-full text-label-sm ${
                status === "Sent" || status === "Converted"
                  ? "bg-success-container text-on-success-container"
                  : "bg-warning-container text-on-warning-container"
              }`}
            >
              {status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Customer</span>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 text-body-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Valid Until</span>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">GST Rate</span>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="rounded border border-light-outline-variant px-3 py-2 text-body-sm"
              >
                <option value={18}>18% IGST / CGST+SGST</option>
                <option value={12}>12% GST</option>
              </select>
            </label>
          </div>

          <div className="overflow-x-auto border border-light-outline-variant rounded">
            <table className="w-full text-left border-collapse text-body-sm">
              <thead className="bg-light-surface-container-low border-b border-light-outline-variant text-label-md text-light-on-surface-variant">
                <tr>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Unit Price (₹)</th>
                  <th className="px-3 py-2">Line Total</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-outline-variant/60">
                {items.map((it, idx) => (
                  <tr key={`${it.sku}-${idx}`}>
                    <td className="px-3 py-2">
                      <select
                        value={it.sku}
                        onChange={(e) => {
                          const p = products.find((x) => x.sku === e.target.value);
                          setItems((prev) =>
                            prev.map((row, rIdx) =>
                              rIdx === idx
                                ? {
                                    ...row,
                                    sku: e.target.value,
                                    product_name: p?.name || e.target.value,
                                    unit_price: p?.dealer_price || row.unit_price,
                                  }
                                : row
                            )
                          );
                        }}
                        className="rounded border border-light-outline-variant px-2 py-1 font-mono text-mono-sm text-light-primary"
                      >
                        {!products.some((p) => p.sku === it.sku) && <option value={it.sku}>{it.sku}</option>}
                        {products.map((p) => (
                          <option key={p.sku} value={p.sku}>{p.sku}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={it.quantity}
                        min={1}
                        onChange={(e) => {
                          const q = Math.max(1, Number(e.target.value) || 1);
                          setItems((prev) => prev.map((r, rIdx) => (rIdx === idx ? { ...r, quantity: q } : r)));
                        }}
                        className="w-20 rounded border border-light-outline-variant px-2 py-1 font-mono tabular-nums"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={it.unit_price}
                        min={0}
                        onChange={(e) => {
                          const up = Math.max(0, Number(e.target.value) || 0);
                          setItems((prev) => prev.map((r, rIdx) => (rIdx === idx ? { ...r, unit_price: up } : r)));
                        }}
                        className="w-24 rounded border border-light-outline-variant px-2 py-1 font-mono tabular-nums"
                      />
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums">
                      {formatINR(it.quantity * it.unit_price)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, rIdx) => rIdx !== idx))}
                        className="text-light-error text-label-sm hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addLineItem}
            className="w-fit text-label-md text-light-primary hover:underline"
          >
            + Add SKU Row
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Volume Discount (₹)</span>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Freight / Shipping (₹)</span>
              <input
                type="number"
                value={shipping}
                onChange={(e) => setShipping(Number(e.target.value) || 0)}
                className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3 pt-2 border-t border-light-outline-variant">
            {canAction("Bulk Inquiries & Quotations", "edit") && (
              <button
                type="button"
                onClick={saveQuotation}
                className="px-4 py-2 rounded bg-light-primary text-light-on-primary text-label-md hover:bg-light-primary-container"
              >
                Save Quotation
              </button>
            )}
            {activeId && canAction("Orders & GST Invoices", "create") && (
              <button
                type="button"
                onClick={convertToOrder}
                className="px-4 py-2 rounded border border-light-outline-variant text-label-md hover:bg-light-surface-container-low"
              >
                Convert to Order
              </button>
            )}
          </div>
          </>
          )}
        </section>

        {loading ? (
          <aside className="lg:col-span-5 min-w-0 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 sm:p-6 flex flex-col gap-4 no-print">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </aside>
        ) : (
          <ProformaPreviewCard
            quoteCode={quoteCode}
            customerName={customerName}
            customerGstin={customerGstin}
            validUntil={validUntil}
            items={items}
            subtotal={subtotal}
            discount={discount}
            shipping={shipping}
            gstRate={gstRate}
            gstAmount={gstAmount}
            grandTotal={grandTotal}
          />
        )}
      </div>
    </AdminShell>
  );
}

export default function AdminQuotationsPage() {
  return (
    <Suspense fallback={<AdminQuotationsPageSkeleton />}>
      <QuotationsContent />
    </Suspense>
  );
}
