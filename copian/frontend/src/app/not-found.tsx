import React from "react";
import Link from "next/link";
import StorefrontShell from "@/components/StorefrontShell";

/**
 * Branded 404 fallback page for unmatched storefront or deep-linked URLs.
 */
export default function NotFoundPage() {
  return (
    <StorefrontShell>
      <div className="max-w-[720px] mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
        <span className="px-3 py-1 rounded-full bg-light-secondary-container text-light-on-secondary-container font-mono text-mono-sm">
          404 · Page Not Found
        </span>
        <h1 className="font-headline text-headline-lg text-light-on-surface">
          The requested SKU or page could not be found.
        </h1>
        <p className="font-body text-body-md text-light-on-surface-variant">
          The URL may have changed or the SKU was archived. Browse our live B2B catalogue or open your Bulk Inquiry Cart below.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/products"
            className="px-5 py-2.5 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container"
          >
            Browse Products
          </Link>
          <Link
            href="/inquiry-cart"
            className="px-5 py-2.5 rounded border border-light-outline-variant text-light-on-surface font-body text-label-lg hover:bg-light-surface-container-low"
          >
            Open Inquiry Cart
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded border border-light-outline-variant text-light-on-surface font-body text-label-lg hover:bg-light-surface-container-low"
          >
            Homepage
          </Link>
        </div>
      </div>
    </StorefrontShell>
  );
}
