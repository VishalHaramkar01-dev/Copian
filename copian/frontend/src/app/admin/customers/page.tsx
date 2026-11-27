"use client";

import React, { useEffect, useState, useMemo } from "react";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthContext";
import { useCart } from "@/components/CartContext";
import { TableRowsSkeleton } from "@/components/Skeleton";
import { isValidOptionalGstin } from "@/core/pricing";
import { API_BASE, apiFetch, downloadAuthenticatedFile, formatINR, getErrorMessage } from "@/lib/api";

interface CustomerRow {
  id: number;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  gstin: string;
  city: string;
  state: string;
  classification: string;
  credit_limit?: number;
  credit_used?: number;
  credit_available?: number;
  overdue_30d_amount?: number;
  overdue_count?: number;
  notes: string;
  inquiries_count: number;
  orders_count: number;
  inquiries: { id: number; inquiry_code: string; status: string }[];
  orders: { id: number; order_code: string; total_amount: number; payment_status?: string; fulfilment_status: string }[];
}

export default function AdminCustomersPage() {
  const { canAction } = useAdminAuth();
  const { showToast } = useCart();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [classFilter, setClassFilter] = useState("All Classifications");
  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"overview" | "inquiries" | "orders" | "notes">("overview");
  const [noteDraft, setNoteDraft] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Customer Modal fields
  const [newCompany, setNewCompany] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newGstin, setNewGstin] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newClass, setNewClass] = useState("Corporate Buyer");
  const [newCreditLimit, setNewCreditLimit] = useState(250000);

  const load = async () => {
    try {
      const res = await apiFetch<CustomerRow[]>("/api/customers");
      setCustomers(res);
      if (res.length > 0) {
        const curr = selected ? res.find((x) => x.id === selected.id) : null;
        const pick = curr || res[0];
        setSelected(pick);
        setNoteDraft(pick.notes || "");
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
  }, []);

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return customers.filter((c) => {
      const mC = classFilter === "All Classifications" || c.classification === classFilter;
      const mQ =
        !q ||
        c.company_name.toLowerCase().includes(q) ||
        c.contact_name.toLowerCase().includes(q) ||
        c.gstin.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q);
      return mC && mQ;
    });
  }, [customers, searchQ, classFilter]);

  const badgeClass = (cls: string) => {
    if (cls === "Dealer" || cls === "Distributor") return "bg-success-container text-on-success-container";
    if (cls === "Wholesaler") return "bg-warning-container text-on-warning-container";
    return "bg-light-secondary-container text-light-on-secondary-container";
  };

  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newContact.trim()) return;
    if (!isValidOptionalGstin(newGstin)) {
      showToast("Enter a valid 15-character GSTIN (e.g. 27AABCU9603R1ZM) or leave blank.");
      return;
    }
    try {
      const created = await apiFetch<CustomerRow>("/api/customers", {
        method: "POST",
        body: JSON.stringify({
          company_name: newCompany.trim(),
          contact_name: newContact.trim(),
          phone: newPhone.trim(),
          email: newEmail.trim(),
          gstin: newGstin.trim().toUpperCase(),
          city: newCity.trim(),
          state: newState.trim(),
          classification: newClass,
          credit_limit: Number(newCreditLimit) || 250000,
        }),
      });
      setShowAddModal(false);
      setNewCompany("");
      setNewContact("");
      await load();
      setSelected(created);
      showToast(`Created customer ${created.company_name}.`);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to create customer."));
    }
  };

  return (
    <AdminShell
      breadcrumb={["Sales & CRM", "Customer Management"]}
      headerRight={
        <div className="flex flex-wrap items-center gap-2">
          {canAction("Customers & Distributors", "export") && (
            <button
              type="button"
              onClick={() =>
                downloadAuthenticatedFile("/api/customers/export/csv", "copian-customers.csv").catch((err) =>
                  showToast(getErrorMessage(err, "Export failed"))
                )
              }
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded border border-light-outline-variant text-label-sm sm:text-label-md hover:bg-light-surface-container-low"
            >
              Export CSV
            </button>
          )}
          {canAction("Customers & Distributors", "create") && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded bg-light-primary text-light-on-primary text-label-sm sm:text-label-md hover:bg-light-primary-container"
            >
              + Add Customer
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4">
        <input
          type="search"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search company, contact name, GSTIN, or city..."
          className="rounded border border-light-outline-variant px-3 py-1.5 text-body-sm w-full sm:w-72"
        />
        <select
          aria-label="Filter by customer type"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="rounded border border-light-outline-variant px-3 py-1.5 text-body-sm w-full sm:w-auto"
        >
          <option>All Classifications</option>
          <option>Corporate Buyer</option>
          <option>Dealer</option>
          <option>Distributor</option>
          <option>Wholesaler</option>
          <option>Retailer</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 w-full min-w-0 overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
          <table className="w-full text-left border-collapse">
            <thead className="bg-light-surface-container-low border-b border-light-outline-variant font-body text-label-md text-light-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">GSTIN</th>
                <th className="px-4 py-3">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-sm">
              {loading ? (
                <TableRowsSkeleton rows={5} cols={5} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-light-on-surface-variant">
                    No matching B2B customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => {
                      setSelected(c);
                      setNoteDraft(c.notes || "");
                    }}
                    className={`cursor-pointer ${
                      selected?.id === c.id ? "bg-light-secondary-container/25" : "hover:bg-light-surface-container-low/60"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-light-on-surface">{c.company_name}</p>
                      <p className="text-light-on-surface-variant">{c.contact_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-label-sm whitespace-nowrap inline-block ${badgeClass(c.classification)}`}>
                        {c.classification}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{c.city}</td>
                    <td className="px-4 py-3 font-mono text-mono-sm whitespace-nowrap">{c.gstin}</td>
                    <td className="px-4 py-3 font-mono tabular-nums">{c.orders_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <aside className="lg:col-span-5 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between border-b border-light-outline-variant pb-4">
              <div>
                <span className={`px-2 py-0.5 rounded-full text-label-sm ${badgeClass(selected.classification)}`}>
                  {selected.classification}
                </span>
                <h2 className="font-headline text-title-lg text-light-on-surface mt-1">{selected.company_name}</h2>
                <p className="font-mono text-mono-sm text-light-on-surface-variant">
                  GSTIN: {selected.gstin || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-light-outline-variant pb-3 font-body text-label-md">
              <button
                type="button"
                onClick={() => setInspectorTab("overview")}
                className={`px-2.5 py-1 rounded ${
                  inspectorTab === "overview" ? "bg-light-primary text-light-on-primary" : "text-light-on-surface-variant hover:bg-light-surface-container-low"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab("inquiries")}
                className={`px-2.5 py-1 rounded ${
                  inspectorTab === "inquiries" ? "bg-light-primary text-light-on-primary" : "text-light-on-surface-variant hover:bg-light-surface-container-low"
                }`}
              >
                Inquiries ({selected.inquiries_count})
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab("orders")}
                className={`px-2.5 py-1 rounded ${
                  inspectorTab === "orders" ? "bg-light-primary text-light-on-primary" : "text-light-on-surface-variant hover:bg-light-surface-container-low"
                }`}
              >
                Orders ({selected.orders_count})
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab("notes")}
                className={`px-2.5 py-1 rounded ${
                  inspectorTab === "notes" ? "bg-light-primary text-light-on-primary" : "text-light-on-surface-variant hover:bg-light-surface-container-low"
                }`}
              >
                Edit Account
              </button>
            </div>

            {inspectorTab === "overview" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
                  <div>
                    <span className="text-light-on-surface-variant block">Primary Contact</span>
                    <span className="font-medium">{selected.contact_name}</span>
                  </div>
                  <div>
                    <span className="text-light-on-surface-variant block">Phone</span>
                    <span className="font-mono">{selected.phone}</span>
                  </div>
                  <div>
                    <span className="text-light-on-surface-variant block">Email</span>
                    <span>{selected.email}</span>
                  </div>
                  <div>
                    <span className="text-light-on-surface-variant block">Billing City</span>
                    <span>
                      {selected.city}
                      {selected.state ? `, ${selected.state}` : ""}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded border border-light-outline-variant bg-light-surface-container-low p-3 text-body-sm">
                  <div>
                    <span className="text-[11px] text-light-on-surface-variant block">Credit Limit</span>
                    <span className="font-mono font-semibold">{formatINR(selected.credit_limit ?? 250000)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-light-on-surface-variant block">Unpaid / 30d</span>
                    <span className="font-mono font-semibold text-warning">{formatINR(selected.credit_used ?? 0)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-light-on-surface-variant block">Available</span>
                    <span className="font-mono font-semibold text-success">{formatINR(selected.credit_available ?? 250000)}</span>
                  </div>
                </div>
                {(selected.overdue_count ?? 0) > 0 && (
                  <div className="rounded bg-light-error-container text-light-on-error-container px-3 py-2 text-body-sm font-medium">
                    Alert: {selected.overdue_count} overdue 30d+ invoice(s) totaling {formatINR(selected.overdue_30d_amount ?? 0)}
                  </div>
                )}
                <div className="bg-light-surface-container-low rounded p-3 text-body-sm">
                  <p className="font-label text-label-md text-light-on-surface">Account Note</p>
                  <p className="text-light-on-surface-variant mt-1">{selected.notes || "No notes recorded."}</p>
                </div>
              </>
            )}

            {inspectorTab === "inquiries" && (
              <div className="space-y-2 text-body-sm">
                {selected.inquiries.map((i) => (
                  <div key={i.id} className="p-2.5 rounded bg-light-surface-container-low flex justify-between">
                    <span className="font-mono text-light-primary">{i.inquiry_code}</span>
                    <span>{i.status}</span>
                  </div>
                ))}
                {selected.inquiries.length === 0 && <p className="text-light-on-surface-variant">No inquiries yet.</p>}
              </div>
            )}

            {inspectorTab === "orders" && (
              <div className="space-y-2 text-body-sm">
                {selected.orders.map((o) => (
                  <div key={o.id} className="p-2.5 rounded bg-light-surface-container-low flex justify-between">
                    <span className="font-mono text-light-primary">{o.order_code}</span>
                    <span className="font-mono">{formatINR(o.total_amount)}</span>
                    <span>{o.fulfilment_status}</span>
                  </div>
                ))}
                {selected.orders.length === 0 && <p className="text-light-on-surface-variant">No orders yet.</p>}
              </div>
            )}

            {inspectorTab === "notes" && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
                  <label className="flex flex-col gap-1">
                    <span className="text-label-sm">Company Name</span>
                    <input
                      type="text"
                      value={selected.company_name}
                      onChange={(e) => setSelected({ ...selected, company_name: e.target.value })}
                      className="rounded border border-light-outline-variant px-2.5 py-1.5"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label-sm">Contact Name</span>
                    <input
                      type="text"
                      value={selected.contact_name}
                      onChange={(e) => setSelected({ ...selected, contact_name: e.target.value })}
                      className="rounded border border-light-outline-variant px-2.5 py-1.5"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label-sm">Phone</span>
                    <input
                      type="text"
                      value={selected.phone}
                      onChange={(e) => setSelected({ ...selected, phone: e.target.value })}
                      className="rounded border border-light-outline-variant px-2.5 py-1.5 font-mono"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label-sm">Email</span>
                    <input
                      type="email"
                      value={selected.email}
                      onChange={(e) => setSelected({ ...selected, email: e.target.value })}
                      className="rounded border border-light-outline-variant px-2.5 py-1.5"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label-sm">City</span>
                    <input
                      type="text"
                      value={selected.city}
                      onChange={(e) => setSelected({ ...selected, city: e.target.value })}
                      className="rounded border border-light-outline-variant px-2.5 py-1.5"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label-sm">GSTIN</span>
                    <input
                      type="text"
                      value={selected.gstin}
                      onChange={(e) => setSelected({ ...selected, gstin: e.target.value.toUpperCase() })}
                      className="rounded border border-light-outline-variant px-2.5 py-1.5 font-mono"
                    />
                  </label>
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-label-sm">Credit Limit (₹)</span>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={selected.credit_limit ?? 250000}
                      onChange={(e) => setSelected({ ...selected, credit_limit: Number(e.target.value) || 0 })}
                      className="rounded border border-light-outline-variant px-2.5 py-1.5 font-mono"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-label-sm">Account Notes</span>
                  <textarea
                    rows={3}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    className="rounded border border-light-outline-variant p-2.5 text-body-sm"
                  />
                </label>
                {canAction("Customers & Distributors", "edit") && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selected) return;
                      if (!isValidOptionalGstin(selected.gstin)) {
                        showToast("Enter a valid 15-character GSTIN (e.g. 27AABCU9603R1ZM) or leave blank.");
                        return;
                      }
                      try {
                        await apiFetch(`/api/customers/${selected.id}`, {
                          method: "PUT",
                          body: JSON.stringify({
                            company_name: selected.company_name,
                            contact_name: selected.contact_name,
                            phone: selected.phone,
                            email: selected.email,
                            city: selected.city,
                            gstin: selected.gstin,
                            credit_limit: selected.credit_limit ?? 250000,
                            notes: noteDraft,
                          }),
                        });
                        await load();
                        showToast(`Saved customer details for ${selected.company_name}.`);
                      } catch (err) {
                        showToast(getErrorMessage(err, "Failed to update customer details."));
                      }
                    }}
                    className="w-fit px-4 py-2 rounded bg-light-primary text-light-on-primary text-label-md"
                  >
                    Save Customer Changes
                  </button>
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      {showAddModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
          className="fixed inset-0 z-50 bg-light-scrim/40 backdrop-blur-[1px] flex items-center justify-center p-4 animate-fade-in"
        >
          <form
            onSubmit={createCustomer}
            className="bg-white border border-light-outline-variant rounded-lg max-w-md w-full p-6 flex flex-col gap-4 shadow-lg animate-modal-in"
          >
            <div className="flex justify-between items-center">
              <h2 className="font-headline text-title-lg">Add B2B Customer</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-light-outline">
                ✕
              </button>
            </div>
            <input type="text" required placeholder="Company Name *" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
            <input type="text" required placeholder="Contact Name *" value={newContact} onChange={(e) => setNewContact(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="Phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
              <input type="email" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="City" value={newCity} onChange={(e) => setNewCity(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
              <input type="text" placeholder="State" value={newState} onChange={(e) => setNewState(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="GSTIN (e.g. 27AABCU9603R1ZM)" value={newGstin} onChange={(e) => setNewGstin(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm" />
              <select value={newClass} onChange={(e) => setNewClass(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm">
                <option>Corporate Buyer</option>
                <option>Dealer</option>
                <option>Distributor</option>
                <option>Wholesaler</option>
                <option>Retailer</option>
              </select>
            </div>
            <label className="flex flex-col gap-1 text-body-sm">
              <span className="text-label-sm">30-Day Credit Limit (₹)</span>
              <input type="number" min={0} step={10000} value={newCreditLimit} onChange={(e) => setNewCreditLimit(Number(e.target.value) || 0)} className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm" />
            </label>
            <button type="submit" className="py-2.5 rounded bg-light-primary text-light-on-primary text-label-md">
              Create Customer
            </button>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
