"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { Skeleton, TableRowsSkeleton } from "@/components/Skeleton";
import { formatINRLakhs } from "@/core/pricing";
import { adminApi } from "@/services/adminApi";
import { DashboardData } from "@/types/copian";

const DONUT_COLORS = ["#00366B", "#146C2E", "#C26D1F", "#505F78", "#7A2E8A"];

export default function AdminDashboardPage() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApi.getDashboard(range);
        setData(res);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  const statusPill = (status: string) => {
    if (status === "New") return "bg-light-secondary-container text-light-on-secondary-container";
    if (status === "Approved" || status === "Converted") return "bg-success-container text-on-success-container";
    return "bg-warning-container text-on-warning-container";
  };

  // Build SVG Donut geometry
  const shares = data?.category_shares || [];
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let runningOffset = 0;

  // Build SVG Trend Chart geometry
  const trends = data?.trends || [];
  const peakVal = Math.max(...trends.map((t) => t.revenue_lakhs), 1);
  const maxVal = Math.max(10, Math.ceil((peakVal * 1.25) / 5) * 5);
  const chartW = 600;
  const chartH = 200;
  const padLeft = 42;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 28;
  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;

  const polylinePoints = trends
    .map((t, i) => {
      const x = padLeft + (plotW / Math.max(trends.length, 1)) * (i + 0.5);
      const y = padTop + plotH - (t.revenue_lakhs / maxVal) * plotH * 0.9;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <AdminShell breadcrumb={["Overview", "Dashboard"]} showSearch showNewQuotationBtn>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-headline-md text-light-on-surface">Executive Operations Overview</h1>
          <p className="font-body text-body-sm text-light-on-surface-variant">
            Real-time B2B inquiries, stock valuation, quotations, and order fulfilment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Date range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded border border-light-outline-variant bg-light-surface-container-lowest px-3 py-2 font-body text-body-sm"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last Quarter</option>
            <option value="ytd">Fiscal Year to Date</option>
          </select>
          <Link
            href="/admin/reports"
            className="px-3.5 py-2 rounded border border-light-outline-variant bg-light-surface-container-lowest font-body text-label-md hover:bg-light-surface-container-low"
          >
            Export Report
          </Link>
        </div>
      </div>

      {/* 8 KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))
        ) : (
          <>
            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-label-md text-light-on-surface-variant">Total Products</span>
                <span className="material-symbols-outlined text-light-primary text-[20px]" aria-hidden="true">inventory_2</span>
              </div>
              <p className="font-headline text-headline-md text-light-on-surface tabular-nums">
                {data?.kpis.total_products ?? 0}
              </p>
              <span className="font-body text-body-sm text-success">Active B2B SKUs in catalogue</span>
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-label-md text-light-on-surface-variant">Total Customers</span>
                <span className="material-symbols-outlined text-light-primary text-[20px]" aria-hidden="true">groups</span>
              </div>
              <p className="font-headline text-headline-md text-light-on-surface tabular-nums">
                {data?.kpis.total_customers ?? 0}
              </p>
              <span className="font-body text-body-sm text-success">+8.4% vs prev. period</span>
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-label-md text-light-on-surface-variant">Inventory Value</span>
                <span className="material-symbols-outlined text-light-primary text-[20px]" aria-hidden="true">account_balance_wallet</span>
              </div>
              <p className="font-headline text-headline-md text-light-on-surface tabular-nums">
                {formatINRLakhs(data?.kpis.inventory_value ?? 0)}
              </p>
              <span className="font-body text-body-sm text-light-on-surface-variant">
                Across {data?.kpis.warehouse_count ?? 4} warehouses
              </span>
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-label-md text-light-on-surface-variant">Low Stock Alerts</span>
                <span className="material-symbols-outlined text-warning text-[20px]" aria-hidden="true">warning</span>
              </div>
              <p className="font-headline text-headline-md text-warning tabular-nums">
                {data?.kpis.low_stock_count ?? 0} SKUs
              </p>
              <Link href="/admin/inventory" className="font-body text-body-sm text-light-primary hover:underline">
                Review reorder queue →
              </Link>
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-label-md text-light-on-surface-variant">New Bulk Inquiries</span>
                <span className="material-symbols-outlined text-light-primary text-[20px]" aria-hidden="true">inbox</span>
              </div>
              <p className="font-headline text-headline-md text-light-on-surface tabular-nums">
                {data?.kpis.new_inquiries_count ?? 0}
              </p>
              <span className="font-body text-body-sm text-success">
                {data?.kpis.awaiting_review_count ?? 0} awaiting review
              </span>
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-label-md text-light-on-surface-variant">Pending Quotations</span>
                <span className="material-symbols-outlined text-light-primary text-[20px]" aria-hidden="true">request_quote</span>
              </div>
              <p className="font-headline text-headline-md text-light-on-surface tabular-nums">
                {data?.kpis.pending_quotations_count ?? 0}
              </p>
              <span className="font-body text-body-sm text-light-on-surface-variant">
                {formatINRLakhs(data?.kpis.pending_quotations_value ?? 0)} pipeline value
              </span>
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-label-md text-light-on-surface-variant">Confirmed Orders</span>
                <span className="material-symbols-outlined text-light-primary text-[20px]" aria-hidden="true">local_shipping</span>
              </div>
              <p className="font-headline text-headline-md text-light-on-surface tabular-nums">
                {data?.kpis.confirmed_orders_count ?? 0}
              </p>
              <span className="font-body text-body-sm text-success">96.2% on-time dispatch</span>
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-label-md text-light-on-surface-variant">Monthly B2B Sales</span>
                <span className="material-symbols-outlined text-success text-[20px]" aria-hidden="true">trending_up</span>
              </div>
              <p className="font-headline text-headline-md text-light-on-surface tabular-nums">
                {formatINRLakhs(data?.kpis.monthly_sales ?? 0)}
              </p>
              <span className="font-body text-body-sm text-success">+14.2% vs last month</span>
            </div>
          </>
        )}
      </section>

      {/* Interactive SVG Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col gap-4 relative">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-headline text-title-lg text-light-on-surface">
                Monthly Sales &amp; Bulk Inquiry Trends
              </h2>
              <p className="font-body text-body-sm text-light-on-surface-variant">
                Revenue (₹ Lakhs) with conversion trendline
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hoverIdx !== null && trends[hoverIdx] ? (
                <span className="font-mono text-mono-sm bg-dark-surface-container-low text-white px-2.5 py-1 rounded">
                  {trends[hoverIdx].month}: ₹{trends[hoverIdx].revenue_lakhs}L
                </span>
              ) : (
                <span className="font-mono text-mono-sm text-light-primary bg-light-surface-container-low px-2.5 py-1 rounded">
                  Conversion: 38.4%
                </span>
              )}
            </div>
          </div>

          <div className="w-full overflow-hidden">
            {loading ? (
              <div className="h-56 flex flex-col justify-end gap-3 pt-4" aria-busy="true">
                <div className="flex-1 flex items-end justify-between gap-4 px-4">
                  {["h-16", "h-24", "h-20", "h-32", "h-28", "h-40"].map((hCls, i) => (
                    <Skeleton key={i} className={`w-10 rounded-t ${hCls}`} />
                  ))}
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ) : (
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-56 overflow-visible">
              {/* Gridlines & Y-Axis */}
              {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                const y = padTop + plotH * (1 - ratio);
                const val = Math.round(maxVal * ratio);
                return (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={chartW - padRight}
                      y2={y}
                      stroke="#DFE2EE"
                      strokeDasharray={ratio === 0 ? "0" : "3 3"}
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-[#737781] text-[10px] font-mono"
                    >
                      ₹{val}L
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {trends.map((t, i) => {
                const slotW = plotW / Math.max(trends.length, 1);
                const barW = Math.min(44, slotW * 0.52);
                const x = padLeft + slotW * i + (slotW - barW) / 2;
                const barH = Math.max(8, (t.revenue_lakhs / maxVal) * plotH * 0.9);
                const y = padTop + plotH - barH;
                const active = hoverIdx === i;

                return (
                  <g
                    key={t.month}
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={barH}
                      rx={4}
                      fill={active ? "#00366B" : "#1B4D89"}
                      opacity={active ? 1 : 0.82}
                    />
                    <text
                      x={x + barW / 2}
                      y={chartH - 8}
                      textAnchor="middle"
                      className="fill-[#424750] text-[11px] font-mono"
                    >
                      {t.month}
                    </text>
                  </g>
                );
              })}

              {/* Trendline */}
              {trends.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#146C2E"
                  strokeWidth="2.5"
                  points={polylinePoints}
                />
              )}
              {trends.map((t, i) => {
                const slotW = plotW / Math.max(trends.length, 1);
                const cx = padLeft + slotW * (i + 0.5);
                const cy = padTop + plotH - (t.revenue_lakhs / maxVal) * plotH * 0.9;
                return (
                  <circle
                    key={`dot-${t.month}`}
                    cx={cx}
                    cy={cy}
                    r={hoverIdx === i ? 5.5 : 3.5}
                    fill="#FFFFFF"
                    stroke="#146C2E"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
            )}
          </div>
        </div>

        {/* SVG Donut Chart */}
        <div className="lg:col-span-4 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col gap-4">
          <h2 className="font-headline text-title-lg text-light-on-surface">Category Inventory Share</h2>
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-4" aria-busy="true">
              <Skeleton className="w-36 h-36 rounded-full" />
              <div className="w-full space-y-2.5 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3.5 w-10" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
          <>
          <div className="flex items-center justify-center py-2">
            <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
              <circle cx="72" cy="72" r={radius} fill="none" stroke="#EDEDF3" strokeWidth="18" />
              {shares.map((cs, idx) => {
                const dashLen = (cs.pct / 100) * circumference;
                const dashOffset = -runningOffset;
                runningOffset += dashLen;
                return (
                  <circle
                    key={cs.category}
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    stroke={DONUT_COLORS[idx % DONUT_COLORS.length]}
                    strokeWidth="18"
                    strokeDasharray={`${dashLen} ${circumference}`}
                    strokeDashoffset={dashOffset}
                  />
                );
              })}
              <text
                x="72"
                y="76"
                textAnchor="middle"
                transform="rotate(90 72 72)"
                className="fill-[#1A1C20] font-mono text-[13px] font-semibold"
              >
                {shares.length} Cats
              </text>
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            {shares.map((cs, idx) => (
              <div key={cs.category} className="flex items-center justify-between text-body-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                  />
                  <span className="text-light-on-surface">{cs.category}</span>
                </div>
                <span className="font-mono tabular-nums text-light-on-surface-variant">{cs.pct}%</span>
              </div>
            ))}
          </div>
          </>
          )}
        </div>
      </section>

      {/* Recent Inquiries & Low Stock Tables */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-light-surface-container-lowest border border-light-outline-variant rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-light-outline-variant flex items-center justify-between">
            <h2 className="font-headline text-title-md text-light-on-surface">Recent Bulk Inquiries</h2>
            <Link href="/admin/inquiries" className="font-body text-label-md text-light-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-light-surface-container-low border-b border-light-outline-variant font-body text-label-md text-light-on-surface-variant">
                <tr>
                  <th className="px-4 py-2.5">Inquiry ID</th>
                  <th className="px-4 py-2.5">Company</th>
                  <th className="px-4 py-2.5">Qty</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-sm">
                {loading ? (
                  <TableRowsSkeleton rows={4} cols={4} />
                ) : (data?.recent_inquiries || []).map((inq) => (
                  <tr key={inq.id} className="hover:bg-light-surface-container-low/60">
                    <td className="px-4 py-3 font-mono text-light-primary whitespace-nowrap">
                      <Link href="/admin/inquiries" className="hover:underline">
                        {inq.inquiry_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium">{inq.company_name}</td>
                    <td className="px-4 py-3 font-mono tabular-nums whitespace-nowrap">{inq.total_qty} units</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-label-sm whitespace-nowrap inline-block ${statusPill(inq.status)}`}>
                        {inq.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-light-surface-container-lowest border border-light-outline-variant rounded-md overflow-hidden">
          <div className="px-5 py-4 border-b border-light-outline-variant flex items-center justify-between">
            <h2 className="font-headline text-title-md text-light-on-surface">Low Stock Products</h2>
            <Link href="/admin/inventory" className="font-body text-label-md text-light-primary hover:underline">
              Restock →
            </Link>
          </div>
          <div className="divide-y divide-light-outline-variant/60">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-44" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full shrink-0" />
                </div>
              ))
            ) : (data?.low_stock_products || []).map((lp) => (
              <Link
                key={lp.sku}
                href="/admin/inventory"
                className="px-5 py-3 flex items-center justify-between hover:bg-light-surface-container-low/60"
              >
                <div>
                  <p className="font-mono text-mono-sm text-light-primary">{lp.sku}</p>
                  <p className="font-body text-body-sm font-medium text-light-on-surface">{lp.name}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-mono text-mono-sm tabular-nums whitespace-nowrap shrink-0 ${
                    lp.available_qty <= 0
                      ? "bg-light-error-container text-light-on-error-container"
                      : "bg-warning-container text-on-warning-container"
                  }`}
                >
                  {lp.available_qty} left
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
