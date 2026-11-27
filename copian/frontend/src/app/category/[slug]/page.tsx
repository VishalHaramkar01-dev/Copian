import type { Metadata } from "next";
import CategoryDetailView from "@/features/catalog/CategoryDetailView";
import { Category } from "@/types/copian";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  .replace(/\/$/, "")
  .replace("://localhost:", "://127.0.0.1:");

async function fetchCategorySafe(slug: string): Promise<Category | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${API_BASE}/api/categories/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.category as Category) || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = await fetchCategorySafe(slug);
  if (!cat) {
    return {
      title: `Copian B2B Catalogue — ${slug}`,
      description: `Wholesale printer consumables and compatible bulk supplies in ${slug}.`,
    };
  }
  return {
    title: `${cat.name} Wholesale & Bulk Supplies | Copian B2B`,
    description: cat.description || cat.subtitle,
  };
}

export default async function ProductCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = await fetchCategorySafe(slug);

  const jsonLd = cat
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: cat.name,
        description: cat.description || cat.subtitle,
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
      <CategoryDetailView slug={slug} />
    </>
  );
}
