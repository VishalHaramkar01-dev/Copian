"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Article } from "@/types/copian";

interface ArticleReaderModalProps {
  article: Article | null;
  articles: Article[];
  onClose: () => void;
  onSelectArticle: (article: Article) => void;
}

function estimateReadMinutes(article: Article): number {
  const words = `${article.summary} ${article.content}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

/**
 * Overlay editorial reader dialog for B2B technical guides and articles on /resources.
 * Portaled to document.body above StorefrontShell's sticky header stacking context.
 */
export default function ArticleReaderModal({
  article,
  articles,
  onClose,
  onSelectArticle,
}: ArticleReaderModalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!article) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [article, onClose]);

  useEffect(() => {
    setScrollPct(0);
    setCopied(false);
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [article?.id]);

  if (!mounted || !article) return null;

  const currentIdx = articles.findIndex((a) => a.id === article.id);
  const prevArticle = currentIdx > 0 ? articles[currentIdx - 1] : null;
  const nextArticle = currentIdx >= 0 && currentIdx < articles.length - 1 ? articles[currentIdx + 1] : null;
  const readMins = estimateReadMinutes(article);
  const imgSrc = article.image_url || "/images/copian-blog-banner.png";
  const isBanner = imgSrc.includes("blog-banner") || imgSrc.includes("hero-banner");

  const paragraphs = (article.content || article.summary || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      setScrollPct(100);
      return;
    }
    setScrollPct(Math.min(100, Math.max(0, Math.round((el.scrollTop / maxScroll) * 100))));
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/resources?article=${encodeURIComponent(article.slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors in restricted contexts
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] bg-light-scrim/55 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6 animate-fade-in"
    >
      <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-modal-in">
        {/* Modal Top Utility Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-light-surface-container-low/80 border-b border-light-outline-variant flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center flex-wrap gap-2 min-w-0">
            <span className="px-2.5 py-0.5 rounded-full bg-light-secondary-container text-light-on-secondary-container font-mono text-[11px] uppercase tracking-wide whitespace-nowrap">
              {article.category}
            </span>
            {article.is_featured && (
              <span className="px-2.5 py-0.5 rounded-full bg-light-primary/10 text-light-primary font-mono text-[11px] whitespace-nowrap">
                Featured Guide
              </span>
            )}
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-light-on-surface-variant whitespace-nowrap">
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                schedule
              </span>
              {readMins} min read
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-light-outline-variant bg-white text-light-on-surface-variant hover:text-light-primary hover:border-light-primary/50 font-body text-label-md"
            >
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                {copied ? "check" : "link"}
              </span>
              <span className="hidden sm:inline">{copied ? "Link Copied" : "Share"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close article reader"
              className="w-8 h-8 rounded border border-light-outline-variant bg-white text-light-on-surface hover:bg-light-surface-container-low flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Reading Progress Bar */}
        <div className="h-[2.5px] w-full bg-light-surface-container shrink-0" aria-hidden="true">
          <div
            className="h-full bg-light-primary transition-[width] duration-150 ease-out"
            style={{ width: `${scrollPct}%` }}
          />
        </div>

        {/* Scrollable Editorial Article Content */}
        <div
          ref={bodyRef}
          onScroll={handleScroll}
          className="overflow-y-auto flex-1 px-5 sm:px-8 py-6 sm:py-8 space-y-6"
        >
          <header className="space-y-3">
            <h1
              id="article-modal-title"
              className="font-headline text-headline-md sm:text-headline-lg text-light-on-surface leading-tight"
            >
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-body-sm text-light-on-surface-variant font-body">
              <span className="inline-flex items-center gap-1.5 font-medium text-light-on-surface">
                <span className="w-2 h-2 rounded-full bg-light-primary shrink-0" aria-hidden="true" />
                Copian Technical &amp; Procurement Desk
              </span>
              <span aria-hidden="true">·</span>
              <span>ISO/IEC Fleet &amp; Channel Standards</span>
            </div>
          </header>

          {article.summary && article.summary.trim() !== article.content.trim() && (
            <div className="bg-light-surface-container-low border-l-4 border-light-primary rounded-r-md p-4">
              <span className="font-mono text-[11px] uppercase tracking-wider text-light-primary block mb-1">
                Executive Summary
              </span>
              <p className="font-body text-body-md text-light-on-surface leading-relaxed">
                {article.summary}
              </p>
            </div>
          )}

          <div
            className={`rounded-lg border border-light-outline-variant overflow-hidden flex items-center justify-center ${
              isBanner ? "bg-light-surface-container-low" : "bg-gradient-to-br from-light-surface-container-low to-white p-4 sm:p-6"
            }`}
          >
            <img
              src={imgSrc}
              alt={article.title}
              className={
                isBanner
                  ? "w-full max-h-72 object-contain"
                  : "w-full h-48 sm:h-56 object-contain"
              }
            />
          </div>

          <div className="space-y-4 font-body text-body-lg text-light-on-surface-variant leading-relaxed">
            {paragraphs.map((para, idx) => (
              <p
                key={idx}
                className={idx === 0 ? "text-light-on-surface font-medium whitespace-pre-line" : "whitespace-pre-line"}
              >
                {para}
              </p>
            ))}
          </div>

          {/* Contextual B2B Action Strip */}
          <div className="bg-light-secondary-container/25 border border-light-primary/20 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-headline text-title-md text-light-on-surface">
                Need OEM-verified supplies for your print fleet?
              </p>
              <p className="font-body text-body-sm text-light-on-surface-variant mt-0.5">
                Match your printer model or review bulk carton tiers (-8% at 50u, -15% at 200u).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                href="/compatibility"
                className="px-3.5 py-2 rounded border border-light-outline-variant bg-white font-body text-label-md text-light-on-surface hover:border-light-primary hover:text-light-primary"
              >
                Compatibility Finder
              </Link>
              <Link
                href="/products"
                className="px-3.5 py-2 rounded bg-light-primary text-light-on-primary font-body text-label-md hover:bg-light-primary-container"
              >
                Browse Catalogue
              </Link>
            </div>
          </div>
        </div>

        {/* Sticky Modal Footer: Prev / Next Article Navigation */}
        <div className="px-4 sm:px-6 py-3 bg-light-surface-container-low/70 border-t border-light-outline-variant flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              type="button"
              disabled={!prevArticle}
              onClick={() => prevArticle && onSelectArticle(prevArticle)}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded border border-light-outline-variant bg-white font-body text-label-md text-light-on-surface hover:bg-light-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                arrow_back
              </span>
              <span className="sm:hidden">Prev</span>
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              type="button"
              disabled={!nextArticle}
              onClick={() => nextArticle && onSelectArticle(nextArticle)}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded border border-light-outline-variant bg-white font-body text-label-md text-light-on-surface hover:bg-light-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            >
              <span>Next</span>
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                arrow_forward
              </span>
            </button>
            {articles.length > 1 && currentIdx >= 0 && (
              <span className="hidden sm:inline font-mono text-[11px] text-light-on-surface-variant ml-2 whitespace-nowrap">
                Guide {currentIdx + 1} of {articles.length}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 sm:px-4 py-1.5 rounded bg-light-primary text-light-on-primary font-body text-label-md hover:bg-light-primary-container whitespace-nowrap shrink-0"
          >
            <span className="sm:hidden">Done</span>
            <span className="hidden sm:inline">Done Reading</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
