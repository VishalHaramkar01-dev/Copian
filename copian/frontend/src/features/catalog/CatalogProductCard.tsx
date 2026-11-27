"use client";

import React from "react";
import Link from "next/link";
import { formatINR } from "@/core/pricing";
import { Product } from "@/types/copian";

interface CatalogProductCardProps {
  product: Product;
  quantity: number;
  inCartQty: number;
  viewMode?: "grid" | "list";
  showStepper?: boolean;
  onQuantityChange: (nextQty: number) => void;
  onAddToCart: () => void;
  onQuickView?: () => void;
}

/**
 * Shared B2B product card reused across Homepage Featured Supplies and Product Catalogue.
 */
export default function CatalogProductCard({
  product: p,
  quantity,
  inCartQty,
  viewMode = "grid",
  showStepper = false,
  onQuantityChange,
  onAddToCart,
  onQuickView,
}: CatalogProductCardProps) {
  const stockBadgeClass =
    p.stock_status === "In Stock"
      ? "bg-success-container text-on-success-container"
      : p.stock_status === "Out of Stock"
      ? "bg-light-error-container text-light-on-error-container"
      : "bg-warning-container text-on-warning-container";

  return (
    <article
      className={`flex ${
        viewMode === "list"
          ? "flex-col sm:flex-row sm:items-center"
          : "flex-col justify-between"
      } bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 gap-4 hover:border-light-primary/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-surface-enter ease-surface-enter`}
    >
      <div className={viewMode === "list" ? "flex items-center gap-4 flex-1" : "flex flex-col gap-3"}>
        <Link
          href={`/product/${p.sku}`}
          className={`relative rounded bg-light-surface-container-low p-3.5 pt-9 flex items-center justify-center group overflow-hidden ${
            viewMode === "list" ? "w-28 h-28 shrink-0" : "w-full"
          }`}
        >
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="h-32 sm:h-36 object-contain group-hover:scale-105 transition-transform duration-surface-enter ease-surface-enter"
          />
          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full font-body text-label-sm whitespace-nowrap ${stockBadgeClass}`}>
            {p.stock_status}
          </span>
          {inCartQty > 0 && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-light-primary text-white font-mono text-[10px] whitespace-nowrap">
              In Cart: {inCartQty}
            </span>
          )}
        </Link>

        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-mono-sm text-light-primary">{p.sku}</span>
            <span className="font-mono text-[11px] text-light-on-surface-variant">
              {p.oem_code ? `OEM ${p.oem_code}` : `HSN ${p.hsn_code}`}
            </span>
          </div>
          <Link
            href={`/product/${p.sku}`}
            className="font-headline text-title-md text-light-on-surface hover:text-light-primary block"
          >
            {p.name}
          </Link>
          <p className="font-body text-body-sm text-light-on-surface-variant line-clamp-2">
            {p.compatible_printers_text} · {p.page_yield.toLocaleString()} pages
          </p>
          {viewMode === "list" && (
            <p className="font-body text-body-sm text-light-on-surface-variant mt-0.5">{p.short_desc}</p>
          )}
        </div>
      </div>

      <div
        className={`flex flex-col gap-3 pt-3 border-t border-light-outline-variant/60 ${
          viewMode === "list" ? "sm:border-t-0 sm:pt-0 sm:w-64 shrink-0" : ""
        }`}
      >
        <div className="flex items-baseline justify-between">
          <div>
            <span className="font-mono text-title-md font-semibold text-light-on-surface tabular-nums">
              {formatINR(p.dealer_price)}
            </span>
            <span className="font-body text-[11px] text-light-on-surface-variant"> /unit base</span>
          </div>
          <span className="font-mono text-[11px] text-success">50+: -8%</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-mono-sm text-light-on-surface-variant">
            MOQ: {p.moq} {p.moq_unit}
          </span>
          {showStepper ? (
            <div className="inline-flex items-center border border-light-outline-variant rounded">
              <button
                type="button"
                onClick={() => onQuantityChange(Math.max(p.moq, quantity - 5))}
                className="px-2.5 py-1 text-light-on-surface hover:bg-light-surface-container-low"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                min={p.moq}
                step={5}
                onChange={(e) => onQuantityChange(Math.max(p.moq, Number(e.target.value) || p.moq))}
                className="w-14 text-center border-0 py-1 font-mono text-mono-sm tabular-nums focus:ring-0"
              />
              <button
                type="button"
                onClick={() => onQuantityChange(Math.max(p.moq, quantity + 5))}
                className="px-2.5 py-1 text-light-on-surface hover:bg-light-surface-container-low"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <input
              type="number"
              value={quantity}
              min={p.moq}
              step={5}
              onChange={(e) => onQuantityChange(Math.max(p.moq, Number(e.target.value) || p.moq))}
              className="w-16 text-center rounded border border-light-outline-variant py-1 font-mono text-mono-sm tabular-nums"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddToCart}
            className="flex-1 px-3 py-2 rounded bg-light-primary text-light-on-primary font-body text-label-md hover:bg-light-primary-container active:scale-[0.98] transition-all duration-state-change"
          >
            {inCartQty > 0 ? "Add More" : "Add to Inquiry"}
          </button>
          {onQuickView ? (
            <button
              type="button"
              onClick={onQuickView}
              className="px-3 py-2 rounded border border-light-outline-variant font-body text-label-md hover:bg-light-surface-container-low active:scale-[0.98]"
            >
              Quick View
            </button>
          ) : (
            <Link
              href={`/product/${p.sku}`}
              className="px-3 py-2 rounded border border-light-outline-variant text-light-on-surface font-body text-label-md hover:bg-light-surface-container-low active:scale-[0.98]"
            >
              Details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
