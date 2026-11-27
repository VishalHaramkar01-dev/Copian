"use client";

import React, { useEffect } from "react";
import { ErrorFallbackCard } from "@/components/ErrorBoundary";

/**
 * Admin ERP route error boundary for safe recovery inside internal workflows.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Admin route error:", error);
    }
  }, [error]);

  return (
    <ErrorFallbackCard
      title="ERP Module Recovered Safely"
      description={error?.message || "An unexpected exception occurred while loading this ERP module. No saved records were lost."}
      onRetry={reset}
      homeHref="/admin"
      homeLabel="Back to ERP Dashboard"
    />
  );
}
