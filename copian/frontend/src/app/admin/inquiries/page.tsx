"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { SplitInspectorSkeleton, TableRowsSkeleton } from "@/components/Skeleton";
import { useAdminAuth } from "@/components/AdminAuthContext";
import { useCart } from "@/components/CartContext";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { adminApi } from "@/services/adminApi";

interface ContactMsg {
  id: number;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  inquiry_type: string;
  message: string;
  status: string;
  created_at: string;
}

interface InquiryItem {
  id: number;
  sku: string;
  product_name: string;
  quantity: number;
  unit_note: string;
}

interface BulkInquiry {
  id: number;
  inquiry_code: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  gstin: string;
  delivery_city: string;
  notes: string;
  status: string;
  assigned_salesperson: string;
  internal_note: string;
  source: string;
  sku_count: number;
  total_qty: number;
  created_at: string;
  items: InquiryItem[];
}

export default function AdminInquiriesPage() {
  const router = useRouter();
  const { canAction } = useAdminAuth();
  const { showToast } = useCart();
  const canEditInquiries = canAction("Bulk Inquiries & Quotations", "edit");
  const canCreateQuotations = canAction("Bulk Inquiries & Quotations", "create");
  const canCreateOrders = canAction("Orders & GST Invoices", "create");
  const [viewMode, setViewMode] = useState<"inquiries" | "contact">("inquiries");
  const [statusFilter, setStatusFilter] = useState("All");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [inquiries, setInquiries] = useState<BulkInquiry[]>([]);
  const [contactMsgs, setContactMsgs] = useState<ContactMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BulkInquiry | null>(null);
  const [internalNote, setInternalNote] = useState("");

  const load = async (st = statusFilter) => {
    setLoading(true);
    try {
      const [res, msgs] = await Promise.all([
        apiFetch<{ counts: Record<string, number>; inquiries: BulkInquiry[] }>(
          `/api/inquiries${st !== "All" ? `?status=${encodeURIComponent(st)}` : ""}`
        ),
        adminApi.listContactMessages().catch(() => []),
      ]);
      setContactMsgs(msgs);
      setCounts(res.counts);
      setInquiries(res.inquiries);
      if (res.inquiries.length > 0) {
        const current = selected ? res.inquiries.find((x) => x.id === selected.id) : null;
        const pick = current || res.inquiries[0];
        setSelected(pick);
        setInternalNote(pick.internal_note || "");
      } else {
        setSelected(null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const updateSelected = async (patch: { status?: string; assigned_salesperson?: string; internal_note?: string }) => {
    if (!selected) return;
    try {
      const updated = await apiFetch<BulkInquiry>(`/api/inquiries/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setSelected(updated);
      await load(statusFilter);
      showToast(`Updated ${updated.inquiry_code}`);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to update inquiry."));
    }
  };

  const handleGenerateQuotation = async () => {
    if (!selected) return;
    try {
      const qt = await apiFetch<{ id: number }>(`/api/inquiries/${selected.id}/convert-quotation`, {
        method: "POST",
      });
      router.push(`/admin/quotations?id=${qt.id}`);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to generate quotation."));
    }
  };

  const handleConvertOrder = async () => {
    if (!selected) return;
    try {
      const ord = await apiFetch<{ id: number }>(`/api/inquiries/${selected.id}/convert-order`, {
        method: "POST",
      });
      router.push(`/admin/orders?id=${ord.id}`);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to convert inquiry to order."));
    }
  };

  const statusPill = (status: string) => {
    if (status === "New") return "bg-light-secondary-container text-light-on-secondary-container";
    if (status === "Approved" || status === "Converted") return "bg-success-container text-on-success-container";
    return "bg-warning-container text-on-warning-container";
  };

  const filterKeys = ["All", "New", "Under Review", "Quotation Sent", "Negotiation", "Converted"];

  return (
    <AdminShell
      breadcrumb={["Sales & CRM", "Bulk Inquiries"]}
      headerRight={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("inquiries")}
            className={`px-3 py-1.5 rounded text-label-sm ${viewMode === "inquiries" ? "bg-light-primary text-white" : "border border-light-outline-variant"}`}
          >
            Cart Inquiries ({counts.All ?? inquiries.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode("contact")}
            className={`px-3 py-1.5 rounded text-label-sm ${viewMode === "contact" ? "bg-light-primary text-white" : "border border-light-outline-variant"}`}
          >
            Contact Desk ({contactMsgs.length})
          </button>
        </div>
      }
    >
      {viewMode === "contact" ? (
        <section className="overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
          <table className="w-full text-left border-collapse">
            <thead className="bg-light-surface-container-low border-b border-light-outline-variant text-label-md text-light-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Sender / Company</th>
                <th className="px-4 py-3">Inquiry Type</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/60 text-body-sm">
              {loading ? (
                <TableRowsSkeleton rows={5} cols={5} />
              ) : contactMsgs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-light-on-surface-variant">
                    No messages submitted via /contact yet.
                  </td>
                </tr>
              ) : (
                contactMsgs.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{m.company_name}</p>
                      <p className="text-light-on-surface-variant">{m.full_name} · {m.phone}</p>
                      <p className="font-mono text-mono-sm text-light-primary">{m.email}</p>
                    </td>
                    <td className="px-4 py-3">{m.inquiry_type}</td>
                    <td className="px-4 py-3 max-w-md">{m.message}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-label-sm ${m.status === "Reviewed" ? "bg-success-container text-on-success-container" : "bg-warning-container text-on-warning-container"}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.status !== "Reviewed" && canEditInquiries && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await adminApi.updateContactStatus(m.id, "Reviewed");
                              await load();
                              showToast("Marked contact message Reviewed.");
                            } catch (err) {
                              showToast(getErrorMessage(err, "Failed to update contact message."));
                            }
                          }}
                          className="text-light-primary font-medium hover:underline"
                        >
                          Mark Reviewed
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      ) : (
      <>
      <div className="flex flex-wrap gap-2">
        {filterKeys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setStatusFilter(k)}
            className={`px-3 py-1.5 rounded-full text-label-md ${
              statusFilter === k
                ? "bg-light-primary text-light-on-primary"
                : "border border-light-outline-variant bg-light-surface-container-lowest"
            }`}
          >
            {k} ({counts[k] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <SplitInspectorSkeleton rows={5} cols={4} />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 w-full min-w-0 overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
          <table className="w-full text-left border-collapse">
            <thead className="bg-light-surface-container-low border-b border-light-outline-variant font-body text-label-md text-light-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Inquiry ID</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">SKUs / Qty</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-sm">
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-light-on-surface-variant">
                    No bulk inquiries match this filter.
                  </td>
                </tr>
              ) : (
              inquiries.map((inq) => (
                <tr
                  key={inq.id}
                  onClick={() => {
                    setSelected(inq);
                    setInternalNote(inq.internal_note || "");
                  }}
                  className={`cursor-pointer ${
                    selected?.id === inq.id ? "bg-light-secondary-container/25" : "hover:bg-light-surface-container-low/60"
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-light-primary whitespace-nowrap">{inq.inquiry_code}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{inq.company_name}</p>
                    <p className="text-light-on-surface-variant">{inq.delivery_city}</p>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums whitespace-nowrap">
                    {inq.sku_count} SKUs · {inq.total_qty}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-label-sm whitespace-nowrap inline-block ${statusPill(inq.status)}`}>
                      {inq.status}
                    </span>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <section className="lg:col-span-6 min-w-0 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between border-b border-light-outline-variant pb-4 gap-3">
              <div>
                <span className="font-mono text-mono-sm text-light-primary">
                  {selected.inquiry_code} · Received via {selected.source}
                </span>
                <h2 className="font-headline text-headline-sm text-light-on-surface mt-1">{selected.company_name}</h2>
                <p className="font-body text-body-sm text-light-on-surface-variant">
                  {selected.contact_name} · {selected.phone} · {selected.delivery_city}
                </p>
                {selected.gstin && (
                  <p className="font-mono text-mono-sm text-light-on-surface-variant mt-0.5">
                    GSTIN: {selected.gstin}
                  </p>
                )}
              </div>
              <select
                aria-label="Update inquiry status"
                disabled={!canEditInquiries}
                value={selected.status}
                onChange={(e) => updateSelected({ status: e.target.value })}
                className="rounded border border-light-outline-variant px-3 py-1.5 text-body-sm disabled:opacity-60"
              >
                <option>New</option>
                <option>Under Review</option>
                <option>Quotation Sent</option>
                <option>Negotiation</option>
                <option>Approved</option>
                <option>Converted</option>
              </select>
            </div>

            <div className="overflow-x-auto border border-light-outline-variant rounded">
              <table className="w-full text-left border-collapse text-body-sm">
                <thead className="bg-light-surface-container-low border-b border-light-outline-variant text-label-md text-light-on-surface-variant">
                  <tr>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Requested Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-outline-variant/60">
                  {selected.items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-3 py-2 font-mono text-light-primary">{it.sku}</td>
                      <td className="px-3 py-2">
                        <p>{it.product_name}</p>
                        {it.unit_note && <p className="text-body-sm text-light-on-surface-variant">{it.unit_note}</p>}
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums">{it.quantity} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-label-md">Assign Salesperson</span>
                <select
                  disabled={!canEditInquiries}
                  value={selected.assigned_salesperson}
                  onChange={(e) => updateSelected({ assigned_salesperson: e.target.value })}
                  className="rounded border border-light-outline-variant px-3 py-2 text-body-sm disabled:opacity-60"
                >
                  <option>Rohan Deshmukh</option>
                  <option>Priya Iyer</option>
                  <option>Arjun Mehta</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 min-w-0">
                <span className="text-label-md">Internal Note</span>
                <div className="flex gap-2 min-w-0">
                  <input
                    type="text"
                    readOnly={!canEditInquiries}
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Add pricing tier note..."
                    className="flex-1 min-w-0 rounded border border-light-outline-variant px-3 py-2 text-body-sm read-only:bg-light-surface-container-low"
                  />
                  {canEditInquiries && (
                    <button
                      type="button"
                      onClick={() => updateSelected({ internal_note: internalNote })}
                      className="px-3 py-2 rounded border border-light-outline-variant text-label-md hover:bg-light-surface-container-low shrink-0"
                    >
                      Save
                    </button>
                  )}
                </div>
              </label>
            </div>

            {(canCreateQuotations || canCreateOrders) && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-light-outline-variant">
                {canCreateQuotations && (
                  <button
                    type="button"
                    onClick={handleGenerateQuotation}
                    className="px-4 py-2.5 rounded bg-light-primary text-light-on-primary text-label-md hover:bg-light-primary-container"
                  >
                    Generate Quotation
                  </button>
                )}
                {canCreateOrders && (
                  <button
                    type="button"
                    onClick={handleConvertOrder}
                    className="px-4 py-2.5 rounded border border-light-outline-variant text-label-md hover:bg-light-surface-container-low"
                  >
                    Convert to Order
                  </button>
                )}
              </div>
            )}
          </section>
        )}
      </div>
      )}
      </>
      )}
    </AdminShell>
  );
}
