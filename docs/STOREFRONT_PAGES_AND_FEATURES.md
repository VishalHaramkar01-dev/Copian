# Public Storefront Pages & Features Guide

All public B2B buyer experiences live under `copian/frontend/src/app/` wrapped inside [`StorefrontShell`](../copian/frontend/src/components/StorefrontShell.tsx), [`CartContext`](../copian/frontend/src/components/CartContext.tsx), and [`CmsContext`](../copian/frontend/src/components/CmsContext.tsx).

---

## Route Inventory & Rendering Strategy

| Route | Source File | Render Mode | Shell Options | Loading Skeleton (`loading.tsx`) |
|---|---|---|---|---|
| `/` | [`page.tsx`](../copian/frontend/src/app/page.tsx) | CSR | Defaults (`showUtilityBar=true`, `showSearchInHeader=true`) + `fullFooter` | `HomePageSkeleton` |
| `/products` | [`products/page.tsx`](../copian/frontend/src/app/products/page.tsx) | CSR + `<Suspense>` | Sticky utility bar + search, compact footer | `CataloguePageSkeleton` |
| `/category/[slug]` | [`category/[slug]/page.tsx`](../copian/frontend/src/app/category/%5Bslug%5D/page.tsx) + [`CategoryDetailView.tsx`](../copian/frontend/src/features/catalog/CategoryDetailView.tsx) | SSR metadata/JSON-LD + CSR view | Sticky utility bar + search, compact footer | `CategoryDetailSkeleton` |
| `/product/[sku]` | [`product/[sku]/page.tsx`](../copian/frontend/src/app/product/%5Bsku%5D/page.tsx) + [`ProductDetailView.tsx`](../copian/frontend/src/features/catalog/ProductDetailView.tsx) | SSR metadata/JSON-LD + CSR view | Sticky utility bar + search, compact footer | `ProductDetailSkeleton` |
| `/compatibility` | [`compatibility/page.tsx`](../copian/frontend/src/app/compatibility/page.tsx) | CSR + `<Suspense>` | Sticky utility bar + search, compact footer | `CompatibilitySkeleton` |
| `/inquiry-cart` | [`inquiry-cart/page.tsx`](../copian/frontend/src/app/inquiry-cart/page.tsx) | CSR | Sticky utility bar + search, compact footer | `InquiryCartPageSkeleton` |
| `/track-order` | [`track-order/page.tsx`](../copian/frontend/src/app/track-order/page.tsx) | CSR | Sticky utility bar + search, compact footer | Root fallback if streaming |
| `/account` | [`account/page.tsx`](../copian/frontend/src/app/account/page.tsx) | CSR | Sticky utility bar + search, compact footer | `AccountPageSkeleton` |
| `/distributors` | [`distributors/page.tsx`](../copian/frontend/src/app/distributors/page.tsx) | CSR | Sticky utility bar + search, compact footer | `DistributorsPageSkeleton` |
| `/resources` | [`resources/page.tsx`](../copian/frontend/src/app/resources/page.tsx) | CSR + `<Suspense>` | Sticky utility bar + search, compact footer | `ResourcesPageSkeleton` |
| `/about` | [`about/page.tsx`](../copian/frontend/src/app/about/page.tsx) | CSR (`useCms`) | Sticky utility bar + search, compact footer | Instant static defaults |
| `/contact` | [`contact/page.tsx`](../copian/frontend/src/app/contact/page.tsx) | CSR | Sticky utility bar + search, compact footer | Instant form |
| `/sitemap` | [`sitemap/page.tsx`](../copian/frontend/src/app/sitemap/page.tsx) | Pure static SSR | Sticky utility bar + search, compact footer | None needed |
| `/sitemap.xml` | [`sitemap.xml/route.ts`](../copian/frontend/src/app/sitemap.xml/route.ts) | Dynamic XML Route (`force-dynamic`) | — | — |
| `/robots.txt` | [`robots.ts`](../copian/frontend/src/app/robots.ts) | Metadata Route | — | — |

---

## Global Storefront Chrome ([`StorefrontShell.tsx`](../copian/frontend/src/components/StorefrontShell.tsx))

- **Sticky Top Utility Bar (`showUtilityBar = true` by default)**: Pinned inside the sticky `<header>` across all storefront pages (`lg+`) so it remains visible when scrolling, opening the `Products` dropdown, or switching tabs. Displays `CmsContext` credibility metrics, links to Compatibility Finder, Track Order, Buyer Portal, Distributors, ERP Portal (`/admin`), direct phone link, and an **Install App** button (`usePwaInstall()`, hidden when running as an installed PWA).
- **Sticky Navigation & Products Mega-Menu**:
  - Pressing `/` anywhere outside an `INPUT`, `TEXTAREA`, or `SELECT` focuses the header SKU/OEM search input.
  - Pressing `Alt + Shift + A` (`Option + Shift + A` on macOS, implemented via [`GlobalShortcuts.tsx`](../copian/frontend/src/components/GlobalShortcuts.tsx) in root layout) toggles between the storefront (`/admin`) and returns to the homepage (`/`) when pressed again inside `/admin/*` (ignored while focused in form fields).
  - Typing queries `GET /api/products?q=...&status=Published` with a `150ms` debounce and shows up to 6 autocomplete matches; pressing Enter jumps directly to `/product/<sku>` on match or `/products?q=...`.
  - Clicking **Products** smoothly opens/closes (`220ms` opacity + translateY + chevron rotation) a floating 3-column Mega Menu with category cards, `/compatibility` quick link, and footer link to `/products`.
  - **Inquiry Cart** pill displays live item count (`useCart().count`).
- **Mobile Drawer & Scroll-to-Top**: Slide-out mobile drawer includes search, all storefront + `/admin` links, WhatsApp deep link, and Install App action. Scrolling past `420px` reveals a fixed bottom-right smooth Back-to-Top button.

---

## Page-by-Page Feature Documentation

### 1. Homepage (`/`) — [`src/app/page.tsx`](../copian/frontend/src/app/page.tsx)
- **Asymmetric Hero & Studio Stage ([`HeroProductShowcase.tsx`](../copian/frontend/src/features/catalog/HeroProductShowcase.tsx))**:
  - Left column renders CMS-controlled hero eyebrow, headline, subtitle, CTAs (`/products`, `/inquiry-cart`), and 4 proof metrics (`COPIAN_METRICS` overridden by `CmsContext`).
  - Right column embeds an **automatic horizontal product carousel** (`autoSlideMs = 2500`, `300ms` slide transition) showcasing up to 6 featured SKUs (`CPN-HP-26A` prioritized first, with verified static fallback slides if `< 2` products load). Supports Prev/Next buttons, slide counter (`1 / 6`), dot indicators, Play/Pause toggle, hover/focus pause, `prefers-reduced-motion` pause, and mobile swipe (`> 40px`).
- **Printer Compatibility Lookup Bar**: Brand quick-pills + brand/model dropdowns navigating directly to `/compatibility?brand=...&model=...`.
- **Product Categories & Featured Tabs**: Displays seeded categories + a Wholesale Master Carton promo card, followed by **Best-Selling** vs **New Arrivals** tabbed product grid (`CatalogProductCard` with quantity stepper and `Quick View`).
- **Operational Pillars, Volume Slabs, Testimonials, FAQs & Resources**:
  - Live `volume_slabs` discount table (`1–49` 0%, `50–199` -8%, `200+` -15%).
  - Partner testimonials (`useCms().testimonials`), collapsible FAQ `<details>` accordion, and the top 2 published articles linking to `/resources?article=<slug>`.
- **Data calls**: Parallel fetch of `catalogApi.listCategories()`, featured & new-arrival `catalogApi.listProducts()`, and `catalogApi.getCompatibilityBrands()`.

### 2. Full B2B Product Catalogue (`/products`) — [`src/app/products/page.tsx`](../copian/frontend/src/app/products/page.tsx)
- **Faceted Filtering**: Reads `?q=` search param on load and filters live in-browser across SKU, name, OEM code, and `compatible_printers_text`, combined with Category checkboxes, Printer Brand checkboxes, and `"Bulk Ready (In Stock)"` availability filter. Mobile viewports expose a slide-down Filters toggle.
- **Sorting & Layout**: Sort by `Featured`, `Highest Yield` (`yield-desc`), or `Lowest MOQ` (`moq-asc`), and toggle between Grid and List cards (`CatalogProductCard`).
- **Quick View ([`ProductQuickViewModal.tsx`](../copian/frontend/src/features/catalog/ProductQuickViewModal.tsx))**: Modal displaying SKU, OEM code, page yield, MOQ, computed unit rates at 10 / 50 / 200+ quantities, direct link to full specifications, and 1-click Add to Inquiry.

### 3. Category Showcase (`/category/[slug]`) — [`CategoryDetailView.tsx`](../copian/frontend/src/features/catalog/CategoryDetailView.tsx)
- **SSR SEO**: Server page runs `generateMetadata` and injects a `schema.org/CollectionPage` JSON-LD script from `GET /api/categories/:slug`.
- **Interactive Controls**: Brand filter pills (`All Brands` + discovered brands in category), sort selector (`popularity` / `yield`), 3-column SKU grid with instant MOQ cart addition, category `seo_guide`, and cross-links to other categories.

### 4. Product Detail & Interactive Tier Calculator (`/product/[sku]`) — [`ProductDetailView.tsx`](../copian/frontend/src/features/catalog/ProductDetailView.tsx)
- **SSR SEO**: Generates SKU-specific `<title>`, `<meta description>`, and `schema.org/Product` + `Offer` (`INR`) JSON-LD.
- **Gallery & Variants**: Interactive 4-image thumbnail switcher with click-to-zoom (`scale(1.45)`) stage and optional SKU Yield Variant selector (`product.variants`).
- **Live Tiered Dealer Pricing Calculator**: Selecting any `volume_slabs` button or incrementing quantity (`-/+` in steps of `10`, floored at `activeMoq`) dynamically recalculates `effectiveUnitPrice`, `estTotal`, and estimated master cartons (`Math.ceil(qty / master_carton_qty)`).
- **Technical Tabs & Print**: Switches between `Technical Specifications`, `Compatible Printer Models`, and `Features & Packaging`, plus `"Print Spec Sheet"` (`window.print()`) and `"Related Compatible Supplies"`.

### 5. Printer Compatibility Finder (`/compatibility`) — [`src/app/compatibility/page.tsx`](../copian/frontend/src/app/compatibility/page.tsx)
- Supports URL query deep-links `?brand=...&model=...`.
- Combines Brand quick-select chips, Manufacturer `<select>`, and HTML `<datalist>` model autocomplete (`cf-model-list`) backed by `GET /api/compatibility/brands`.
- Queries `GET /api/compatibility` and smooth-scrolls to `#compat-results`, rendering a 7-column comparison table (`SKU`, `Product & OEM`, `Type`, `Yield`, `Dealer Base`, `MOQ`, `Add to Inquiry`).

### 6. Bulk Inquiry Cart & BOM CSV Upload (`/inquiry-cart`) — [`src/app/inquiry-cart/page.tsx`](../copian/frontend/src/app/inquiry-cart/page.tsx)
- **Quick-Add & CSV BOM Import**: Buyers can add any published SKU via dropdown + quantity, or upload a `.csv` Bill of Materials (`sku,quantity,note`); matched SKUs are added to the persistent server session cart automatically.
- **Per-Item Packaging Notes**: Editable quantity (`PATCH /api/cart/:id`), item notes, item removal (`DELETE /api/cart/:id`), and live estimated order total (`qty * dealer_price`).
- **RFQ Submission**: Validates required fields + optional 15-character GSTIN (`isValidOptionalGstin`), submits `POST /api/inquiries` (which auto-clears the server cart and emails/logs an `INQ-*` reference), displays the generated reference code, and resets local cart state.

### 7. Track Order / Inquiry Status (`/track-order`) — [`src/app/track-order/page.tsx`](../copian/frontend/src/app/track-order/page.tsx)
- Public lookup form (`POST /api/track`) accepting any `INQ-*`, `QT-*`, `ORD-*`, or `INV-*` code plus registered email or 4+ trailing phone digits.
- Displays verified document status (`Order`, `Quotation`, or `Bulk Inquiry`), payment status, courier & AWB/LR tracking number, line items, and full chronological dispatch timeline.

### 8. Buyer Self-Service Portal (`/account`) — [`src/app/account/page.tsx`](../copian/frontend/src/app/account/page.tsx)
- **Authentication**: Stores buyer JWT in `localStorage["copian_buyer_token"]` using `POST /api/buyer/login` (registered email + GSTIN or 4+ trailing phone digits, with a `"Fill Demo"` shortcut for `orders@deccanoffice.in` / `2311`).
- **Credit Ledger**: 4 KPI cards from `GET /api/buyer/portal` showing `30-Day Credit Limit`, `Unpaid / Utilized`, `Available Balance`, and `Overdue 30d+` warning banner when applicable.
- **Order History Actions**:
  - **GST Invoice PDF**: Authenticated fetch to `GET /api/buyer/orders/:id/pdf` downloading `COPIAN-Invoice-<invoice_code>.pdf`.
  - **One-Click Re-Order**: Loops all line items of a past order through `addToCart(...)` and navigates directly to `/inquiry-cart`.

### 9. Supporting Content & Legal/SEO Routes
- **`/distributors`** ([`distributors/page.tsx`](../copian/frontend/src/app/distributors/page.tsx)): Client-side search across city, state, distributor name, and territory backed by `GET /api/distributors?active_only=true`.
- **`/resources`** ([`resources/page.tsx`](../copian/frontend/src/app/resources/page.tsx)): Live article search, featured article spotlight, `?article=<slug>` deep-link reader, and smooth scroll-to-top full-article view (`GET /api/articles`).
- **`/about`** ([`about/page.tsx`](../copian/frontend/src/app/about/page.tsx)): Brand story, 10 OEM ecosystem chips linking to `/compatibility?brand=...`, 4 proof metrics, and quality/warehouse pillars driven by `CmsContext`.
- **`/contact`** ([`contact/page.tsx`](../copian/frontend/src/app/contact/page.tsx)): B2B inquiry & dealership form (`POST /api/contact`), Thane HQ details, and WhatsApp direct link.
- **`/sitemap` & `/sitemap.xml`**: Human-readable journey-flow architecture directory (`/sitemap`) alongside dynamic XML sitemap (`/sitemap.xml`) and crawler policy (`/robots.txt`).
- **`not-found.tsx`, `error.tsx`, `global-error.tsx`**: Branded 404 recovery inside `StorefrontShell` and route/root error boundaries via [`ErrorBoundary.tsx`](../copian/frontend/src/components/ErrorBoundary.tsx).
