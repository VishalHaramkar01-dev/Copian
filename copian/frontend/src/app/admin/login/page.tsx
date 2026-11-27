"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/components/AdminAuthContext";
import { apiFetch, safeStorageSet } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const { refreshAdminState } = useAdminAuth();
  const [email, setEmail] = useState("arjun@copian.in");
  const [password, setPassword] = useState("copian@2026");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ access_token: string; user?: Record<string, unknown> }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      safeStorageSet("copian_admin_token", res.access_token);
      if (res.user) {
        safeStorageSet("copian_admin_user", JSON.stringify(res.user));
      }
      await refreshAdminState(true);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-surface flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-light-surface-container-lowest border border-light-outline-variant rounded-lg p-8 shadow-sm flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-3 py-1.5 rounded bg-light-primary">
            <img src="/images/copian-logo.png" alt="COPIAN" className="h-5 w-auto object-contain" />
          </span>
          <span className="font-mono text-mono-sm text-light-primary">ERP Sign In</span>
        </div>

        <div>
          <h1 className="font-headline text-headline-sm text-light-on-surface">Copian ERP Admin Portal</h1>
          <p className="font-body text-body-sm text-light-on-surface-variant mt-1">
            Sign in with your Copian staff credentials to manage inventory, inquiries, and quotations.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-light-error-container text-light-on-error-container text-body-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-label-md">Staff Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded border border-light-outline-variant px-3 py-2 text-body-md"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-label-md">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded border border-light-outline-variant px-3 py-2 text-body-md"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container"
          >
            {loading ? "Signing In..." : "Sign In to ERP"}
          </button>
        </form>

        <div className="pt-3 border-t border-light-outline-variant flex items-center justify-between text-body-sm text-light-on-surface-variant">
          <span className="font-mono text-mono-sm">Demo: arjun@copian.in / copian@2026</span>
          <Link href="/" className="text-light-primary hover:underline">
            Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
