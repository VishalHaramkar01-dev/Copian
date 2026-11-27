"use client";

import React from "react";
import Link from "next/link";
import { computeBulkUnitPrice, formatINR } from "@/core/pricing";
import { Product } from "@/types/copian";

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

/**
 * Product Quick Preview modal displaying OEM yield, 3-tier volume pricing, and Add-to-Cart action.
 */
export default function ProductQuickViewModal({
  product,
  onClose,
  onAddToCart,
}: ProductQuickViewModalProps) {
  if (!product) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-light-scrim/45 backdrop-blur-[1px] flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-lg max-w-lg w-full p-6 flex flex-col gap-4 shadow-xl animate-modal-in">
        <div className="flex items-center justify-between">
          <span className="font-mono text-mono-sm text-light-primary">{product.sku}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick preview"
            className="w-8 h-8 rounded border border-light-outline-variant flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-24 h-24 object-contain bg-light-surface-container-low rounded p-2 border border-light-outline-variant/60"
          />
          <div>
            <h3 className="font-headline text-headline-sm text-light-on-surface">{product.name}</h3>
            <p className="font-mono text-mono-sm text-light-on-surface-variant mt-1">
              OEM: {product.oem_code} · Yield: {product.page_yield.toLocaleString()} pages
            </p>
            <p className="font-mono text-title-md text-light-primary mt-1">
              {formatINR(product.dealer_price)}/unit · MOQ {product.moq}
            </p>
          </div>
        </div>

        <p className="font-body text-body-md text-light-on-surface-variant">
          {product.compatible_printers_text} — {product.short_desc}
        </p>

        <div className="rounded bg-light-surface-container-low p-3 grid grid-cols-3 gap-2 font-mono text-[11px] text-center">
          <div>
            <span className="text-light-on-surface-variant block">10–49 u</span>
            <span className="font-semibold">{formatINR(computeBulkUnitPrice(product.dealer_price, 10))}</span>
          </div>
          <div>
            <span className="text-light-on-surface-variant block">50–199 u (-8%)</span>
            <span className="font-semibold text-success">
              {formatINR(Math.round(computeBulkUnitPrice(product.dealer_price, 50)))}
            </span>
          </div>
          <div>
            <span className="text-light-on-surface-variant block">200+ u (-15%)</span>
            <span className="font-semibold text-success">
              {formatINR(Math.round(computeBulkUnitPrice(product.dealer_price, 200)))}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-light-outline-variant">
          <Link
            href={`/product/${product.sku}`}
            className="px-4 py-2 rounded border border-light-outline-variant font-body text-label-lg text-light-on-surface hover:bg-light-surface-container-low"
          >
            Full Specifications
          </Link>
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="px-4 py-2 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container"
          >
            Add to Inquiry
          </button>
        </div>
      </div>
    </div>
  );
}
