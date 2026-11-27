"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import StorefrontShell from "@/components/StorefrontShell";
import { ProductDetailSkeleton } from "@/components/Skeleton";
import { useCart } from "@/components/CartContext";
import { useCms } from "@/components/CmsContext";
import { apiFetch, formatINR, Product, ProductVariant } from "@/lib/api";

export default function ProductDetailView({ skuParam }: { skuParam: string }) {
  const { items: cartItems, addToCart } = useCart();
  const { volume_slabs } = useCms();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [mainImg, setMainImg] = useState("/images/hero-banner.png");
  const [zoomed, setZoomed] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(20);
  const [activeTab, setActiveTab] = useState<"specs" | "compat" | "features">("specs");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch<{ product: Product; related: Product[] }>(
          `/api/products/${encodeURIComponent(skuParam)}`
        );
        setProduct(res.product);
        setRelated(res.related);
        setMainImg(res.product.image_url || "/images/hero-banner.png");
        setQty(Math.max(res.product.moq, res.product.master_carton_qty || 20));
        if (res.product.variants && res.product.variants.length > 0) {
          setSelectedVariant(res.product.variants[0]);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [skuParam]);

  const gallery = product?.gallery_images?.length
    ? product.gallery_images
    : ["/images/hero-banner.png", "/images/toner-img-2.png", "/images/copian-banner-2.png", "/images/copian-banner-5.png"];

  const activeSku = selectedVariant?.code || product?.sku || skuParam;
  const activeMoq = selectedVariant?.moq || product?.moq || 10;
  const basePrice = selectedVariant?.dealer_price || product?.dealer_price || 680;
  const sortedSlabs = [...volume_slabs].sort((a, b) => a.min_qty - b.min_qty);
  const activeSlab = [...sortedSlabs].reverse().find((s) => qty >= s.min_qty) || sortedSlabs[0];
  const tierDiscount = (activeSlab?.discount_pct || 0) / 100;
  const effectiveUnitPrice = Math.round(basePrice * (1 - tierDiscount));
  const estTotal = effectiveUnitPrice * qty;
  const cartonCount = Math.ceil(qty / Math.max(product?.master_carton_qty || 20, 1));
  const inCartQty = cartItems.find((c) => c.sku === activeSku)?.quantity || 0;

  if (loading) {
    return (
      <StorefrontShell>
        <ProductDetailSkeleton />
      </StorefrontShell>
    );
  }

  return (
    <StorefrontShell>
      <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-8 flex flex-col gap-12">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-body text-body-sm text-light-on-surface-variant">
          <Link href="/" className="hover:text-light-primary">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-light-primary">{product?.category_name || "Toner Cartridges"}</Link>
          <span>/</span>
          <span className="text-light-on-surface font-medium">{activeSku}</span>
        </nav>

        <>
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div
                onClick={() => setZoomed((z) => !z)}
                style={{
                  backgroundImage: "radial-gradient(circle at 50% 45%, #FFFFFF 0%, #F3F3F9 100%)",
                }}
                className={`relative overflow-hidden rounded-lg border border-light-outline-variant p-8 flex items-center justify-center ${
                  zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                }`}
              >
                <img
                  key={mainImg}
                  src={mainImg}
                  alt={product?.name || "Product Image"}
                  style={{ transform: zoomed ? "scale(1.45)" : "scale(1)" }}
                  className="h-[340px] object-contain transition-transform duration-surface-enter ease-surface-enter animate-fade-in"
                />
                <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-white/90 border border-light-outline-variant font-body text-label-sm text-light-on-surface-variant">
                  {zoomed ? "Click to reset zoom" : "Click to zoom"}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {gallery.map((imgSrc, idx) => (
                  <button
                    key={`${imgSrc}-${idx}`}
                    type="button"
                    onClick={() => setMainImg(imgSrc)}
                    className={`rounded bg-light-surface-container-lowest p-2 ${
                      mainImg === imgSrc
                        ? "border-2 border-light-primary"
                        : "border border-light-outline-variant hover:border-light-primary"
                    }`}
                  >
                    <img src={imgSrc} alt={`View ${idx + 1}`} className="h-16 w-full object-contain" />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-mono-md text-light-primary bg-light-secondary-container/40 px-2.5 py-1 rounded">
                    SKU: {activeSku}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-container text-on-success-container font-body text-label-md">
                    {product?.stock_status || "In Stock"} · Bulk Ready
                  </span>
                  {inCartQty > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-light-primary text-white font-mono text-mono-sm">
                      In Inquiry Cart: {inCartQty}
                    </span>
                  )}
                </div>
                <h1 className="font-headline text-headline-lg text-light-on-surface mt-1">
                  {product?.name || "Copian Compatible Toner Cartridge"}
                </h1>
                <p className="font-body text-body-md text-light-on-surface-variant">
                  {product?.detailed_desc || `OEM Reference: ${product?.oem_code || "CF226A"}`}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {sortedSlabs.map((slab) => {
                  const targetQty = Math.max(activeMoq, slab.min_qty === 1 ? activeMoq : slab.min_qty);
                  const isActive = activeSlab?.min_qty === slab.min_qty;
                  const unitPrice = Math.round(basePrice * (1 - slab.discount_pct / 100));
                  const rangeLabel = slab.max_qty
                    ? `${slab.min_qty === 1 ? activeMoq : slab.min_qty}–${slab.max_qty} units`
                    : `${slab.min_qty}+ units`;
                  return (
                    <button
                      key={slab.label}
                      type="button"
                      onClick={() => setQty(targetQty)}
                      className={`rounded-md p-3 text-left border transition-all duration-state-change hover:-translate-y-0.5 hover:shadow-sm ${
                        isActive
                          ? "border-light-primary bg-light-secondary-container/25 shadow-sm"
                          : "border-light-outline-variant bg-light-surface-container-lowest hover:border-light-primary/60"
                      }`}
                    >
                      <span className="font-mono text-[11px] text-light-on-surface-variant block">{rangeLabel}</span>
                      <span className="font-mono text-title-md font-semibold text-light-on-surface tabular-nums">
                        {formatINR(unitPrice)}
                      </span>
                      <span className="font-body text-[11px] text-success block">
                        {slab.discount_pct > 0 ? `Save ${slab.discount_pct}%` : "Dealer Base"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {product?.variants && product.variants.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="font-body text-label-md text-light-on-surface">Select Yield Variant</span>
                  <div className="grid grid-cols-2 gap-3">
                    {product.variants.map((v) => {
                      const active = selectedVariant?.code === v.code;
                      return (
                        <button
                          key={v.code}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`rounded-md p-3 text-left bg-light-surface-container-lowest ${
                            active
                              ? "border-2 border-light-primary"
                              : "border border-light-outline-variant hover:border-light-primary"
                          }`}
                        >
                          <p className="font-body text-label-lg text-light-on-surface">{v.label}</p>
                          <p className="font-mono text-mono-sm text-light-on-surface-variant">
                            {v.yield_text} · MOQ {v.moq}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-light-surface-container-low border border-light-outline-variant rounded-md p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="font-body text-label-md text-light-on-surface">Bulk Inquiry Quantity</p>
                    <p className="font-body text-body-sm text-light-on-surface-variant">
                      MOQ <span className="font-mono text-light-on-surface">{activeMoq}</span> · Est.{" "}
                      <span className="font-mono text-light-on-surface">{cartonCount} master carton(s)</span>
                    </p>
                  </div>
                  <div className="inline-flex items-center border border-light-outline-variant rounded bg-light-surface-container-lowest">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(activeMoq, q - 10))}
                      className="px-3 py-2 text-light-on-surface hover:bg-light-surface-container-low"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={qty}
                      min={activeMoq}
                      step={10}
                      onChange={(e) => setQty(Math.max(activeMoq, Number(e.target.value) || activeMoq))}
                      className="w-20 text-center border-0 py-2 font-mono text-mono-md tabular-nums focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 10)}
                      className="px-3 py-2 text-light-on-surface hover:bg-light-surface-container-low"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-body-sm pt-2 border-t border-light-outline-variant/60">
                  <span className="text-light-on-surface-variant">
                    Est. Bulk Value ({formatINR(effectiveUnitPrice)}/u excl. GST)
                  </span>
                  <span className="font-mono text-title-md font-semibold text-light-primary tabular-nums">
                    {formatINR(estTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      addToCart({
                        sku: activeSku,
                        product_name: selectedVariant ? `${product?.name} (${selectedVariant.label})` : product?.name || activeSku,
                        description_line: selectedVariant?.yield_text || product?.yield_text || "",
                        image_url: mainImg,
                        moq: activeMoq,
                        moq_unit: product?.moq_unit || "units",
                        quantity: qty,
                      })
                    }
                    className="px-5 py-3 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container transition-colors duration-state-change"
                  >
                    Add to Inquiry Cart
                  </button>
                  <Link
                    href="/inquiry-cart"
                    className="inline-flex items-center justify-center px-5 py-3 rounded border border-light-outline-variant bg-light-surface-container-lowest text-light-on-surface font-body text-label-lg hover:bg-light-surface-container-low"
                  >
                    Request Bulk Quotation
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-body text-body-sm text-light-on-surface-variant">
                  <li className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-success text-[16px]" aria-hidden="true">check_circle</span>
                    Smart chip installed
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-success text-[16px]" aria-hidden="true">check_circle</span>
                    ISO/IEC 19752 tested
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-success text-[16px]" aria-hidden="true">check_circle</span>
                    Airbag carton seal
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-success text-[16px]" aria-hidden="true">check_circle</span>
                    HSN {product?.hsn_code || "8443"} GST
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-light-outline-variant font-body text-label-md text-light-primary hover:bg-light-surface-container-low no-print"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  Print Spec Sheet
                </button>
              </div>
            </div>
          </section>

        <section className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md overflow-hidden">
          <div role="tablist" className="flex border-b border-light-outline-variant bg-light-surface-container-low overflow-x-auto">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "specs"}
              onClick={() => setActiveTab("specs")}
              className={`px-6 py-3.5 font-body text-label-lg whitespace-nowrap ${
                activeTab === "specs"
                  ? "text-light-primary border-b-2 border-light-primary bg-light-surface-container-lowest"
                  : "text-light-on-surface-variant hover:text-light-on-surface"
              }`}
            >
              Technical Specifications
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "compat"}
              onClick={() => setActiveTab("compat")}
              className={`px-6 py-3.5 font-body text-label-lg whitespace-nowrap ${
                activeTab === "compat"
                  ? "text-light-primary border-b-2 border-light-primary bg-light-surface-container-lowest"
                  : "text-light-on-surface-variant hover:text-light-on-surface"
              }`}
            >
              Compatible Printer Models
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "features"}
              onClick={() => setActiveTab("features")}
              className={`px-6 py-3.5 font-body text-label-lg whitespace-nowrap ${
                activeTab === "features"
                  ? "text-light-primary border-b-2 border-light-primary bg-light-surface-container-lowest"
                  : "text-light-on-surface-variant hover:text-light-on-surface"
              }`}
            >
              Features &amp; Packaging
            </button>
          </div>

          {activeTab === "specs" && (
            <div key="specs" className="p-4 sm:p-6 overflow-x-auto animate-surface-in">
              <table className="w-full text-left border-collapse min-w-[300px]">
                <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-md">
                  <tr>
                    <td className="py-3 text-light-on-surface-variant w-1/3">Copian SKU</td>
                    <td className="py-3 font-mono text-mono-md text-light-on-surface">{activeSku}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-light-on-surface-variant">OEM Equivalent</td>
                    <td className="py-3 font-mono text-mono-md text-light-on-surface">{product?.oem_code || "—"}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-light-on-surface-variant">Page Yield</td>
                    <td className="py-3 font-mono text-mono-md text-light-on-surface tabular-nums">
                      {selectedVariant?.yield_text || product?.yield_text || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-light-on-surface-variant">Chip Included</td>
                    <td className="py-3 text-light-on-surface">{product?.chip_included || "—"}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-light-on-surface-variant">Master Carton Packing</td>
                    <td className="py-3 font-mono text-mono-md text-light-on-surface tabular-nums">
                      {product?.master_carton_qty || 20} units / carton
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "compat" && (
            <div key="compat" className="p-6 animate-surface-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-body text-body-md text-light-on-surface">
                {(product?.compatible_models || [product?.compatible_printers_text || ""]).map((m) => (
                  <div key={m} className="p-3 rounded bg-light-surface-container-low">
                    {m}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "features" && (
            <div key="features" className="p-6 font-body text-body-md text-light-on-surface-variant space-y-3 animate-surface-in">
              {(product?.features || []).map((f, idx) => (
                <p key={idx}>{f}</p>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="font-headline text-headline-md text-light-on-surface">Related Compatible Supplies</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((r) => (
              <Link
                key={r.sku}
                href={`/product/${r.sku}`}
                className="group bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex items-center gap-4 hover:border-light-primary hover:-translate-y-0.5 hover:shadow-md transition-all duration-surface-enter ease-surface-enter"
              >
                <img src={r.image_url} alt={r.name} className="w-16 h-16 object-contain group-hover:scale-105 transition-transform duration-surface-enter ease-surface-enter" />
                <div>
                  <span className="font-mono text-mono-sm text-light-primary">{r.sku}</span>
                  <h3 className="font-headline text-title-md text-light-on-surface">{r.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
          </>
      </div>
    </StorefrontShell>
  );
}
