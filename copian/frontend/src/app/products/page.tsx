"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import StorefrontShell from "@/components/StorefrontShell";
import { CardGridSkeleton, CataloguePageSkeleton } from "@/components/Skeleton";
import { useCart } from "@/components/CartContext";
import CatalogProductCard from "@/features/catalog/CatalogProductCard";
import ProductQuickViewModal from "@/features/catalog/ProductQuickViewModal";
import { catalogApi } from "@/services/catalogApi";
import { Product } from "@/types/copian";

const DEFAULT_CATEGORIES = [
  "Toner Cartridges",
  "Toner Powder",
  "OPC Drums",
  "Inkjet Ink",
  "Components",
];
const DEFAULT_BRANDS = ["HP", "Canon", "Brother", "Ricoh"];

function CatalogueContent() {
  const searchParams = useSearchParams();
  const { items: cartItems, addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableCats, setAvailableCats] = useState<string[]>(DEFAULT_CATEGORIES);
  const [availableBrands, setAvailableBrands] = useState<string[]>(DEFAULT_BRANDS);
  const [searchQ, setSearchQ] = useState(searchParams.get("q") || "");
  const [selectedCats, setSelectedCats] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(DEFAULT_BRANDS);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [quickPreview, setQuickPreview] = useState<Product | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [res, catsRes] = await Promise.all([
          catalogApi.listProducts({ status: "Published" }),
          catalogApi.listCategories().catch(() => []),
        ]);
        setProducts(res);
        const discoveredCats = Array.from(
          new Set([
            ...catsRes.map((c) => c.name),
            ...res.map((p) => p.category_name).filter(Boolean),
          ])
        );
        const discoveredBrands = Array.from(
          new Set(res.map((p) => p.brand).filter(Boolean))
        );
        if (discoveredCats.length > 0) {
          setAvailableCats(discoveredCats);
          setSelectedCats(discoveredCats);
        }
        if (discoveredBrands.length > 0) {
          setAvailableBrands(discoveredBrands);
          setSelectedBrands(discoveredBrands);
        }
        const qMap: Record<string, number> = {};
        res.forEach((p) => {
          qMap[p.sku] = p.moq;
        });
        setQuantities(qMap);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    const list = products.filter((p) => {
      const matchQ =
        !q ||
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.oem_code.toLowerCase().includes(q) ||
        p.compatible_printers_text.toLowerCase().includes(q);
      const matchC = selectedCats.includes(p.category_name);
      const matchB = selectedBrands.includes(p.brand);
      const matchS = !inStockOnly || p.stock_status === "In Stock";
      return matchQ && matchC && matchB && matchS;
    });

    if (sortBy === "yield-desc") {
      return [...list].sort((a, b) => b.page_yield - a.page_yield);
    }
    if (sortBy === "moq-asc") {
      return [...list].sort((a, b) => a.moq - b.moq);
    }
    return list;
  }, [products, searchQ, selectedCats, selectedBrands, inStockOnly, sortBy]);

  const toggleCat = (cat: string) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const resetFilters = () => {
    setSearchQ("");
    setSelectedCats(availableCats);
    setSelectedBrands(availableBrands);
    setInStockOnly(false);
    setSortBy("featured");
  };

  const getCartQty = (sku: string) => cartItems.find((c) => c.sku === sku)?.quantity || 0;
  const hasCustomFilters =
    searchQ.trim() !== "" ||
    selectedCats.length < availableCats.length ||
    selectedBrands.length < availableBrands.length ||
    inStockOnly;

  const filtersContent = (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-light-outline-variant/60 pb-3">
        <h2 className="font-headline text-title-md text-light-on-surface">Filters</h2>
        <button type="button" onClick={resetFilters} className="font-body text-label-md text-light-primary hover:underline">
          Reset all
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        <h3 className="font-body text-label-md text-light-on-surface">Category</h3>
        {availableCats.map((cat) => (
          <label key={cat} className="flex items-center gap-2.5 font-body text-body-sm text-light-on-surface-variant cursor-pointer">
            <input
              type="checkbox"
              checked={selectedCats.includes(cat)}
              onChange={() => toggleCat(cat)}
              className="rounded border-light-outline-variant text-light-primary"
            />
            <span>{cat === "Components" ? "Printer Components" : cat}</span>
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 pt-4 border-t border-light-outline-variant/60">
        <h3 className="font-body text-label-md text-light-on-surface">Printer Brand Compatibility</h3>
        {availableBrands.map((brand) => (
          <label key={brand} className="flex items-center gap-2.5 font-body text-body-sm text-light-on-surface-variant cursor-pointer">
            <input
              type="checkbox"
              checked={selectedBrands.includes(brand)}
              onChange={() => toggleBrand(brand)}
              className="rounded border-light-outline-variant text-light-primary"
            />
            <span>{brand}</span>
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 pt-4 border-t border-light-outline-variant/60">
        <h3 className="font-body text-label-md text-light-on-surface">Availability</h3>
        <label className="flex items-center gap-2.5 font-body text-body-sm text-light-on-surface-variant cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="rounded border-light-outline-variant text-light-primary"
          />
          <span>Bulk Ready (In Stock)</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-body text-body-sm text-light-on-surface-variant mb-4">
        <Link href="/" className="hover:text-light-primary">Home</Link>
        <span>/</span>
        <span className="text-light-on-surface font-medium">Product Catalogue</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-light-outline-variant mb-8">
        <div>
          <h1 className="font-headline text-headline-lg text-light-on-surface">B2B Product Catalogue</h1>
          <p className="font-body text-body-md text-light-on-surface-variant mt-1">
            Browse compatible toner cartridges, bulk powders, OPC drums, inks, and printer components.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-light-outline text-[18px]" aria-hidden="true">
              search
            </span>
            <input
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Filter by SKU, OEM code..."
              className="rounded border border-light-outline-variant bg-light-surface-container-lowest pl-9 pr-3 py-2 font-body text-body-sm w-56 focus:border-light-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="lg:hidden px-3 py-2 rounded border border-light-outline-variant bg-light-surface-container-lowest font-body text-label-md"
          >
            Filters
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort products"
            className="rounded border border-light-outline-variant bg-light-surface-container-lowest px-3 py-2 font-body text-body-md text-light-on-surface focus:border-light-primary"
          >
            <option value="featured">Sort: Featured SKUs</option>
            <option value="yield-desc">Sort: Highest Page Yield</option>
            <option value="moq-asc">Sort: Lowest MOQ</option>
          </select>
          <div className="inline-flex rounded border border-light-outline-variant bg-light-surface-container-lowest p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              className={`p-1.5 rounded ${viewMode === "grid" ? "bg-light-surface-container-low text-light-primary" : "text-light-on-surface-variant"}`}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">grid_view</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="List view"
              className={`p-1.5 rounded ${viewMode === "list" ? "bg-light-surface-container-low text-light-primary" : "text-light-on-surface-variant"}`}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="lg:hidden bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 mb-6 animate-megamenu-in">
          {filtersContent}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="hidden lg:flex lg:col-span-3 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex-col sticky top-24">
          {filtersContent}
        </aside>

        <div className="lg:col-span-9 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-body-sm text-light-on-surface-variant">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-mono-sm tabular-nums">
                Showing {filtered.length} of {products.length} SKUs
              </span>
              {hasCustomFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-2 py-0.5 rounded bg-light-secondary-container/50 text-light-primary font-body text-[12px] hover:underline"
                >
                  Clear active filters ×
                </button>
              )}
            </div>
            <span className="font-mono text-[12px]">Tiered dealer rates · Excl. GST</span>
          </div>

          {loading ? (
            <CardGridSkeleton count={6} />
          ) : filtered.length === 0 ? (
            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-10 text-center flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-light-outline text-[36px]">search_off</span>
              <p className="font-headline text-title-md text-light-on-surface">No products match your active filters</p>
              <p className="font-body text-body-sm text-light-on-surface-variant">
                Reset filters or search a different OEM code.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-1 px-4 py-2 rounded bg-light-primary text-white text-label-md"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div
              key={viewMode}
              className={`animate-surface-in ${
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch"
                  : "grid grid-cols-1 gap-4"
              }`}
            >
              {filtered.map((p) => (
                <CatalogProductCard
                  key={p.sku}
                  product={p}
                  quantity={quantities[p.sku] ?? p.moq}
                  inCartQty={getCartQty(p.sku)}
                  viewMode={viewMode}
                  onQuantityChange={(nextQty) =>
                    setQuantities((prev) => ({ ...prev, [p.sku]: nextQty }))
                  }
                  onAddToCart={() =>
                    addToCart({
                      sku: p.sku,
                      product_name: p.name,
                      description_line: p.short_desc,
                      image_url: p.image_url,
                      moq: p.moq,
                      moq_unit: p.moq_unit,
                      quantity: quantities[p.sku] ?? p.moq,
                    })
                  }
                  onQuickView={() => setQuickPreview(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ProductQuickViewModal
        product={quickPreview}
        onClose={() => setQuickPreview(null)}
        onAddToCart={(p) => {
          addToCart({
            sku: p.sku,
            product_name: p.name,
            description_line: p.short_desc,
            image_url: p.image_url,
            moq: p.moq,
            moq_unit: p.moq_unit,
            quantity: p.moq,
          });
          setQuickPreview(null);
        }}
      />
    </div>
  );
}

export default function ProductCataloguePage() {
  return (
    <StorefrontShell>
      <Suspense fallback={<CataloguePageSkeleton />}>
        <CatalogueContent />
      </Suspense>
    </StorefrontShell>
  );
}
