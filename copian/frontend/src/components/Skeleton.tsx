"use client";

import React from "react";
import AdminShell from "@/components/AdminShell";

export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer rounded ${className}`}
    />
  );
}

/** 1-to-1 Studio Product Showcase Slider Skeleton for Homepage Hero */
export function HeroShowcaseCardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading featured product showcase"
      className="rounded-lg border border-light-outline-variant bg-light-surface-container-low overflow-hidden flex flex-col shadow-sm"
    >
      <div className="p-4 sm:p-5 flex flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="bg-white/95 border border-light-outline-variant rounded px-3 py-2 shadow-sm w-60 max-w-full space-y-1.5">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3.5 w-32" />
          </div>
          <Skeleton className="hidden sm:block h-6 w-24 rounded shrink-0" />
        </div>
        <div className="h-[165px] sm:h-[195px] lg:h-[210px] w-full flex items-center justify-center">
          <Skeleton className="h-40 w-56 sm:w-64 rounded-md" />
        </div>
        <div className="flex justify-end">
          <div className="bg-dark-surface-container-low rounded px-3.5 py-2 shadow-md w-60 max-w-full space-y-1.5">
            <Skeleton className="h-2.5 w-32 opacity-30" />
            <Skeleton className="h-3.5 w-48 opacity-25" />
          </div>
        </div>
      </div>
      <div className="border-t border-light-outline-variant/80 bg-light-surface-container-lowest/95 px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-2 w-6 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="ml-2 h-3 w-9" />
        </div>
        <Skeleton className="hidden md:block h-4 w-36" />
        <div className="flex items-center gap-1">
          <Skeleton className="w-7 h-7 rounded" />
          <Skeleton className="w-7 h-7 rounded" />
          <Skeleton className="w-7 h-7 rounded" />
        </div>
      </div>
    </div>
  );
}

/** 1-to-1 Full Homepage Skeleton (Hero + Studio Stage + Finder Bar + Categories + Featured Cards) */
export function HomePageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading homepage">
      <section className="bg-light-surface-container-lowest border-b border-light-outline-variant">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-10 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Skeleton className="h-7 w-64 rounded-full" />
              <Skeleton className="h-4 w-44" />
            </div>
            <div className="space-y-2.5">
              <Skeleton className="h-10 sm:h-12 w-full" />
              <Skeleton className="h-10 sm:h-12 w-5/6" />
            </div>
            <div className="space-y-2 max-w-prose">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <Skeleton className="h-12 w-56 rounded" />
              <Skeleton className="h-12 w-44 rounded" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-5 mt-2 border-t border-light-outline-variant/70">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-6">
            <HeroShowcaseCardSkeleton />
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-4 md:px-6 -mt-7 relative z-20">
        <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 md:p-6 shadow-md grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-11 w-full rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full rounded" />
          </div>
          <Skeleton className="h-11 w-full lg:w-52 rounded" />
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-16 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-5 w-36" />
        </div>
        <CategoryGridSkeleton count={6} />
      </section>

      <section className="bg-light-surface-container-lowest border-y border-light-outline-variant py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-8 w-64" />
            </div>
            <Skeleton className="h-10 w-64 rounded" />
          </div>
          <CardGridSkeleton count={4} />
        </div>
      </section>
    </div>
  );
}

export function CardGridSkeleton({
  count = 4,
  cols = 4,
}: {
  count?: number;
  cols?: 3 | 4;
}) {
  const colsClass =
    cols === 3 || count === 3
      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch"
      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch";
  return (
    <div className={colsClass} aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col justify-between gap-4"
        >
          <div className="flex flex-col gap-3">
            <div className="relative rounded bg-light-surface-container-low p-3.5 pt-9 flex items-center justify-center">
              <Skeleton className="h-5 w-16 rounded-full absolute top-2 left-2" />
              <Skeleton className="h-32 sm:h-36 w-32 rounded" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <Skeleton className="h-5 w-4/5" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <div className="pt-3 border-t border-light-outline-variant/60 flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3.5 w-12" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-7 w-24 rounded" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1 rounded" />
              <Skeleton className="h-9 w-24 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 1-to-1 Full Product Catalogue Skeleton (Header + Sticky Filter Sidebar + 3-Col Product Grid) */
export function CataloguePageSkeleton() {
  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-8 flex flex-col gap-6" aria-busy="true">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-12" />
        <Skeleton className="h-3.5 w-24" />
      </div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-light-outline-variant pb-5">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-9 w-56 rounded" />
          <Skeleton className="h-9 w-44 rounded" />
          <Skeleton className="h-9 w-20 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="hidden lg:flex lg:col-span-3 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex-col gap-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-12" />
          </div>
          {Array.from({ length: 3 }).map((_, g) => (
            <div key={g} className="space-y-2.5 pt-2 border-t border-light-outline-variant/60">
              <Skeleton className="h-3.5 w-24" />
              {Array.from({ length: 4 }).map((__, r) => (
                <div key={r} className="flex items-center gap-2.5">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
              ))}
            </div>
          ))}
        </aside>
        <div className="lg:col-span-9 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3.5 w-40" />
          </div>
          <CardGridSkeleton count={6} cols={3} />
        </div>
      </div>
    </div>
  );
}

/** 1-to-1 Category Landing Page Skeleton */
export function CategoryDetailSkeleton() {
  return (
    <div aria-busy="true">
      <section className="bg-light-surface-container-lowest border-b border-light-outline-variant">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 flex flex-col gap-3">
            <Skeleton className="h-3.5 w-44" />
            <Skeleton className="h-10 w-80 max-w-full" />
            <Skeleton className="h-4 w-full max-w-lg" />
            <Skeleton className="h-4 w-3/4 max-w-md" />
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <Skeleton className="h-44 w-56 rounded-md" />
          </div>
        </div>
      </section>
      <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-10 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-9 w-40 rounded" />
        </div>
        <CardGridSkeleton count={4} />
      </section>
    </div>
  );
}

/** 1-to-1 Product Detail & Tech Specs Page Skeleton */
export function ProductDetailSkeleton() {
  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-8 flex flex-col gap-12" aria-busy="true">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-12" />
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3.5 w-24" />
      </div>
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="rounded-lg border border-light-outline-variant bg-light-surface-container-low p-8 flex items-center justify-center relative">
            <Skeleton className="h-[340px] w-full rounded" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Skeleton className="h-7 w-32 rounded" />
            <Skeleton className="h-7 w-36 rounded-full" />
          </div>
          <Skeleton className="h-9 w-4/5" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
          <div className="bg-light-surface-container-low border border-light-outline-variant rounded-md p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3.5 w-44" />
              </div>
              <Skeleton className="h-10 w-36 rounded" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Skeleton className="h-12 w-full rounded" />
              <Skeleton className="h-12 w-full rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </section>
      <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md overflow-hidden">
        <div className="flex border-b border-light-outline-variant bg-light-surface-container-low px-4 py-3 gap-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-8 py-2 border-b border-light-outline-variant/50">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-64" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CategoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch" aria-busy="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </div>
          <div className="pt-3 border-t border-light-outline-variant/60 flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableRowsSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} aria-hidden="true">
          {Array.from({ length: cols }).map((__, cIdx) => (
            <td key={cIdx} className="px-4 py-3.5">
              <Skeleton
                className={`h-4 ${
                  cIdx === 0
                    ? "w-24"
                    : cIdx === cols - 1
                    ? "w-20 rounded-full"
                    : "w-3/4 min-w-[72px]"
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SplitInspectorSkeleton({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" aria-busy="true">
      <div className="lg:col-span-6 w-full min-w-0 overflow-hidden rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
        <div className="bg-light-surface-container-low border-b border-light-outline-variant px-4 py-3 flex gap-4">
          {Array.from({ length: cols }).map((_, idx) => (
            <Skeleton key={idx} className="h-4 flex-1" />
          ))}
        </div>
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-light-outline-variant/60">
            <TableRowsSkeleton rows={rows} cols={cols} />
          </tbody>
        </table>
      </div>
      <div className="lg:col-span-6 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between border-b border-light-outline-variant pb-4 gap-3">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
          <Skeleton className="h-9 w-32 rounded" />
        </div>
        <div className="border border-light-outline-variant rounded p-3 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Skeleton className="h-14 w-full rounded" />
          <Skeleton className="h-14 w-full rounded" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded" />
          <Skeleton className="h-10 flex-1 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ReportAnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 space-y-2.5"
          >
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </section>
      <div className="overflow-hidden rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
        <div className="bg-light-surface-container-low border-b border-light-outline-variant px-4 py-3 flex gap-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-light-outline-variant/60">
            <TableRowsSkeleton rows={5} cols={4} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CmsFormSkeleton() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6" aria-busy="true">
      <div className="lg:col-span-7 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-4">
        <Skeleton className="h-6 w-64" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-20 w-full rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        </div>
      </div>
      <div className="lg:col-span-5 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-11 w-full rounded" />
        <div className="space-y-2.5 pt-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Skeleton className="h-10 w-full rounded mt-2" />
      </div>
    </section>
  );
}

export function BuyerPortalSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 space-y-2.5"
          >
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md overflow-hidden">
        <div className="px-5 py-4 border-b border-light-outline-variant flex items-center justify-between">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-24" />
        </div>
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-light-outline-variant/60">
            <TableRowsSkeleton rows={4} cols={5} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AccountPageSkeleton() {
  return (
    <div className="max-w-[1160px] w-full mx-auto px-4 md:px-6 py-10 flex flex-col gap-8" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <BuyerPortalSkeleton />
    </div>
  );
}

export function CartItemsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col gap-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3.5 w-40" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-24 rounded" />
              <Skeleton className="h-9 w-9 rounded" />
            </div>
          </div>
          <Skeleton className="h-9 w-full rounded" />
        </div>
      ))}
    </div>
  );
}

/** 1-to-1 Inquiry Cart & RFQ Submission Page Skeleton */
export function InquiryCartPageSkeleton() {
  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-8 flex flex-col gap-8" aria-busy="true">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-light-outline-variant pb-5">
        <div className="space-y-2">
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-light-surface-container-low border border-light-outline-variant rounded-md p-4 flex flex-wrap gap-3">
            <Skeleton className="h-10 flex-1 min-w-[200px] rounded" />
            <Skeleton className="h-10 w-20 rounded" />
            <Skeleton className="h-10 w-32 rounded" />
            <Skeleton className="h-10 w-32 rounded" />
          </div>
          <CartItemsSkeleton count={3} />
        </section>
        <section className="lg:col-span-5 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 space-y-5">
          <div className="grid grid-cols-3 gap-2 p-3 rounded bg-light-surface-container-low">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5 flex flex-col items-center">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-14" />
              </div>
            ))}
          </div>
          <Skeleton className="h-6 w-52" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded" />
        </section>
      </div>
    </div>
  );
}

export function DistributorsPageSkeleton() {
  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-10 flex flex-col gap-8" aria-busy="true">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-light-outline-variant pb-6">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-full md:w-72 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex justify-between gap-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="pt-3 border-t border-light-outline-variant/60 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-44" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResourcesPageSkeleton() {
  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-10 flex flex-col gap-8" aria-busy="true">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-full md:w-72 rounded" />
      </div>
      <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center">
        <Skeleton className="lg:col-span-6 h-72 w-full rounded-none" />
        <div className="lg:col-span-6 p-6 md:p-8 flex flex-col gap-3">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-36 rounded mt-2" />
        </div>
      </div>
      <CardGridSkeleton count={3} cols={3} />
    </div>
  );
}

export function CompatibilitySkeleton() {
  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-8 flex flex-col gap-10" aria-busy="true">
      <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-lg p-6 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-8 w-72 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-16 rounded-full" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-11 w-full rounded" />
          <Skeleton className="h-11 w-full rounded" />
          <Skeleton className="h-11 w-full rounded" />
        </div>
      </div>
      <div className="overflow-hidden rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-light-outline-variant/60">
            <TableRowsSkeleton rows={5} cols={7} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Shared live ERP Sidebar + Topbar frame so only the main content pane shows route skeletons. */
export function AdminSkeletonFrame({ children }: { children: React.ReactNode }) {
  return <AdminShell breadcrumb={["ERP Workspace"]}>{children}</AdminShell>;
}

export function AdminDashboardSkeleton() {
  return (
    <AdminSkeletonFrame>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36 rounded" />
          <Skeleton className="h-9 w-28 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-6 w-32 rounded" />
          </div>
          <div className="h-52 flex items-end justify-between gap-4 pt-4 px-4">
            {["h-16", "h-24", "h-20", "h-32", "h-28", "h-40"].map((h, i) => (
              <Skeleton key={i} className={`w-10 rounded-t ${h}`} />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col items-center gap-4">
          <Skeleton className="h-5 w-44 self-start" />
          <Skeleton className="w-36 h-36 rounded-full" />
          <div className="w-full space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-3">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminSkeletonFrame>
  );
}

export function AdminProductsPageSkeleton() {
  return (
    <AdminSkeletonFrame>
      <div className="flex gap-2 border-b border-light-outline-variant pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-36 rounded" />
        ))}
      </div>
      <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-wrap gap-3">
        <Skeleton className="h-10 flex-1 min-w-[200px] rounded" />
        <Skeleton className="h-10 w-40 rounded" />
        <Skeleton className="h-10 w-36 rounded" />
        <Skeleton className="h-10 w-28 rounded" />
      </div>
      <div className="overflow-hidden rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-light-outline-variant/60">
            <TableRowsSkeleton rows={7} cols={6} />
          </tbody>
        </table>
      </div>
    </AdminSkeletonFrame>
  );
}

export function AdminInventoryPageSkeleton() {
  return (
    <AdminSkeletonFrame>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-b border-light-outline-variant pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-36 rounded" />
        ))}
      </div>
      <div className="overflow-hidden rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-light-outline-variant/60">
            <TableRowsSkeleton rows={6} cols={6} />
          </tbody>
        </table>
      </div>
    </AdminSkeletonFrame>
  );
}

export function AdminQuotationsPageSkeleton() {
  return (
    <AdminSkeletonFrame>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 rounded" />
          ))}
        </div>
        <Skeleton className="h-9 w-40 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
          <Skeleton className="h-44 w-full rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        <div className="lg:col-span-6 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 space-y-4">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-24 w-full rounded" />
          <Skeleton className="h-36 w-full rounded" />
        </div>
      </div>
    </AdminSkeletonFrame>
  );
}

export function AdminDistributorsPageSkeleton() {
  return (
    <AdminSkeletonFrame>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 space-y-2.5">
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-6 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
          <Skeleton className="h-10 w-36 rounded" />
        </div>
      </div>
    </AdminSkeletonFrame>
  );
}

export function AdminRolesPageSkeleton() {
  return (
    <AdminSkeletonFrame>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded" />
        ))}
      </div>
      <div className="overflow-hidden rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
        <table className="w-full text-left border-collapse">
          <tbody className="divide-y divide-light-outline-variant/60">
            <TableRowsSkeleton rows={5} cols={7} />
          </tbody>
        </table>
      </div>
      <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-32 w-full rounded" />
      </div>
    </AdminSkeletonFrame>
  );
}

export function AdminRouteSkeleton() {
  return (
    <AdminSkeletonFrame>
      <SplitInspectorSkeleton rows={5} cols={4} />
    </AdminSkeletonFrame>
  );
}

export function StorefrontRouteSkeleton() {
  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-10 flex flex-col gap-8" aria-busy="true">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <CardGridSkeleton count={4} />
    </div>
  );
}
