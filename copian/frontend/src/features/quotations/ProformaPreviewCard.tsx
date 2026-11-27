"use client";

import React from "react";
import { computeGstBreakdown, formatINR } from "@/core/pricing";
import { QuoteItem } from "@/types/copian";

interface ProformaPreviewCardProps {
  quoteCode: string;
  customerName: string;
  customerGstin?: string;
  validUntil: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
}

/**
 * Live GST Proforma Quotation preview panel with automatic CGST/SGST vs IGST breakdown.
 */
export default function ProformaPreviewCard({
  quoteCode,
  customerName,
  customerGstin,
  validUntil,
  items,
  subtotal,
  discount,
  shipping,
  gstRate,
  gstAmount,
  grandTotal,
}: ProformaPreviewCardProps) {
  const taxSplit = computeGstBreakdown({
    subtotal,
    discountAmount: discount,
    shippingAmount: shipping,
    gstRate,
    buyerGstin: customerGstin,
    buyerAddress: customerName,
  });

  return (
    <aside className="lg:col-span-5 min-w-0 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-light-outline-variant pb-3">
        <span className="font-headline text-title-md text-light-on-surface">Proforma Quote Preview</span>
        <span className="font-mono text-mono-sm text-light-primary">{quoteCode}</span>
      </div>
      <div className="text-body-sm space-y-1 text-light-on-surface-variant">
        <p className="font-medium text-light-on-surface">{customerName}</p>
        {customerGstin && (
          <p className="font-mono text-mono-sm">GSTIN: {customerGstin}</p>
        )}
        <p>
          Valid Until: <span className="font-mono">{validUntil}</span>
        </p>
      </div>
      <div className="border-t border-light-outline-variant pt-3 text-body-sm space-y-1.5">
        {items.map((it, idx) => (
          <div key={`${it.sku}-${idx}`} className="flex justify-between gap-2">
            <span className="truncate">
              <span className="font-mono text-light-primary">{it.sku}</span> × {it.quantity}
            </span>
            <span className="font-mono tabular-nums shrink-0">{formatINR(it.quantity * it.unit_price)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-light-outline-variant pt-3 text-body-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-light-on-surface-variant">Subtotal ({items.length} SKUs)</span>
          <span className="font-mono tabular-nums">{formatINR(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-light-on-surface-variant">Bulk Discount</span>
          <span className="font-mono tabular-nums text-success">-{formatINR(discount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-light-on-surface-variant">Shipping</span>
          <span className="font-mono tabular-nums">{formatINR(shipping)}</span>
        </div>
        {taxSplit.taxMode === "CGST+SGST" ? (
          <>
            <div className="flex justify-between">
              <span className="text-light-on-surface-variant">CGST ({gstRate / 2}%)</span>
              <span className="font-mono tabular-nums">{formatINR(taxSplit.cgstAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-light-on-surface-variant">SGST ({gstRate / 2}%)</span>
              <span className="font-mono tabular-nums">{formatINR(taxSplit.sgstAmount)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between">
            <span className="text-light-on-surface-variant">IGST ({gstRate}%)</span>
            <span className="font-mono tabular-nums">{formatINR(gstAmount)}</span>
          </div>
        )}
        <div className="flex justify-between pt-3 border-t border-light-outline-variant font-headline text-title-md">
          <span>Grand Total</span>
          <span className="font-mono tabular-nums text-light-primary">{formatINR(grandTotal)}</span>
        </div>
      </div>
    </aside>
  );
}
