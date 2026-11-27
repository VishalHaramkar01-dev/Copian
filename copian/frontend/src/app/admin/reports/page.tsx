"use client";

import React, { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { ReportAnalyticsSkeleton } from "@/components/Skeleton";
import { useAdminAuth } from "@/components/AdminAuthContext";
import { useCart } from "@/components/CartContext";
import { apiFetch, downloadAuthenticatedFile, formatINR, getErrorMessage } from "@/lib/api";

interface ReportData {
  summary: {
    avg_order_value: number;
    quote_acceptance_rate: number;
    repeat_buyers_pct: number;
  };
  top_skus: { sku: string; name: string; units: number; revenue: number }[];
  warehouse_valuation: { warehouse: string; units: number; value: number; skus: number }[];
  customer_activity: { id?: number; company_name: string; classification: string; city: string; inquiries: number; orders: number; total_spend: number }[];
  funnel: { total_inquiries: number; quotations_issued: number; orders_confirmed: number; conversion_rate_pct: number };
}

export default function AdminReportsPage() {
  const { canAction } = useAdminAuth();
  const { showToast } = useCart();
  const canExportReports = canAction("Reports & Analytics", "export");
  const [tab, setTab] = useState<"sales" | "inventory" | "customers" | "funnel">("sales");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch<ReportData>("/api/reports");
        setData(res);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AdminShell
      breadcrumb={["Analytics", "Business Reports"]}
      headerRight={
        canExportReports ? (
          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              type="button"
              onClick={() =>
                downloadAuthenticatedFile("/api/reports/export/csv", "copian-sales-report.csv").catch((err) =>
                  showToast(getErrorMessage(err, "Export failed"))
                )
              }
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded border border-light-outline-variant text-label-sm sm:text-label-md hover:bg-light-surface-container-low"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded bg-light-primary text-light-on-primary text-label-sm sm:text-label-md hover:bg-light-primary-container"
            >
              Download PDF
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-wrap gap-2 border-b border-light-outline-variant pb-3 no-print">
        {[
          { id: "sales", label: "Sales Reports" },
          { id: "inventory", label: "Inventory Valuation" },
          { id: "customers", label: "Customer Activity" },
          { id: "funnel", label: "Inquiry Conversion" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 rounded text-label-md ${
              tab === t.id
                ? "bg-light-primary text-light-on-primary"
                : "border border-light-outline-variant bg-light-surface-container-lowest"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <ReportAnalyticsSkeleton />
      ) : (
      <>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5">
          <span className="text-label-md text-light-on-surface-variant">Average Bulk Order Value</span>
          <p className="font-headline text-headline-md text-light-on-surface tabular-nums mt-1">
            {formatINR(data?.summary.avg_order_value ?? 0)}
          </p>
        </div>
        <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5">
          <span className="text-label-md text-light-on-surface-variant">Quotation Acceptance Rate</span>
          <p className="font-headline text-headline-md text-success tabular-nums mt-1">
            {data?.summary.quote_acceptance_rate ?? 0}%
          </p>
        </div>
        <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5">
          <span className="text-label-md text-light-on-surface-variant">Repeat B2B Buyers</span>
          <p className="font-headline text-headline-md text-light-on-surface tabular-nums mt-1">
            {data?.summary.repeat_buyers_pct ?? 68.5}%
          </p>
        </div>
      </section>

      {tab === "sales" && (
        <div className="overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
          <table className="w-full text-left border-collapse">
            <thead className="bg-light-surface-container-low border-b border-light-outline-variant font-body text-label-md text-light-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Top Performing SKU</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Units Dispatched</th>
                <th className="px-4 py-3">Revenue (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-sm">
              {(data?.top_skus || []).map((s) => (
                <tr key={s.sku}>
                  <td className="px-4 py-3 font-mono text-light-primary">{s.sku}</td>
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{s.units.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{formatINR(s.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "inventory" && (
        <div className="overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
          <table className="w-full text-left border-collapse">
            <thead className="bg-light-surface-container-low border-b border-light-outline-variant font-body text-label-md text-light-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Warehouse Hub</th>
                <th className="px-4 py-3">Active SKUs</th>
                <th className="px-4 py-3">Total Units</th>
                <th className="px-4 py-3">Valuation (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-sm">
              {(data?.warehouse_valuation || []).map((w) => (
                <tr key={w.warehouse}>
                  <td className="px-4 py-3 font-medium">{w.warehouse}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{w.skus}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{w.units.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{formatINR(w.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "customers" && (
        <div className="overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
          <table className="w-full text-left border-collapse">
            <thead className="bg-light-surface-container-low border-b border-light-outline-variant font-body text-label-md text-light-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Inquiries</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-sm">
              {(data?.customer_activity || []).map((c, idx) => (
                <tr key={c.id ?? `${c.company_name}-${c.city}-${idx}`}>
                  <td className="px-4 py-3 font-medium">{c.company_name}</td>
                  <td className="px-4 py-3">{c.classification}</td>
                  <td className="px-4 py-3">{c.city}</td>
                  <td className="px-4 py-3 font-mono">{c.inquiries}</td>
                  <td className="px-4 py-3 font-mono">{c.orders}</td>
                  <td className="px-4 py-3 font-mono">{formatINR(c.total_spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "funnel" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5">
            <span className="text-label-md text-light-on-surface-variant">1. Bulk Inquiries Logged</span>
            <p className="font-headline text-headline-md mt-1 font-mono">{data?.funnel.total_inquiries ?? 0}</p>
          </div>
          <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5">
            <span className="text-label-md text-light-on-surface-variant">2. Quotations Issued</span>
            <p className="font-headline text-headline-md mt-1 font-mono">{data?.funnel.quotations_issued ?? 0}</p>
          </div>
          <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5">
            <span className="text-label-md text-light-on-surface-variant">3. Orders Confirmed</span>
            <p className="font-headline text-headline-md mt-1 font-mono">{data?.funnel.orders_confirmed ?? 0}</p>
          </div>
          <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5">
            <span className="text-label-md text-light-on-surface-variant">Overall Conversion Rate</span>
            <p className="font-headline text-headline-md mt-1 font-mono text-success">
              {data?.funnel.conversion_rate_pct ?? 0}%
            </p>
          </div>
        </div>
      )}
      </>
      )}
    </AdminShell>
  );
}
