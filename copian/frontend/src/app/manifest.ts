import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Copian B2B — Printer Consumables & ERP",
    short_name: "Copian B2B",
    description:
      "Copian International (Est. 1997): OEM-compatible toner cartridges, bulk toner powders, OPC drums, compatibility lookup, and GST quotations.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#FAFAFF",
    theme_color: "#00366B",
    categories: ["business", "productivity", "shopping"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Product Catalogue",
        short_name: "Catalogue",
        url: "/products",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Compatibility Finder",
        short_name: "Compatibility",
        url: "/compatibility",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Inquiry Cart",
        short_name: "Cart",
        url: "/inquiry-cart",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Admin ERP",
        short_name: "ERP",
        url: "/admin",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
