"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import StorefrontShell from "@/components/StorefrontShell";
import { CompatibilitySkeleton, TableRowsSkeleton } from "@/components/Skeleton";
import { useCart } from "@/components/CartContext";
import { apiFetch, formatINR, Product } from "@/lib/api";

function CompatibilityContent() {
  const searchParams = useSearchParams();
  const { items: cartItems, addToCart } = useCart();

  const [brand, setBrand] = useState(searchParams.get("brand") || "HP");
  const [model, setModel] = useState(searchParams.get("model") || "LaserJet Pro M402dn");
  const [modelsByBrand, setModelsByBrand] = useState<Record<string, { model_name: string }[]>>({
    HP: [{ model_name: "LaserJet Pro M402dn" }, { model_name: "LaserJet Pro M1136 MFP" }, { model_name: "LaserJet P1007 / P1008" }],
    Canon: [{ model_name: "imageCLASS MF232w" }, { model_name: "imageCLASS MF244dw" }],
    Brother: [{ model_name: "HL-L2321D" }, { model_name: "InkBenefit DCP-T520W" }],
    Ricoh: [{ model_name: "Aficio SP 210" }],
  });
  const [matches, setMatches] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultTitle, setResultTitle] = useState("Compatible Supplies for HP LaserJet Pro M402dn");

  const runLookup = async (b: string, m: string) => {
    setLoading(true);
    try {
      const res = await apiFetch<{ brand: string; model: string; matches: Product[] }>(
        `/api/compatibility?brand=${encodeURIComponent(b)}&model=${encodeURIComponent(m)}`
      );
      setMatches(res.matches);
      setResultTitle(`Compatible Supplies for ${b} ${m || "Selected Model"}`);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const bRes = await apiFetch<{ models_by_brand: Record<string, { model_name: string }[]> }>("/api/compatibility/brands");
        if (bRes.models_by_brand && Object.keys(bRes.models_by_brand).length > 0) {
          setModelsByBrand(bRes.models_by_brand);
        }
      } catch {
        // ignore
      }
      runLookup(brand, model);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allModelsForDatalist = Object.values(modelsByBrand)
    .flat()
    .map((m) => m.model_name);

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-8 flex flex-col gap-10">
      <section className="bg-light-surface-container-lowest border border-light-outline-variant rounded-lg p-6 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-mono-sm text-light-primary uppercase">Fleet Lookup Tool</span>
            <h1 className="font-headline text-headline-lg text-light-on-surface mt-1">Printer Compatibility Finder</h1>
            <p className="font-body text-body-md text-light-on-surface-variant mt-1">
              Select your printer manufacturer and model—or type to filter—to view and compare verified Copian consumables.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(modelsByBrand).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => {
                  setBrand(b);
                  const m0 = modelsByBrand[b]?.[0]?.model_name || "";
                  setModel(m0);
                  runLookup(b, m0);
                }}
                className={`px-3 py-1.5 rounded-full font-mono text-mono-sm ${
                  brand === b
                    ? "bg-light-primary text-white"
                    : "border border-light-outline-variant bg-light-surface-container-low text-light-on-surface"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cf-brand" className="font-body text-label-md text-light-on-surface">
              1. Printer Manufacturer
            </label>
            <select
              id="cf-brand"
              value={brand}
              onChange={(e) => {
                const nb = e.target.value;
                setBrand(nb);
                const firstModel = modelsByBrand[nb]?.[0]?.model_name || "";
                setModel(firstModel);
              }}
              className="rounded border border-light-outline-variant bg-light-surface-container-lowest px-3.5 py-2.5 font-body text-body-md"
            >
              {Object.keys(modelsByBrand).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cf-model" className="font-body text-label-md text-light-on-surface">
              2. Printer Model
            </label>
            <input
              id="cf-model"
              list="cf-model-list"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Type or select printer model..."
              className="rounded border border-light-outline-variant bg-light-surface-container-lowest px-3.5 py-2.5 font-body text-body-md"
            />
            <datalist id="cf-model-list">
              {allModelsForDatalist.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <button
            type="button"
            onClick={() => {
              runLookup(brand, model);
              document.getElementById("compat-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="px-6 py-2.5 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container active:scale-[0.98]"
          >
            Show Compatible Supplies
          </button>
        </div>
      </section>

      <section id="compat-results" className="flex flex-col gap-4 scroll-mt-24">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-headline text-headline-md text-light-on-surface">{resultTitle}</h2>
          <span className="font-mono text-mono-sm text-light-primary">{matches.length} Verified Matches</span>
        </div>

        <div className="overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest">
          <table className="w-full text-left border-collapse">
            <thead className="bg-light-surface-container-low border-b border-light-outline-variant">
              <tr>
                <th className="px-4 py-3 font-body text-label-md text-light-on-surface-variant">Copian SKU</th>
                <th className="px-4 py-3 font-body text-label-md text-light-on-surface-variant">Product &amp; OEM</th>
                <th className="px-4 py-3 font-body text-label-md text-light-on-surface-variant">Type</th>
                <th className="px-4 py-3 font-body text-label-md text-light-on-surface-variant">Yield / Spec</th>
                <th className="px-4 py-3 font-body text-label-md text-light-on-surface-variant">Dealer Base</th>
                <th className="px-4 py-3 font-body text-label-md text-light-on-surface-variant">MOQ</th>
                <th className="px-4 py-3 font-body text-label-md text-light-on-surface-variant">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-md">
              {loading ? (
                <TableRowsSkeleton rows={5} cols={7} />
              ) : (
                <>
              {matches.map((p) => {
                const inCart = cartItems.find((c) => c.sku === p.sku)?.quantity || 0;
                return (
                  <tr key={p.sku} className="hover:bg-light-surface-container-low/50">
                    <td className="px-4 py-3.5 font-mono text-mono-md text-light-primary">
                      <Link href={`/product/${p.sku}`} className="hover:underline">{p.sku}</Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-light-on-surface">{p.name}</p>
                      <p className="font-mono text-[11px] text-light-on-surface-variant">OEM: {p.oem_code}</p>
                    </td>
                    <td className="px-4 py-3.5 text-light-on-surface-variant">{p.category_name}</td>
                    <td className="px-4 py-3.5 font-mono text-mono-sm tabular-nums">{p.page_yield.toLocaleString()} pages</td>
                    <td className="px-4 py-3.5 font-mono text-mono-sm tabular-nums">{formatINR(p.dealer_price)}/u</td>
                    <td className="px-4 py-3.5 font-mono text-mono-sm tabular-nums">{p.moq} {p.moq_unit}</td>
                    <td className="px-4 py-3.5">
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
                        className="px-3 py-1.5 rounded bg-light-primary text-light-on-primary text-label-md hover:bg-light-primary-container whitespace-nowrap"
                      >
                        {inCart > 0 ? `In Cart (${inCart}) +` : "Add to Inquiry"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {matches.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-light-on-surface-variant">
                    No direct matches found for &quot;{model}&quot;. Try LaserJet Pro M402dn, M1136, or MF232w.
                  </td>
                </tr>
              )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function CompatibilityFinderPage() {
  return (
    <StorefrontShell>
      <Suspense fallback={<CompatibilitySkeleton />}>
        <CompatibilityContent />
      </Suspense>
    </StorefrontShell>
  );
}
