"use client";

import React, { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthContext";
import { useCart } from "@/components/CartContext";
import { TableRowsSkeleton } from "@/components/Skeleton";
import { apiFetch, Distributor, formatINRLakhs, getErrorMessage } from "@/lib/api";

export default function AdminDistributorsPage() {
  const { canAction } = useAdminAuth();
  const { showToast } = useCart();
  const canCreateDistributor = canAction("Customers & Distributors", "create");
  const canEditDistributor = canAction("Customers & Distributors", "edit");
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [territory, setTerritory] = useState("West India");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [status, setStatus] = useState("Active");
  const [assocDealers, setAssocDealers] = useState(15);
  const [ytdValue, setYtdValue] = useState(0);

  const selectRow = (d: Distributor) => {
    setSelectedId(d.id);
    setName(d.name);
    setCity(d.city);
    setStateVal(d.state);
    setTerritory(d.territory);
    setAddress(d.address);
    setPhone(d.phone);
    setEmail(d.email);
    setGstin(d.gstin);
    setStatus(d.status);
    setAssocDealers(d.associated_dealers);
    setYtdValue(d.ytd_orders_value);
  };

  const load = async () => {
    try {
      const res = await apiFetch<Distributor[]>("/api/distributors");
      setDistributors(res);
      if (res.length > 0) {
        const curr = selectedId ? res.find((x) => x.id === selectedId) : null;
        selectRow(curr || res[0]);
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

  const startNew = () => {
    setSelectedId(null);
    setName("");
    setCity("");
    setStateVal("");
    setTerritory("West India");
    setAddress("");
    setPhone("");
    setEmail("");
    setGstin("");
    setStatus("Active");
    setAssocDealers(10);
    setYtdValue(0);
  };

  const saveProfile = async () => {
    if (!name.trim() || !city.trim()) return;
    const payload = {
      name: name.trim(),
      city: city.trim(),
      state: stateVal.trim() || "Maharashtra",
      territory,
      address,
      phone,
      email,
      gstin: gstin.toUpperCase(),
      status,
      associated_dealers: assocDealers,
      ytd_orders_value: ytdValue,
    };
    try {
      if (selectedId) {
        await apiFetch(`/api/distributors/${selectedId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast(`Saved ${name} (synced with public /distributors).`);
      } else {
        const created = await apiFetch<Distributor>("/api/distributors", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSelectedId(created.id);
        showToast(`Added distributor ${name}.`);
      }
      await load();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to save distributor profile."));
    }
  };

  const canSaveSelected = selectedId ? canEditDistributor : canCreateDistributor;

  return (
    <AdminShell
      breadcrumb={["Sales & CRM", "Distributor Management"]}
      headerRight={
        canCreateDistributor ? (
          <button
            type="button"
            onClick={startNew}
            className="px-4 py-2 rounded bg-light-primary text-light-on-primary text-label-md hover:bg-light-primary-container"
          >
            + Add Distributor
          </button>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 w-full min-w-0 overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-light-surface-container-low border-b border-light-outline-variant font-body text-label-md text-light-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Distributor</th>
                <th className="px-4 py-3">Territory</th>
                <th className="px-4 py-3">GSTIN</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-sm">
              {loading ? (
                <TableRowsSkeleton rows={5} cols={4} />
              ) : (
                distributors.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => selectRow(d)}
                    className={`cursor-pointer ${
                      selectedId === d.id ? "bg-light-secondary-container/25" : "hover:bg-light-surface-container-low/60"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{d.name}</p>
                      <p className="text-light-on-surface-variant">
                        {d.city}, {d.state}
                      </p>
                    </td>
                    <td className="px-4 py-3">{d.territory}</td>
                    <td className="px-4 py-3 font-mono text-mono-sm">{d.gstin}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-label-sm ${
                          d.status === "Active"
                            ? "bg-success-container text-on-success-container"
                            : "bg-warning-container text-on-warning-container"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <aside className="lg:col-span-5 min-w-0 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 sm:p-6 flex flex-col gap-4">
          <h2 className="font-headline text-title-lg text-light-on-surface">
            {selectedId ? "Edit Distributor Details" : "New Distributor Profile"}
          </h2>
          <label className="flex flex-col gap-1">
            <span className="text-label-md">Company Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded border border-light-outline-variant px-3 py-2 text-body-sm"
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-label-md">City</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 text-body-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">State</span>
              <input
                type="text"
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 text-body-sm"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Territory</span>
              <input
                type="text"
                value={territory}
                onChange={(e) => setTerritory(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 text-body-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 text-body-sm"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-label-md">GSTIN</span>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Phone</span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 text-body-sm"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-label-md">Warehouse Address</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded border border-light-outline-variant px-3 py-2 text-body-sm"
            />
          </label>
          <div className="bg-light-surface-container-low rounded p-3 text-body-sm flex justify-between">
            <span>
              Associated Dealers: <strong className="font-mono">{assocDealers}</strong>
            </span>
            <span>
              YTD Orders: <strong className="font-mono">{formatINRLakhs(ytdValue)}</strong>
            </span>
          </div>
          {canSaveSelected ? (
            <button
              type="button"
              onClick={saveProfile}
              className="py-2.5 rounded bg-light-primary text-light-on-primary text-label-md hover:bg-light-primary-container"
            >
              Save Distributor Profile
            </button>
          ) : (
            <p className="text-body-sm text-light-on-surface-variant border-t border-light-outline-variant pt-3">
              View-only access: distributor profile edits require edit permission.
            </p>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}
