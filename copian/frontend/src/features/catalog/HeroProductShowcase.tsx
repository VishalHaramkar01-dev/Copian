"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { HeroShowcaseCardSkeleton } from "@/components/Skeleton";
import { Product } from "@/types/copian";

export interface HeroShowcaseSlide {
  sku: string;
  name: string;
  image_url: string;
  specHighlight: string;
  oemCode: string;
  cartonSummary: string;
  compatibleSummary: string;
}

const DEFAULT_SHOWCASE_SLIDES: HeroShowcaseSlide[] = [
  {
    sku: "CPN-HP-26A",
    name: "Copian 26A Enterprise Toner",
    image_url: "/images/hero-banner.png",
    specHighlight: "3,100 Pages · Smart Chip",
    oemCode: "OEM CF226A",
    cartonSummary: "20 Units / Box · MOQ 10",
    compatibleSummary: "HP LaserJet Pro M402dn, M426fdw",
  },
  {
    sku: "CPN-HP-88A",
    name: "Copian 88A Black Toner",
    image_url: "/images/toner-cartridge.png",
    specHighlight: "1,500 Pages · Smart Chip",
    oemCode: "OEM CC388A",
    cartonSummary: "20 Units / Box · MOQ 10",
    compatibleSummary: "HP LaserJet P1007, P1008, M1136",
  },
  {
    sku: "CPN-PWD-1KG",
    name: "Universal Toner Powder (1kg)",
    image_url: "/images/copian-banner-2.png",
    specHighlight: "18,000 Pages · High-Density Powder",
    oemCode: "Universal Grade",
    cartonSummary: "20 Bottles / Box · MOQ 20",
    compatibleSummary: "HP / Canon Monochrome Laser Series",
  },
  {
    sku: "CPN-OPC-12A",
    name: "Long-Life OPC Drum Unit",
    image_url: "/images/toner-img-2.png",
    specHighlight: "12,000 Pages · 4 Rebuild Cycles",
    oemCode: "OEM Q2612A-OPC",
    cartonSummary: "50 Units / Box · MOQ 25",
    compatibleSummary: "12A / 88A / 337 Cartridge Assemblies",
  },
  {
    sku: "CPN-HP-26X",
    name: "Copian 26X High-Yield Toner",
    image_url: "/images/copian-banner-5.png",
    specHighlight: "9,000 Pages · High-Yield Chip",
    oemCode: "OEM CF226X",
    cartonSummary: "16 Units / Box · MOQ 10",
    compatibleSummary: "HP LaserJet Pro M402dn, M426fdw",
  },
];

function formatProductToSlide(p: Product): HeroShowcaseSlide {
  const shortChip = p.chip_included?.toLowerCase().startsWith("yes")
    ? "Smart Chip"
    : p.oem_code
    ? `OEM ${p.oem_code}`
    : `HSN ${p.hsn_code}`;
  const specHighlight = `${p.page_yield.toLocaleString()} Pages · ${shortChip}`;
  const unitLabel = p.moq_unit ? p.moq_unit[0].toUpperCase() + p.moq_unit.slice(1) : "Units";
  return {
    sku: p.sku,
    name: p.name,
    image_url: p.image_url || "/images/hero-banner.png",
    specHighlight,
    oemCode: p.oem_code ? `OEM ${p.oem_code}` : `HSN ${p.hsn_code}`,
    cartonSummary: `${p.master_carton_qty || 20} ${unitLabel} / Box · MOQ ${p.moq}`,
    compatibleSummary: p.compatible_printers_text || p.short_desc || "Pan-India B2B Supply",
  };
}

interface HeroProductShowcaseProps {
  products: Product[];
  loading?: boolean;
  autoSlideMs?: number;
}

/**
 * Automatic horizontal product slider showcasing featured SKUs with OEM spec highlights
 * inside the homepage Studio Product Stage.
 */
export default function HeroProductShowcase({
  products,
  loading = false,
  autoSlideMs = 2500,
}: HeroProductShowcaseProps) {
  const slides = useMemo(() => {
    if (!products || products.length === 0) return DEFAULT_SHOWCASE_SLIDES;
    const seen = new Set<string>();
    const unique: Product[] = [];
    // Keep CPN-HP-26A first if present so initial visual matches Copian's flagship enterprise unit
    const prioritized = [...products].sort((a, b) =>
      a.sku === "CPN-HP-26A" ? -1 : b.sku === "CPN-HP-26A" ? 1 : 0
    );
    for (const p of prioritized) {
      if (!seen.has(p.sku)) {
        seen.add(p.sku);
        unique.push(p);
      }
      if (unique.length >= 6) break;
    }
    return unique.length >= 2 ? unique.map(formatProductToSlide) : DEFAULT_SHOWCASE_SLIDES;
  }, [products]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const slidesCountRef = useRef(slides.length);
  slidesCountRef.current = slides.length;

  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(0);
    }
  }, [slides.length, activeIndex]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (paused || hoverPaused || reducedMotion) return;
    const timer = window.setInterval(() => {
      const total = slidesCountRef.current;
      if (total > 1) {
        setActiveIndex((prev) => (prev + 1) % total);
      }
    }, autoSlideMs);
    return () => window.clearInterval(timer);
  }, [paused, hoverPaused, reducedMotion, autoSlideMs]);

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % slides.length);

  if (loading && (!products || products.length === 0)) {
    return <HeroShowcaseCardSkeleton />;
  }

  const currentSlide = slides[activeIndex] || slides[0];

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Product Specification Showcase"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={() => setHoverPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) > 40) {
          if (delta < 0) goNext();
          else goPrev();
        }
      }}
      className="rounded-lg border border-light-outline-variant bg-light-surface-container-low overflow-hidden flex flex-col shadow-sm"
    >
      {/* Studio Sliding Track */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 45%, #FFFFFF 0%, #F3F3F9 72%), radial-gradient(#C3C6D1 1px, transparent 1px)",
          backgroundSize: "100% 100%, 20px 20px",
        }}
      >
        <div
          className="flex transition-transform duration-300 ease-surface-enter"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={slide.sku}
                aria-hidden={!isActive}
                className="w-full shrink-0 p-4 sm:p-5 flex flex-col justify-between gap-3"
              >
                {/* Top Row: Spec Card + OEM Ref Tag */}
                <div className="flex items-start justify-between gap-2.5">
                  <Link
                    href={`/product/${slide.sku}`}
                    tabIndex={isActive ? 0 : -1}
                    className="min-w-0 max-w-full bg-white/95 border border-light-outline-variant rounded px-3 py-2 shadow-sm hover:border-light-primary hover:shadow transition-all"
                  >
                    <div className="flex items-center gap-2 font-mono text-[11px] text-light-primary whitespace-nowrap">
                      <span>SKU · {slide.sku}</span>
                      <span className="text-light-outline-variant hidden sm:inline">·</span>
                      <span className="text-light-on-surface-variant hidden sm:inline">{slide.oemCode}</span>
                    </div>
                    <p className="font-headline text-label-lg text-light-on-surface truncate mt-0.5">
                      {slide.name}
                    </p>
                    <span className="font-body text-body-sm text-light-on-surface-variant block truncate">
                      {slide.specHighlight}
                    </span>
                  </Link>
                  <span className="hidden sm:inline-flex px-2.5 py-1 rounded bg-white/90 border border-light-outline-variant font-mono text-[10px] text-light-on-surface-variant uppercase shrink-0">
                    Bulk Verified
                  </span>
                </div>

                {/* Middle: Product Studio Stage */}
                <Link
                  href={`/product/${slide.sku}`}
                  tabIndex={isActive ? 0 : -1}
                  className="h-[165px] sm:h-[195px] lg:h-[210px] w-full flex items-center justify-center group"
                >
                  <img
                    src={slide.image_url}
                    alt={`${slide.name} (${slide.sku})`}
                    className="max-h-full w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-surface-enter ease-surface-enter"
                  />
                </Link>

                {/* Bottom Row: Carton & Printer Compatibility Pill */}
                <div className="flex justify-end">
                  <div className="max-w-full sm:max-w-[85%] bg-dark-surface-container-low text-white rounded px-3.5 py-2 shadow-md">
                    <span className="font-mono text-[10px] text-dark-primary uppercase block truncate">
                      {slide.cartonSummary}
                    </span>
                    <span className="font-mono text-mono-sm tabular-nums block truncate">
                      {slide.compatibleSummary}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Slider Navigation & Active Spec Link Strip */}
      <div className="border-t border-light-outline-variant/80 bg-light-surface-container-lowest/95 px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          {slides.map((s, idx) => {
            const active = idx === activeIndex;
            return (
              <button
                key={s.sku}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Show ${s.name} (${s.sku})`}
                aria-current={active ? "true" : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  active
                    ? "w-6 bg-light-primary"
                    : "w-2 bg-light-outline-variant hover:bg-light-outline"
                }`}
              />
            );
          })}
          <span className="ml-2 font-mono text-[11px] text-light-on-surface-variant tabular-nums whitespace-nowrap">
            {activeIndex + 1} / {slides.length}
          </span>
        </div>

        <Link
          href={`/product/${currentSlide.sku}`}
          className="hidden md:inline-flex items-center gap-1 font-body text-label-md text-light-primary hover:underline truncate"
        >
          <span>View {currentSlide.sku} specs</span>
          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">arrow_forward</span>
        </Link>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Resume automatic slider" : "Pause automatic slider"}
            title={paused ? "Resume auto-slide" : "Pause auto-slide"}
            className="w-7 h-7 rounded border border-light-outline-variant text-light-on-surface-variant hover:text-light-primary hover:border-light-primary flex items-center justify-center active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              {paused ? "play_arrow" : "pause"}
            </span>
          </button>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous featured product"
            className="w-7 h-7 rounded border border-light-outline-variant text-light-on-surface hover:text-light-primary hover:border-light-primary flex items-center justify-center active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next featured product"
            className="w-7 h-7 rounded border border-light-outline-variant text-light-on-surface hover:text-light-primary hover:border-light-primary flex items-center justify-center active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
