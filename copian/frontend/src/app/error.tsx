"use client";

import React, { useEffect } from "react";
import { ErrorFallbackCard } from "@/components/ErrorBoundary";

/**
 * Storefront route-level error boundary preserving navigation and recovery controls.
 */
export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Storefront route error:", error);
    }
  }, [error]);

  return (
    <ErrorFallbackCard
      title="Something interrupted this page"
      description={error?.message || "A temporary data or network hiccup occurred. Click Try Again to reload safely."}
      onRetry={reset}
      homeHref="/products"
      homeLabel="Browse Catalogue"
    />
  );
}
