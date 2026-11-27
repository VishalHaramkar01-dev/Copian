# Frontend Architecture, Design Tokens, Skeletons & PWA

Detailed developer guide to the internal Next.js 15 frontend architecture under `copian/frontend/`.

---

## 1. Architectural Layers (`copian/frontend/src/`)

```text
src/
├── core/          # Pure, zero-DOM TypeScript reusable on Web, React Native, or CLI
│   ├── pricing.ts         # Volume slabs, GST split calculator, GSTIN regex, INR formatters
│   └── copianMetrics.ts   # Verified track record metrics, 10 OEM brands, Thane HQ metadata
├── types/
│   └── copian.ts          # Domain TypeScript interfaces mirroring FastAPI payloads
├── lib/
│   └── api.ts             # API base resolution, apiFetch (15s timeout, auth/ngrok headers), file downloader
├── services/              # Thin typed API modules wrapping apiFetch
│   ├── catalogApi.ts
│   ├── salesApi.ts
│   └── adminApi.ts
├── features/              # Domain-scoped composite UI widgets
│   ├── catalog/           # HeroProductShowcase, CatalogProductCard, CategoryDetailView, ProductDetailView, ProductQuickViewModal
│   └── quotations/        # ProformaPreviewCard
├── components/            # Providers, shells, design primitives & 1-to-1 skeletons
└── app/                   # Next.js 15 App Router routes, loading.tsx skeletons & error boundaries
```

---

## 2. Request Transport & Dev Proxy (`next.config.ts` & `src/lib/api.ts`)

### Next.js Configuration ([`next.config.ts`](../copian/frontend/next.config.ts))
- **`distDir`**: Uses `process.env.NEXT_DIST_DIR || ".next"`.
- **`allowedDevOrigins`**: Allows `localhost`, `127.0.0.1`, `overdrawn-shrimp-browse.ngrok-free.dev`, `*.ngrok-free.dev`, and `*.ngrok.io`.
- **Rewrites**: Proxies `/api/:path*` and `/uploads/:path*` to `BACKEND_INTERNAL_URL` or `NEXT_PUBLIC_API_URL` (default `http://127.0.0.1:8000`, normalizing `://localhost:` -> `://127.0.0.1:` on Node server side to prevent IPv6 `::1` refusal on Windows).
- **Images**: Supports `avif`/`webp` and keeps `unoptimized: true` by default unless `NEXT_IMAGE_UNOPTIMIZED="false"`.

### `apiFetch` & `getApiBase()` ([`src/lib/api.ts`](../copian/frontend/src/lib/api.ts))
- **SSR (`typeof window === "undefined"`)**: Targets `127.0.0.1:8000` (or configured backend URL).
- **Browser**: If hosted on a remote origin (such as ngrok or LAN IP) while `NEXT_PUBLIC_API_URL` points to `localhost`/`127.0.0.1`, returns `""` so requests travel **same-origin** through Next.js `/api/*` rewrites cleanly.
- **Timeouts & Headers**: Uses a `15000ms` `AbortController` (`cache: "no-store"`), automatically skips `Content-Type` for `FormData`, appends `"ngrok-skip-browser-warning": "true"` when targeting ngrok, attaches `copian_admin_token` (or lets caller override `Authorization`, e.g. Buyer Portal's `copian_buyer_token`), and clears stale admin tokens on HTTP `401`.
- **Authenticated Downloads**: `downloadAuthenticatedFile(path, fallbackFilename)` fetches binary blobs (CSV/PDF) with the admin bearer token via `ensureAdminToken()` and triggers a browser `<a download>` flow. (Buyer Portal invoice PDF downloads use `copian_buyer_token` directly in `account/page.tsx`.)

---

## 3. Shared Context Providers ([`src/app/layout.tsx`](../copian/frontend/src/app/layout.tsx))

`RootLayout` wraps all routes in three providers in order:
1. **`PwaInstallProvider`** ([`PwaInstallProvider.tsx`](../copian/frontend/src/components/PwaInstallProvider.tsx))
2. **`CmsProvider`** ([`CmsContext.tsx`](../copian/frontend/src/components/CmsContext.tsx))
3. **`CartProvider`** ([`CartContext.tsx`](../copian/frontend/src/components/CartContext.tsx))

### `CartContext` Highlights
- Tracks session cart via `localStorage["copian_cart_session"]` (`sess-<uuid>`).
- On a browser's very first empty cart visit (`localStorage["copian_cart_seeded"] !== "1"`), seeds a 3-SKU sample B2B starter cart (`CPN-HP-88A` × 40, `CPN-PWD-1KG` × 20, `CPN-OPC-12A` × 50) so procurement evaluation works immediately.
- Implements optimistic quantity/note updates with snapshot rollback on API error, exposes `cartLoading` (prevents empty-cart flash on `/inquiry-cart`), captures unhandled promise rejections into a global bottom-left status toast (`3000ms`), and exposes `useCart()`.

### `CmsContext` Highlights
- Pre-hydrated with `DEFAULT_CONTACT`, `COPIAN_METRICS`, `COPIAN_SUPPORTED_BRANDS`, `VOLUME_SLABS`, and 3 verified partner testimonials from `src/core/*`, preventing blank text before `GET /api/cms` finishes.
- Exposes `refreshCms()` called immediately after saving in `/admin/website-seo`.

---

## 4. Core Pricing & Validation Rules ([`src/core/pricing.ts`](../copian/frontend/src/core/pricing.ts))

| Function / Constant | Behavior |
|---|---|
| `VOLUME_SLABS` | `1–49` units (0% Standard), `50–199` units (-8% Volume Discount), `200+` units (-15% Contract Rate). |
| `getVolumeDiscountPct(qty)` & `computeBulkUnitPrice(price, qty)` | Returns tier discount and rounded per-unit price. |
| `isIntraStateSupply(gstin?, address?)` | Returns `true` for Maharashtra GSTIN state prefix `"27"` or address containing Maharashtra/Mumbai/Thane/Pune/Nagpur/Nashik/Aurangabad/Navi Mumbai -> splits tax into **CGST + SGST**; otherwise **IGST**. |
| `computeGstBreakdown(...)` | Computes `taxable = max(0, subtotal - discount + shipping)` and returns `{ taxable, gstAmount, cgstAmount, sgstAmount, igstAmount, taxMode, grandTotal }`. |
| `GSTIN_REGEX` / `isValidOptionalGstin(v)` | Allows empty string or enforces Indian 15-character GSTIN format (`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$`). |
| `formatINR(n)` & `formatINRLakhs(n)` | Indian Rupee locale formatting (`en-IN`, `₹1.25 Cr`, `₹4.5L`). |

---

## 5. Design Tokens, Motion & Smooth Scrolling

Defined in [`tailwind.config.ts`](../copian/frontend/tailwind.config.ts), [`src/app/globals.css`](../copian/frontend/src/app/globals.css), and [`copian_b2b_design_system.md`](../copian_b2b_design_system.md):
- **Palette**: Material 3 Cobalt Navy primary (`#00366B`), Cool Slate neutrals (`#F9F9FF` surface background, `#FFFFFF` cards, `#E8E8ED` containers), Emerald success (`#146C2E`), Amber warning (`#8D4F13`), Crimson error (`#BA1A1A`).
- **Fonts**: `Wix Madefor Display` (`font-headline` / `font-display`), `Instrument Sans` (`font-body`), `Spline Sans Mono` (`font-mono`, tabular figures).
- **Smooth Scrolling & Transitions**:
  - `html { scroll-behavior: smooth; scroll-padding-top: 5.5rem; }` avoids sticky-header anchor clipping.
  - `overscroll-behavior-y: contain` and `scroll-behavior: smooth` on horizontal `[role="tablist"]` / `overflow-x-auto` containers.
  - Reusable Tailwind animations (`fade-in`, `surface-in`, `modal-in`, `drawer-in-left`, `megamenu-in`, `toast-in`), CSS `<details>` FAQ accordion transition (`accordion-open`), and `.no-print` print suppression for quotes/invoices/reports.
  - Full `@media (prefers-reduced-motion: reduce)` reset disables shimmer gradients, animations, and smooth scrolling when requested by the OS.

---

## 6. 1-to-1 Skeleton Loading System

- **Base Shimmer**: [`Skeleton`](../copian/frontend/src/components/Skeleton.tsx) applies `.skeleton-shimmer` (`#E8E8ED -> #F5F6FB -> #E8E8ED`, `1.4s ease-in-out infinite`) with accessible `aria-hidden="true"`.
- **Two-Layer Coverage**:
  1. **Route Navigation Fallbacks (`loading.tsx`)**: **20** dedicated Next.js App Router `loading.tsx` files (9 storefront routes + all 11 dynamic data Admin ERP routes) render full-page structural replicas during initial route transitions and `<Suspense>` boundaries (`/products`, `/compatibility`, `/resources`, `/admin/quotations`, `/admin/orders`).
  2. **In-Page Data Fetch Skeletons**: Client pages mirror those exact structures (`HeroShowcaseCardSkeleton` in Hero stage, `ProductDetailSkeleton` on `/product/[sku]`, `TableRowsSkeleton` across ERP & Compatibility tables, `CartItemsSkeleton` on `/inquiry-cart`, split spotlight + grid on `/resources`, KPI/SVG-chart skeletons on `/admin` & `/admin/reports`) so zero generic spinners or full-width placeholder bars appear and layout shift is eliminated.

---

## 7. PWA Configuration & Service Worker ([`manifest.ts`](../copian/frontend/src/app/manifest.ts), [`sw.js`](../copian/frontend/public/sw.js))

- **Web App Manifest (`/manifest.webmanifest`)**: Configured as `standalone` (`theme_color: "#00366B"`, `background_color: "#FAFAFF"`), providing `192x192`, `512x512`, `maskable-512x512`, and Apple `180x180` icons plus 4 quick app shortcuts (`/products`, `/compatibility`, `/inquiry-cart`, `/admin`).
- **Service Worker Strategy (`copian-pwa-v2` in `public/sw.js`)**:
  - Bypasses non-`GET`, cross-origin requests, `/api/*`, and `/uploads/*` completely (ERP/pricing data stays fresh).
  - `/_next/static/*`: **network-first** with cache fallback (prevents stale JS chunk hydration mismatches after deployments).
  - `/images/*` & `/icons/*`: **cache-first** for instant visual loads.
  - Navigations (`req.mode === "navigate"`): **network-first** with offline HTML fallback.
- **Dev vs Production Install Behavior ([`PwaInstallProvider.tsx`](../copian/frontend/src/components/PwaInstallProvider.tsx))**:
  - When `NODE_ENV !== "production"` (i.e. `npm run dev`), `PwaInstallProvider` unregisters active service workers so Turbopack/HMR assets never cache stale bundles — meaning Chrome `beforeinstallprompt` only fires on a **production build** (`npm run build && npm run start` or Docker) over HTTPS or `localhost` without an intermediary interstitial page (like ngrok's free warning screen).
  - Handles `beforeinstallprompt` cleanly for native Android Chrome / desktop Edge install prompts and provides an instructional fallback modal (`"Install Copian B2B App"`) for iOS Safari Share-sheet installation (`sessionStorage["copian_pwa_banner_dismissed"]`).
