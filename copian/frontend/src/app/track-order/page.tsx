"use client";

import React, { useState } from "react";
import Link from "next/link";
import StorefrontShell from "@/components/StorefrontShell";
import { apiFetch, formatINR, getErrorMessage } from "@/lib/api";
import { TrackResult } from "@/types/copian";

export default function TrackOrderPage() {
  const [referenceCode, setReferenceCode] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceCode.trim() || !contact.trim()) {
      setError("Enter both your reference code and registered email or phone number.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<TrackResult>("/api/track", {
        method: "POST",
        body: JSON.stringify({
          reference_code: referenceCode.trim(),
          contact: contact.trim(),
        }),
      });
      setResult(res);
    } catch (err) {
      setResult(null);
      setError(getErrorMessage(err, "Unable to locate a matching order, quotation, or inquiry."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <StorefrontShell>
      <div className="max-w-[960px] w-full mx-auto px-4 md:px-6 py-10 flex flex-col gap-8">
        <div>
          <span className="font-mono text-mono-sm text-light-primary uppercase tracking-wider">
            Buyer Self-Service Portal
          </span>
          <h1 className="font-headline text-headline-lg text-light-on-surface mt-1">
            Track Inquiry, Quotation &amp; Order Dispatch
          </h1>
          <p className="font-body text-body-md text-light-on-surface-variant mt-1">
            Enter your Copian reference number (<span className="font-mono">INQ-...</span>,{" "}
            <span className="font-mono">QT-...</span>, <span className="font-mono">ORD-...</span>, or{" "}
            <span className="font-mono">INV-...</span>) along with your registered business email or last 4+ phone digits.
          </p>
        </div>

        <form
          onSubmit={handleTrack}
          className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
        >
          <label className="md:col-span-5 flex flex-col gap-1">
            <span className="font-body text-label-md">Reference Code</span>
            <input
              type="text"
              required
              placeholder="e.g. ORD-1091 or INQ-4812"
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
              className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm uppercase"
            />
          </label>
          <label className="md:col-span-5 flex flex-col gap-1">
            <span className="font-body text-label-md">Email or Phone Digits</span>
            <input
              type="text"
              required
              placeholder="buyer@company.in or 9820..."
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="rounded border border-light-outline-variant px-3 py-2 font-body text-body-sm"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="md:col-span-2 px-4 py-2.5 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container"
          >
            {loading ? "Checking..." : "Track"}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded border border-light-error/30 bg-light-error-container text-light-on-error-container font-body text-body-sm">
            {error}
          </div>
        )}

        {result && (
          <section className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-light-outline-variant pb-4">
              <div>
                <span className="font-mono text-mono-sm text-light-primary">
                  {result.type} · {result.reference_code}
                  {result.invoice_code ? ` · Inv #${result.invoice_code}` : ""}
                </span>
                <h2 className="font-headline text-title-lg text-light-on-surface mt-1">
                  {result.customer_name}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-light-secondary-container text-light-on-secondary-container font-body text-label-md">
                  {result.status}
                </span>
                {result.payment_status && (
                  <span className="px-3 py-1 rounded-full bg-success-container text-on-success-container font-body text-label-md">
                    {result.payment_status}
                  </span>
                )}
              </div>
            </div>

            {(result.courier_name || result.tracking_number || result.total_amount !== undefined) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-light-surface-container-low rounded p-4 text-body-sm">
                {result.total_amount !== undefined && (
                  <div>
                    <span className="text-light-on-surface-variant block">Total (incl. GST)</span>
                    <span className="font-mono text-title-md text-light-primary">
                      {formatINR(result.total_amount)}
                    </span>
                  </div>
                )}
                {result.courier_name && (
                  <div>
                    <span className="text-light-on-surface-variant block">Carrier / Logistics</span>
                    <span className="font-medium">{result.courier_name}</span>
                  </div>
                )}
                {result.tracking_number && (
                  <div>
                    <span className="text-light-on-surface-variant block">AWB / LR Number</span>
                    <span className="font-mono font-semibold text-light-primary">{result.tracking_number}</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-headline text-title-md mb-3">Line Items</h3>
                <div className="divide-y divide-light-outline-variant/60 border border-light-outline-variant rounded">
                  {result.items.map((it, idx) => (
                    <div key={`${it.sku}-${idx}`} className="p-3 flex items-center justify-between gap-2 text-body-sm">
                      <div>
                        <span className="font-mono text-light-primary mr-2">{it.sku}</span>
                        <span>{it.product_name}</span>
                      </div>
                      <span className="font-mono font-medium shrink-0">× {it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-headline text-title-md mb-3">Dispatch Timeline</h3>
                <div className="space-y-3">
                  {result.timeline.map((t, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded border text-body-sm flex items-center justify-between gap-2 ${
                        t.is_highlighted
                          ? "border-light-primary bg-light-secondary-container/25 font-medium"
                          : "border-light-outline-variant bg-light-surface-container-lowest"
                      }`}
                    >
                      <span>{t.event_title}</span>
                      <span className="font-mono text-mono-sm text-light-on-surface-variant shrink-0">
                        {t.created_at}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-light-outline-variant pt-4 text-body-sm text-light-on-surface-variant">
          <span>Need urgent dispatch assistance? Call our Thane HQ desk directly.</span>
          <div className="flex gap-4">
            <Link href="/contact" className="text-light-primary hover:underline">
              Contact Sales Desk
            </Link>
            <Link href="/products" className="text-light-primary hover:underline">
              Browse Catalogue
            </Link>
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
