"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { resolveModuleForPath, useAdminAuth } from "@/components/AdminAuthContext";
import CopianLogo from "@/components/CopianLogo";
import { ErrorFallbackCard } from "@/components/ErrorBoundary";
import { apiFetch } from "@/lib/api";

interface AdminShellProps {
  children: React.ReactNode;
  breadcrumb: string[];
  headerRight?: React.ReactNode;
  showSearch?: boolean;
  showNewQuotationBtn?: boolean;
  requiredModule?: string;
}

export default function AdminShell({
  children,
  breadcrumb,
  headerRight,
  showSearch = false,
  showNewQuotationBtn = false,
  requiredModule,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminUser, authReady, unreadInquiries, alerts, canViewModule, switchDemoUser, signOut } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchRes, setSearchRes] = useState<{
    products: { sku: string; name: string }[];
    inquiries: { id: number; code: string; company: string }[];
    orders: { id: number; code: string; customer: string }[];
  } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSidebarOpen(false);
    setProfileMenuOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.tagName !== "SELECT"
      ) {
        if (searchInputRef.current) {
          e.preventDefault();
          searchInputRef.current.focus();
        }
      }
      if (e.key === "Escape") {
        setSearchRes(null);
        setProfileMenuOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const q = searchQ.trim();
    if (!q) {
      setSearchRes(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch<typeof searchRes>(`/api/search?q=${encodeURIComponent(q)}`);
        setSearchRes(res);
      } catch {
        setSearchRes(null);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQ]);

  const activeRequiredModule = requiredModule ?? resolveModuleForPath(pathname);
  const accessBlocked = Boolean(authReady && activeRequiredModule && !canViewModule(activeRequiredModule));

  const navLinkClass = (active: boolean) =>
    active
      ? "flex items-center gap-2.5 px-3 py-2 rounded bg-dark-primary-container text-dark-on-primary-container font-medium border-l-2 border-dark-primary"
      : "flex items-center gap-2.5 px-3 py-2 rounded text-dark-on-surface-variant hover:bg-dark-surface-container-high hover:text-dark-on-surface transition-colors";

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="p-4 flex flex-col gap-6">
        <Link href="/admin" prefetch={false} className="flex items-center justify-between px-2 py-1.5 border-b border-dark-outline-variant/60 pb-4">
          <div className="flex flex-col gap-1">
            <CopianLogo variant="white" className="h-5 w-24" />
            <span className="font-mono text-[11px] text-dark-outline">ERP Admin Workspace</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-dark-surface-container-high font-mono text-[10px] text-dark-primary">v1.0</span>
        </Link>

        <nav aria-label="Admin Sidebar" className="flex flex-col gap-5 text-body-sm">
          {!authReady ? (
            <div className="flex flex-col gap-3 px-2 pt-2 animate-pulse" aria-busy="true">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-8 rounded bg-dark-surface-container-high/80" />
              ))}
            </div>
          ) : (
          <>
          <div>
            <span className="px-3 font-mono text-[10px] text-dark-outline uppercase tracking-wider">Overview</span>
            <div className="mt-1.5 flex flex-col gap-1">
              <Link href="/admin" prefetch={false} className={navLinkClass(pathname === "/admin")}>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">dashboard</span>
                <span>Dashboard</span>
              </Link>
            </div>
          </div>

          {(canViewModule("Products & Categories") || canViewModule("Inventory & Stock Ledger")) && (
            <div>
              <span className="px-3 font-mono text-[10px] text-dark-outline uppercase tracking-wider">Catalog &amp; Stock</span>
              <div className="mt-1.5 flex flex-col gap-1">
                {canViewModule("Products & Categories") && (
                  <Link href="/admin/products" prefetch={false} className={navLinkClass(pathname.startsWith("/admin/products"))}>
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">inventory_2</span>
                    <span>Product Management</span>
                  </Link>
                )}
                {canViewModule("Inventory & Stock Ledger") && (
                  <Link href="/admin/inventory" prefetch={false} className={navLinkClass(pathname.startsWith("/admin/inventory"))}>
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">warehouse</span>
                    <span>Inventory &amp; Stock</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {(canViewModule("Customers & Distributors") ||
            canViewModule("Bulk Inquiries & Quotations") ||
            canViewModule("Orders & GST Invoices")) && (
            <div>
              <span className="px-3 font-mono text-[10px] text-dark-outline uppercase tracking-wider">Sales &amp; CRM</span>
              <div className="mt-1.5 flex flex-col gap-1">
                {canViewModule("Customers & Distributors") && (
                  <>
                    <Link href="/admin/customers" prefetch={false} className={navLinkClass(pathname.startsWith("/admin/customers"))}>
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">groups</span>
                      <span>Customers</span>
                    </Link>
                    <Link href="/admin/distributors" prefetch={false} className={navLinkClass(pathname.startsWith("/admin/distributors"))}>
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">hub</span>
                      <span>Distributors</span>
                    </Link>
                  </>
                )}
                {canViewModule("Bulk Inquiries & Quotations") && (
                  <>
                    <Link
                      href="/admin/inquiries"
                      prefetch={false}
                      className={`flex items-center justify-between px-3 py-2 rounded ${
                        pathname.startsWith("/admin/inquiries")
                          ? "bg-dark-primary-container text-dark-on-primary-container font-medium border-l-2 border-dark-primary"
                          : "text-dark-on-surface-variant hover:bg-dark-surface-container-high hover:text-dark-on-surface"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">inbox</span>
                        <span>Bulk Inquiries</span>
                      </span>
                      {unreadInquiries !== null && (
                        <span className="px-1.5 py-0.5 rounded-full bg-dark-primary text-dark-on-primary font-mono text-mono-sm tabular-nums">
                          {unreadInquiries}
                        </span>
                      )}
                    </Link>
                    <Link href="/admin/quotations" prefetch={false} className={navLinkClass(pathname.startsWith("/admin/quotations"))}>
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">request_quote</span>
                      <span>Quotations</span>
                    </Link>
                  </>
                )}
                {canViewModule("Orders & GST Invoices") && (
                  <Link href="/admin/orders" prefetch={false} className={navLinkClass(pathname.startsWith("/admin/orders"))}>
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">local_shipping</span>
                    <span>Orders &amp; Invoices</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          <div>
            <span className="px-3 font-mono text-[10px] text-dark-outline uppercase tracking-wider">Web, Reports &amp; System</span>
            <div className="mt-1.5 flex flex-col gap-1">
              {canViewModule("Website & SEO") && (
                <Link href="/admin/website-seo" prefetch={false} className={navLinkClass(pathname.startsWith("/admin/website-seo"))}>
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">language</span>
                  <span>Website &amp; SEO</span>
                </Link>
              )}
              {canViewModule("Reports & Analytics") && (
                <Link href="/admin/reports" prefetch={false} className={navLinkClass(pathname.startsWith("/admin/reports"))}>
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">analytics</span>
                  <span>Reports &amp; Analytics</span>
                </Link>
              )}
              {canViewModule("Roles & Permissions") && (
                <Link href="/admin/roles" prefetch={false} className={navLinkClass(pathname.startsWith("/admin/roles"))}>
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">admin_panel_settings</span>
                  <span>Roles &amp; Permissions</span>
                </Link>
              )}
              <Link href="/admin/sitemap" prefetch={false} className={navLinkClass(pathname.startsWith("/admin/sitemap"))}>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">account_tree</span>
                <span>ERP Sitemap</span>
              </Link>
            </div>
          </div>
          </>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-dark-outline-variant">
        <Link
          href="/"
          prefetch={false}
          className="flex items-center justify-between px-3 py-2 rounded text-body-sm text-dark-on-surface-variant hover:bg-dark-surface-container-high hover:text-white"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">open_in_new</span>
            <span>Public Storefront</span>
          </span>
          <span className="font-mono text-[10px] text-dark-outline">copian.in</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-light-surface">
      <aside className="w-64 shrink-0 bg-dark-surface-container-low text-dark-on-surface border-r border-dark-outline-variant min-h-screen hidden lg:flex flex-col no-print">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSidebarOpen(false);
          }}
          className="fixed inset-0 z-50 bg-light-scrim/40 backdrop-blur-[1px] lg:hidden no-print animate-fade-in"
        >
          <aside className="w-64 bg-dark-surface-container-low text-dark-on-surface min-h-screen flex flex-col relative shadow-xl animate-drawer-in-left">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="absolute top-3 right-3 p-1.5 rounded text-dark-on-surface-variant hover:bg-dark-surface-container-high"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 min-h-16 py-2 bg-light-surface-container-lowest/95 backdrop-blur-sm border-b border-light-outline-variant px-4 md:px-6 flex flex-wrap items-center justify-between gap-2 md:gap-4 no-print">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle sidebar"
              className="lg:hidden p-2 rounded border border-light-outline-variant text-light-on-surface shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">menu</span>
            </button>
            <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 font-body text-body-sm text-light-on-surface-variant min-w-0">
              {breadcrumb.map((b, idx) => (
                <React.Fragment key={b}>
                  {idx > 0 && <span className="text-light-outline">/</span>}
                  <span className={idx === breadcrumb.length - 1 ? "font-semibold text-light-on-surface" : ""}>
                    {b}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {showSearch && (
            <div className="hidden md:block flex-1 max-w-md relative">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-light-outline text-[18px]" aria-hidden="true">
                  search
                </span>
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search SKUs, inquiries (INQ-), orders (ORD-)..."
                  className="w-full rounded border border-light-outline-variant bg-light-surface-container-low pl-10 pr-10 py-1.5 font-body text-body-sm focus:bg-light-surface-container-lowest focus:border-light-primary"
                />
                {!searchQ && (
                  <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[11px] font-mono text-light-outline border border-light-outline-variant rounded bg-white">
                    /
                  </kbd>
                )}
              </div>
              {searchRes && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-light-surface-container-lowest border border-light-outline-variant rounded-md shadow-xl z-50 p-2 text-body-sm animate-megamenu-in">
                  {searchRes.products.map((p) => (
                    <button
                      key={p.sku}
                      type="button"
                      onClick={() => {
                        setSearchQ("");
                        router.push("/admin/products");
                      }}
                      className="w-full text-left px-3 py-1.5 rounded hover:bg-light-surface-container-low flex justify-between"
                    >
                      <span>{p.name}</span>
                      <span className="font-mono text-mono-sm text-light-primary">{p.sku}</span>
                    </button>
                  ))}
                  {searchRes.inquiries.map((i) => (
                    <button
                      key={i.code}
                      type="button"
                      onClick={() => {
                        setSearchQ("");
                        router.push("/admin/inquiries");
                      }}
                      className="w-full text-left px-3 py-1.5 rounded hover:bg-light-surface-container-low flex justify-between"
                    >
                      <span>{i.company}</span>
                      <span className="font-mono text-mono-sm text-light-primary">{i.code}</span>
                    </button>
                  ))}
                  {searchRes.orders.map((o) => (
                    <button
                      key={o.code}
                      type="button"
                      onClick={() => {
                        setSearchQ("");
                        router.push("/admin/orders");
                      }}
                      className="w-full text-left px-3 py-1.5 rounded hover:bg-light-surface-container-low flex justify-between"
                    >
                      <span>{o.customer}</span>
                      <span className="font-mono text-mono-sm text-light-primary">{o.code}</span>
                    </button>
                  ))}
                  {searchRes.products.length === 0 &&
                    searchRes.inquiries.length === 0 &&
                    searchRes.orders.length === 0 && (
                      <p className="px-3 py-2 text-light-on-surface-variant">No matches found.</p>
                    )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center flex-wrap gap-2 sm:gap-3 min-w-0 max-w-full">
            {headerRight}

            {showNewQuotationBtn && (
              <Link
                href="/admin/quotations"
                prefetch={false}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-light-primary text-light-on-primary font-body text-label-md hover:bg-light-primary-container"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
                <span>New Quotation</span>
              </Link>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                className="relative p-2 rounded border border-light-outline-variant text-light-on-surface hover:bg-light-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">notifications</span>
                {(alerts.length > 0 || (unreadInquiries ?? 0) > 0) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-light-error" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-light-surface-container-lowest border border-light-outline-variant rounded-md shadow-xl p-3 z-50 text-body-sm animate-megamenu-in">
                  <p className="font-headline text-title-md mb-2">Operations Alerts</p>
                  <div className="space-y-2">
                    <Link
                      href="/admin/inquiries"
                      prefetch={false}
                      className="block p-2 rounded bg-light-surface-container-low hover:bg-light-surface-container"
                    >
                      <span className="font-medium">{unreadInquiries ?? 0} New Bulk Inquiries</span> awaiting review
                    </Link>
                    {alerts.slice(0, 3).map((a) => (
                      <Link
                        key={a.sku}
                        href="/admin/inventory"
                        prefetch={false}
                        className="flex items-center justify-between gap-2 p-2 rounded bg-warning-container/40 hover:bg-warning-container/60"
                      >
                        <span className="font-mono text-mono-sm text-light-primary truncate">{a.sku}</span>
                        <span className="whitespace-nowrap shrink-0">{a.available_qty} left</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative pl-2 border-l border-light-outline-variant">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-light-primary text-light-on-primary flex items-center justify-center font-mono text-mono-sm">
                  {authReady ? adminUser.initials : "·"}
                </div>
                <div className="hidden md:block">
                  {authReady ? (
                    <>
                      <p className="font-body text-label-md text-light-on-surface leading-tight">{adminUser.name}</p>
                      <p className="font-body text-label-sm text-light-on-surface-variant leading-tight">{adminUser.role}</p>
                    </>
                  ) : (
                    <div className="space-y-1 animate-pulse">
                      <div className="h-3.5 w-20 rounded bg-light-surface-container-high" />
                      <div className="h-3 w-16 rounded bg-light-surface-container" />
                    </div>
                  )}
                </div>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-light-surface-container-lowest border border-light-outline-variant rounded-md shadow-xl p-2 z-50 text-body-sm animate-megamenu-in">
                  <p className="px-2 py-1 font-mono text-mono-sm text-light-on-surface-variant">Switch ERP Role</p>
                  <button type="button" onClick={() => { switchDemoUser("arjun@copian.in", pathname); setProfileMenuOpen(false); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-light-surface-container-low">Arjun Mehta (Super Admin)</button>
                  <button type="button" onClick={() => { switchDemoUser("sharma@copian.in", pathname); setProfileMenuOpen(false); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-light-surface-container-low">R. Sharma (Inventory Manager)</button>
                  <button type="button" onClick={() => { switchDemoUser("rohan@copian.in", pathname); setProfileMenuOpen(false); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-light-surface-container-low">Rohan Deshmukh (Sales Manager)</button>
                  <div className="border-t border-light-outline-variant mt-1 pt-1">
                    <Link
                      href="/admin/login"
                      prefetch={false}
                      onClick={() => signOut()}
                      className="block px-2 py-1.5 rounded text-light-error hover:bg-light-error-container/40"
                    >
                      Sign Out / Login Screen
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main key={pathname} className="flex-1 p-4 md:p-6 max-w-[1440px] w-full min-w-0 mx-auto flex flex-col gap-6 animate-surface-in">
          {accessBlocked ? (
            <ErrorFallbackCard
              title="Access Restricted for Your Role"
              description={`Your current ERP role (${adminUser.role}) does not include permission for ${activeRequiredModule}.`}
              homeHref="/admin"
              homeLabel="Back to Dashboard"
            />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
