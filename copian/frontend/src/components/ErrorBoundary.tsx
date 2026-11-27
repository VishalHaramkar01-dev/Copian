"use client";

import React from "react";
import Link from "next/link";

interface ErrorFallbackProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  homeHref?: string;
  homeLabel?: string;
}

/**
 * Shared branded fallback UI displayed when an unhandled route or component error is caught.
 */
export function ErrorFallbackCard({
  title = "We recovered from a temporary display error",
  description = "Your session and saved data remain safe. Retry loading this view or return to a working section.",
  onRetry,
  homeHref = "/",
  homeLabel = "Back to Homepage",
}: ErrorFallbackProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12 bg-light-surface">
      <div className="max-w-lg w-full bg-light-surface-container-lowest border border-light-outline-variant rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-4 text-center items-center">
        <div className="w-12 h-12 rounded-full bg-light-error-container text-light-on-error-container flex items-center justify-center">
          <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
            health_and_safety
          </span>
        </div>
        <h1 className="font-headline text-headline-sm text-light-on-surface">{title}</h1>
        <p className="font-body text-body-md text-light-on-surface-variant">{description}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container"
            >
              Try Again
            </button>
          )}
          <Link
            href={homeHref}
            className="px-4 py-2 rounded border border-light-outline-variant text-light-on-surface font-body text-label-lg hover:bg-light-surface-container-low"
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

interface BoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface BoundaryState {
  hasError: boolean;
}

/**
 * React class error boundary for wrapping isolated interactive panels or routes.
 */
export class ErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Caught React boundary error:", error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallbackCard
          title={this.props.fallbackTitle || "Unable to render section"}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
