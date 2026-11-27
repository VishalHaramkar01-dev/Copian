"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/components/CartContext";
import { useCms } from "@/components/CmsContext";
import CopianLogo from "@/components/CopianLogo";
import { usePwaInstall } from "@/components/PwaInstallProvider";
import { apiFetch, formatINR, Product } from "@/lib/api";

interface StorefrontShellProps {
  children: React.ReactNode;
  showUtilityBar?: boolean;
  showSearchInHeader?: boolean;
  fullFooter?: boolean;
}

export default function StorefrontShell({
  children,
  showUtilityBar = false,
  showSearchInHeader = false,
  fullFooter = false,
}: StorefrontShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const { contact, metrics } = useCms();
  const { isStandalone, promptInstall } = usePwaInstall();
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
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
        setSearchOpen(false);
        setMegaOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClickOutside);
    const onScroll = () => setShowScrollTop(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchMatches([]);
      setSearchOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch<Product[]>(`/api/products?q=${encodeURIComponent(q)}&status=Published`);
        setSearchMatches(res.slice(0, 6));
        setSearchOpen(true);
      } catch {
        setSearchMatches([]);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isProducts =
    pathname.startsWith("/products") ||
    pathname.startsWith("/category") ||
    pathname.startsWith("/product");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMatches.length > 0) {
      router.push(`/product/${searchMatches[0].sku}`);
    } else if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {showUtilityBar && (
        <div className="bg-light-surface-container-low border-b border-light-outline-variant/80 hidden lg:block">
          <div className="max-w-[1280px] mx-auto px-4 xl:px-6 py-1.5 flex items-center justify-between gap-4 text-[12px] text-light-on-surface-variant whitespace-nowrap">
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="inline-flex items-center gap-1.5 font-medium text-light-on-surface">
                <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                <span>{`Trusted Since ${contact.established_year} · ${metrics[1]?.value || "5k+"} ${metrics[1]?.label || "Businesses Served"}`}</span>
              </span>
              <span className="hidden xl:inline text-light-outline-variant">|</span>
              <span className="hidden xl:inline">{`${metrics[2]?.value || "98%"} Retention · HSN 8443`}</span>
            </div>
            <div className="flex items-center gap-3.5 xl:gap-5 shrink-0">
              <Link href="/compatibility" prefetch={false} className="hover:text-light-primary transition-colors">
                Compatibility
              </Link>
              <Link href="/track-order" prefetch={false} className="hover:text-light-primary transition-colors">
                Track Order
              </Link>
              <Link href="/account" prefetch={false} className="hover:text-light-primary transition-colors">
                Buyer Portal
              </Link>
              <Link href="/distributors" prefetch={false} className="hidden xl:inline hover:text-light-primary transition-colors">
                Distributors
              </Link>
              <Link
                href="/admin"
                prefetch={false}
                className="inline-flex items-center gap-1 font-medium text-light-primary hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                ERP Portal
              </Link>
              {!isStandalone && (
                <button
                  type="button"
                  onClick={promptInstall}
                  className="inline-flex items-center gap-1 font-medium text-light-primary hover:underline"
                >
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">download_for_offline</span>
                  Install App
                </button>
              )}
              <span className="font-mono text-mono-sm text-light-on-surface tabular-nums">
                {contact.phone_primary}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Main Header */}
      <header className="sticky top-0 z-40 bg-light-surface-container-lowest/95 backdrop-blur-sm border-b border-light-outline-variant">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-2 xl:gap-4">
          <div className="flex items-center gap-3 xl:gap-5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded border border-light-outline-variant text-light-on-surface hover:bg-light-surface-container-low shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">menu</span>
            </button>

            <Link href="/" className="flex items-center gap-2 shrink-0">
              <CopianLogo variant="cobalt" className="h-7 w-[104px]" />
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded border border-light-primary/20 bg-light-secondary-container/40 font-mono text-[10px] font-semibold tracking-wider text-light-primary uppercase">
                B2B
              </span>
            </Link>

            <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-0.5 whitespace-nowrap">
              {showUtilityBar ? (
                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={megaOpen}
                    onClick={() => setMegaOpen((v) => !v)}
                    className={`inline-flex items-center gap-1 px-2.5 xl:px-3 py-2 rounded font-body text-label-md xl:text-label-lg transition-colors duration-state-change whitespace-nowrap ${
                      megaOpen || isProducts
                        ? "text-light-primary bg-light-surface-container-low"
                        : "text-light-on-surface hover:bg-light-surface-container-low"
                    }`}
                  >
                    <span>Products</span>
                    <span
                      className={`material-symbols-outlined text-[18px] transition-transform duration-150 ${
                        megaOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    >
                      expand_more
                    </span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/products"
                  className={`px-2.5 xl:px-3 py-2 rounded font-body text-label-md xl:text-label-lg transition-colors duration-state-change whitespace-nowrap ${
                    isProducts
                      ? "text-light-primary bg-light-surface-container-low"
                      : "text-light-on-surface-variant hover:text-light-on-surface hover:bg-light-surface-container-low"
                  }`}
                >
                  Products
                </Link>
              )}

              <Link
                href="/compatibility"
                className={`px-2.5 xl:px-3 py-2 rounded font-body text-label-md xl:text-label-lg transition-colors duration-state-change whitespace-nowrap ${
                  pathname.startsWith("/compatibility")
                    ? "text-light-primary bg-light-surface-container-low"
                    : "text-light-on-surface-variant hover:text-light-on-surface hover:bg-light-surface-container-low"
                }`}
              >
                Compatibility
              </Link>
              <Link
                href="/distributors"
                className={`px-2.5 xl:px-3 py-2 rounded font-body text-label-md xl:text-label-lg transition-colors duration-state-change whitespace-nowrap ${
                  pathname.startsWith("/distributors")
                    ? "text-light-primary bg-light-surface-container-low"
                    : "text-light-on-surface-variant hover:text-light-on-surface hover:bg-light-surface-container-low"
                }`}
              >
                Distributors
              </Link>
              <Link
                href="/about"
                className={`px-2.5 xl:px-3 py-2 rounded font-body text-label-md xl:text-label-lg transition-colors duration-state-change whitespace-nowrap ${
                  pathname.startsWith("/about")
                    ? "text-light-primary bg-light-surface-container-low"
                    : "text-light-on-surface-variant hover:text-light-on-surface hover:bg-light-surface-container-low"
                }`}
              >
                About Us
              </Link>
              <Link
                href="/resources"
                className={`px-2.5 xl:px-3 py-2 rounded font-body text-label-md xl:text-label-lg transition-colors duration-state-change whitespace-nowrap ${
                  pathname.startsWith("/resources")
                    ? "text-light-primary bg-light-surface-container-low"
                    : "text-light-on-surface-variant hover:text-light-on-surface hover:bg-light-surface-container-low"
                }`}
              >
                Resources
              </Link>
              <Link
                href="/contact"
                className={`px-2.5 xl:px-3 py-2 rounded font-body text-label-md xl:text-label-lg transition-colors duration-state-change whitespace-nowrap ${
                  pathname.startsWith("/contact")
                    ? "text-light-primary bg-light-surface-container-low"
                    : "text-light-on-surface-variant hover:text-light-on-surface hover:bg-light-surface-container-low"
                }`}
              >
                Contact
              </Link>
            </nav>
          </div>

          {showSearchInHeader && (
            <div ref={searchRef} className="hidden xl:block relative flex-1 max-w-[290px]">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-light-outline text-[18px]" aria-hidden="true">
                  search
                </span>
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setSearchOpen(true)}
                  placeholder="Search SKU, OEM code, printer..."
                  autoComplete="off"
                  className="w-full rounded border border-light-outline-variant bg-light-surface-container-low pl-9 pr-9 py-2 font-body text-body-sm text-light-on-surface placeholder:text-light-outline focus:bg-light-surface-container-lowest focus:border-light-primary focus:ring-1 focus:ring-light-primary"
                />
                {!searchQuery && (
                  <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[11px] font-mono text-light-outline border border-light-outline-variant rounded bg-white">
                    /
                  </kbd>
                )}
              </form>
              {searchOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-light-surface-container-lowest border border-light-outline-variant rounded-md shadow-xl z-50 overflow-hidden animate-megamenu-in">
                  <div className="px-3 py-2 bg-light-surface-container-low border-b border-light-outline-variant flex items-center justify-between">
                    <span className="font-body text-label-md text-light-on-surface-variant">
                      Matching SKUs ({searchMatches.length})
                    </span>
                    <Link href="/products" className="font-body text-label-md text-light-primary hover:underline">
                      Browse catalogue →
                    </Link>
                  </div>
                  <div className="divide-y divide-light-outline-variant/60">
                    {searchMatches.length > 0 ? (
                      searchMatches.map((m) => (
                        <Link
                          key={m.sku}
                          href={`/product/${m.sku}`}
                          className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-light-surface-container-low"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={m.image_url}
                              alt={m.name}
                              className="w-9 h-9 rounded object-contain bg-white border border-light-outline-variant/60 p-0.5 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-body text-label-md text-light-on-surface truncate">{m.name}</p>
                              <p className="font-body text-body-sm text-light-on-surface-variant truncate">
                                {m.compatible_printers_text}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono text-mono-sm text-light-primary block">{m.sku}</span>
                            <span className="font-mono text-[11px] text-light-on-surface-variant">
                              {formatINR(m.dealer_price)}/u
                            </span>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-3 font-body text-body-sm text-light-on-surface-variant">
                        No matching SKUs found. Try 88A, 26A, or OPC.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inquiry Cart Action */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/inquiry-cart"
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container transition-colors duration-state-change shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                inventory_2
              </span>
              <span className="hidden sm:inline">Inquiry Cart</span>
              <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-light-surface-container-lowest text-light-primary font-mono text-mono-sm tabular-nums">
                {count}
              </span>
            </Link>
          </div>
        </div>

        {/* Mega Menu Panel */}
        {megaOpen && (
          <div className="border-t border-light-outline-variant bg-light-surface-container-lowest shadow-xl animate-megamenu-in">
            <div className="max-w-[1280px] mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-mono-sm text-light-primary uppercase px-2.5">Laser &amp; Imaging</span>
                <Link
                  href="/category/toner-cartridges"
                  prefetch={false}
                  className="flex items-center justify-between p-2.5 rounded hover:bg-light-surface-container-low group"
                >
                  <div className="flex items-center gap-3">
                    <img src="/images/toner-cartridge.png" alt="" className="w-10 h-10 object-contain rounded bg-light-surface-container-low p-1" />
                    <div>
                      <p className="font-body text-label-lg text-light-on-surface group-hover:text-light-primary">
                        Compatible Toner Cartridges
                      </p>
                      <p className="font-body text-body-sm text-light-on-surface-variant">
                        HP, Canon, Brother, Ricoh, Kyocera
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-light-outline text-[18px]" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
                <Link
                  href="/category/toner-powder"
                  prefetch={false}
                  className="flex items-center justify-between p-2.5 rounded hover:bg-light-surface-container-low group"
                >
                  <div className="flex items-center gap-3">
                    <img src="/images/copian-banner-2.png" alt="" className="w-10 h-10 object-contain rounded bg-light-surface-container-low p-1" />
                    <div>
                      <p className="font-body text-label-lg text-light-on-surface group-hover:text-light-primary">
                        Toner Powder (Bulk Packs)
                      </p>
                      <p className="font-body text-body-sm text-light-on-surface-variant">
                        500g, 1kg, and 10kg industrial pouches
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-light-outline text-[18px]" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-mono text-mono-sm text-light-primary uppercase px-2.5">Drums, Ink &amp; Parts</span>
                <Link
                  href="/category/opc-drums"
                  prefetch={false}
                  className="flex items-center justify-between p-2.5 rounded hover:bg-light-surface-container-low group"
                >
                  <div className="flex items-center gap-3">
                    <img src="/images/toner-img-2.png" alt="" className="w-10 h-10 object-contain rounded bg-light-surface-container-low p-1" />
                    <div>
                      <p className="font-body text-label-lg text-light-on-surface group-hover:text-light-primary">
                        OPC Drums &amp; Drum Units
                      </p>
                      <p className="font-body text-body-sm text-light-on-surface-variant">
                        High-longevity organic photoconductor drums
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-light-outline text-[18px]" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
                <Link
                  href="/category/inkjet-ink"
                  prefetch={false}
                  className="flex items-center justify-between p-2.5 rounded hover:bg-light-surface-container-low group"
                >
                  <div className="flex items-center gap-3">
                    <img src="/images/copian-banner-5.png" alt="" className="w-10 h-10 object-contain rounded bg-light-surface-container-low p-1" />
                    <div>
                      <p className="font-body text-label-lg text-light-on-surface group-hover:text-light-primary">
                        Inkjet Ink &amp; Printer Components
                      </p>
                      <p className="font-body text-body-sm text-light-on-surface-variant">
                        Dye/pigment inks, fuser rollers, pickup gears
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-light-outline text-[18px]" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
              </div>
              <div className="bg-light-surface-container-low border border-light-outline-variant/60 rounded-md p-5 flex flex-col justify-between gap-4">
                <div>
                  <span className="font-mono text-mono-sm text-light-primary uppercase">Fleet Lookup</span>
                  <p className="font-headline text-title-md text-light-on-surface mt-1">
                    Not sure which SKU fits your fleet?
                  </p>
                  <p className="font-body text-body-sm text-light-on-surface-variant mt-1">
                    Match your printer manufacturer and model in seconds with verified OEM cross-references.
                  </p>
                </div>
                <Link
                  href="/compatibility"
                  prefetch={false}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container"
                >
                  <span>Open Compatibility Finder</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileOpen(false);
          }}
          className="fixed inset-0 z-50 bg-light-scrim/40 backdrop-blur-[1px] lg:hidden animate-fade-in"
        >
          <div className="w-80 max-w-full min-h-screen bg-light-surface-container-lowest p-6 flex flex-col gap-6 border-r border-light-outline-variant shadow-xl animate-drawer-in-left">
            <div className="flex items-center justify-between">
              <CopianLogo variant="cobalt" className="h-6 w-24" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="w-9 h-9 rounded border border-light-outline-variant flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  setMobileOpen(false);
                  router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="relative flex items-center"
            >
              <span className="material-symbols-outlined absolute left-3 text-light-outline text-[18px]" aria-hidden="true">
                search
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU or printer model..."
                className="w-full rounded border border-light-outline-variant bg-light-surface-container-low pl-10 pr-3 py-2 font-body text-body-md text-light-on-surface"
              />
            </form>
            <nav className="flex flex-col gap-1.5">
              <Link href="/products" prefetch={false} className="px-3 py-2.5 rounded font-body text-label-lg text-light-on-surface hover:bg-light-surface-container-low">Product Catalogue</Link>
              <Link href="/compatibility" prefetch={false} className="px-3 py-2.5 rounded font-body text-label-lg text-light-on-surface hover:bg-light-surface-container-low">Compatibility Finder</Link>
              <Link href="/inquiry-cart" prefetch={false} className="px-3 py-2.5 rounded font-body text-label-lg text-light-on-surface hover:bg-light-surface-container-low">Bulk Inquiry Cart ({count})</Link>
              <Link href="/track-order" prefetch={false} className="px-3 py-2.5 rounded font-body text-label-lg text-light-on-surface hover:bg-light-surface-container-low">Track Order &amp; Inquiry</Link>
              <Link href="/account" prefetch={false} className="px-3 py-2.5 rounded font-body text-label-lg text-light-on-surface hover:bg-light-surface-container-low">Buyer Account Portal</Link>
              <Link href="/distributors" prefetch={false} className="px-3 py-2.5 rounded font-body text-label-lg text-light-on-surface hover:bg-light-surface-container-low">Distributor Network</Link>
              <Link href="/about" prefetch={false} className="px-3 py-2.5 rounded font-body text-label-lg text-light-on-surface hover:bg-light-surface-container-low">About Us</Link>
              <Link href="/resources" prefetch={false} className="px-3 py-2.5 rounded font-body text-label-lg text-light-on-surface hover:bg-light-surface-container-low">Blog &amp; Resources</Link>
              <Link href="/contact" prefetch={false} className="px-3 py-2.5 rounded font-body text-label-lg text-light-on-surface hover:bg-light-surface-container-low">Contact Us</Link>
              <Link href="/sitemap" prefetch={false} className="px-3 py-2.5 rounded font-body text-label-lg text-light-on-surface hover:bg-light-surface-container-low">Sitemap</Link>
              <Link href="/admin" prefetch={false} className="mt-2 px-3 py-2.5 rounded font-body text-label-lg text-light-primary bg-light-secondary-container/40">Admin ERP Portal</Link>
              <a
                href={`https://wa.me/${contact.whatsapp_number || "919322593719"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 px-3 py-2.5 rounded border border-success/40 bg-success-container/30 text-on-success-container font-body text-label-lg inline-flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
                <span>WhatsApp Sales Desk</span>
              </a>
              {!isStandalone && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    promptInstall();
                  }}
                  className="mt-1 px-3 py-2.5 rounded bg-light-primary text-light-on-primary font-body text-label-lg inline-flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download_for_offline</span>
                  <span>Install Copian App</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      <main key={pathname} className="flex-1 pb-12 animate-surface-in">
        {children}
      </main>

      {fullFooter ? (
        <footer className="bg-dark-surface-container-low text-dark-on-surface border-t border-dark-outline-variant">
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <CopianLogo variant="white" className="h-6 w-24" />
                <span className="px-1.5 py-0.5 rounded bg-dark-primary-container font-mono text-[10px] text-white">B2B</span>
              </div>
              <p className="font-body text-body-sm text-dark-on-surface-variant leading-relaxed">
                Premium compatible toner cartridges, bulk toner powder, OPC drums, inkjet inks, and printer components for enterprise buyers and dealers.
              </p>
              <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-dark-outline">
                <span className="px-2 py-0.5 rounded border border-dark-outline-variant">ISO/IEC 19752</span>
                <span className="px-2 py-0.5 rounded border border-dark-outline-variant">HSN 8443 GST</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-body text-label-lg text-white">Categories</h4>
              <Link href="/category/toner-cartridges" prefetch={false} className="font-body text-body-sm text-dark-on-surface-variant hover:text-white">Toner Cartridges</Link>
              <Link href="/category/toner-powder" prefetch={false} className="font-body text-body-sm text-dark-on-surface-variant hover:text-white">Toner Powder</Link>
              <Link href="/category/opc-drums" prefetch={false} className="font-body text-body-sm text-dark-on-surface-variant hover:text-white">OPC Drums</Link>
              <Link href="/category/inkjet-ink" prefetch={false} className="font-body text-body-sm text-dark-on-surface-variant hover:text-white">Inkjet Ink &amp; Parts</Link>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-body text-label-lg text-white">Procurement Tools</h4>
              <Link href="/compatibility" prefetch={false} className="font-body text-body-sm text-dark-on-surface-variant hover:text-white">Printer Compatibility Finder</Link>
              <Link href="/inquiry-cart" prefetch={false} className="font-body text-body-sm text-dark-on-surface-variant hover:text-white">Bulk Inquiry Cart</Link>
              <Link href="/track-order" prefetch={false} className="font-body text-body-sm text-dark-on-surface-variant hover:text-white">Track Order &amp; Dispatch</Link>
              <Link href="/account" prefetch={false} className="font-body text-body-sm text-dark-on-surface-variant hover:text-white">Buyer Portal &amp; Re-Order</Link>
              <Link href="/distributors" prefetch={false} className="font-body text-body-sm text-dark-on-surface-variant hover:text-white">Distributor Network</Link>
              <Link href="/resources" prefetch={false} className="font-body text-body-sm text-dark-on-surface-variant hover:text-white">Blog &amp; Resources</Link>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-body text-label-lg text-white">Sales &amp; Support</h4>
              <span className="font-body text-body-sm text-dark-on-surface-variant">{contact.email}</span>
              <span className="font-mono text-mono-sm text-dark-on-surface-variant">{contact.phone_primary}</span>
              {contact.phone_secondary && (
                <span className="font-mono text-mono-sm text-dark-on-surface-variant">{contact.phone_secondary}</span>
              )}
              <Link href="/contact" prefetch={false} className="font-body text-body-sm text-dark-primary hover:underline mt-1">Contact Thane HQ</Link>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <Link href="/sitemap" prefetch={false} className="font-body text-body-sm text-dark-on-surface-variant hover:text-white">Sitemap</Link>
                <span className="text-dark-outline">·</span>
                <Link href="/admin" prefetch={false} className="font-body text-body-sm text-dark-primary hover:underline">Admin ERP</Link>
                <span className="text-dark-outline">·</span>
                <a
                  href={`https://wa.me/${contact.whatsapp_number || "919322593719"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-body-sm text-success-container hover:underline"
                >
                  WhatsApp Sales
                </a>
                {!isStandalone && (
                  <>
                    <span className="text-dark-outline">·</span>
                    <button
                      type="button"
                      onClick={promptInstall}
                      className="font-body text-body-sm text-dark-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">install_mobile</span>
                      <span>Install App</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-dark-outline-variant py-4 text-center font-body text-body-sm text-dark-outline px-4">
            {`${contact.company} (Est. ${contact.established_year}) · ${metrics[0]?.value || "27+ Yrs"} · ${metrics[1]?.value || "5k+"} ${metrics[1]?.label || "Businesses Served"}`}
          </div>
        </footer>
      ) : (
        <footer className="bg-dark-surface-container-low text-dark-on-surface border-t border-dark-outline-variant mt-12">
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <CopianLogo variant="white" className="h-5 w-20" />
              <span className="font-mono text-mono-sm text-dark-outline">{`Est. ${contact.established_year} · B2B Supplies`}</span>
            </div>
            <div className="flex items-center flex-wrap justify-center gap-4 font-body text-body-sm text-dark-on-surface-variant">
              <span>{`${contact.email} · ${contact.phone_primary}`}</span>
              <a
                href={`https://wa.me/${contact.whatsapp_number || "919322593719"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-success-container hover:underline"
              >
                WhatsApp Sales
              </a>
              <Link href="/sitemap" prefetch={false} className="hover:text-white">Sitemap</Link>
              <Link href="/admin" prefetch={false} className="text-dark-primary hover:underline">Admin ERP</Link>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="hover:text-white inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_upward</span>
                <span>Top</span>
              </button>
            </div>
          </div>
        </footer>
      )}

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Scroll back to top"
          title="Back to top"
          className="fixed bottom-5 right-5 z-30 inline-flex items-center justify-center w-10 h-10 rounded-full bg-light-surface-container-lowest/95 border border-light-outline-variant text-light-primary shadow-md hover:border-light-primary hover:bg-light-surface-container-low hover:-translate-y-0.5 active:scale-95 animate-modal-in no-print"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_upward</span>
        </button>
      )}
    </div>
  );
}
