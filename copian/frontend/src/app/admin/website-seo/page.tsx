"use client";

import React, { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { CmsFormSkeleton } from "@/components/Skeleton";
import { useAdminAuth } from "@/components/AdminAuthContext";
import { useCms } from "@/components/CmsContext";
import ConfirmModal from "@/components/ConfirmModal";
import { useCart } from "@/components/CartContext";
import { apiFetch, Article, Faq, getErrorMessage } from "@/lib/api";
import { adminApi } from "@/services/adminApi";
import { MetricItem, TestimonialItem, VolumeSlabItem } from "@/types/copian";

interface RedirectItem {
  id: number;
  source_path: string;
  target_path: string;
  status_code: number;
}

export default function AdminWebsiteSeoPage() {
  const { canAction } = useAdminAuth();
  const { showToast } = useCart();
  const { refreshCms } = useCms();
  const [tab, setTab] = useState<"seo" | "home" | "brand" | "blog">("seo");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "article" | "faq" | "redirect"; id: number; label: string } | null>(null);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("https://copian.in/");
  const [robots, setRobots] = useState("index, follow");
  const [sitemapCount, setSitemapCount] = useState(412);
  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [newSource, setNewSource] = useState("");
  const [newTarget, setNewTarget] = useState("");

  const [heroBadge, setHeroBadge] = useState("");
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSub, setHeroSub] = useState("");
  const [primaryCta, setPrimaryCta] = useState("");
  const [secondaryCta, setSecondaryCta] = useState("");

  const [companyName, setCompanyName] = useState("Copian International");
  const [estYear, setEstYear] = useState(1997);
  const [phonePrimary, setPhonePrimary] = useState("+91 93225 93719");
  const [phoneSecondary, setPhoneSecondary] = useState("+91 83568 85132");
  const [contactEmail, setContactEmail] = useState("Copiantoner@gmail.com");
  const [whatsappNum, setWhatsappNum] = useState("919322593719");
  const [hqAddress, setHqAddress] = useState("");
  const [officeHours, setOfficeHours] = useState("Mon-Sat, 9:30 AM - 6:30 PM IST");
  const [metricsList, setMetricsList] = useState<MetricItem[]>([]);
  const [testimonialsList, setTestimonialsList] = useState<TestimonialItem[]>([]);
  const [slabsList, setSlabsList] = useState<VolumeSlabItem[]>([]);
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutIntro, setAboutIntro] = useState("");
  const [aboutBrandsText, setAboutBrandsText] = useState("");

  const [articles, setArticles] = useState<Article[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [artTitle, setArtTitle] = useState("");
  const [artCat, setArtCat] = useState("Procurement Guide");
  const [artSummary, setArtSummary] = useState("");
  const [artContent, setArtContent] = useState("");
  const [faqQ, setFaqQ] = useState("");
  const [faqA, setFaqA] = useState("");

  const load = async () => {
    try {
      const res = await adminApi.getCms();
      setMetaTitle(String(res.seo.meta_title || ""));
      setMetaDesc(String(res.seo.meta_description || ""));
      setCanonicalUrl(String(res.seo.canonical_url || "https://copian.in/"));
      setRobots(String(res.seo.robots_directive || "index, follow"));
      setSitemapCount(Number(res.seo.sitemap_urls_count || 412));

      setHeroBadge(res.homepage.hero_badge || "");
      setHeroHeadline(res.homepage.hero_headline || "");
      setHeroSub(res.homepage.hero_subheadline || "");
      setPrimaryCta(res.homepage.primary_cta_label || "");
      setSecondaryCta(res.homepage.secondary_cta_label || "");

      if (res.contact) {
        setCompanyName(res.contact.company || "Copian International");
        setEstYear(res.contact.established_year || 1997);
        setPhonePrimary(res.contact.phone_primary || "");
        setPhoneSecondary(res.contact.phone_secondary || "");
        setContactEmail(res.contact.email || "");
        setWhatsappNum(res.contact.whatsapp_number || "");
        setHqAddress(res.contact.address || "");
        setOfficeHours(res.contact.office_hours || "");
      }
      setMetricsList(res.metrics || []);
      setTestimonialsList(res.testimonials || []);
      setSlabsList(res.volume_slabs || []);
      if (res.about) {
        setAboutTitle(res.about.title || "");
        setAboutIntro(res.about.intro || "");
        setAboutBrandsText((res.about.oem_brands || []).join(", "));
      }

      setArticles(res.articles || []);
      setFaqs(res.faqs || []);
      setRedirects(res.redirects || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const publishChanges = async () => {
    try {
      await adminApi.updateCms({
        seo: {
          meta_title: metaTitle,
          meta_description: metaDesc,
          canonical_url: canonicalUrl,
          robots_directive: robots,
          sitemap_urls_count: sitemapCount,
        },
        homepage: {
          hero_badge: heroBadge,
          hero_headline: heroHeadline,
          hero_subheadline: heroSub,
          primary_cta_label: primaryCta,
          secondary_cta_label: secondaryCta,
          sales_phone: phonePrimary,
          sales_email: contactEmail,
        },
        contact: {
          company: companyName,
          established_year: Number(estYear) || 1997,
          phone_primary: phonePrimary,
          phone_secondary: phoneSecondary,
          email: contactEmail,
          whatsapp_number: whatsappNum,
          address: hqAddress,
          office_hours: officeHours,
        },
        metrics: metricsList,
        testimonials: testimonialsList,
        volume_slabs: slabsList,
        about: {
          title: aboutTitle,
          intro: aboutIntro,
          oem_brands: aboutBrandsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
      await refreshCms();
      showToast("Published Website, Contact, Metrics & SEO live to storefront.");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to publish CMS settings."));
    }
  };

  const addRedirect = async () => {
    if (!newSource.trim() || !newTarget.trim()) return;
    try {
      await apiFetch("/api/redirects", {
        method: "POST",
        body: JSON.stringify({ source_path: newSource.trim(), target_path: newTarget.trim(), status_code: 301 }),
      });
      setNewSource("");
      setNewTarget("");
      await load();
      showToast("Added 301 redirect.");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to add 301 redirect."));
    }
  };

  const addArticle = async () => {
    if (!artTitle.trim()) return;
    try {
      await apiFetch("/api/articles", {
        method: "POST",
        body: JSON.stringify({
          title: artTitle.trim(),
          category: artCat,
          summary: artSummary,
          content: artContent || artSummary,
          image_url: "/images/copian-blog-banner.png",
        }),
      });
      setArtTitle("");
      setArtSummary("");
      setArtContent("");
      await load();
      showToast("Article published to /resources.");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to publish article."));
    }
  };

  const addFaq = async () => {
    if (!faqQ.trim() || !faqA.trim()) return;
    try {
      await apiFetch("/api/faqs", {
        method: "POST",
        body: JSON.stringify({ question: faqQ.trim(), answer: faqA.trim(), display_order: faqs.length + 1 }),
      });
      setFaqQ("");
      setFaqA("");
      await load();
      showToast("FAQ added to homepage.");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to add FAQ."));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "article") await apiFetch(`/api/articles/${deleteTarget.id}`, { method: "DELETE" });
      if (deleteTarget.type === "faq") await apiFetch(`/api/faqs/${deleteTarget.id}`, { method: "DELETE" });
      if (deleteTarget.type === "redirect") await apiFetch(`/api/redirects/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await load();
      showToast("Deleted item.");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to delete item."));
    }
  };

  return (
    <AdminShell
      breadcrumb={["Website", "CMS & SEO Management"]}
      headerRight={
        canAction("Website & SEO", "edit") ? (
          <button
            type="button"
            onClick={publishChanges}
            className="px-4 py-2 rounded bg-light-primary text-light-on-primary text-label-md hover:bg-light-primary-container"
          >
            Publish Changes
          </button>
        ) : undefined
      }
    >
      <div role="tablist" className="flex gap-2 border-b border-light-outline-variant overflow-x-auto">
        {[
          { id: "seo", label: "SEO & Metadata" },
          { id: "home", label: "Homepage & Banners" },
          { id: "brand", label: "Contact, Metrics & Trust" },
          { id: "blog", label: "Blog & FAQs" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2.5 text-label-md whitespace-nowrap ${
              tab === t.id
                ? "text-light-primary border-b-2 border-light-primary"
                : "text-light-on-surface-variant"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <CmsFormSkeleton />
      ) : (
      <>
      {tab === "seo" && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 min-w-0 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-4">
            <h1 className="font-headline text-title-lg">Global &amp; Page-Level SEO Settings</h1>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Meta Title</span>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 text-body-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Meta Description</span>
              <textarea
                rows={2}
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                className="rounded border border-light-outline-variant px-3 py-2 text-body-sm"
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-label-md">Canonical URL</span>
                <input
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-label-md">Robots Directive</span>
                <select
                  value={robots}
                  onChange={(e) => setRobots(e.target.value)}
                  className="rounded border border-light-outline-variant px-3 py-2 text-body-sm"
                >
                  <option>index, follow</option>
                  <option>noindex, nofollow</option>
                </select>
              </label>
            </div>
          </div>

          <div className="lg:col-span-5 min-w-0 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 sm:p-6 flex flex-col gap-4">
            <h2 className="font-headline text-title-md">Sitemap &amp; Redirect Status</h2>
            <div className="p-3 rounded bg-success-container text-on-success-container text-body-sm flex flex-wrap items-center justify-between gap-2">
              <span>sitemap.xml · {sitemapCount} URLs indexed</span>
              <span className="font-mono text-mono-sm">Healthy</span>
            </div>
            <div className="text-body-sm space-y-2">
              <p className="font-medium">Active 301 Redirects</p>
              {redirects.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 font-mono text-mono-sm text-light-on-surface-variant">
                  <span className="break-all min-w-0">{r.source_path} → {r.target_path}</span>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: "redirect", id: r.id, label: r.source_path })}
                    className="text-light-error hover:underline shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 pt-2">
                <input type="text" placeholder="/old-path" value={newSource} onChange={(e) => setNewSource(e.target.value)} className="w-full min-w-0 rounded border border-light-outline-variant px-2 py-1.5 font-mono text-mono-sm" />
                <input type="text" placeholder="/new-path" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} className="w-full min-w-0 rounded border border-light-outline-variant px-2 py-1.5 font-mono text-mono-sm" />
                <button type="button" onClick={addRedirect} className="px-3 py-1.5 rounded bg-light-primary text-white text-label-sm">Add</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === "home" && (
        <section className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-4 max-w-3xl">
          <h2 className="font-headline text-title-lg">Homepage Hero &amp; Banner Controls</h2>
          <label className="flex flex-col gap-1">
            <span className="text-label-md">Hero Eyebrow Badge</span>
            <input type="text" value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-label-md">Hero Headline</span>
            <input type="text" value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-md" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-label-md">Hero Subtitle</span>
            <textarea rows={2} value={heroSub} onChange={(e) => setHeroSub(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Primary CTA Label</span>
              <input type="text" value={primaryCta} onChange={(e) => setPrimaryCta(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Secondary CTA Label</span>
              <input type="text" value={secondaryCta} onChange={(e) => setSecondaryCta(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
            </label>
          </div>
          <button
            type="button"
            onClick={publishChanges}
            className="w-fit px-4 py-2 rounded bg-light-primary text-white text-label-md"
          >
            Save &amp; Publish Banner
          </button>
        </section>
      )}

      {tab === "brand" && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 min-w-0 bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 sm:p-6 flex flex-col gap-4">
            <h2 className="font-headline text-title-lg">Global Contact, HQ &amp; About Copy</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-label-md">Company Name</span>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-label-md">Established Year</span>
                <input type="number" value={estYear} onChange={(e) => setEstYear(Number(e.target.value) || 1997)} className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-label-md">Primary Sales Phone</span>
                <input type="text" value={phonePrimary} onChange={(e) => setPhonePrimary(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-label-md">Secondary Phone</span>
                <input type="text" value={phoneSecondary} onChange={(e) => setPhoneSecondary(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-label-md">Sales Email</span>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-label-md">WhatsApp Digits (Intl)</span>
                <input type="text" value={whatsappNum} onChange={(e) => setWhatsappNum(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm" />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">HQ &amp; Warehouse Address</span>
              <input type="text" value={hqAddress} onChange={(e) => setHqAddress(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Office Hours</span>
              <input type="text" value={officeHours} onChange={(e) => setOfficeHours(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
            </label>
            <label className="flex flex-col gap-1 pt-2 border-t border-light-outline-variant">
              <span className="text-label-md">About Page Headline</span>
              <input type="text" value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">About Page Intro</span>
              <textarea rows={3} value={aboutIntro} onChange={(e) => setAboutIntro(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 text-body-sm" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-label-md">Supported OEM Brands (comma separated)</span>
              <input type="text" value={aboutBrandsText} onChange={(e) => setAboutBrandsText(e.target.value)} className="rounded border border-light-outline-variant px-3 py-2 font-mono text-mono-sm" />
            </label>
          </div>

          <div className="lg:col-span-6 min-w-0 flex flex-col gap-6">
            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 sm:p-6 flex flex-col gap-3">
              <h2 className="font-headline text-title-md">Key Proof Metrics (4 Cards)</h2>
              {metricsList.map((m, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={m.value}
                    onChange={(e) =>
                      setMetricsList((prev) => prev.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x)))
                    }
                    placeholder="Value"
                    className="rounded border border-light-outline-variant px-2.5 py-1.5 font-mono text-mono-sm"
                  />
                  <input
                    type="text"
                    value={m.label}
                    onChange={(e) =>
                      setMetricsList((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                    }
                    placeholder="Label"
                    className="rounded border border-light-outline-variant px-2.5 py-1.5 text-body-sm"
                  />
                  <input
                    type="text"
                    value={m.detail}
                    onChange={(e) =>
                      setMetricsList((prev) => prev.map((x, i) => (i === idx ? { ...x, detail: e.target.value } : x)))
                    }
                    placeholder="Detail"
                    className="rounded border border-light-outline-variant px-2.5 py-1.5 text-body-sm"
                  />
                </div>
              ))}
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 sm:p-6 flex flex-col gap-3">
              <h2 className="font-headline text-title-md">Bulk Volume Discount Slabs</h2>
              {slabsList.map((s, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={s.label}
                    onChange={(e) =>
                      setSlabsList((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                    }
                    placeholder="Slab Label"
                    className="rounded border border-light-outline-variant px-2.5 py-1.5 text-body-sm"
                  />
                  <input
                    type="number"
                    value={s.min_qty}
                    onChange={(e) =>
                      setSlabsList((prev) => prev.map((x, i) => (i === idx ? { ...x, min_qty: Number(e.target.value) || 1 } : x)))
                    }
                    placeholder="Min Qty"
                    className="rounded border border-light-outline-variant px-2.5 py-1.5 font-mono text-mono-sm"
                  />
                  <input
                    type="number"
                    value={s.discount_pct}
                    onChange={(e) =>
                      setSlabsList((prev) => prev.map((x, i) => (i === idx ? { ...x, discount_pct: Number(e.target.value) || 0 } : x)))
                    }
                    placeholder="Discount %"
                    className="rounded border border-light-outline-variant px-2.5 py-1.5 font-mono text-mono-sm"
                  />
                </div>
              ))}
            </div>

            <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-4 sm:p-6 flex flex-col gap-3">
              <h2 className="font-headline text-title-md">Partner Testimonials</h2>
              {testimonialsList.map((t, idx) => (
                <div key={idx} className="p-3 rounded bg-light-surface-container-low flex flex-col gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={t.author}
                      onChange={(e) =>
                        setTestimonialsList((prev) => prev.map((x, i) => (i === idx ? { ...x, author: e.target.value } : x)))
                      }
                      placeholder="Partner / Author"
                      className="rounded border border-light-outline-variant px-2.5 py-1.5 text-body-sm"
                    />
                    <input
                      type="text"
                      value={t.role_company}
                      onChange={(e) =>
                        setTestimonialsList((prev) => prev.map((x, i) => (i === idx ? { ...x, role_company: e.target.value } : x)))
                      }
                      placeholder="Role / City"
                      className="rounded border border-light-outline-variant px-2.5 py-1.5 text-body-sm"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={t.quote}
                    onChange={(e) =>
                      setTestimonialsList((prev) => prev.map((x, i) => (i === idx ? { ...x, quote: e.target.value } : x)))
                    }
                    className="rounded border border-light-outline-variant px-2.5 py-1.5 text-body-sm"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={publishChanges}
                className="w-fit px-4 py-2 rounded bg-light-primary text-white text-label-md hover:bg-light-primary-container"
              >
                Save &amp; Publish All Settings
              </button>
            </div>
          </div>
        </section>
      )}

      {tab === "blog" && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-4">
            <h2 className="font-headline text-title-lg">Published Articles ({articles.length})</h2>
            <div className="space-y-2">
              {articles.map((a) => (
                <div key={a.id} className="p-3 rounded bg-light-surface-container-low flex justify-between items-center text-body-sm">
                  <div>
                    <span className="font-mono text-mono-sm text-light-primary">{a.category}</span>
                    <p className="font-medium">{a.title}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: "article", id: a.id, label: a.title })}
                    className="text-light-error text-label-sm hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-light-outline-variant flex flex-col gap-2">
              <p className="text-label-md">Add Technical Article</p>
              <input type="text" placeholder="Article Title" value={artTitle} onChange={(e) => setArtTitle(e.target.value)} className="rounded border border-light-outline-variant px-3 py-1.5 text-body-sm" />
              <input type="text" placeholder="Category (e.g. Technical Note)" value={artCat} onChange={(e) => setArtCat(e.target.value)} className="rounded border border-light-outline-variant px-3 py-1.5 text-body-sm" />
              <textarea rows={2} placeholder="Summary & body..." value={artSummary} onChange={(e) => setArtSummary(e.target.value)} className="rounded border border-light-outline-variant px-3 py-1.5 text-body-sm" />
              <button type="button" onClick={addArticle} className="w-fit px-4 py-2 rounded bg-light-primary text-white text-label-md">Publish Article</button>
            </div>
          </div>

          <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-md p-6 flex flex-col gap-4">
            <h2 className="font-headline text-title-lg">Homepage FAQs ({faqs.length})</h2>
            <div className="space-y-2">
              {faqs.map((f) => (
                <div key={f.id} className="p-3 rounded bg-light-surface-container-low flex justify-between items-start gap-2 text-body-sm">
                  <div>
                    <p className="font-medium">{f.question}</p>
                    <p className="text-light-on-surface-variant">{f.answer}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: "faq", id: f.id, label: f.question })}
                    className="text-light-error text-label-sm hover:underline shrink-0"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-light-outline-variant flex flex-col gap-2">
              <p className="text-label-md">Add FAQ Entry</p>
              <input type="text" placeholder="Question" value={faqQ} onChange={(e) => setFaqQ(e.target.value)} className="rounded border border-light-outline-variant px-3 py-1.5 text-body-sm" />
              <textarea rows={2} placeholder="Answer" value={faqA} onChange={(e) => setFaqA(e.target.value)} className="rounded border border-light-outline-variant px-3 py-1.5 text-body-sm" />
              <button type="button" onClick={addFaq} className="w-fit px-4 py-2 rounded bg-light-primary text-white text-label-md">Add FAQ</button>
            </div>
          </div>
        </section>
      )}
      </>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Confirm Deletion"
        message={`Remove "${deleteTarget?.label}"? This action takes effect immediately on the live storefront.`}
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminShell>
  );
}
