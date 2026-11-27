"use client";

import React, { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthContext";
import { useCart } from "@/components/CartContext";
import { Skeleton, TableRowsSkeleton } from "@/components/Skeleton";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { adminApi } from "@/services/adminApi";

interface RoleItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  permissions: Record<string, Record<string, boolean>>;
}

interface AdminUserRow {
  id: number;
  name: string;
  initials: string;
  email: string;
  role_id: number;
  role_name: string;
  is_active: boolean;
}

const PERM_COLS = ["view", "create", "edit", "delete", "approve", "export"];

export default function AdminRolesPage() {
  const { canAction } = useAdminAuth();
  const { showToast } = useCart();
  const canEditRoles = canAction("Roles & Permissions", "edit");
  const canCreateUsers = canAction("Roles & Permissions", "create");
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRoleId, setNewRoleId] = useState<number>(1);

  const load = async () => {
    try {
      const res = await apiFetch<{ roles: RoleItem[]; users: AdminUserRow[] }>("/api/roles");
      setRoles(res.roles);
      setUsers(res.users);
      if (res.roles.length > 0) {
        const target = activeRoleId ? res.roles.find((r) => r.id === activeRoleId) : res.roles[0];
        if (target) {
          setActiveRoleId(target.id);
          setMatrix(target.permissions || {});
        }
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

  const selectRole = (r: RoleItem) => {
    setActiveRoleId(r.id);
    setMatrix(r.permissions || {});
  };

  const togglePerm = (moduleName: string, col: string) => {
    setMatrix((prev) => ({
      ...prev,
      [moduleName]: {
        ...(prev[moduleName] || {}),
        [col]: !prev[moduleName]?.[col],
      },
    }));
  };

  const saveMatrix = async () => {
    if (!activeRoleId) return;
    try {
      await apiFetch(`/api/roles/${activeRoleId}`, {
        method: "PUT",
        body: JSON.stringify({ permissions: matrix }),
      });
      await load();
      showToast("Role permission matrix saved to PostgreSQL.");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to save role permissions."));
    }
  };

  return (
    <AdminShell
      breadcrumb={["System Administration", "Roles & Permissions"]}
      headerRight={
        canEditRoles ? (
          <button
            type="button"
            onClick={saveMatrix}
            className="px-4 py-2 rounded bg-light-primary text-light-on-primary text-label-md hover:bg-light-primary-container"
          >
            Save Role Matrix
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-28" />)
        ) : (
          roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => selectRole(r)}
              className={`px-3.5 py-2 rounded text-label-md transition-colors ${
                activeRoleId === r.id
                  ? "bg-light-primary text-light-on-primary"
                  : "border border-light-outline-variant bg-light-surface-container-lowest hover:bg-light-surface-container-low"
              }`}
            >
              {r.name}
            </button>
          ))
        )}
      </div>

      <div className="overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-light-surface-container-low border-b border-light-outline-variant font-body text-label-md text-light-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Module</th>
              {PERM_COLS.map((c) => (
                <th key={c} className="px-4 py-3 text-center capitalize">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-sm">
            {loading ? (
              <TableRowsSkeleton rows={6} cols={7} />
            ) : (
              Object.keys(matrix).map((mod) => (
                <tr key={mod} className="hover:bg-light-surface-container-low/40">
                  <td className="px-4 py-3 font-medium">{mod}</td>
                  {PERM_COLS.map((c) => (
                    <td key={c} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        disabled={!canEditRoles}
                        checked={Boolean(matrix[mod]?.[c])}
                        onChange={() => togglePerm(mod, c)}
                        className="rounded text-light-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col gap-5">
        <h2 className="font-headline text-title-md">Admin Users &amp; Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading && users.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 rounded border border-light-outline-variant flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-14 rounded shrink-0" />
                </div>
              ))
            : users.map((u) => (
            <div key={u.id} className="p-3 rounded border border-light-outline-variant flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-light-primary text-white flex items-center justify-center font-mono text-mono-sm shrink-0">
                  {u.initials}
                </div>
                <div className="min-w-0">
                  <p className="font-body text-label-md truncate">{u.name}</p>
                  <p className="font-mono text-mono-sm text-light-on-surface-variant truncate">{u.role_name}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={!canEditRoles}
                onClick={async () => {
                  try {
                    await adminApi.updateAdminUser(u.id, { is_active: !u.is_active });
                    await load();
                    showToast(`${u.name} ${u.is_active ? "disabled" : "enabled"}.`);
                  } catch (err) {
                    showToast(getErrorMessage(err, "Failed to toggle user access."));
                  }
                }}
                className={`px-2 py-0.5 rounded text-[11px] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                  u.is_active ? "bg-success-container text-on-success-container" : "bg-light-error-container text-light-on-error-container"
                }`}
              >
                {u.is_active ? "Active" : "Disabled"}
              </button>
            </div>
          ))}
        </div>

        {canCreateUsers && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newName.trim() || !newEmail.trim() || !newPass) return;
              try {
                await adminApi.createAdminUser({
                  name: newName.trim(),
                  email: newEmail.trim(),
                  password: newPass,
                  role_id: newRoleId || roles[0]?.id || 1,
                });
                setNewName("");
                setNewEmail("");
                setNewPass("");
                await load();
                showToast("Admin account created.");
              } catch (err) {
                showToast(err instanceof Error ? err.message : "Failed to create admin user");
              }
            }}
            className="pt-4 border-t border-light-outline-variant grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            <input
              type="text"
              required
              placeholder="Full Name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded border border-light-outline-variant px-3 py-2 text-body-sm min-w-0"
            />
            <input
              type="email"
              required
              placeholder="Email *"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="rounded border border-light-outline-variant px-3 py-2 text-body-sm min-w-0"
            />
            <input
              type="password"
              required
              placeholder="Password *"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="rounded border border-light-outline-variant px-3 py-2 text-body-sm min-w-0"
            />
            <select
              value={newRoleId}
              onChange={(e) => setNewRoleId(Number(e.target.value))}
              className="rounded border border-light-outline-variant px-3 py-2 text-body-sm min-w-0"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-light-primary text-light-on-primary text-label-md hover:bg-light-primary-container"
            >
              + Add User
            </button>
          </form>
        )}
      </div>
    </AdminShell>
  );
}
