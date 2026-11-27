"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthContext";
import { useCart } from "@/components/CartContext";
import { useCms } from "@/components/CmsContext";
import { AdminSkeletonFrame, SplitInspectorSkeleton, TableRowsSkeleton } from "@/components/Skeleton";
import { computeGstBreakdown, formatINR } from "@/core/pricing";
import { downloadAuthenticatedFile, getErrorMessage } from "@/lib/api";
import { salesApi } from "@/services/salesApi";
import { Order } from "@/types/copian";

function OrdersContent() {
  const { canAction } = useAdminAuth();
  const { contact } = useCms();
  const { showToast } = useCart();
  const searchParams = useSearchParams();
  const reqId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [courierDraft, setCourierDraft] = useState("");
  const [trackingDraft, setTrackingDraft] = useState("");

  const selectOrder = (o: Order | null) => {
    setSelected(o);
    setCourierDraft(o?.courier_name || "");
    setTrackingDraft(o?.tracking_number || "");
  };

  const load = async () => {
    try {
      const res = await salesApi.listOrders();
      setOrders(res);
      if (res.length > 0) {
        const match = reqId ? res.find((x) => String(x.id) === reqId) : null;
        const curr = selected ? res.find((x) => x.id === selected.id) : null;
        selectOrder(match || curr || res[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reqId]);

  const updateOrder = async (patch: {
    payment_status?: string;
    fulfilment_status?: string;
    courier_name?: string;
    tracking_number?: string;
  }) => {
    if (!selected) return;
    try {
      const updated = await salesApi.updateOrder(selected.id, patch);
      selectOrder(updated);
      await load();
      showToast(`Updated order ${updated.order_code}.`);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to update order status."));
    }
  };

  return (
    <AdminShell
      breadcrumb={["Sales & CRM", "Orders & Fulfilment"]}
      headerRight={
        <div className="flex flex-wrap gap-2 no-print">
          {selected && canAction("Orders & GST Invoices", "export") && (
            <button
              type="button"
              onClick={() =>
                downloadAuthenticatedFile(
                  `/api/orders/${selected.id}/pdf`,
                  `COPIAN-Invoice-${selected.invoice_code}.pdf`
                ).catch((err) => showToast(getErrorMessage(err, "Failed to download PDF invoice.")))
              }
              className="px-3.5 py-2 rounded border border-light-outline-variant text-label-md hover:bg-light-surface-container-low"
            >
              Download PDF
            </button>
          )}
          <button
            type="button"
            onClick={() => setInvoiceModal(true)}
            className="px-4 py-2 rounded bg-light-primary text-light-on-primary text-label-md hover:bg-light-primary-container"
          >
            Generate GST Invoice
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start no-print">
        <div className="lg:col-span-7 overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
          <table className="w-full text-left border-collapse">
            <thead className="bg-light-surface-container-low border-b border-light-outline-variant font-body text-label-md text-light-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Fulfilment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-sm">
              {loading ? (
                <TableRowsSkeleton rows={5} cols={5} />
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-light-on-surface-variant">
                    No confirmed B2B orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => selectOrder(o)}
                    className={`cursor-pointer ${
                      selected?.id === o.id ? "bg-light-secondary-container/25" : "hover:bg-light-surface-container-low/60"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-light-primary whitespace-nowrap">{o.order_code}</td>
                    <td className="px-4 py-3 font-medium">{o.customer_name}</td>
                    <td className="px-4 py-3 font-mono tabular-nums whitespace-nowrap">{formatINR(o.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-label-sm whitespace-nowrap inline-block ${
                          o.payment_status === "Paid"
                            ? "bg-success-container text-on-success-container"
                            : "bg-warning-container text-on-warning-container"
                        }`}
                      >
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-label-sm whitespace-nowrap inline-block ${
                          o.fulfilment_status === "Dispatched" || o.fulfilment_status === "Delivered"
                            ? "bg-success-container text-on-success-container"
                            : "bg-light-secondary-container text-light-on-secondary-container"
                        }`}
                      >
                        {o.fulfilment_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <aside className="lg:col-span-5 min-w-0 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between border-b border-light-outline-variant pb-3 gap-2">
              <div className="min-w-0">
                <span className="font-mono text-mono-sm text-light-primary">
                  {selected.order_code} · Inv #{selected.invoice_code}
                </span>
                <h2 className="font-headline text-title-lg text-light-on-surface truncate">{selected.customer_name}</h2>
              </div>
              <select
                aria-label="Fulfilment status"
                value={selected.fulfilment_status}
                onChange={(e) => updateOrder({ fulfilment_status: e.target.value })}
                className="rounded border border-light-outline-variant px-2.5 py-1.5 text-body-sm max-w-full shrink-0"
              >
                <option>Ready to Dispatch</option>
                <option>Dispatched</option>
                <option>Delivered</option>
                <option>Cancelled</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm">
              <span className="text-light-on-surface-variant">Payment Status</span>
              <select
                aria-label="Payment status"
                value={selected.payment_status}
                onChange={(e) => updateOrder({ payment_status: e.target.value })}
                className="rounded border border-light-outline-variant px-2.5 py-1 text-body-sm max-w-full shrink-0"
              >
                <option>Paid</option>
                <option>Credit 30d</option>
                <option>Pending</option>
              </select>
            </div>

            <div className="text-body-sm space-y-1.5">
              <p className="font-medium text-light-on-surface">Shipping Address</p>
              <p className="text-light-on-surface-variant">{selected.shipping_address}</p>
            </div>

            <div className="border-t border-light-outline-variant pt-3 text-body-sm space-y-2">
              <p className="font-medium text-light-on-surface">Dispatch &amp; Courier Tracking</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Courier (e.g. BlueDart / VRL)"
                  value={courierDraft}
                  onChange={(e) => setCourierDraft(e.target.value)}
                  className="rounded border border-light-outline-variant px-2.5 py-1.5 text-body-sm"
                />
                <input
                  type="text"
                  placeholder="AWB / LR Tracking Number"
                  value={trackingDraft}
                  onChange={(e) => setTrackingDraft(e.target.value)}
                  className="rounded border border-light-outline-variant px-2.5 py-1.5 font-mono text-mono-sm"
                />
              </div>
              {canAction("Orders & GST Invoices", "edit") && (
                <button
                  type="button"
                  onClick={() => updateOrder({ courier_name: courierDraft, tracking_number: trackingDraft })}
                  className="px-3 py-1.5 rounded border border-light-outline-variant text-label-sm hover:bg-light-surface-container-low"
                >
                  Save Tracking Info
                </button>
              )}
            </div>

            <div className="border-t border-light-outline-variant pt-3 text-body-sm space-y-2">
              <p className="font-medium text-light-on-surface">Order Timeline</p>
              {selected.timeline.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between ${
                    t.is_highlighted ? "text-light-primary font-medium" : "text-light-on-surface-variant"
                  }`}
                >
                  <span>{t.event_title}</span>
                  <span className="font-mono text-mono-sm">{t.created_at}</span>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Printable GST Tax Invoice Modal */}
      {invoiceModal && selected && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setInvoiceModal(false);
          }}
          className="fixed inset-0 z-50 bg-light-scrim/40 backdrop-blur-[1px] flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white border border-light-outline-variant rounded-lg max-w-2xl w-full p-8 flex flex-col gap-6 shadow-lg animate-modal-in">
            <div className="flex items-start justify-between border-b border-light-outline-variant pb-4">
              <div>
                <h2 className="font-headline text-headline-sm text-light-primary">TAX INVOICE · COPIAN B2B</h2>
                <p className="font-mono text-mono-sm text-light-on-surface-variant">
                  Invoice #{selected.invoice_code} · Order {selected.order_code}
                </p>
              </div>
              <div className="flex gap-2 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded bg-light-primary text-white text-label-md"
                >
                  Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceModal(false)}
                  className="px-3 py-1.5 rounded border border-light-outline-variant text-label-md"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm">
              <div>
                <p className="font-label text-label-md">Billed To</p>
                <p className="font-medium">{selected.customer_name}</p>
                <p className="text-light-on-surface-variant">{selected.shipping_address}</p>
                <p className="font-mono text-mono-sm mt-1">GSTIN: {selected.gstin || "N/A"}</p>
              </div>
              <div className="sm:text-right">
                <p className="font-label text-label-md">Supplier</p>
                <p className="font-medium">{contact.company}</p>
                <p className="text-light-on-surface-variant">{contact.address}</p>
                <p className="font-mono text-mono-sm mt-1">HSN: 8443</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-sm border border-light-outline-variant">
              <thead className="bg-light-surface-container-low border-b border-light-outline-variant">
                <tr>
                  <th className="p-2">SKU</th>
                  <th className="p-2">Item</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Rate</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-outline-variant/60">
                {selected.items.map((it) => (
                  <tr key={it.id}>
                    <td className="p-2 font-mono">{it.sku}</td>
                    <td className="p-2">{it.product_name}</td>
                    <td className="p-2 font-mono">{it.quantity}</td>
                    <td className="p-2 font-mono">{formatINR(it.unit_price)}</td>
                    <td className="p-2 font-mono text-right">{formatINR(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="flex flex-col items-end gap-1 text-body-sm">
              <p>Subtotal: <span className="font-mono">{formatINR(selected.subtotal)}</span></p>
              {(() => {
                const split = computeGstBreakdown({
                  subtotal: selected.subtotal,
                  buyerGstin: selected.gstin,
                  buyerAddress: selected.shipping_address,
                });
                return split.taxMode === "CGST+SGST" ? (
                  <>
                    <p>CGST (9%): <span className="font-mono">{formatINR(Math.round((selected.gst_amount / 2) * 100) / 100)}</span></p>
                    <p>SGST (9%): <span className="font-mono">{formatINR(Math.round((selected.gst_amount - Math.round((selected.gst_amount / 2) * 100) / 100) * 100) / 100)}</span></p>
                  </>
                ) : (
                  <p>IGST (18%): <span className="font-mono">{formatINR(selected.gst_amount)}</span></p>
                );
              })()}
              <p className="font-headline text-title-lg text-light-primary">
                Grand Total: <span className="font-mono">{formatINR(selected.total_amount)}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <AdminSkeletonFrame>
          <SplitInspectorSkeleton rows={5} cols={5} />
        </AdminSkeletonFrame>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
