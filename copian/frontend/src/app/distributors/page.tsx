"use client";

import React, { useEffect, useState, useMemo } from "react";
import StorefrontShell from "@/components/StorefrontShell";
import { CardGridSkeleton } from "@/components/Skeleton";
import { apiFetch, Distributor } from "@/lib/api";

export default function DistributorNetworkPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch<Distributor[]>("/api/distributors?active_only=true");
        setDistributors(res);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return distributors.filter(
      (d) =>
        !q ||
        d.city.toLowerCase().includes(q) ||
        d.state.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.territory.toLowerCase().includes(q)
    );
  }, [distributors, searchQ]);

  return (
    <StorefrontShell>
      <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-10 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-headline-lg text-light-on-surface">
              Authorized Distributor Network
            </h1>
            <p className="font-body text-body-md text-light-on-surface-variant mt-1">
              Search regional Copian stockists and B2B fulfillment partners by city, territory, or state.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-light-outline text-[18px]" aria-hidden="true">
              search
            </span>
            <input
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search city or state (e.g. Mumbai, Delhi)..."
              className="w-full rounded border border-light-outline-variant bg-light-surface-container-lowest pl-10 pr-4 py-2 font-body text-body-md"
            />
          </div>
        </div>

        {loading ? (
          <CardGridSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-10 text-center flex flex-col items-center gap-3">
            <p className="font-body text-body-lg text-light-on-surface-variant">
              No authorized distributors matched &ldquo;{searchQ}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => setSearchQ("")}
              className="px-4 py-2 rounded border border-light-outline-variant font-body text-label-md hover:bg-light-surface-container-low"
            >
              Show All Regions
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((d) => (
              <article
                key={d.id}
                className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col justify-between gap-4 hover:border-light-primary/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-surface-enter ease-surface-enter"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-mono-sm text-light-primary">
                      {d.city}, {d.state}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-light-surface-container-low font-mono text-[10px] uppercase text-light-on-surface-variant">
                      {d.territory}
                    </span>
                  </div>
                  <h2 className="font-headline text-title-lg text-light-on-surface">{d.name}</h2>
                  <p className="font-body text-body-sm text-light-on-surface-variant">{d.address}</p>
                </div>
                <div className="pt-3 border-t border-light-outline-variant/60 flex flex-col gap-1 font-body text-body-sm text-light-on-surface-variant">
                  <span className="font-mono text-mono-sm text-light-on-surface">{d.phone}</span>
                  <span>{d.email}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
