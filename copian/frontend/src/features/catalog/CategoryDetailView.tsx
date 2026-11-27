"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import StorefrontShell from "@/components/StorefrontShell";
import { useCart } from "@/components/CartContext";
import { CardGridSkeleton, Skeleton } from "@/components/Skeleton";
import { apiFetch, Category, formatINR, Product } from "@/lib/api";

export default function CategoryDetailView({ slug }: { slug: string }) {
  const { addToCart, items } = useCart();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState("All Brands");
  const [sortBy, setSortBy] = useState("popularity");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch<{ category: Category; products: Product[] }>(`/api/categories/${slug}`);
        setCategory(res.category);
        setProducts(res.products);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const brands = useMemo(() => {
    const bset = Array.from(new Set(products.map((p) => p.brand)));
    return ["All Brands", ...bset];
  }, [products]);

  const filtered = useMemo(() => {
    const list = selectedBrand === "All Brands" ? products : products.filter((p) => p.brand === selectedBrand);
    if (sortBy === "yield") {
      return [...list].sort((a, b) => b.page_yield - a.page_yield);
    }
    return list;
  }, [products, selectedBrand, sortBy]);

  return (
    <StorefrontShell>
      <section className="bg-light-surface-container-lowest border-b border-light-outline-variant">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 flex flex-col gap-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-body text-body-sm text-light-on-surface-variant">
              <Link href="/" className="hover:text-light-primary">Home</Link>
              <span>/</span>
              <Link href="/products" className="hover:text-light-primary">Products</Link>
              <span>/</span>
              <span className="text-light-on-surface font-medium">{category?.name || "Category"}</span>
            </nav>
            {loading && !category ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-80" />
                <Skeleton className="h-12 w-full max-w-lg" />
              </div>
            ) : (
              <>
                <h1 className="font-headline text-display-md-mobile lg:text-display-md text-light-on-surface">
                  {category?.name === "Toner Cartridges" ? "Compatible Laser Toner Cartridges" : category?.name || "Consumables"}
                </h1>
                <p className="font-body text-body-lg text-light-on-surface-variant max-w-prose">
                  {category?.description}
                </p>
              </>
            )}
          </div>
          <div className="lg:col-span-4 flex justify-end">
            {loading && !category ? (
              <Skeleton className="h-44 w-56 rounded-md" />
            ) : (
              <img
                src={category?.image_url || "/images/toner-cartridge.png"}
                alt={category?.name || "Category"}
                className="h-44 object-contain rounded-md border border-light-outline-variant p-3 bg-light-surface-container-low"
              />
            )}
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-10 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body text-label-md text-light-on-surface-variant mr-2">Brand:</span>
            {brands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                className={`px-3 py-1.5 rounded-full font-body text-label-md ${
                  selectedBrand === brand
                    ? "bg-light-primary text-light-on-primary"
                    : "border border-light-outline-variant text-light-on-surface hover:bg-light-surface-container-low"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort category products"
            className="rounded border border-light-outline-variant bg-light-surface-container-lowest px-3 py-1.5 font-body text-body-sm"
          >
            <option value="popularity">Sort by: Popularity</option>
            <option value="yield">Sort by: Highest Yield</option>
          </select>
        </div>

        {loading ? (
          <CardGridSkeleton count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((p) => {
              const inCart = items.find((it) => it.sku === p.sku);
              return (
                <article
                  key={p.sku}
                  className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col justify-between gap-4 hover:border-light-primary/40 transition-colors"
                >
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-36 object-contain bg-light-surface-container-low rounded p-3"
                      />
                      {inCart && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-light-primary text-white font-mono text-[10px]">
                          In Cart: {inCart.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-mono-sm text-light-primary">{p.sku}</span>
                      <span className="font-mono text-[11px] text-light-on-surface-variant">
                        MOQ {p.moq} {p.moq_unit}
                      </span>
                    </div>
                    <h2 className="font-headline text-title-md text-light-on-surface">{p.name}</h2>
                    <p className="font-body text-body-sm text-light-on-surface-variant">
                      {p.compatible_printers_text} · {p.page_yield.toLocaleString()} pages
                    </p>
                    <p className="font-mono text-mono-sm font-semibold text-light-on-surface">
                      Dealer Base: {formatINR(p.dealer_price)} / {p.moq_unit.replace(/s$/, "")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-light-outline-variant/60">
                    <button
                      type="button"
                      onClick={() =>
                        addToCart({
                          sku: p.sku,
                          product_name: p.name,
                          description_line: p.short_desc,
                          image_url: p.image_url,
                          moq: p.moq,
                          moq_unit: p.moq_unit,
                          quantity: p.moq,
                        })
                      }
                      className="flex-1 text-center px-3 py-2 rounded bg-light-primary text-light-on-primary font-body text-label-md hover:bg-light-primary-container"
                    >
                      {inCart ? "Add Another MOQ" : "Add to Inquiry"}
                    </button>
                    <Link
                      href={`/product/${p.sku}`}
                      className="px-3 py-2 rounded border border-light-outline-variant font-body text-label-md hover:bg-light-surface-container-low"
                    >
                      Details
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-light-outline-variant">
          <div className="lg:col-span-7 flex flex-col gap-3">
            <h2 className="font-headline text-headline-sm text-light-on-surface">
              Bulk Procurement Guide: {category?.name || "Consumables"}
            </h2>
            <p className="font-body text-body-md text-light-on-surface-variant">{category?.seo_guide}</p>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-3">
            <h3 className="font-headline text-title-md text-light-on-surface">Related Categories</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/category/toner-powder" className="p-3 rounded border border-light-outline-variant bg-light-surface-container-lowest font-body text-label-md hover:border-light-primary">
                Toner Powder
              </Link>
              <Link href="/category/opc-drums" className="p-3 rounded border border-light-outline-variant bg-light-surface-container-lowest font-body text-label-md hover:border-light-primary">
                OPC Drums
              </Link>
              <Link href="/category/inkjet-ink" className="p-3 rounded border border-light-outline-variant bg-light-surface-container-lowest font-body text-label-md hover:border-light-primary">
                Inkjet Ink
              </Link>
              <Link href="/category/components" className="p-3 rounded border border-light-outline-variant bg-light-surface-container-lowest font-body text-label-md hover:border-light-primary">
                Fuser Rollers
              </Link>
            </div>
          </div>
        </div>
      </section>
    </StorefrontShell>
  );
}
