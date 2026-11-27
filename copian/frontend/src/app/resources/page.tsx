"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import StorefrontShell from "@/components/StorefrontShell";
import { CardGridSkeleton, ResourcesPageSkeleton, Skeleton } from "@/components/Skeleton";
import { apiFetch, Article } from "@/lib/api";

function ResourcesContent() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("article");

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch<Article[]>("/api/articles");
        setArticles(res);
        if (initialSlug) {
          const match = res.find((a) => a.slug === initialSlug);
          if (match) setSelectedArticle(match);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [initialSlug]);

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return articles.filter(
      (a) =>
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q)
    );
  }, [articles, searchQ]);

  const featured = filtered.find((a) => a.is_featured) || filtered[0];
  const rest = filtered.filter((a) => a.id !== featured?.id);

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 py-10 flex flex-col gap-10">
      {!selectedArticle ? (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-headline text-headline-lg text-light-on-surface">Copian Knowledge &amp; Resources</h1>
              <p className="font-body text-body-md text-light-on-surface-variant mt-1">
                Technical guides, fleet procurement insights, and consumable maintenance best practices.
              </p>
            </div>
            <input
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search articles..."
              className="rounded border border-light-outline-variant bg-light-surface-container-lowest px-4 py-2 font-body text-body-md w-full md:w-72"
            />
          </div>

          {loading ? (
            <div className="flex flex-col gap-6">
              <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center">
                <Skeleton className="lg:col-span-6 h-72 w-full rounded-none" />
                <div className="lg:col-span-6 p-6 md:p-8 flex flex-col gap-3">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-8 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-10 w-40 rounded mt-2" />
                </div>
              </div>
              <CardGridSkeleton count={3} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-10 text-center flex flex-col items-center gap-3">
              <p className="font-body text-body-lg text-light-on-surface-variant">
                No technical guides matched &ldquo;{searchQ}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setSearchQ("")}
                className="px-4 py-2 rounded border border-light-outline-variant font-body text-label-md hover:bg-light-surface-container-low"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <>
              {featured && (
                <article className="bg-light-surface-container-lowest border border-light-outline-variant rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center">
                  <div className="lg:col-span-6">
                    <img
                      src={featured.image_url || "/images/copian-blog-banner.png"}
                      alt={featured.title}
                      className="w-full h-72 object-cover"
                    />
                  </div>
                  <div className="lg:col-span-6 p-6 md:p-8 flex flex-col gap-3">
                    <span className="font-mono text-mono-sm text-light-primary uppercase">
                      Featured · {featured.category}
                    </span>
                    <h2 className="font-headline text-headline-md text-light-on-surface">{featured.title}</h2>
                    <p className="font-body text-body-md text-light-on-surface-variant">{featured.summary}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArticle(featured);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="w-fit mt-2 px-5 py-2.5 rounded bg-light-primary text-light-on-primary font-body text-label-lg hover:bg-light-primary-container active:scale-[0.98]"
                    >
                      Read Full Article
                    </button>
                  </div>
                </article>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rest.map((art) => (
                  <article
                    key={art.id}
                    className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-5 flex flex-col justify-between gap-4 hover:border-light-primary/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-surface-enter ease-surface-enter"
                  >
                    <div>
                      <span className="font-mono text-mono-sm text-light-primary">{art.category}</span>
                      <h3 className="font-headline text-title-lg text-light-on-surface mt-1">{art.title}</h3>
                      <p className="font-body text-body-sm text-light-on-surface-variant mt-2">{art.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArticle(art);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-left font-body text-label-lg text-light-primary hover:underline"
                    >
                      Read article →
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <article className="max-w-3xl mx-auto bg-light-surface-container-lowest border border-light-outline-variant rounded-lg p-6 md:p-10 flex flex-col gap-6 w-full animate-surface-in">
          <button
            type="button"
            onClick={() => setSelectedArticle(null)}
            className="inline-flex items-center gap-1.5 font-body text-label-lg text-light-primary w-fit hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
            <span>Back to all resources</span>
          </button>
          <span className="font-mono text-mono-sm text-light-primary uppercase">{selectedArticle.category}</span>
          <h1 className="font-headline text-headline-lg text-light-on-surface">{selectedArticle.title}</h1>
          <img
            src={selectedArticle.image_url || "/images/copian-blog-banner.png"}
            alt={selectedArticle.title}
            className="w-full h-64 object-cover rounded-md"
          />
          <div className="font-body text-body-lg text-light-on-surface-variant space-y-4 whitespace-pre-line">
            {selectedArticle.content}
          </div>
        </article>
      )}
    </div>
  );
}

export default function BlogResourcesPage() {
  return (
    <StorefrontShell>
      <Suspense fallback={<ResourcesPageSkeleton />}>
        <ResourcesContent />
      </Suspense>
    </StorefrontShell>
  );
}
