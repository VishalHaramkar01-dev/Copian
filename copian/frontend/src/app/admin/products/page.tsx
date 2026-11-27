"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth } from "@/components/AdminAuthContext";
import ConfirmModal from "@/components/ConfirmModal";
import { TableRowsSkeleton } from "@/components/Skeleton";
import { useCart } from "@/components/CartContext";
import { useCms } from "@/components/CmsContext";
import { API_BASE, apiFetch, downloadAuthenticatedFile, getErrorMessage } from "@/lib/api";
import { adminApi } from "@/services/adminApi";
import { catalogApi } from "@/services/catalogApi";
import { Category, Product } from "@/types/copian";

const REAL_IMAGES = [
  "/images/toner-cartridge.png",
  "/images/hero-banner.png",
  "/images/toner-img-2.png",
  "/images/copian-banner-2.png",
  "/images/copian-banner-5.png",
];

export default function AdminProductsPage() {
  const { canAction } = useAdminAuth();
  const { showToast } = useCart();
  const { about } = useCms();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [compatModels, setCompatModels] = useState<Record<string, { id?: number; model_name: string; series?: string }[]>>({});
  const [activeTab, setActiveTab] = useState<"list" | "form" | "meta">("list");

  const [newCatName, setNewCatName] = useState("");
  const [newCatSub, setNewCatSub] = useState("");
  const [newPmBrand, setNewPmBrand] = useState("HP");
  const [newPmModel, setNewPmModel] = useState("");
  const [newPmSeries, setNewPmSeries] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [catFilter, setCatFilter] = useState("All Categories");
  const [brandFilter, setBrandFilter] = useState("All Brands");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [name, setName] = useState("Copian 26A Enterprise Toner");
  const [sku, setSku] = useState("CPN-HP-26A");
  const [categoryName, setCategoryName] = useState("Toner Cartridges");
  const [brand, setBrand] = useState("HP");
  const [detailedDesc, setDetailedDesc] = useState("");
  const [yieldText, setYieldText] = useState("3,100 pages");
  const [weightGrams, setWeightGrams] = useState("840g");
  const [oemCode, setOemCode] = useState("CF226A");
  const [compatText, setCompatText] = useState("HP LaserJet Pro M402d, M402dn, M402dw, MFP M426fdw");
  const [seoTitle, setSeoTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [imageUrl, setImageUrl] = useState("/images/toner-cartridge.png");
  const [dealerPrice, setDealerPrice] = useState(680);
  const [moq, setMoq] = useState(10);
  const [gstRate, setGstRate] = useState(18);
  const [initialStock, setInitialStock] = useState(100);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const imgUploadRef = useRef<HTMLInputElement>(null);

  const loadProducts = async () => {
    try {
      const [res, catsRes, compatRes] = await Promise.all([
        apiFetch<Product[]>("/api/products"),
        catalogApi.listCategories().catch(() => []),
        catalogApi.getCompatibilityBrands().catch(() => ({ brands: [], models_by_brand: {} })),
      ]);
      setProducts(res);
      setCategories(catsRes);
      setCompatModels(compatRes.models_by_brand || {});
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const brandOptions = useMemo(
    () => Array.from(new Set([...about.oem_brands, ...products.map((p) => p.brand).filter(Boolean)])),
    [about.oem_brands, products]
  );

  const categoryOptions = useMemo(
    () =>
      categories.length > 0
        ? categories.map((c) => c.name)
        : ["Toner Cartridges", "Toner Powder", "OPC Drums", "Inkjet Ink", "Components"],
    [categories]
  );

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return products.filter((p) => {
      const mQ =
        !q ||
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.oem_code.toLowerCase().includes(q);
      const mC = catFilter === "All Categories" || p.category_name === catFilter;
      const mB = brandFilter === "All Brands" || p.brand === brandFilter;
      return mQ && mC && mB;
    });
  }, [products, searchQ, catFilter, brandFilter]);

  const startNewProduct = () => {
    setEditingId(null);
    setName("");
    setSku("");
    setCategoryName("Toner Cartridges");
    setBrand("HP");
    setDetailedDesc("");
    setYieldText("2,500 pages");
    setWeightGrams("750g");
    setOemCode("");
    setCompatText("");
    setSeoTitle("");
    setSlug("");
    setMetaDesc("");
    setImageUrl("/images/toner-cartridge.png");
    setDealerPrice(550);
    setMoq(10);
    setGstRate(18);
    setInitialStock(100);
    setActiveTab("form");
  };

  const startEditProduct = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setSku(p.sku);
    setCategoryName(p.category_name);
    setBrand(p.brand);
    setDetailedDesc(p.detailed_desc);
    setYieldText(p.yield_text || `${p.page_yield} pages`);
    setWeightGrams(p.weight_grams);
    setOemCode(p.oem_code);
    setCompatText(p.compatible_printers_text);
    setSeoTitle(p.seo_title);
    setSlug(p.slug);
    setMetaDesc(p.meta_description);
    setImageUrl(p.image_url);
    setDealerPrice(p.dealer_price);
    setMoq(p.moq);
    setGstRate(p.gst_rate);
    setActiveTab("form");
  };

  const saveProduct = async (status: "Published" | "Draft") => {
    if (!name.trim() || !sku.trim()) {
      showToast("Product Name and SKU are required.");
      return;
    }
    const parsedYield = parseInt(yieldText.replace(/[^0-9]/g, ""), 10) || 1500;
    const payload = {
      name: name.trim(),
      sku: sku.trim(),
      slug: slug.trim() || undefined,
      category_name: categoryName,
      brand,
      detailed_desc: detailedDesc,
      short_desc: detailedDesc.slice(0, 140) || `${parsedYield.toLocaleString()}-page yield`,
      page_yield: parsedYield,
      yield_text: yieldText,
      weight_grams: weightGrams,
      oem_code: oemCode,
      compatible_printers_text: compatText,
      seo_title: seoTitle,
      meta_description: metaDesc,
      image_url: imageUrl,
      dealer_price: Number(dealerPrice),
      moq: Number(moq),
      gst_rate: Number(gstRate),
      status,
      initial_stock: Number(initialStock),
    };
    try {
      if (editingId) {
        await apiFetch(`/api/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast(`Updated ${sku} (${status})`);
      } else {
        await apiFetch("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast(`Created ${sku} (${status})`);
      }
      await loadProducts();
      setActiveTab("list");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save product");
    }
  };

  const handleBulkAction = async (action: "publish" | "draft" | "delete") => {
    if (selectedIds.length === 0) return;
    try {
      await apiFetch("/api/products/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds, action }),
      });
      const count = selectedIds.length;
      setSelectedIds([]);
      setConfirmDeleteOpen(false);
      await loadProducts();
      showToast(`Applied ${action} to ${count} product(s).`);
    } catch (err) {
      showToast(getErrorMessage(err, "Bulk action failed."));
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch<{ imported: number }>("/api/products/import/csv", {
        method: "POST",
        body: fd,
      });
      await loadProducts();
      showToast(`Imported ${res.imported} products from CSV.`);
    } catch (err) {
      showToast(getErrorMessage(err, "CSV import failed."));
    } finally {
      e.target.value = "";
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch<{ url: string }>("/api/upload", {
        method: "POST",
        body: fd,
      });
      setImageUrl(res.url);
      showToast("Image uploaded.");
    } catch (err) {
      showToast(getErrorMessage(err, "Image upload failed."));
    } finally {
      e.target.value = "";
    }
  };

  return (
    <AdminShell
      breadcrumb={["Catalog", "Product Management"]}
      headerRight={
        canAction("Products & Categories", "create") ? (
          <button
            type="button"
            onClick={startNewProduct}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-light-primary text-light-on-primary font-body text-label-md hover:bg-light-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            <span>Add Product</span>
          </button>
        ) : undefined
      }
    >
      <div role="tablist" className="inline-flex flex-nowrap overflow-x-auto max-w-full rounded border border-light-outline-variant bg-light-surface-container-lowest p-1 gap-1 w-fit">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "list"}
          onClick={() => setActiveTab("list")}
          className={`px-3.5 sm:px-4 py-1.5 rounded font-body text-label-md whitespace-nowrap shrink-0 ${
            activeTab === "list"
              ? "bg-light-primary text-light-on-primary"
              : "text-light-on-surface-variant hover:text-light-on-surface"
          }`}
        >
          All Products ({products.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "form"}
          onClick={() => setActiveTab("form")}
          className={`px-3.5 sm:px-4 py-1.5 rounded font-body text-label-md whitespace-nowrap shrink-0 ${
            activeTab === "form"
              ? "bg-light-primary text-light-on-primary"
              : "text-light-on-surface-variant hover:text-light-on-surface"
          }`}
        >
          {editingId ? `Edit Product (${sku})` : "Add / Edit Product"}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "meta"}
          onClick={() => setActiveTab("meta")}
          className={`px-3.5 sm:px-4 py-1.5 rounded font-body text-label-md whitespace-nowrap shrink-0 ${
            activeTab === "meta"
              ? "bg-light-primary text-light-on-primary"
              : "text-light-on-surface-variant hover:text-light-on-surface"
          }`}
        >
          Categories &amp; Printers ({categories.length})
        </button>
      </div>

      {activeTab === "list" && (
        <section className="flex flex-col gap-4">
          <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <input
                type="search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search SKU, product name, or OEM code..."
                className="rounded border border-light-outline-variant px-3 py-1.5 font-body text-body-sm w-64"
              />
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-1.5 font-body text-body-sm"
              >
                <option>All Categories</option>
                {categoryOptions.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-1.5 font-body text-body-sm"
              >
                <option>All Brands</option>
                {brandOptions.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <>
                  {canAction("Products & Categories", "edit") && (
                    <button
                      type="button"
                      onClick={() => handleBulkAction("publish")}
                      className="px-3 py-1.5 rounded bg-success-container text-on-success-container text-label-md"
                    >
                      Publish ({selectedIds.length})
                    </button>
                  )}
                  {canAction("Products & Categories", "delete") && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteOpen(true)}
                      className="px-3 py-1.5 rounded bg-light-error-container text-light-on-error-container text-label-md"
                    >
                      Delete ({selectedIds.length})
                    </button>
                  )}
                </>
              )}
              <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
              {canAction("Products & Categories", "create") && (
                <button
                  type="button"
                  onClick={() => csvInputRef.current?.click()}
                  className="px-3 py-1.5 rounded border border-light-outline-variant font-body text-label-md hover:bg-light-surface-container-low"
                >
                  Import CSV
                </button>
              )}
              {canAction("Products & Categories", "export") && (
                <button
                  type="button"
                  onClick={() =>
                    downloadAuthenticatedFile("/api/products/export/csv", "copian-products.csv").catch((err) =>
                      showToast(getErrorMessage(err, "Export failed"))
                    )
                  }
                  className="px-3 py-1.5 rounded border border-light-outline-variant font-body text-label-md hover:bg-light-surface-container-low"
                >
                  Export CSV
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-light-outline-variant bg-light-surface-container-lowest max-h-[640px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-light-surface-container-low border-b border-light-outline-variant font-body text-label-md text-light-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                      onChange={(e) =>
                        setSelectedIds(e.target.checked ? filtered.map((p) => p.id) : [])
                      }
                      aria-label="Select all"
                      className="rounded border-light-outline-variant"
                    />
                  </th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Available Qty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-outline-variant/60 font-body text-body-sm">
                {loading
                  ? <TableRowsSkeleton rows={7} cols={8} />
                  : filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-light-surface-container-low/50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                              )
                            }
                            className="rounded border-light-outline-variant"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-10 h-10 rounded object-contain border border-light-outline-variant/60 bg-white shrink-0"
                            />
                            <span className="font-medium text-light-on-surface">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-light-primary whitespace-nowrap">{p.sku}</td>
                        <td className="px-4 py-3 text-light-on-surface-variant whitespace-nowrap">{p.category_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{p.brand}</td>
                        <td
                          className={`px-4 py-3 font-mono tabular-nums whitespace-nowrap ${
                            p.available_qty <= p.reorder_level ? "text-warning font-semibold" : ""
                          }`}
                        >
                          {p.available_qty.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-label-sm whitespace-nowrap inline-block ${
                              p.status === "Published"
                                ? p.available_qty <= p.reorder_level
                                  ? "bg-warning-container text-on-warning-container"
                                  : "bg-success-container text-on-success-container"
                                : "bg-light-surface-container text-light-on-surface-variant"
                            }`}
                          >
                            {p.available_qty <= p.reorder_level ? "Low Stock" : p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => startEditProduct(p)}
                            className="text-light-primary font-medium hover:underline mr-3"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {activeTab === "form" && (
        <section className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-4">
                <h2 className="font-headline text-title-lg text-light-on-surface">1. Basic Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-label-md">Product Name</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded border border-light-outline-variant px-3 py-2 text-body-md"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label-md">SKU</span>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-md"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label-md">Category</span>
                    <select
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="rounded border border-light-outline-variant px-3 py-2 text-body-md"
                    >
                      {categoryOptions.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label-md">Brand</span>
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="rounded border border-light-outline-variant px-3 py-2 text-body-md"
                    >
                      {brandOptions.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-label-md">Detailed Description</span>
                  <textarea
                    rows={3}
                    value={detailedDesc}
                    onChange={(e) => setDetailedDesc(e.target.value)}
                    className="rounded border border-light-outline-variant px-3 py-2 text-body-md"
                  />
                </label>
              </div>

              <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-4">
                <h2 className="font-headline text-title-lg text-light-on-surface">
                  2. Specifications &amp; Printer Compatibility
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-label-md">Page Yield</span>
                    <input
                      type="text"
                      value={yieldText}
                      onChange={(e) => setYieldText(e.target.value)}
                      className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label-md">Weight (g)</span>
                    <input
                      type="text"
                      value={weightGrams}
                      onChange={(e) => setWeightGrams(e.target.value)}
                      className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label-md">OEM Code</span>
                    <input
                      type="text"
                      value={oemCode}
                      onChange={(e) => setOemCode(e.target.value)}
                      className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-label-md">Compatible Printer Models</span>
                  <input
                    type="text"
                    value={compatText}
                    onChange={(e) => setCompatText(e.target.value)}
                    className="rounded border border-light-outline-variant px-3 py-2 text-body-md"
                  />
                </label>
              </div>

              <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-4">
                <h2 className="font-headline text-title-lg text-light-on-surface">3. SEO Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-label-md">SEO Title</span>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="rounded border border-light-outline-variant px-3 py-2 text-body-md"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-label-md">URL Slug</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-label-md">Meta Description</span>
                  <textarea
                    rows={2}
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    className="rounded border border-light-outline-variant px-3 py-2 text-body-sm"
                  />
                </label>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-4">
                <h2 className="font-headline text-title-lg text-light-on-surface">4. Product Media</h2>
                <div className="rounded bg-light-surface-container-low border border-dashed border-light-outline-variant p-4 flex flex-col items-center gap-3">
                  <img src={imageUrl} alt="Product preview" className="h-32 object-contain" />
                  <input ref={imgUploadRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <button
                    type="button"
                    onClick={() => imgUploadRef.current?.click()}
                    className="text-label-md text-light-primary hover:underline"
                  >
                    Upload New Image
                  </button>
                  <select
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    aria-label="Choose from Copian assets"
                    className="w-full rounded border border-light-outline-variant px-2 py-1 text-body-sm"
                  >
                    {REAL_IMAGES.map((img) => (
                      <option key={img} value={img}>{img.replace("/images/", "")}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-4">
                <h2 className="font-headline text-title-lg text-light-on-surface">5. Commercial &amp; GST</h2>
                <label className="flex flex-col gap-1">
                  <span className="text-label-md">Dealer Price (₹)</span>
                  <input
                    type="number"
                    value={dealerPrice}
                    onChange={(e) => setDealerPrice(Number(e.target.value))}
                    className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-md"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-label-md">Minimum Order Quantity</span>
                  <input
                    type="number"
                    value={moq}
                    onChange={(e) => setMoq(Number(e.target.value))}
                    className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-md"
                  />
                </label>
                {!editingId && (
                  <label className="flex flex-col gap-1">
                    <span className="text-label-md">Opening Stock Qty</span>
                    <input
                      type="number"
                      value={initialStock}
                      onChange={(e) => setInitialStock(Number(e.target.value))}
                      className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-md"
                    />
                  </label>
                )}
                <label className="flex flex-col gap-1">
                  <span className="text-label-md">GST Rate</span>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    className="rounded border border-light-outline-variant px-3 py-2 text-body-md"
                  >
                    <option value={18}>18% (HSN 8443)</option>
                    <option value={12}>12%</option>
                  </select>
                </label>
                <div className="flex items-center gap-2 pt-3 border-t border-light-outline-variant">
                  <button
                    type="button"
                    onClick={() => saveProduct("Published")}
                    className="flex-1 py-2.5 rounded bg-light-primary text-light-on-primary font-body text-label-md hover:bg-light-primary-container"
                  >
                    Publish Product
                  </button>
                  <button
                    type="button"
                    onClick={() => saveProduct("Draft")}
                    className="px-4 py-2.5 rounded border border-light-outline-variant font-body text-label-md hover:bg-light-surface-container-low"
                  >
                    Save Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "meta" && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 min-w-0 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col gap-4">
            <h2 className="font-headline text-title-lg">Product Categories ({categories.length})</h2>
            <div className="divide-y divide-light-outline-variant/60 text-body-sm">
              {categories.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="font-mono text-mono-sm text-light-on-surface-variant truncate">/{c.slug} · {c.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await adminApi.deleteCategory(c.id);
                        await loadProducts();
                        showToast(`Removed category ${c.name}.`);
                      } catch (err) {
                        showToast(getErrorMessage(err, "Failed to remove category."));
                      }
                    }}
                    className="text-light-error text-label-sm hover:underline shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCatName.trim()) return;
                try {
                  await adminApi.createCategory({ name: newCatName.trim(), subtitle: newCatSub.trim() });
                  setNewCatName("");
                  setNewCatSub("");
                  await loadProducts();
                  showToast("Category added.");
                } catch (err) {
                  showToast(err instanceof Error ? err.message : "Failed to add category");
                }
              }}
              className="pt-3 border-t border-light-outline-variant grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2"
            >
              <input type="text" required placeholder="Category Name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="rounded border border-light-outline-variant px-2.5 py-1.5 text-body-sm min-w-0" />
              <input type="text" placeholder="Subtitle / Badge" value={newCatSub} onChange={(e) => setNewCatSub(e.target.value)} className="rounded border border-light-outline-variant px-2.5 py-1.5 text-body-sm min-w-0" />
              <button type="submit" className="px-3 py-1.5 rounded bg-light-primary text-white text-label-sm">+ Add</button>
            </form>
          </div>

          <div className="lg:col-span-6 min-w-0 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col gap-4">
            <h2 className="font-headline text-title-lg">Compatibility Printer Models</h2>
            <div className="max-h-72 overflow-y-auto divide-y divide-light-outline-variant/60 text-body-sm">
              {Object.entries(compatModels).flatMap(([bName, list]) =>
                list.map((m, idx) => (
                  <div key={`${bName}-${m.model_name}-${idx}`} className="py-2 flex items-center justify-between gap-2">
                    <span className="truncate">
                      <span className="font-mono text-mono-sm text-light-primary mr-2">{bName}</span>
                      {m.model_name}
                    </span>
                    {m.id && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await adminApi.deletePrinterModel(m.id!);
                            await loadProducts();
                            showToast(`Removed ${m.model_name}.`);
                          } catch (err) {
                            showToast(getErrorMessage(err, "Failed to remove printer model."));
                          }
                        }}
                        className="text-light-error text-label-sm hover:underline shrink-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newPmModel.trim()) return;
                try {
                  await adminApi.createPrinterModel({
                    brand: newPmBrand,
                    model_name: newPmModel.trim(),
                    series: newPmSeries.trim(),
                  });
                  setNewPmModel("");
                  setNewPmSeries("");
                  await loadProducts();
                  showToast("Added printer model.");
                } catch (err) {
                  showToast(getErrorMessage(err, "Failed to add printer model."));
                }
              }}
              className="pt-3 border-t border-light-outline-variant grid grid-cols-1 sm:grid-cols-[100px_1fr_auto] gap-2"
            >
              <select value={newPmBrand} onChange={(e) => setNewPmBrand(e.target.value)} className="rounded border border-light-outline-variant px-2 py-1.5 text-body-sm min-w-0">
                {brandOptions.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
              <input type="text" required placeholder="Model Name (e.g. LaserJet Pro M15w)" value={newPmModel} onChange={(e) => setNewPmModel(e.target.value)} className="rounded border border-light-outline-variant px-2.5 py-1.5 text-body-sm min-w-0" />
              <button type="submit" className="px-3 py-1.5 rounded bg-light-primary text-white text-label-sm">+ Add Model</button>
            </form>
          </div>
        </section>
      )}

      <ConfirmModal
        open={confirmDeleteOpen}
        title="Delete Selected Products?"
        message={`Are you sure you want to permanently remove ${selectedIds.length} selected SKU(s) and their warehouse stock records?`}
        confirmLabel="Delete Products"
        onConfirm={() => handleBulkAction("delete")}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </AdminShell>
  );
}
