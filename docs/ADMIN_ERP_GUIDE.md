# Admin ERP Workspace & RBAC Guide

The Copian Admin ERP spans `/admin/login` plus **12 workspace routes** wrapped in [`AdminLayout`](../copian/frontend/src/app/admin/layout.tsx) (`AdminAuthProvider`), [`AdminError`](../copian/frontend/src/app/admin/error.tsx), and [`AdminShell`](../copian/frontend/src/components/AdminShell.tsx).

---

## 1. Authentication, Session Handling & RBAC Architecture

### [`AdminAuthContext.tsx`](../copian/frontend/src/components/AdminAuthContext.tsx)
- **Persisted Keys**: `localStorage["copian_admin_token"]` (24h Bearer JWT) and `localStorage["copian_admin_user"]` (`AdminUser` JSON synced with an in-memory `cachedAdminUser` singleton).
- **Pre-Paint Hydration**: Uses `useIsomorphicLayoutEffect` (`useLayoutEffect` on client) to read stored `copian_admin_user` before the browser paints, preventing restricted sidebar links or unauthorized pages from flashing during route switches.
- **Session Initialization (`refreshAdminState`)**:
  - Skipped on `/admin/login` unless forced after form submit.
  - When a token is absent (and `ENABLE_DEMO_AUTH=true` on the backend), fetches `GET /api/auth/demo-session`; if the backend returns `403` (demo auth disabled), [`src/lib/api.ts`](../copian/frontend/src/lib/api.ts) redirects to `/admin/login`.
  - When a token is present, validates via `GET /api/auth/me` and fetches `GET /api/dashboard` for header alert counters (`unreadInquiries` & `alerts`).
  - Any HTTP `401` response in `apiFetch` clears stored admin credentials.

### Route-to-Module RBAC Guard (`ADMIN_ROUTE_MODULES`)

`AdminShell` maps route prefixes to PostgreSQL permission module keys:

| Route Prefix | Permission Module Key |
|---|---|
| `/admin/products` | `"Products & Categories"` |
| `/admin/inventory` | `"Inventory & Stock Ledger"` |
| `/admin/customers` | `"Customers & Distributors"` |
| `/admin/distributors` | `"Customers & Distributors"` |
| `/admin/inquiries` | `"Bulk Inquiries & Quotations"` |
| `/admin/quotations` | `"Bulk Inquiries & Quotations"` |
| `/admin/orders` | `"Orders & GST Invoices"` |
| `/admin/website-seo` | `"Website & SEO"` |
| `/admin/reports` | `"Reports & Analytics"` |
| `/admin/roles` | `"Roles & Permissions"` |
| `/admin`, `/admin/sitemap`, `/admin/login` | `null` (open to any authenticated ERP user) |

- **Permission Resolution (`canActionForUser`)**:
  1. `role_slug === "super-admin"` -> always `true` across all modules and actions.
  2. `"Roles & Permissions"` -> explicitly `false` for all non-super-admins.
  3. Otherwise checks `Boolean(user.permissions?.[moduleKey]?.[action])` (`view`, `create`, `edit`, `delete`, `approve`, `export`).
- **Deep-Link 403 UI**: When `authReady` is true and `canViewModule(activeRequiredModule)` is false, `AdminShell` renders `<ErrorFallbackCard title="Access Restricted for Your Role" ... />` in place instead of mounting the page component.

### [`AdminShell.tsx`](../copian/frontend/src/components/AdminShell.tsx) Shared Capabilities
- **Responsive Collapsible Sidebar**: Fixed dark rail on `lg+`, slide-over drawer on mobile/tablet, showing only modules passing `canViewModule` plus live unreviewed inquiry count badge (`unreadInquiries`).
- **Global Search (`showSearch` prop, enabled on `/admin`)**: Press `/` anywhere outside form inputs to focus search; debounced `150ms` `GET /api/search?q=...` returns top 5 matching products, inquiries, and orders linking to their modules.
- **Notifications Popover**: Red indicator dot when low-stock alerts or unreviewed inquiries exist; quick links to `/admin/inquiries` and `/admin/inventory`.
- **Hot Role Switcher (Demo Testing)**: Profile dropdown can switch sessions live between `Arjun Mehta (Super Admin)`, `R. Sharma (Inventory Manager)`, and `Rohan Deshmukh (Sales Manager)` via `GET /api/auth/demo-session?email=...`, redirecting to `/admin` if the switched role lacks view permission for the current route.

---

## 2. Admin ERP Modules Reference (`/admin/*`)

| Route | Source & Skeleton | Required Module | Key Features & Exports |
|---|---|---|---|
| `/admin/login` | [`admin/login/page.tsx`](../copian/frontend/src/app/admin/login/page.tsx) | Public | Staff email/password form (`POST /api/auth/login`), refreshes context and routes to `/admin`. |
| `/admin` | [`admin/page.tsx`](../copian/frontend/src/app/admin/page.tsx) + [`loading.tsx`](../copian/frontend/src/app/admin/loading.tsx) | Open (`null`) | 8 live KPI cards, date-range selector (`30d`, `90d`, `ytd`), interactive SVG bar + trendline chart, category inventory SVG donut chart, Recent Bulk Inquiries, Low Stock alert rows, global `/` search. |
| `/admin/products` | [`admin/products/page.tsx`](../copian/frontend/src/app/admin/products/page.tsx) + [`loading.tsx`](../copian/frontend/src/app/admin/products/loading.tsx) | `Products & Categories` | 3 tabs: **All Products** (search/category/brand filters, checkboxes, bulk Publish/Delete `<ConfirmModal>`, CSV Import/Export), **Add / Edit Product** (5-section editor, image upload `POST /api/upload` or preset picker, Publish/Save Draft), **Categories & Printers** (CRUD categories & printer models). |
| `/admin/inventory` | [`admin/inventory/page.tsx`](../copian/frontend/src/app/admin/inventory/page.tsx) + [`loading.tsx`](../copian/frontend/src/app/admin/inventory/loading.tsx) | `Inventory & Stock Ledger` | 5 warehouse KPIs + 7 tabs: `Inventory Listing`, `Stock Inward` (`create`), `Stock Outward` (`edit`), `Stock Adjustment` (`edit`, mandatory reason), `Transaction History` (`TXN-*` ledger), `Low Stock Alerts` (`Restock ->` pre-fills Inward form), and `Warehouses` (`+ Add Warehouse`). |
| `/admin/customers` | [`admin/customers/page.tsx`](../copian/frontend/src/app/admin/customers/page.tsx) + [`loading.tsx`](../copian/frontend/src/app/admin/customers/loading.tsx) | `Customers & Distributors` | Customer CRM table, CSV export (`export`), Add Customer modal (`create` + GSTIN validation), 4-tab split inspector (`Overview` with 30-day credit limit/unpaid/available/overdue banner, `Inquiries`, `Orders`, `Edit Account` notes/credit update). |
| `/admin/distributors` | [`admin/distributors/page.tsx`](../copian/frontend/src/app/admin/distributors/page.tsx) + [`loading.tsx`](../copian/frontend/src/app/admin/distributors/loading.tsx) | `Customers & Distributors` | Split distributor directory & profile form for territory assignment, GSTIN/contact management, Active/Inactive status, and read-only YTD metrics (`create` / `edit` gated). |
| `/admin/inquiries` | [`admin/inquiries/page.tsx`](../copian/frontend/src/app/admin/inquiries/page.tsx) + [`loading.tsx`](../copian/frontend/src/app/admin/inquiries/loading.tsx) | `Bulk Inquiries & Quotations` | Switch between **Cart Inquiries** (status filter pills `All`/`New`/`Under Review`/`Quotation Sent`/`Negotiation`/`Converted`, salesperson assignment, internal note, **Generate Quotation**, and **Convert to Order** gated by `Orders & GST Invoices:create`) and **Contact Desk** (`Mark Reviewed`). |
| `/admin/quotations` | [`admin/quotations/page.tsx`](../copian/frontend/src/app/admin/quotations/page.tsx) + [`loading.tsx`](../copian/frontend/src/app/admin/quotations/loading.tsx) | `Bulk Inquiries & Quotations` | Split Quotation Builder (`?id=` deep-linkable via `<Suspense>`) with multi-SKU line-item editor, GST `18%`/`12%`, volume discount, freight, live [`ProformaPreviewCard`](../copian/frontend/src/features/quotations/ProformaPreviewCard.tsx) showing auto `CGST+SGST` vs `IGST`, **WhatsApp** share link, **Send PDF** (`POST /api/quotations/:id/send` + print), **Download A4 PDF** (`export`), and **Convert to Order**. |
| `/admin/orders` | [`admin/orders/page.tsx`](../copian/frontend/src/app/admin/orders/page.tsx) + [`loading.tsx`](../copian/frontend/src/app/admin/orders/loading.tsx) | `Orders & GST Invoices` | Split Orders table (`?id=` deep-linkable via `<Suspense>`) + Fulfilment inspector (`Ready to Dispatch` / `Dispatched` / `Delivered` / `Cancelled`, `Paid` / `Credit 30d` / `Pending`, courier & AWB/LR tracking number with timeline logging), **Download PDF** (`export`), and printable **Tax Invoice Modal** (`computeGstBreakdown` + `window.print()`). |
| `/admin/reports` | [`admin/reports/page.tsx`](../copian/frontend/src/app/admin/reports/page.tsx) + [`loading.tsx`](../copian/frontend/src/app/admin/reports/loading.tsx) | `Reports & Analytics` | 3 executive KPIs (`Avg Order Value`, `Quote Acceptance Rate`, `Repeat B2B Buyers`), 4 tabs (`Sales Reports`, `Inventory Valuation`, `Customer Activity`, `Inquiry Conversion`), **Export CSV** (`export`), and printable **Download PDF** (`window.print()`). |
| `/admin/website-seo` | [`admin/website-seo/page.tsx`](../copian/frontend/src/app/admin/website-seo/page.tsx) + [`loading.tsx`](../copian/frontend/src/app/admin/website-seo/loading.tsx) | `Website & SEO` | 4-tab live CMS publisher (`SEO & Metadata` + 301 Redirects manager, `Homepage & Banners`, `Contact, Metrics & Trust` including volume slabs/about/testimonials, and `Blog & FAQs`), immediately refreshing `CmsContext` across the storefront on publish. |
| `/admin/roles` | [`admin/roles/page.tsx`](../copian/frontend/src/app/admin/roles/page.tsx) + [`loading.tsx`](../copian/frontend/src/app/admin/roles/loading.tsx) | `Roles & Permissions` (Super Admin only) | Role selector, 7×6 RBAC checkbox matrix (`PUT /api/roles/:id`), Admin Staff directory (`Active`/`Disabled` toggle), and `+ Add User` creator (`POST /api/roles/users`). |
| `/admin/sitemap` | [`admin/sitemap/page.tsx`](../copian/frontend/src/app/admin/sitemap/page.tsx) | Open (`null`) | Interactive 7-card Admin ERP navigation directory automatically marking cards as `"Restricted"` (non-clickable) when `canViewModule(...)` is false for the signed-in role. |

---

## 3. UI vs Backend Permission Notes for Maintainers

Backend routers enforce **all** mutations (`create`, `edit`, `delete`, `approve`, `export`) authoritatively via `require_permission(...)` (returning HTTP `403` on unauthorized calls). Inside the UI, several sub-controls rely on API rejection rather than hiding controls upfront:
- In `/admin/products`: row `Edit`, form `Publish Product` / `Save Draft`, and category/printer-model add/remove buttons are visible whenever the user can view the page (top bar `Add Product`, `Import CSV`, `Export CSV`, and bulk `Publish`/`Delete` buttons are explicitly gated by `canAction`).
- In `/admin/quotations`: `WhatsApp` and `Send PDF` buttons are always rendered when a quote is active (`Save Quotation`, `Download A4 PDF`, and `Convert to Order` are explicitly `canAction`-gated).
- In `/admin/orders`: `Generate GST Invoice` preview modal and status dropdowns are rendered for any viewer (`Download PDF` and `Save Tracking Info` are explicitly `canAction`-gated).
- In `/admin/website-seo`: tab-internal publish/add/delete actions rely on `Website & SEO` backend checks, while header `Publish Changes` is `canAction`-gated.
