"use client";

import React, { useEffect } from "react";

/**
 * Root-level safety boundary catching catastrophic layout/provider exceptions.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Global error boundary:", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans antialiased">
        <main className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-4 text-center items-center">
            <h1 className="text-xl font-semibold text-slate-900">
              Copian Application Recovery
            </h1>
            <p className="text-sm text-slate-600">
              A temporary client error occurred. Your account and database records were not affected.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={() => reset()}
                className="px-4 py-2 rounded bg-[#00366B] text-white text-sm font-medium hover:opacity-95"
              >
                Reload View
              </button>
              <a
                href="/"
                className="px-4 py-2 rounded border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                Return Home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
