import type { Metadata } from "next";
import ProductDetailView from "@/features/catalog/ProductDetailView";
import { Product } from "@/types/copian";

const API_BASE = (
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace("://localhost:", "://127.0.0.1:")
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

async function fetchProductSafe(sku: string): Promise<Product | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(sku)}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.product as Product) || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateMetadata({ params }: { params: Promise<{ sku: string }> }): Promise<Metadata> {
  const { sku } = await params;
  const prod = await fetchProductSafe(sku);
  if (!prod) {
    return {
      title: `${sku} — Copian B2B Product Specifications`,
      description: `Bulk B2B specifications, MOQ, and printer compatibility for ${sku} from Copian International.`,
    };
  }
  return {
    title: prod.seo_title || `${prod.name} (${prod.sku}) | Copian B2B`,
    description:
      prod.meta_description ||
      `${prod.name} (${prod.sku}) · OEM ${prod.oem_code} · ${prod.page_yield.toLocaleString()} pages · MOQ ${prod.moq} ${prod.moq_unit}.`,
  };
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;
  const prod = await fetchProductSafe(sku);

  const jsonLd = prod
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: prod.name,
        sku: prod.sku,
        mpn: prod.oem_code,
        brand: { "@type": "Brand", name: prod.brand || "Copian" },
        description: prod.detailed_desc || prod.short_desc,
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: prod.dealer_price,
          availability: "https://schema.org/InStock",
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailView skuParam={sku} />
    </>
  );
}
