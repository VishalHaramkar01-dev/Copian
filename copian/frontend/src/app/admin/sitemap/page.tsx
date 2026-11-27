"use client";

import React from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthContext";

interface SitemapSection {
  href: string;
  icon: string;
  title: string;
  moduleKey: string | null;
  wide?: boolean;
  bullets?: string[];
  description?: string;
}

const ERP_SECTIONS: SitemapSection[] = [
  {
    href: "/admin",
    icon: "dashboard",
    title: "1. Overview",
    moduleKey: null,
    bullets: [
      "Dashboard KPIs & Trends",
      "Recent Inquiries & Orders",
      "Low Stock & Pending Quotes",
    ],
  },
  {
    href: "/admin/products",
    icon: "inventory_2",
    title: "2. Product Management",
    moduleKey: "Products & Categories",
    bullets: [
      "All Products (Bulk Actions)",
      "Add / Edit Product (6 Tabs)",
      "Categories, Brands, Compatibility",
    ],
  },
  {
    href: "/admin/inventory",
    icon: "warehouse",
    title: "3. Inventory Management",
    moduleKey: "Inventory & Stock Ledger",
    bullets: [
      "Overview & Warehouse Stock",
      "Stock Inward / Outward / Adjust",
      "Low Stock Alerts & Ledger",
    ],
  },
  {
    href: "/admin/inquiries",
    icon: "request_quote",
    title: "4. Sales & Channels",
    moduleKey: "Bulk Inquiries & Quotations",
    bullets: [
      "Customers & Distributors",
      "Bulk Inquiries → Quotations",
      "Orders & GST Invoices",
    ],
  },
  {
    href: "/admin/website-seo",
    icon: "language",
    title: "5. Website & SEO",
    moduleKey: "Website & SEO",
    bullets: [
      "Homepage Banners & Sections",
      "Blog & FAQ Management",
      "Meta, Schema & Redirects",
    ],
  },
  {
    href: "/admin/reports",
    icon: "analytics",
    title: "6. Reports & Analytics",
    moduleKey: "Reports & Analytics",
    bullets: [
      "Sales & Order Valuation",
      "Inventory Movement & Aging",
      "Customer & Inquiry Conversion",
    ],
  },
  {
    href: "/admin/roles",
    icon: "admin_panel_settings",
    title: "7. System Administration",
    moduleKey: "Roles & Permissions",
    wide: true,
    description:
      "Role-Based Access Control (Super Admin, Inventory Manager, Sales Manager, Sales Executive, Order Manager, Content Manager), Granular Permission Matrix, Admin Users, and Audit Activity Logs.",
  },
];

export default function AdminSitemapPage() {
  const { authReady, canViewModule } = useAdminAuth();

  return (
    <AdminShell breadcrumb={["System Administration", "ERP Sitemap & Architecture"]}>
      <header className="border-b border-light-outline-variant pb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="font-mono text-mono-sm text-light-primary uppercase tracking-wider">
            Enterprise ERP Architecture · Copian Admin
          </span>
          <h1 className="font-headline text-headline-lg text-light-on-surface mt-1">
            Admin Dashboard Sitemap &amp; Navigation Hierarchy
          </h1>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-light-secondary-container text-light-on-secondary-container font-body text-label-md">
          7 Module Groups · 11 Connected Workspaces
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {ERP_SECTIONS.map((sec) => {
          const allowed = !authReady || !sec.moduleKey || canViewModule(sec.moduleKey);
          const spanCls = sec.wide ? "md:col-span-2" : "";
          const inner = (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className={`flex items-center gap-2 ${allowed ? "text-light-primary" : "text-light-on-surface-variant"}`}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {sec.icon}
                  </span>
                  <h2 className="font-headline text-title-md text-light-on-surface">{sec.title}</h2>
                </div>
                {!allowed && (
                  <span className="px-2 py-0.5 rounded bg-light-surface-container-high font-mono text-[10px] text-light-on-surface-variant">
                    Restricted
                  </span>
                )}
              </div>
              {sec.bullets && (
                <ul className="text-body-sm text-light-on-surface-variant space-y-1.5">
                  {sec.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
              {sec.description && <p className="text-body-sm text-light-on-surface-variant">{sec.description}</p>}
            </>
          );

          if (!allowed) {
            return (
              <div
                key={sec.href}
                aria-disabled="true"
                className={`bg-light-surface-container-low border border-light-outline-variant/60 rounded-md p-5 flex flex-col gap-3 opacity-65 cursor-not-allowed ${spanCls}`}
              >
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={sec.href}
              href={sec.href}
              className={`bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col gap-3 hover:border-light-primary ${spanCls}`}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </AdminShell>
  );
}
