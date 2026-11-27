"use client";

import React, { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthContext";
import { Skeleton, TableRowsSkeleton } from "@/components/Skeleton";
import { useCart } from "@/components/CartContext";
import { apiFetch, formatINRLakhs } from "@/lib/api";
import { adminApi } from "@/services/adminApi";

interface InvListing {
  id: number;
  product_name: string;
  sku: string;
  warehouse: string;
  available_qty: number;
  reserved_qty: number;
  reorder_level: number;
  suggested_reorder_qty: number;
  status: string;
}

interface InvTxn {
  id: number;
  txn_code: string;
  product_name: string;
  sku: string;
  txn_type: string;
  prev_qty: number;
  delta_qty: number;
  new_qty: number;
  reference_code: string;
  performed_by: string;
}

interface InventoryOverview {
  kpis: {
    total_skus: number;
    total_stock_qty: number;
    inventory_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
    warehouse_count: number;
  };
  warehouses: { id: number; name: string; code: string; city: string }[];
  listing: InvListing[];
  transactions: InvTxn[];
  alerts: InvListing[];
}

export default function AdminInventoryPage() {
  const { canAction } = useAdminAuth();
  const { showToast } = useCart();
  const canCreateInventory = canAction("Inventory & Stock Ledger", "create");
  const canEditInventory = canAction("Inventory & Stock Ledger", "edit");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InventoryOverview | null>(null);
  const [tab, setTab] = useState<"listing" | "inward" | "outward" | "adjust" | "history" | "alerts" | "warehouses">("listing");
  const [whName, setWhName] = useState("");
  const [whCode, setWhCode] = useState("");
  const [whCity, setWhCity] = useState("");

  const [inSku, setInSku] = useState("CPN-OPC-12A");
  const [inWh, setInWh] = useState("Mumbai Central");
  const [inQty, setInQty] = useState(500);
  const [inRef, setInRef] = useState("PO-2026-0914");

  const [outSku, setOutSku] = useState("CPN-HP-88A");
  const [outRef, setOutRef] = useState("ORD-2026-1092");
  const [outQty, setOutQty] = useState(100);
  const [outReason, setOutReason] = useState("B2B Order Fulfilment");

  const [adjSku, setAdjSku] = useState("CPN-OPC-12A");
  const [adjType, setAdjType] = useState("Damaged Inventory (-)");
  const [adjQty, setAdjQty] = useState(5);
  const [adjReason, setAdjReason] = useState("");

  const loadData = async () => {
    try {
      const res = await apiFetch<InventoryOverview>("/api/inventory");
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInward = async () => {
    try {
      const res = await apiFetch<{ txn_code: string; new_qty: number }>("/api/inventory/inward", {
        method: "POST",
        body: JSON.stringify({
          sku: inSku,
          warehouse_name: inWh,
          quantity: Number(inQty),
          reference_code: inRef,
        }),
      });
      await loadData();
      showToast(`Logged ${res.txn_code}: ${inSku} updated to ${res.new_qty} units.`);
      setTab("listing");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Inward failed");
    }
  };

  const handleOutward = async () => {
    try {
      const res = await apiFetch<{ txn_code: string; new_qty: number }>("/api/inventory/outward", {
        method: "POST",
        body: JSON.stringify({
          sku: outSku,
          quantity: Number(outQty),
          reference_code: outRef,
          reason: outReason,
        }),
      });
      await loadData();
      showToast(`Logged ${res.txn_code}: ${outSku} updated to ${res.new_qty} units.`);
      setTab("listing");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Outward failed");
    }
  };

  const handleAdjust = async () => {
    try {
      const res = await apiFetch<{ txn_code: string; new_qty: number }>("/api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          sku: adjSku,
          adjustment_type: adjType,
          quantity: Number(adjQty),
          reason: adjReason,
        }),
      });
      setAdjReason("");
      await loadData();
      showToast(`Logged ${res.txn_code}: ${adjSku} adjusted to ${res.new_qty} units.`);
      setTab("history");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Adjustment failed");
    }
  };

  return (
    <AdminShell
      breadcrumb={["Inventory", "Stock & Ledger"]}
      headerRight={
        <span className="font-mono text-mono-sm text-light-on-surface-variant">
          {data?.kpis.warehouse_count ?? 4} Active Warehouses
        </span>
      }
    >
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))
        ) : (
          <>
            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4">
              <span className="text-label-md text-light-on-surface-variant">Total SKUs</span>
              <p className="font-headline text-headline-sm text-light-on-surface tabular-nums mt-1">
                {data?.kpis.total_skus ?? 0}
              </p>
            </div>
            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4">
              <span className="text-label-md text-light-on-surface-variant">Total Stock Qty</span>
              <p className="font-headline text-headline-sm text-light-on-surface tabular-nums mt-1">
                {(data?.kpis.total_stock_qty ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4">
              <span className="text-label-md text-light-on-surface-variant">Inventory Value</span>
              <p className="font-headline text-headline-sm text-light-on-surface tabular-nums mt-1">
                {formatINRLakhs(data?.kpis.inventory_value ?? 0)}
              </p>
            </div>
            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4">
              <span className="text-label-md text-light-on-surface-variant">Low Stock</span>
              <p className="font-headline text-headline-sm text-warning tabular-nums mt-1">
                {data?.kpis.low_stock_count ?? 0}
              </p>
            </div>
            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4">
              <span className="text-label-md text-light-on-surface-variant">Out of Stock</span>
              <p className="font-headline text-headline-sm text-light-error tabular-nums mt-1">
                {data?.kpis.out_of_stock_count ?? 0}
              </p>
            </div>
          </>
        )}
      </section>

      <div role="tablist" className="flex flex-wrap gap-1 border-b border-light-outline-variant">
        {[
          { id: "listing", label: "Inventory Listing", allowed: true },
          { id: "inward", label: "Stock Inward", allowed: canCreateInventory },
          { id: "outward", label: "Stock Outward", allowed: canEditInventory },
          { id: "adjust", label: "Stock Adjustment", allowed: canEditInventory },
          { id: "history", label: "Transaction History", allowed: true },
          { id: "alerts", label: "Low Stock Alerts", allowed: true },
          { id: "warehouses", label: "Warehouses", allowed: true },
        ]
          .filter((t) => t.allowed)
          .map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2.5 font-body text-label-md ${
              tab === t.id
                ? "text-light-primary border-b-2 border-light-primary"
                : "text-light-on-surface-variant hover:text-light-on-surface"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "listing" && (
        <section className="overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest max-h-[600px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-light-surface-container-low border-b border-light-outline-variant font-body text-label-md text-light-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Reserved</th>
                <th className="px-4 py-3">Reorder Level</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-sm">
              {loading && !(data?.listing?.length) ? (
                <TableRowsSkeleton rows={6} cols={7} />
              ) : (
                (data?.listing || []).map((row) => (
                  <tr key={row.id} className="hover:bg-light-surface-container-low/50">
                    <td className="px-4 py-3 font-medium">{row.product_name}</td>
                    <td className="px-4 py-3 font-mono text-light-primary">{row.sku}</td>
                    <td className="px-4 py-3">{row.warehouse}</td>
                    <td
                      className={`px-4 py-3 font-mono tabular-nums ${
                        row.status === "Out of Stock"
                          ? "text-light-error font-semibold"
                          : row.status === "Low Stock"
                          ? "text-warning font-semibold"
                          : ""
                      }`}
                    >
                      {row.available_qty.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums">{row.reserved_qty}</td>
                    <td className="px-4 py-3 font-mono tabular-nums">{row.reorder_level}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-label-sm whitespace-nowrap inline-block ${
                          row.status === "Healthy"
                            ? "bg-success-container text-on-success-container"
                            : row.status === "Low Stock"
                            ? "bg-warning-container text-on-warning-container"
                            : "bg-light-error-container text-light-on-error-container"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}

      {tab === "inward" && canCreateInventory && (
        <section className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 max-w-2xl">
          <h2 className="font-headline text-title-lg mb-4">Record Stock Inward</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Product SKU</span>
              <input
                type="text"
                value={inSku}
                onChange={(e) => setInSku(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Warehouse</span>
              <select
                value={inWh}
                onChange={(e) => setInWh(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 text-body-md"
              >
                {(data?.warehouses || []).map((w) => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Quantity Received</span>
              <input
                type="number"
                value={inQty}
                onChange={(e) => setInQty(Number(e.target.value))}
                className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-md"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Batch / PO Reference</span>
              <input
                type="text"
                value={inRef}
                onChange={(e) => setInRef(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleInward}
            className="mt-4 px-5 py-2.5 rounded bg-light-primary text-light-on-primary text-label-md hover:bg-light-primary-container"
          >
            Commit Inward Entry
          </button>
        </section>
      )}

      {tab === "outward" && canEditInventory && (
        <section className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 max-w-2xl">
          <h2 className="font-headline text-title-lg mb-4">Record Stock Outward</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Product SKU</span>
              <input
                type="text"
                value={outSku}
                onChange={(e) => setOutSku(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Order Reference</span>
              <input
                type="text"
                value={outRef}
                onChange={(e) => setOutRef(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Quantity Dispatched</span>
              <input
                type="number"
                value={outQty}
                onChange={(e) => setOutQty(Number(e.target.value))}
                className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-md"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Dispatch Reason</span>
              <select
                value={outReason}
                onChange={(e) => setOutReason(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 text-body-md"
              >
                <option>B2B Order Fulfilment</option>
                <option>Warehouse Transfer</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={handleOutward}
            className="mt-4 px-5 py-2.5 rounded bg-light-primary text-light-on-primary text-label-md hover:bg-light-primary-container"
          >
            Record Dispatch
          </button>
        </section>
      )}

      {tab === "adjust" && canEditInventory && (
        <section className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 max-w-2xl">
          <h2 className="font-headline text-title-lg mb-4">Manual Stock Adjustment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Product SKU</span>
              <input
                type="text"
                value={adjSku}
                onChange={(e) => setAdjSku(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Adjustment Type</span>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 text-body-md"
              >
                <option>Damaged Inventory (-)</option>
                <option>Lost / Shrinkage (-)</option>
                <option>Audit Correction (+)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Quantity</span>
              <input
                type="number"
                value={adjQty}
                onChange={(e) => setAdjQty(Number(e.target.value))}
                className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-md"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 mt-4">
            <span className="text-label-md">Mandatory Audit Reason</span>
            <input
              type="text"
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder="Describe physical count variance..."
              className="rounded border border-light-outline-variant px-3 py-2 text-body-md"
            />
          </label>
          <button
            type="button"
            onClick={handleAdjust}
            className="mt-4 px-5 py-2.5 rounded bg-light-primary text-light-on-primary text-label-md hover:bg-light-primary-container"
          >
            Log Adjustment
          </button>
        </section>
      )}

      {tab === "history" && (
        <section className="overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest max-h-[600px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-light-surface-container-low border-b border-light-outline-variant font-body text-label-md text-light-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Txn ID</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Prev</th>
                <th className="px-4 py-3">Delta</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-sm">
              {(data?.transactions || []).map((tx) => (
                <tr key={tx.id} className="hover:bg-light-surface-container-low/50">
                  <td className="px-4 py-3 font-mono">{tx.txn_code}</td>
                  <td className="px-4 py-3">{tx.product_name}</td>
                  <td className={`px-4 py-3 ${tx.txn_type === "Inward" ? "text-success" : "text-light-primary"}`}>
                    {tx.txn_type}
                  </td>
                  <td className="px-4 py-3 font-mono">{tx.prev_qty}</td>
                  <td className={`px-4 py-3 font-mono ${tx.delta_qty >= 0 ? "text-success" : "text-light-error"}`}>
                    {tx.delta_qty >= 0 ? `+${tx.delta_qty}` : tx.delta_qty}
                  </td>
                  <td className="px-4 py-3 font-mono">{tx.new_qty}</td>
                  <td className="px-4 py-3 font-mono">{tx.reference_code}</td>
                  <td className="px-4 py-3">{tx.performed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "alerts" && (
        <section className="overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
          <table className="w-full text-left border-collapse">
            <thead className="bg-light-surface-container-low border-b border-light-outline-variant font-body text-label-md text-light-on-surface-variant">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Available</th>
                <th className="px-4 py-3">Threshold</th>
                <th className="px-4 py-3">Suggested Reorder</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-sm">
              {(data?.alerts || []).map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-mono text-light-primary">{a.sku}</td>
                  <td className="px-4 py-3">{a.product_name}</td>
                  <td className={`px-4 py-3 font-mono ${a.available_qty <= 0 ? "text-light-error" : "text-warning"}`}>
                    {a.available_qty}
                  </td>
                  <td className="px-4 py-3 font-mono">{a.reorder_level}</td>
                  <td className="px-4 py-3 font-mono font-semibold">{a.suggested_reorder_qty} units</td>
                  <td className="px-4 py-3">
                    {canCreateInventory && (
                      <button
                        type="button"
                        onClick={() => {
                          setInSku(a.sku);
                          setInWh(a.warehouse);
                          setInQty(a.suggested_reorder_qty);
                          setTab("inward");
                        }}
                        className="text-light-primary font-medium hover:underline"
                      >
                        Restock →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === "warehouses" && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-light-surface-container-lowest border border-light-outline-variant rounded-md overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-light-surface-container-low border-b border-light-outline-variant text-label-md text-light-on-surface-variant">
                <tr>
                  <th className="px-4 py-3">Warehouse Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">City</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-outline-variant/60 text-body-sm">
                {(data?.warehouses || []).map((w) => (
                  <tr key={w.id}>
                    <td className="px-4 py-3 font-medium">{w.name}</td>
                    <td className="px-4 py-3 font-mono text-light-primary">{w.code}</td>
                    <td className="px-4 py-3">{w.city}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canCreateInventory && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!whName.trim() || !whCode.trim()) return;
                try {
                  await adminApi.createWarehouse({
                    name: whName.trim(),
                    code: whCode.trim().toUpperCase(),
                    city: whCity.trim() || "Thane",
                  });
                  setWhName("");
                  setWhCode("");
                  setWhCity("");
                  await loadData();
                  showToast("Added warehouse depot.");
                } catch (err) {
                  showToast(err instanceof Error ? err.message : "Failed to add warehouse");
                }
              }}
              className="lg:col-span-5 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col gap-3"
            >
              <h2 className="font-headline text-title-md">Add Regional Warehouse</h2>
              <input type="text" required placeholder="Warehouse Name (e.g. Pune Hub)" value={whName} onChange={(e) => setWhName(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
              <input type="text" required placeholder="Depot Code (e.g. PNQ-01)" value={whCode} onChange={(e) => setWhCode(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm" />
              <input type="text" required placeholder="City" value={whCity} onChange={(e) => setWhCity(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
              <button type="submit" className="px-4 py-2 rounded bg-light-primary text-light-on-primary text-label-md hover:bg-light-primary-container">
                + Add Warehouse
              </button>
            </form>
          )}
        </section>
      )}
    </AdminShell>
  );
}
