"use client";

import React from "react";
import Link from "next/link";
import StorefrontShell from "@/components/StorefrontShell";
import { useCms } from "@/components/CmsContext";

export default function AboutUsPage() {
  const { about, contact, metrics } = useCms();

  return (
    <StorefrontShell>
      {/* Intro Hero */}
      <section className="bg-light-surface-container-lowest border-b border-light-outline-variant py-12 lg:py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 flex flex-col gap-4">
            <span className="font-mono text-mono-sm text-light-primary uppercase">
              {contact.company} · Est. {contact.established_year}
            </span>
            <h1 className="font-headline text-display-md-mobile lg:text-display-md text-light-on-surface text-balance">
              {about.title}
            </h1>
            <p className="font-body text-body-lg text-light-on-surface-variant text-pretty">
              {about.intro}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/products"
                className="px-5 py-2.5 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container"
              >
                Explore Product Catalogue
              </Link>
              <Link
                href="/distributors"
                className="px-5 py-2.5 rounded border border-light-outline-variant font-body text-label-lg text-light-on-surface hover:bg-light-surface-container-low"
              >
                View Distributor Network
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6">
            <img
              src="/images/copian-banner-5.png"
              alt="Copian International toner cartridges and bulk imaging consumables"
              className="w-full h-80 object-contain bg-white p-4 rounded-lg border border-light-outline-variant"
            />
          </div>
        </div>
      </section>

      {/* Official Key Metrics Strip */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-6 pt-12">
        <div className="bg-light-primary text-light-on-primary rounded-lg p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shadow-sm">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex flex-col gap-1 border-b sm:border-b-0 sm:border-r border-white/15 pb-4 sm:pb-0 sm:pr-4 last:border-0"
            >
              <span className="font-mono text-display-sm font-semibold tabular-nums text-white">{m.value}</span>
              <span className="font-headline text-title-md text-light-inverse-primary">{m.label}</span>
              <span className="font-body text-body-sm text-white/75">{m.detail}</span>
            </div>
          ))}
        </div>

        {/* Supported OEM Brands Bar */}
        <div className="mt-6 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-mono-sm text-light-primary uppercase block">
              {about.oem_brands.length} OEM Printer Ecosystems
            </span>
            <p className="font-body text-body-sm text-light-on-surface-variant">
              Compatible laser &amp; copier cartridge listings delivering OEM-parity output at competitive dealer margins.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {about.oem_brands.map((brand) => (
              <Link
                key={brand}
                href={`/compatibility?brand=${encodeURIComponent(brand)}`}
                className="px-3 py-1 rounded border border-light-outline-variant bg-light-surface-container-low font-mono text-mono-sm text-light-on-surface hover:border-light-primary hover:text-light-primary transition-colors"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Manufacturing, Quality & History */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-3">
          <span className="material-symbols-outlined text-light-primary text-[28px]" aria-hidden="true">
            precision_manufacturing
          </span>
          <h2 className="font-headline text-headline-sm text-light-on-surface">Heritage Since {contact.established_year}</h2>
          <p className="font-body text-body-md text-light-on-surface-variant">
            Starting from dot-matrix ribbons in Thane in {contact.established_year}, {contact.company} expanded into compatible laser cartridges, OPC drums, magnetic rollers, and spare components with long-term dealer relationships.
          </p>
        </div>
        <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-3">
          <span className="material-symbols-outlined text-light-primary text-[28px]" aria-hidden="true">fact_check</span>
          <h2 className="font-headline text-headline-sm text-light-on-surface">Quality &amp; Yield Standards</h2>
          <p className="font-body text-body-md text-light-on-surface-variant">
            Incoming powders and finished assemblies undergo page-yield benchmarking, fusing adhesion tests, and recyclable drop-tested carton packaging for OEM-grade consistency.
          </p>
        </div>
        <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-3">
          <span className="material-symbols-outlined text-light-primary text-[28px]" aria-hidden="true">hub</span>
          <h2 className="font-headline text-headline-sm text-light-on-surface">Pan-India Distributor Network</h2>
          <p className="font-body text-body-md text-light-on-surface-variant">
            Headquartered at {contact.address}, with authorized stockists across Delhi Daryaganj, Bengaluru, Chennai, Kolkata, Odisha, Rajasthan, MP, and Gujarat.
          </p>
        </div>
      </section>

      {/* Company Journey */}
      <section className="bg-light-surface-container-lowest border-t border-light-outline-variant py-14">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex flex-col gap-8">
          <h2 className="font-headline text-headline-md text-light-on-surface">Our Operational Pillars</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-md bg-light-surface-container-low border border-light-outline-variant flex flex-col gap-2">
              <h3 className="font-headline text-title-lg text-light-on-surface">End-to-End Consumable Coverage</h3>
              <p className="font-body text-body-md text-light-on-surface-variant">
                From sealed retail-ready compatible cartridges to bulk 1kg toner powders and replacement fuser components, dealers consolidate their entire print supply chain with one partner.
              </p>
            </div>
            <div className="p-6 rounded-md bg-light-surface-container-low border border-light-outline-variant flex flex-col gap-2">
              <h3 className="font-headline text-title-lg text-light-on-surface">HQ &amp; GST Traceability</h3>
              <p className="font-body text-body-md text-light-on-surface-variant">
                Dispatched from {contact.address} with accurate HSN classification and GST-compliant invoicing for corporate and reseller accounting.
              </p>
            </div>
          </div>
        </div>
      </section>
    </StorefrontShell>
  );
}
