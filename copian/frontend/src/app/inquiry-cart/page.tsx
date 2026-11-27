"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import StorefrontShell from "@/components/StorefrontShell";
import { CartItemsSkeleton } from "@/components/Skeleton";
import { useCart } from "@/components/CartContext";
import { isValidOptionalGstin } from "@/core/pricing";
import { apiFetch, formatINR, getErrorMessage, Product } from "@/lib/api";

export default function BulkInquiryCartPage() {
  const { items, cartLoading, sessionId, addToCart, updateItem, removeItem, clearLocalAfterSubmit, showToast } = useCart();
  const csvFileRef = useRef<HTMLInputElement>(null);

  const [catalog, setCatalog] = useState<Product[]>([]);
  const [quickSku, setQuickSku] = useState("CPN-HP-26A");
  const [quickQty, setQuickQty] = useState(20);

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Product[]>("/api/products?status=Published")
      .then((res) => {
        setCatalog(res);
        if (res.length > 0) setQuickSku(res[0].sku);
      })
      .catch(() => {});
  }, []);

  const totalUnits = items.reduce((acc, it) => acc + it.quantity, 0);
  const estSubtotal = items.reduce((acc, it) => {
    const p = catalog.find((c) => c.sku === it.sku);
    return acc + (p?.dealer_price || 450) * it.quantity;
  }, 0);

  const handleQuickAdd = async () => {
    const prod = catalog.find((c) => c.sku === quickSku);
    if (!prod) return;
    try {
      await addToCart({
        sku: prod.sku,
        product_name: prod.name,
        description_line: prod.short_desc,
        image_url: prod.image_url,
        moq: prod.moq,
        moq_unit: prod.moq_unit,
        quantity: Math.max(prod.moq, quickQty),
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to quick-add item");
    }
  };

  const handleBomCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      let addedCount = 0;
      for (const line of lines) {
        const [rawSku, rawQty, rawNote] = line.split(",").map((s) => s.trim());
        if (!rawSku || rawSku.toLowerCase() === "sku") continue;
        const prod = catalog.find((c) => c.sku.toLowerCase() === rawSku.toLowerCase());
        if (!prod) continue;
        const qtyVal = Math.max(prod.moq, Number(rawQty) || prod.moq);
        await addToCart({
          sku: prod.sku,
          product_name: prod.name,
          description_line: prod.short_desc,
          image_url: prod.image_url,
          moq: prod.moq,
          moq_unit: prod.moq_unit,
          quantity: qtyVal,
          note: rawNote || "",
        });
        addedCount += 1;
      }
      if (addedCount === 0) {
        setErrorMsg("No matching catalog SKUs found in uploaded CSV (expected format: sku,quantity).");
      } else {
        setErrorMsg(null);
        showToast(`Added ${addedCount} SKU line(s) from CSV upload.`);
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Failed to read quick-order CSV."));
    } finally {
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !phone.trim() || !email.trim() || !deliveryCity.trim()) {
      setErrorMsg("Please complete all required (*) fields before submitting.");
      return;
    }
    if (!isValidOptionalGstin(gstin)) {
      setErrorMsg("Enter a valid 15-character GSTIN (e.g. 27AABCU9603R1ZM) or leave GSTIN blank.");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("Add at least one SKU to your inquiry cart before submitting.");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<{ inquiry_code: string }>("/api/inquiries", {
        method: "POST",
        body: JSON.stringify({
          company_name: companyName.trim(),
          contact_name: contactName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          gstin: gstin.trim().toUpperCase(),
          delivery_city: deliveryCity.trim(),
          notes: notes.trim(),
          session_id: sessionId,
          items: items.map((it) => ({
            sku: it.sku,
            product_name: it.product_name,
            quantity: it.quantity,
            unit_note: it.note,
          })),
        }),
      });
      setSubmittedCode(res.inquiry_code);
      clearLocalAfterSubmit();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StorefrontShell>
      <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-headline-lg text-light-on-surface">
              Bulk Inquiry Cart &amp; Quotation Request
            </h1>
            <p className="font-body text-body-md text-light-on-surface-variant mt-1">
              Review selected SKUs, adjust carton quantities, add per-item packaging notes, and submit for a formal GST quotation.
            </p>
          </div>
          <Link href="/products" className="font-body text-label-lg text-light-primary hover:underline">
            + Browse full catalogue
          </Link>
        </div>

        {submittedCode ? (
          <div className="bg-success-container border border-success/30 rounded-lg p-6 mb-8 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-on-success-container">
              <span className="material-symbols-outlined text-[28px]" aria-hidden="true">check_circle</span>
              <h2 className="font-headline text-headline-sm">Bulk Quotation Request Submitted</h2>
            </div>
            <p className="font-body text-body-md text-on-success-container">
              Your inquiry reference <span className="font-mono font-semibold">{submittedCode}</span> has been logged with our B2B sales desk. A proforma quotation will be sent to your business email.
            </p>
            <div className="flex flex-wrap gap-3 mt-1">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-light-primary text-light-on-primary font-body text-label-md"
              >
                Continue Browsing Catalogue
              </Link>
              <Link
                href="/track-order"
                className="inline-flex items-center gap-2 px-4 py-2 rounded border border-success/40 text-on-success-container font-body text-label-md hover:bg-white/40"
              >
                Track Inquiry Status
              </Link>
              <Link
                href="/admin/inquiries"
                className="inline-flex items-center gap-2 px-4 py-2 rounded border border-success/40 text-on-success-container font-body text-label-md hover:bg-white/40"
              >
                View in Admin ERP
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Line Items + Quick SKU Pad */}
            <section className="lg:col-span-7 flex flex-col gap-4">
              {/* Quick-Add by SKU Strip */}
              <div className="bg-light-surface-container-low border border-light-outline-variant rounded-md p-4 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px] flex flex-col gap-1">
                  <label className="font-mono text-[11px] uppercase text-light-primary">Quick-Add SKU</label>
                  <select
                    value={quickSku}
                    disabled={catalog.length === 0}
                    onChange={(e) => setQuickSku(e.target.value)}
                    className="w-full rounded border border-light-outline-variant bg-white px-3 py-2 font-body text-body-sm disabled:opacity-60"
                  >
                    {catalog.length === 0 ? (
                      <option value={quickSku}>Loading SKUs...</option>
                    ) : (
                      catalog.map((p) => (
                        <option key={p.sku} value={p.sku}>
                          {p.sku} — {p.name} ({formatINR(p.dealer_price)}/u)
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="w-20 shrink-0 flex flex-col gap-1">
                  <label className="font-mono text-[11px] uppercase text-light-on-surface-variant">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={quickQty}
                    onChange={(e) => setQuickQty(Math.max(1, Number(e.target.value) || 10))}
                    className="w-full rounded border border-light-outline-variant bg-white px-2 py-2 font-mono text-mono-sm text-center"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={catalog.length === 0}
                    onClick={handleQuickAdd}
                    className="px-4 py-2 rounded bg-light-primary text-white font-body text-label-md hover:bg-light-primary-container whitespace-nowrap disabled:opacity-60"
                  >
                    + Add Line Item
                  </button>
                  <input ref={csvFileRef} type="file" accept=".csv" onChange={handleBomCsvUpload} className="hidden" />
                  <button
                    type="button"
                    onClick={() => csvFileRef.current?.click()}
                    title="Upload CSV with columns: sku,quantity,note"
                    className="px-3.5 py-2 rounded border border-light-outline-variant bg-white font-body text-label-md hover:bg-light-surface-container-lowest whitespace-nowrap"
                  >
                    Upload CSV BOM
                  </button>
                </div>
              </div>

              {cartLoading && items.length === 0 ? (
                <CartItemsSkeleton count={3} />
              ) : items.length === 0 ? (
                <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-8 text-center flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-light-outline text-[36px]">inventory_2</span>
                  <h2 className="font-headline text-title-lg text-light-on-surface">Your Inquiry Cart is Empty</h2>
                  <p className="font-body text-body-sm text-light-on-surface-variant">
                    Use Quick-Add above or browse compatible toner cartridges, bulk powders, and OPC drums.
                  </p>
                  <Link
                    href="/products"
                    className="mt-2 px-5 py-2.5 rounded bg-light-primary text-light-on-primary font-body text-label-lg"
                  >
                    Browse Product Catalogue
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col gap-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-16 h-16 rounded object-contain bg-light-surface-container-low p-1.5 border border-light-outline-variant/60"
                          />
                          <div>
                            <span className="font-mono text-mono-sm text-light-primary">{item.sku}</span>
                            <h3 className="font-headline text-title-md text-light-on-surface">{item.product_name}</h3>
                            <p className="font-body text-body-sm text-light-on-surface-variant">{item.description_line}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            value={item.quantity}
                            min={item.moq || 1}
                            step={5}
                            aria-label={`Quantity for ${item.sku}`}
                            onChange={(e) =>
                              updateItem(item.id, {
                                quantity: Math.max(1, Number(e.target.value) || item.moq || 1),
                              })
                            }
                            className="w-20 text-center rounded border border-light-outline-variant py-1.5 font-mono text-mono-md tabular-nums"
                          />
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-2 rounded border border-light-outline-variant text-light-error hover:bg-light-error-container/40"
                            aria-label="Remove item"
                          >
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={item.note || ""}
                        onChange={(e) => updateItem(item.id, { note: e.target.value })}
                        placeholder="Optional note for this SKU (e.g., neutral box packaging, chip version)..."
                        className="w-full rounded border border-light-outline-variant bg-light-surface-container-low px-3 py-2 font-body text-body-sm"
                      />
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Business Inquiry Form */}
            <aside className="lg:col-span-5 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 sticky top-24 flex flex-col gap-5">
              {/* Live Estimate Strip */}
              <div className="rounded bg-light-surface-container-low border border-light-outline-variant/70 p-3.5 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="font-body text-[11px] text-light-on-surface-variant block">SKUs</span>
                  <span className="font-mono text-title-md font-semibold tabular-nums">{items.length}</span>
                </div>
                <div>
                  <span className="font-body text-[11px] text-light-on-surface-variant block">Total Units</span>
                  <span className="font-mono text-title-md font-semibold tabular-nums">{totalUnits}</span>
                </div>
                <div>
                  <span className="font-body text-[11px] text-light-on-surface-variant block">Est. Value</span>
                  <span className="font-mono text-title-md font-semibold text-light-primary tabular-nums">
                    {formatINR(estSubtotal)}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="font-headline text-headline-sm text-light-on-surface mb-4">
                  Company &amp; Quotation Details
                </h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                  <label className="flex flex-col gap-1">
                    <span className="font-body text-label-md text-light-on-surface">Company Name *</span>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Apex Managed Print Pvt. Ltd."
                      className="rounded border border-light-outline-variant px-3.5 py-2 font-body text-body-md"
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                      <span className="font-body text-label-md text-light-on-surface">Contact Name *</span>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Full name"
                        className="rounded border border-light-outline-variant px-3.5 py-2 font-body text-body-md"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="font-body text-label-md text-light-on-surface">Phone Number *</span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98XXXXXXXX"
                        className="rounded border border-light-outline-variant px-3.5 py-2 font-body text-body-md"
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="font-body text-label-md text-light-on-surface">Business Email *</span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="procurement@company.in"
                      className="rounded border border-light-outline-variant px-3.5 py-2 font-body text-body-md"
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                      <span className="font-body text-label-md text-light-on-surface">GSTIN (Optional)</span>
                      <input
                        type="text"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        placeholder="27AABCU9603R1ZM"
                        className="rounded border border-light-outline-variant px-3.5 py-2 font-mono text-mono-sm uppercase"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="font-body text-label-md text-light-on-surface">Delivery City / PIN *</span>
                      <input
                        type="text"
                        required
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        placeholder="Mumbai, 400001"
                        className="rounded border border-light-outline-variant px-3.5 py-2 font-body text-body-md"
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="font-body text-label-md text-light-on-surface">Additional Requirements</span>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Specify delivery timeline, recurring monthly volume, or custom branding needs..."
                      className="rounded border border-light-outline-variant px-3.5 py-2 font-body text-body-md"
                    />
                  </label>
                  {errorMsg && <p className="font-body text-body-sm text-light-error">{errorMsg}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container transition-colors duration-state-change disabled:opacity-60"
                  >
                    {submitting ? "Submitting Quotation Request..." : "Submit Bulk Quotation Request"}
                  </button>
                </form>
              </div>
            </aside>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
