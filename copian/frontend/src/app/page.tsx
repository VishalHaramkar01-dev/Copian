"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StorefrontShell from "@/components/StorefrontShell";
import { CardGridSkeleton, CategoryGridSkeleton, Skeleton } from "@/components/Skeleton";
import { useCart } from "@/components/CartContext";
import { useCms } from "@/components/CmsContext";
import CatalogProductCard from "@/features/catalog/CatalogProductCard";
import HeroProductShowcase from "@/features/catalog/HeroProductShowcase";
import { catalogApi } from "@/services/catalogApi";
import { Category, Product } from "@/types/copian";

export default function HomePage() {
  const router = useRouter();
  const { items: cartItems, addToCart } = useCart();
  const { metrics, testimonials, volume_slabs, homepage: homepageCms, articles, faqs } = useCms();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"bestsellers" | "new">("bestsellers");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [modelsByBrand, setModelsByBrand] = useState<Record<string, { model_name: string }[]>>({
    HP: [{ model_name: "LaserJet Pro M1136 MFP" }, { model_name: "LaserJet Pro M402dn" }, { model_name: "LaserJet P1007 / P1008" }],
    Canon: [{ model_name: "imageCLASS MF232w" }, { model_name: "imageCLASS MF244dw" }],
    Brother: [{ model_name: "HL-L2321D" }, { model_name: "InkBenefit DCP-T520W" }],
    Ricoh: [{ model_name: "Aficio SP 210" }],
  });
  const [selectedBrand, setSelectedBrand] = useState("HP");
  const [selectedModel, setSelectedModel] = useState("LaserJet Pro M1136 MFP");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catsRes, bestRes, newRes, compatRes] = await Promise.all([
          catalogApi.listCategories(),
          catalogApi.listProducts({ featured: true, status: "Published" }),
          catalogApi.listProducts({ new_arrival: true, status: "Published" }),
          catalogApi.getCompatibilityBrands(),
        ]);
        setCategories(catsRes);
        setBestSellers(bestRes);
        setNewArrivals(newRes);
        const qtyMap: Record<string, number> = {};
        [...bestRes, ...newRes].forEach((p) => {
          qtyMap[p.sku] = p.moq || 10;
        });
        setQuantities(qtyMap);
        if (compatRes.models_by_brand && Object.keys(compatRes.models_by_brand).length > 0) {
          setModelsByBrand(compatRes.models_by_brand);
        }
      } catch {
        // graceful fallback
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    const list = modelsByBrand[brand] || [];
    setSelectedModel(list[0]?.model_name || "");
  };

  const getCartQty = (sku: string) => cartItems.find((c) => c.sku === sku)?.quantity || 0;

  const categoryTitles: Record<string, string> = {
    "toner-cartridges": "Compatible Toner Cartridges",
    "toner-powder": "Toner Powder",
    "opc-drums": "OPC Drums & Drum Units",
    "inkjet-ink": "Inkjet Ink Bottles",
    components: "Printer Components",
  };

  const activeProducts = activeTab === "bestsellers" ? bestSellers : newArrivals;
  const showcaseProducts = useMemo(
    () => [...bestSellers, ...newArrivals],
    [bestSellers, newArrivals]
  );

  return (
    <StorefrontShell showUtilityBar showSearchInHeader fullFooter>
      {/* 1. Asymmetric Engineering Hero */}
      <section className="bg-light-surface-container-lowest border-b border-light-outline-variant">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-10 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-light-secondary-container text-light-on-secondary-container font-body text-label-md">
                <span className="w-1.5 h-1.5 rounded-full bg-light-primary" />
                {homepageCms.hero_badge || "Trusted Since 1997 · Enterprise & Dealer Supply"}
              </span>
              <span className="font-mono text-mono-sm text-light-on-surface-variant">
                220+ SKUs · 10 OEM Brands · HSN 8443
              </span>
            </div>

            <h1 className="font-headline text-display-lg-mobile lg:text-display-lg text-light-on-surface text-balance">
              {homepageCms.hero_headline || "Precision printer consumables built for bulk procurement."}
            </h1>
            <p className="font-body text-body-lg text-light-on-surface-variant max-w-prose text-pretty">
              {homepageCms.hero_subheadline ||
                "Established in 1997 in Thane, Copian International supplies OEM-compatible toner cartridges, bulk toner powders, OPC drums, inkjet inks, and printer spare parts across 10 major printer brands."}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container transition-colors duration-state-change shadow-sm"
              >
                <span>{homepageCms.primary_cta_label || "Explore Product Catalogue"}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <Link
                href="/inquiry-cart"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded border border-light-outline-variant bg-light-surface-container-lowest text-light-on-surface font-body text-label-lg hover:bg-light-surface-container-low transition-colors duration-state-change"
              >
                <span>{homepageCms.secondary_cta_label || "Request Bulk Quote"}</span>
              </Link>
            </div>

            {/* Official Copian International Key Metrics Strip (from copian.in) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-5 mt-2 border-t border-light-outline-variant/70">
              {metrics.map((m, idx) => (
                <div key={m.label}>
                  <p className={`font-mono text-title-lg font-semibold tabular-nums ${idx === 0 ? "text-light-primary" : "text-light-on-surface"}`}>
                    {m.value}
                  </p>
                  <p className="font-body text-body-sm text-light-on-surface-variant">
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Studio Product Stage Carousel */}
          <div className="lg:col-span-6">
            <HeroProductShowcase products={showcaseProducts} loading={loading} />
          </div>
        </div>
      </section>

      {/* 2. Precision Compatibility Finder Bar */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-6 -mt-7 relative z-20">
        <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 md:p-6 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="home-brand-select" className="font-body text-label-md text-light-on-surface">
                  1. Printer Manufacturer
                </label>
                <div className="hidden sm:flex items-center gap-1">
                  {Object.keys(modelsByBrand).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleBrandChange(b)}
                      className={`px-2 py-0.5 rounded font-mono text-[11px] transition-colors ${
                        selectedBrand === b
                          ? "bg-light-primary text-white"
                          : "bg-light-surface-container-low text-light-on-surface-variant hover:text-light-on-surface"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <select
                id="home-brand-select"
                value={selectedBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full rounded border border-light-outline-variant bg-light-surface-container-lowest px-3.5 py-2.5 font-body text-body-md text-light-on-surface focus:border-light-primary focus:ring-1 focus:ring-light-primary"
              >
                {Object.keys(modelsByBrand).map((brand) => (
                  <option key={brand} value={brand}>
                    {brand === "HP"
                      ? "HP LaserJet / OfficeJet"
                      : brand === "Canon"
                      ? "Canon imageCLASS / PIXMA"
                      : brand === "Brother"
                      ? "Brother HL / DCP Series"
                      : brand === "Ricoh"
                      ? "Ricoh Aficio / SP Series"
                      : brand}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label htmlFor="home-model-select" className="font-body text-label-md text-light-on-surface">
                2. Printer Model
              </label>
              <select
                id="home-model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full rounded border border-light-outline-variant bg-light-surface-container-lowest px-3.5 py-2.5 font-body text-body-md text-light-on-surface focus:border-light-primary focus:ring-1 focus:ring-light-primary"
              >
                {(modelsByBrand[selectedBrand] || []).map((m) => (
                  <option key={m.model_name} value={m.model_name}>
                    {m.model_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/compatibility?brand=${encodeURIComponent(selectedBrand)}&model=${encodeURIComponent(selectedModel)}`
                  )
                }
                className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container transition-colors duration-state-change whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">search</span>
                <span>Find Compatible Supplies</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Product Categories */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="font-mono text-mono-sm text-light-primary uppercase tracking-wider">Catalog Architecture</span>
            <h2 className="font-headline text-headline-lg text-light-on-surface mt-1">Product Categories</h2>
            <p className="font-body text-body-md text-light-on-surface-variant mt-1">
              Engineered consumables across every print technology and fleet volume.
            </p>
          </div>
          <Link href="/products" className="inline-flex items-center gap-1.5 font-body text-label-lg text-light-primary hover:underline">
            <span>View full catalogue</span>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
          </Link>
        </div>

        {loading && categories.length === 0 ? (
          <CategoryGridSkeleton count={6} />
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group flex flex-col justify-between bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 gap-4 hover:border-light-primary hover:-translate-y-0.5 hover:shadow-md transition-all duration-surface-enter ease-surface-enter"
            >
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded bg-light-surface-container-low border border-light-outline-variant/60 p-2 flex items-center justify-center shrink-0">
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                </div>
                <div>
                  <h3 className="font-headline text-title-lg text-light-on-surface group-hover:text-light-primary transition-colors">
                    {categoryTitles[cat.slug] || cat.name}
                  </h3>
                  <p className="font-body text-body-sm text-light-on-surface-variant mt-1">{cat.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-light-outline-variant/60 text-label-md text-light-primary">
                <span>Explore SKUs</span>
                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}

          <Link
            href="/products"
            className="group flex flex-col justify-between bg-light-primary text-light-on-primary border border-light-primary rounded-md p-5 gap-4 hover:bg-light-primary-container transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded bg-white/10 text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[32px]" aria-hidden="true">pallet</span>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-light-inverse-primary">Wholesale Packs</span>
                <h3 className="font-headline text-title-lg text-white mt-0.5">Master Carton Bundles</h3>
                <p className="font-body text-body-sm text-white/80 mt-1">Pallet &amp; dealer volume packs (-15%)</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/20 text-label-md text-white">
              <span>Browse bulk bundles</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                arrow_forward
              </span>
            </div>
          </Link>
        </div>
        )}
      </section>

      {/* 4. Best-Selling & Featured Products */}
      <section className="bg-light-surface-container-lowest border-y border-light-outline-variant py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="font-mono text-mono-sm text-light-primary uppercase tracking-wider">Direct Procurement</span>
              <h2 className="font-headline text-headline-lg text-light-on-surface mt-1">Featured B2B Supplies</h2>
              <p className="font-body text-body-md text-light-on-surface-variant mt-1">
                Verify OEM compatibility, select bulk carton quantities, and add directly to your inquiry.
              </p>
            </div>
            <div role="tablist" className="inline-flex rounded border border-light-outline-variant bg-light-surface-container-low p-1 gap-1 w-fit">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "bestsellers"}
                onClick={() => setActiveTab("bestsellers")}
                className={`px-4 py-1.5 rounded font-body text-label-lg transition-colors ${
                  activeTab === "bestsellers"
                    ? "bg-light-surface-container-lowest text-light-primary shadow-sm"
                    : "text-light-on-surface-variant hover:text-light-on-surface"
                }`}
              >
                Best-Selling ({bestSellers.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "new"}
                onClick={() => setActiveTab("new")}
                className={`px-4 py-1.5 rounded font-body text-label-lg transition-colors ${
                  activeTab === "new"
                    ? "bg-light-surface-container-lowest text-light-primary shadow-sm"
                    : "text-light-on-surface-variant hover:text-light-on-surface"
                }`}
              >
                New Arrivals ({newArrivals.length})
              </button>
            </div>
          </div>

          {loading ? (
            <CardGridSkeleton count={4} />
          ) : (
            <div
              key={activeTab}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch animate-surface-in"
            >
              {activeProducts.map((p) => (
                <CatalogProductCard
                  key={p.sku}
                  product={p}
                  quantity={quantities[p.sku] ?? p.moq}
                  inCartQty={getCartQty(p.sku)}
                  showStepper
                  onQuantityChange={(nextQty) =>
                    setQuantities((prev) => ({ ...prev, [p.sku]: nextQty }))
                  }
                  onAddToCart={() =>
                    addToCart({
                      sku: p.sku,
                      product_name: p.name,
                      description_line: `${p.page_yield.toLocaleString()}-page ISO yield · MOQ ${p.moq} ${p.moq_unit}`,
                      image_url: p.image_url,
                      moq: p.moq,
                      moq_unit: p.moq_unit,
                      quantity: quantities[p.sku] ?? p.moq,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Engineering Standards (Editorial Spec List) + Bulk Tier Program */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-center gap-6">
          <div>
            <span className="font-mono text-mono-sm text-light-primary uppercase tracking-wider">Operational Reliability</span>
            <h2 className="font-headline text-headline-lg text-light-on-surface mt-1">
              Why B2B Procurement Teams Standardize on Copian
            </h2>
          </div>

          <div className="divide-y divide-light-outline-variant border-y border-light-outline-variant">
            <div className="py-4 flex items-start gap-4">
              <span className="font-mono text-title-md text-light-primary pt-0.5">01</span>
              <div>
                <h3 className="font-headline text-title-md text-light-on-surface">Batch-Tested Optical Density &amp; Yield</h3>
                <p className="font-body text-body-sm text-light-on-surface-variant mt-1">
                  Every production lot undergoes ISO/IEC 19752 yield testing, background fog checks, and fuser adhesion verification prior to carton sealing.
                </p>
              </div>
            </div>
            <div className="py-4 flex items-start gap-4">
              <span className="font-mono text-title-md text-light-primary pt-0.5">02</span>
              <div>
                <h3 className="font-headline text-title-md text-light-on-surface">GST-Ready Proforma Quotations</h3>
                <p className="font-body text-body-sm text-light-on-surface-variant mt-1">
                  Transparent slab pricing, HSN 8443/3707 classification, and automated CGST/SGST or IGST tax invoices for enterprise input credit.
                </p>
              </div>
            </div>
            <div className="py-4 flex items-start gap-4">
              <span className="font-mono text-title-md text-light-primary pt-0.5">03</span>
              <div>
                <h3 className="font-headline text-title-md text-light-on-surface">Thane HQ &amp; Pan-India Distributor Network</h3>
                <p className="font-body text-body-sm text-light-on-surface-variant mt-1">
                  Dispatched from Amargian Industrial Estate, Thane with authorized regional stockists across Delhi Daryaganj, Bengaluru, Madurai, Kolkata, Ahmedabad, Raipur, Jaipur, and Patna.
                </p>
              </div>
            </div>
            <div className="py-4 flex items-start gap-4">
              <span className="font-mono text-title-md text-light-primary pt-0.5">04</span>
              <div>
                <h3 className="font-headline text-title-md text-light-on-surface">Neutral &amp; Custom OEM Packaging Options</h3>
                <p className="font-body text-body-sm text-light-on-surface-variant mt-1">
                  Choose Copian-branded retail cartons or neutral white-box master packing for managed print contracts and regional wholesale distribution.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-light-primary text-light-on-primary rounded-lg p-8 flex flex-col justify-between gap-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-mono-sm uppercase tracking-wider text-light-inverse-primary">
              Bulk &amp; Dealer Program
            </span>
            <h3 className="font-headline text-headline-md text-light-on-primary">
              Ordering for an enterprise fleet or regional dealership?
            </h3>
            <p className="font-body text-body-md text-light-on-primary/85">
              Unlock tiered master-carton pricing across all laser cartridges, bulk powders, and OPC drums.
            </p>

            {/* Real Volume Slab Table */}
            <div className="mt-2 rounded border border-white/15 bg-white/5 divide-y divide-white/10 font-mono text-mono-sm">
              {volume_slabs.map((slab) => (
                <div key={slab.label} className="px-3.5 py-2.5 flex justify-between">
                  <span>
                    {slab.max_qty ? `${slab.min_qty === 1 ? 10 : slab.min_qty} – ${slab.max_qty} Units` : `${slab.min_qty}+ Units (Pallet)`}
                  </span>
                  <span className={slab.discount_pct > 0 ? "text-success-container font-semibold" : "text-light-inverse-primary"}>
                    {slab.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/inquiry-cart"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded bg-light-surface-container-lowest text-light-primary font-body text-label-lg hover:bg-light-surface-container-low transition-colors duration-state-change"
            >
              <span>Start Bulk Inquiry</span>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
            </Link>
            <Link
              href="/distributors"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded border border-light-on-primary/30 text-light-on-primary font-body text-label-lg hover:bg-light-primary-container transition-colors duration-state-change"
            >
              <span>Find a Regional Distributor</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Grounded Partner Stories, FAQ & Blog Resources */}
      <section className="bg-light-surface-container-lowest border-t border-light-outline-variant py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex flex-col gap-16">
          <div>
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <span className="font-mono text-mono-sm text-light-primary uppercase tracking-wider">
                  {metrics[1]?.value || "5k+"} {metrics[1]?.label || "Businesses Served"} · {metrics[2]?.value || "98%"} Retention
                </span>
                <h2 className="font-headline text-headline-lg text-light-on-surface mt-1">
                  Trusted by Long-Term Print &amp; IT Partners
                </h2>
              </div>
              <Link href="/about" className="hidden sm:inline-flex font-body text-label-lg text-light-primary hover:underline">
                Our {metrics[0]?.value || "27+ Year"} track record →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, idx) => (
                <blockquote
                  key={`${t.author}-${idx}`}
                  className="bg-light-surface-container-low border border-light-outline-variant rounded-md p-6 flex flex-col justify-between gap-5 hover:border-light-primary/40 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-surface-enter ease-surface-enter"
                >
                  <p className="font-body text-body-md text-light-on-surface leading-relaxed">
                    &quot;{t.quote}&quot;
                  </p>
                  <footer className="pt-3 border-t border-light-outline-variant/60 font-body text-body-sm">
                    <strong className="text-light-on-surface block">{t.author}</strong>
                    <span className="text-light-on-surface-variant">{t.role_company}</span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-6 flex flex-col gap-4">
              <h2 className="font-headline text-headline-md text-light-on-surface">Frequently Asked Questions</h2>
              <div className="divide-y divide-light-outline-variant border border-light-outline-variant rounded-md bg-light-surface-container-lowest">
                {loading && faqs.length === 0
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="p-4 flex items-center justify-between gap-4">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-5 w-5 rounded shrink-0" />
                      </div>
                    ))
                  : faqs.map((faq, idx) => (
                      <details key={faq.id} className="group p-4" open={idx === 0}>
                        <summary className="flex items-center justify-between cursor-pointer font-body text-title-md text-light-on-surface list-none">
                          <span>{faq.question}</span>
                          <span className="material-symbols-outlined text-light-outline group-open:rotate-180 transition-transform duration-200 ease-surface-enter">
                            expand_more
                          </span>
                        </summary>
                        <p className="font-body text-body-md text-light-on-surface-variant mt-2">{faq.answer}</p>
                      </details>
                    ))}
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline text-headline-md text-light-on-surface">Knowledge &amp; Resources</h2>
                <Link href="/resources" className="font-body text-label-lg text-light-primary hover:underline">
                  All articles →
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {loading && articles.length === 0
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
                        <Skeleton className="w-28 h-20 rounded shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3.5 w-24" />
                          <Skeleton className="h-5 w-4/5" />
                        </div>
                      </div>
                    ))
                  : articles.slice(0, 2).map((art) => (
                  <Link
                    key={art.id}
                    href={`/resources?article=${encodeURIComponent(art.slug)}`}
                    className="group flex items-center gap-4 p-4 rounded-md border border-light-outline-variant bg-light-surface-container-lowest hover:border-light-primary hover:-translate-y-0.5 hover:shadow-md transition-all duration-surface-enter ease-surface-enter"
                  >
                    <img
                      src={art.image_url}
                      alt={art.title}
                      className="w-28 h-20 rounded object-cover shrink-0 bg-light-surface-container-low border border-light-outline-variant/60 group-hover:scale-105 transition-transform duration-surface-enter ease-surface-enter"
                    />
                    <div>
                      <span className="font-mono text-mono-sm text-light-primary">{art.category}</span>
                      <h3 className="font-headline text-title-md text-light-on-surface mt-0.5 group-hover:text-light-primary">
                        {art.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </StorefrontShell>
  );
}
