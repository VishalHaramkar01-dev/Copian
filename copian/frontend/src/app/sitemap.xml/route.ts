import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://copian.in").replace(/\/$/, "");
const RAW_API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
const API_BASE = RAW_API_BASE.replace("://localhost:", "://127.0.0.1:");

interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: "daily" | "weekly";
  priority: number;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function fetchJsonSafe<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(): Promise<NextResponse> {
  const lastModified = new Date().toISOString();
  const staticRoutes = [
    "",
    "/products",
    "/compatibility",
    "/distributors",
    "/about",
    "/resources",
    "/contact",
    "/inquiry-cart",
    "/track-order",
    "/account",
    "/sitemap",
  ];

  const entries: SitemapEntry[] = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === "" || route === "/products" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : route === "/products" ? 0.9 : 0.7,
  }));

  const [categories, products] = await Promise.all([
    fetchJsonSafe<{ slug: string }[]>("/api/categories"),
    fetchJsonSafe<{ sku: string }[]>("/api/products?status=Published"),
  ]);

  if (Array.isArray(categories)) {
    for (const c of categories) {
      if (c?.slug) {
        entries.push({
          url: `${SITE_URL}/category/${encodeURIComponent(c.slug)}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.85,
        });
      }
    }
  }

  if (Array.isArray(products)) {
    for (const p of products) {
      if (p?.sku) {
        entries.push({
          url: `${SITE_URL}/product/${encodeURIComponent(p.sku)}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  }

  const urlsXml = entries
    .map(
      (item) =>
        `  <url>\n` +
        `    <loc>${escapeXml(item.url)}</loc>\n` +
        `    <lastmod>${item.lastModified}</lastmod>\n` +
        `    <changefreq>${item.changeFrequency}</changefreq>\n` +
        `    <priority>${item.priority.toFixed(1)}</priority>\n` +
        `  </url>`,
    )
    .join("\n");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urlsXml}\n` +
    `</urlset>\n`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
