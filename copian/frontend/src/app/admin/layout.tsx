import React from "react";
import { AdminAuthProvider } from "@/components/AdminAuthContext";

/**
 * Shared persistent layout for ERP routes so role permissions and notifications persist without flicker.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
