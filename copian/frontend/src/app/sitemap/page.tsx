import React from "react";
import Link from "next/link";
import StorefrontShell from "@/components/StorefrontShell";

export default function SitemapPage() {
  return (
    <StorefrontShell>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 flex flex-col gap-10">
        <header className="border-b border-light-outline-variant pb-6 flex flex-col gap-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="font-mono text-mono-sm text-light-primary uppercase tracking-wider">
                Information Architecture · Copian.in Redesign
              </span>
              <h1 className="font-headline text-headline-lg text-light-on-surface mt-1">
                Complete Sitemap &amp; B2B User Journey Flows
              </h1>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-light-secondary-container text-light-on-secondary-container font-body text-label-md">
              10 Core Pages · 4 Responsive Breakpoints
            </span>
          </div>
          <p className="font-body text-body-md text-light-on-surface-variant max-w-prose">
            Structured around B2B product discovery, OEM printer compatibility verification, and multi-SKU bulk quotation rather than retail checkout.
          </p>
        </header>

        {/* Sitemap Hierarchy */}
        <section className="flex flex-col gap-4">
          <h2 className="font-headline text-headline-md text-light-on-surface">1. Website Sitemap</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-light-primary">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">home</span>
                <h3 className="font-headline text-title-md text-light-on-surface">Core Entry</h3>
              </div>
              <ul className="flex flex-col gap-2 font-body text-body-sm text-light-on-surface-variant">
                <li className="flex items-center justify-between">
                  <Link href="/" className="hover:text-light-primary">Homepage</Link>
                  <span className="font-mono text-mono-sm text-light-primary">/</span>
                </li>
                <li className="flex items-center justify-between">
                  <Link href="/about" className="hover:text-light-primary">About Us</Link>
                  <span className="font-mono text-mono-sm text-light-primary">/about</span>
                </li>
                <li className="flex items-center justify-between">
                  <Link href="/contact" className="hover:text-light-primary">Contact Us</Link>
                  <span className="font-mono text-mono-sm text-light-primary">/contact</span>
                </li>
              </ul>
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-light-primary">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">inventory_2</span>
                <h3 className="font-headline text-title-md text-light-on-surface">Product Discovery</h3>
              </div>
              <ul className="flex flex-col gap-2 font-body text-body-sm text-light-on-surface-variant">
                <li className="flex items-center justify-between">
                  <Link href="/products" className="hover:text-light-primary">Product Catalogue</Link>
                  <span className="font-mono text-mono-sm text-light-primary">/products</span>
                </li>
                <li className="flex items-center justify-between">
                  <Link href="/category/toner-cartridges" className="hover:text-light-primary">Category Pages</Link>
                  <span className="font-mono text-mono-sm text-light-primary">/category/:slug</span>
                </li>
                <li className="flex items-center justify-between">
                  <Link href="/product/CPN-HP-26A" className="hover:text-light-primary">Product Details</Link>
                  <span className="font-mono text-mono-sm text-light-primary">/product/:sku</span>
                </li>
              </ul>
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-light-primary">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">print</span>
                <h3 className="font-headline text-title-md text-light-on-surface">Compatibility</h3>
              </div>
              <ul className="flex flex-col gap-2 font-body text-body-sm text-light-on-surface-variant">
                <li className="flex items-center justify-between">
                  <Link href="/compatibility" className="hover:text-light-primary">Compatibility Finder</Link>
                  <span className="font-mono text-mono-sm text-light-primary">/compatibility</span>
                </li>
                <li>Manufacturer Lookup</li>
                <li>Model Comparison Matrix</li>
              </ul>
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-light-primary">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">request_quote</span>
                <h3 className="font-headline text-title-md text-light-on-surface">B2B Conversion</h3>
              </div>
              <ul className="flex flex-col gap-2 font-body text-body-sm text-light-on-surface-variant">
                <li className="flex items-center justify-between">
                  <Link href="/inquiry-cart" className="hover:text-light-primary">Bulk Inquiry Cart</Link>
                  <span className="font-mono text-mono-sm text-light-primary">/inquiry-cart</span>
                </li>
                <li className="flex items-center justify-between">
                  <Link href="/track-order" className="hover:text-light-primary">Track Dispatch</Link>
                  <span className="font-mono text-mono-sm text-light-primary">/track-order</span>
                </li>
                <li className="flex items-center justify-between">
                  <Link href="/account" className="hover:text-light-primary">Buyer Portal</Link>
                  <span className="font-mono text-mono-sm text-light-primary">/account</span>
                </li>
                <li>Per-SKU Notes &amp; MOQ</li>
                <li>GSTIN &amp; Quote Request</li>
              </ul>
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-light-primary">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">hub</span>
                <h3 className="font-headline text-title-md text-light-on-surface">Channel &amp; Content</h3>
              </div>
              <ul className="flex flex-col gap-2 font-body text-body-sm text-light-on-surface-variant">
                <li className="flex items-center justify-between">
                  <Link href="/distributors" className="hover:text-light-primary">Distributor Network</Link>
                  <span className="font-mono text-mono-sm text-light-primary">/distributors</span>
                </li>
                <li className="flex items-center justify-between">
                  <Link href="/resources" className="hover:text-light-primary">Blog &amp; Resources</Link>
                  <span className="font-mono text-mono-sm text-light-primary">/resources</span>
                </li>
                <li className="flex items-center justify-between">
                  <Link href="/admin" className="text-light-primary hover:underline">Admin ERP Portal</Link>
                  <span className="font-mono text-mono-sm text-light-primary">/admin</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* User Journey Flows */}
        <section className="flex flex-col gap-4">
          <h2 className="font-headline text-headline-md text-light-on-surface">2. Primary B2B User Journey Flows</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-body text-label-lg text-light-primary">
                  Flow A: Fleet Procurement via Compatibility Finder
                </span>
                <span className="font-mono text-mono-sm text-light-on-surface-variant">IT Manager / MPS Provider</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                <div className="bg-light-surface-container-low rounded p-3 text-body-sm">1. Select Printer Brand &amp; Model</div>
                <div className="bg-light-surface-container-low rounded p-3 text-body-sm">2. Compare Compatible SKUs &amp; Yields</div>
                <div className="bg-light-surface-container-low rounded p-3 text-body-sm">3. Set Bulk Quantities (MOQ)</div>
                <div className="bg-light-surface-container-low rounded p-3 text-body-sm">4. Add Multi-SKU Notes in Inquiry Cart</div>
                <div className="bg-light-primary text-light-on-primary rounded p-3 text-label-md">5. Submit GSTIN Quote Request</div>
              </div>
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-body text-label-lg text-light-primary">
                  Flow B: Direct SKU Discovery &amp; Technical Verification
                </span>
                <span className="font-mono text-mono-sm text-light-on-surface-variant">Corporate Buyer / Dealer</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                <div className="bg-light-surface-container-low rounded p-3 text-body-sm">1. Global Autocomplete Search (SKU/OEM)</div>
                <div className="bg-light-surface-container-low rounded p-3 text-body-sm">2. Filter Catalogue by Category &amp; Stock</div>
                <div className="bg-light-surface-container-low rounded p-3 text-body-sm">3. Inspect Gallery, Zoom &amp; ISO Specs</div>
                <div className="bg-light-surface-container-low rounded p-3 text-body-sm">4. Select Variant &amp; Bulk Quantity</div>
                <div className="bg-light-primary text-light-on-primary rounded p-3 text-label-md">5. Request Bulk Quotation</div>
              </div>
            </div>
          </div>
        </section>

        {/* Responsive Breakpoint Matrix */}
        <section className="flex flex-col gap-4">
          <h2 className="font-headline text-headline-md text-light-on-surface">3. Responsive Adaptation Matrix</h2>
          <div className="overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
            <table className="w-full text-left border-collapse">
              <thead className="bg-light-surface-container-low border-b border-light-outline-variant">
                <tr>
                  <th className="px-4 py-3 font-body text-label-md text-light-on-surface-variant">Breakpoint</th>
                  <th className="px-4 py-3 font-body text-label-md text-light-on-surface-variant">Navigation</th>
                  <th className="px-4 py-3 font-body text-label-md text-light-on-surface-variant">Catalogue Grid &amp; Filters</th>
                  <th className="px-4 py-3 font-body text-label-md text-light-on-surface-variant">Inquiry Cart &amp; Forms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-sm text-light-on-surface-variant">
                <tr>
                  <td className="px-4 py-3 font-mono text-mono-md text-light-on-surface">1440px / 1280px (Desktop)</td>
                  <td className="px-4 py-3">Sticky top bar + Mega Menu + inline Search</td>
                  <td className="px-4 py-3">280px left filter sidebar + 3-col product grid</td>
                  <td className="px-4 py-3">2-column split: 7-col line items + 5-col sticky quote form</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-mono-md text-light-on-surface">768px (Tablet)</td>
                  <td className="px-4 py-3">Compact header + drawer nav + full-width search</td>
                  <td className="px-4 py-3">Filter drawer toggle + 2-col product grid</td>
                  <td className="px-4 py-3">Stacked line items above full-width quote form</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-mono-md text-light-on-surface">375px (Mobile)</td>
                  <td className="px-4 py-3">Mobile drawer + sticky inquiry cart badge</td>
                  <td className="px-4 py-3">Single-column cards + bottom filter sheet</td>
                  <td className="px-4 py-3">Single-column cards with sticky Submit Inquiry CTA</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </StorefrontShell>
  );
}
