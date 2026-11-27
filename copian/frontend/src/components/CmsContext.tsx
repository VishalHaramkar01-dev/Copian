"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { COPIAN_CONTACT, COPIAN_METRICS, COPIAN_SUPPORTED_BRANDS } from "@/core/copianMetrics";
import { VOLUME_SLABS } from "@/core/pricing";
import { adminApi } from "@/services/adminApi";
import {
  AboutSettings,
  Article,
  ContactSettings,
  Faq,
  HomepageSettings,
  MetricItem,
  TestimonialItem,
  VolumeSlabItem,
} from "@/types/copian";

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    quote:
      "We have been associated with COPIAN since more than 15 years. We are selling all Copian products and Copian cartridges — would just say COPIAN Cartridges are at par with OEM quality and hence we have satisfied customers.",
    author: "Mahavir Impex",
    role_company: "Authorized Channel Partner (15+ Years) · Bengaluru",
  },
  {
    quote:
      "The compatibility matrix cuts counter lookup time to seconds for our regional dealers, and master cartons arrive pre-labeled with SKU barcodes for fast inward scanning.",
    author: "Karthik Rao",
    role_company: "Managing Partner · Deccan Office Supplies, Bengaluru",
  },
  {
    quote:
      "Same-day GST proforma quotes and reliable 1kg universal toner powder batches keep our commercial print and cartridge remanufacturing lines running without downtime.",
    author: "Neha Kapoor",
    role_company: "Operations Director · Capital Print Hub, New Delhi",
  },
];

interface CmsState {
  homepage: HomepageSettings;
  contact: ContactSettings;
  metrics: MetricItem[];
  testimonials: TestimonialItem[];
  volume_slabs: VolumeSlabItem[];
  about: AboutSettings;
  articles: Article[];
  faqs: Faq[];
  refreshCms: () => Promise<void>;
}

const DEFAULT_STATE: Omit<CmsState, "refreshCms"> = {
  homepage: {
    hero_badge: "Trusted Since 1997 · Enterprise & Dealer Supply",
    hero_headline: "Precision printer consumables built for bulk procurement.",
    hero_subheadline:
      "Established in 1997 in Thane, Copian International supplies OEM-compatible toner cartridges, bulk toner powders, OPC drums, inkjet inks, and printer spare parts across 10 major printer brands.",
    primary_cta_label: "Explore Product Catalogue",
    secondary_cta_label: "Request Bulk Quote",
  },
  contact: {
    company: COPIAN_CONTACT.company,
    established_year: COPIAN_CONTACT.establishedYear,
    phone_primary: COPIAN_CONTACT.phonePrimary,
    phone_secondary: COPIAN_CONTACT.phoneSecondary,
    email: COPIAN_CONTACT.email,
    whatsapp_number: "919322593719",
    address: COPIAN_CONTACT.address,
    office_hours: "Mon-Sat, 9:30 AM - 6:30 PM IST",
  },
  metrics: COPIAN_METRICS.map((m) => ({ ...m })),
  testimonials: DEFAULT_TESTIMONIALS,
  volume_slabs: VOLUME_SLABS.map((s) => ({
    min_qty: s.minQty,
    max_qty: s.maxQty,
    label: s.label,
    discount_pct: s.discountPct,
  })),
  about: {
    title: "Your Trusted Partner in Printer Consumables Since 1997",
    intro:
      "Incorporated in 1997 in Thane, Maharashtra, Copian International has grown into a Pan-India wholesale provider of compatible laser toner cartridges, toner powders, inkjet inks, OPC drums, wiper & doctor blades, PCRs, magnetic rollers, and printer spares across 10 OEM ecosystems.",
    oem_brands: [...COPIAN_SUPPORTED_BRANDS],
  },
  articles: [],
  faqs: [],
};

const CmsContext = createContext<CmsState>({
  ...DEFAULT_STATE,
  refreshCms: async () => {},
});

export function CmsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<CmsState, "refreshCms">>(DEFAULT_STATE);

  const refreshCms = useCallback(async () => {
    try {
      const res = await adminApi.getCms();
      setState({
        homepage: { ...DEFAULT_STATE.homepage, ...(res.homepage || {}) },
        contact: { ...DEFAULT_STATE.contact, ...(res.contact || {}) },
        metrics: res.metrics && res.metrics.length > 0 ? res.metrics : DEFAULT_STATE.metrics,
        testimonials:
          res.testimonials && res.testimonials.length > 0 ? res.testimonials : DEFAULT_STATE.testimonials,
        volume_slabs:
          res.volume_slabs && res.volume_slabs.length > 0 ? res.volume_slabs : DEFAULT_STATE.volume_slabs,
        about: { ...DEFAULT_STATE.about, ...(res.about || {}) },
        articles: res.articles || [],
        faqs: res.faqs || [],
      });
    } catch {
      // Keep clean default copy if backend is temporarily offline
    }
  }, []);

  useEffect(() => {
    refreshCms();
  }, [refreshCms]);

  return (
    <CmsContext.Provider value={{ ...state, refreshCms }}>
      {children}
    </CmsContext.Provider>
  );
}

export function useCms() {
  return useContext(CmsContext);
}
