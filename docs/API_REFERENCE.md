# Copian B2B REST API Reference

Base URL (local development): `http://localhost:8000` (proxied same-origin via `/api/*` in Next.js).  
Interactive OpenAPI / Swagger UI: `http://localhost:8000/docs`.

---

## Global Conventions

- **Authentication**: Pass Admin or Buyer JWT via `Authorization: Bearer <token>`. Missing/expired tokens return `401`. Insufficient RBAC permissions return `403`.
- **RBAC Bypass**: Admin users whose role slug is `"super-admin"` bypass per-module checks automatically.
- **Validation & DB Errors**:
  - Pydantic validation failure (including malformed GSTIN matching `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$`): `422` `{"detail": "<field>: <msg>", "errors": [...]}`
  - Unique/foreign-key constraint conflict: `409`
  - Unexpected DB failure: `503`
  - Rate limit exceeded: `429`
- **Pagination Header**: Paginated `GET` list endpoints expose `X-Total-Count` in response headers (`limit` `1..200`, `offset >= 0`).
- **Media Mount**: Local uploaded assets are served directly at `/uploads/<filename>`.

---

## 1. System Health, Auth & RBAC (`app/main.py`, `app/routers/auth_roles.py`)

| Method | Path | Auth / RBAC | Rate Limit | Summary |
|---|---|---|---|---|
| `GET` | `/api/health` | Public | — | Returns `{"status": "ok", "service": "copian-backend"}`. |
| `POST` | `/api/auth/login` | Public | `15 / 60s` | Admin credential login. Body: `LoginRequest` (`{email, password}`). Returns `200` `{access_token, token_type: "bearer", user}` or `401`/`403` (disabled account). |
| `GET` | `/api/auth/demo-session` | Public if `ENABLE_DEMO_AUTH=true` (else `403`) | — | Query: `email` (default `"arjun@copian.in"`). Issues a 24h JWT & user object for instant demo/role switching (`404` if no active admin exists). |
| `GET` | `/api/auth/me` | Optional Admin JWT | — | Returns `{"authenticated": true, "user": {...}}` or `{"authenticated": false, "user": null}`. |
| `GET` | `/api/roles` | `Roles & Permissions` : `view` | — | Returns `{"roles": [...], "users": [...]}` including all role permission matrices and admin staff list. |
| `PUT` | `/api/roles/{role_id}` | `Roles & Permissions` : `edit` | — | Path: `role_id: int`. Body: `{"permissions": {module: {action: bool}}}`. Updates matrix + logs `UPDATE_ROLE_MATRIX` (`404` if missing). |
| `GET` | `/api/audit-logs` | `Roles & Permissions` : `view` | — | Query: `limit: int = 25`. Returns latest `AuditLog` entries sorted newest first. |
| `POST` | `/api/roles/users` | `Roles & Permissions` : `create` | — | Body: `AdminUserCreate` (`{name, email, password, role_id}`). Returns `{id, name, email, role_name}` (`400` duplicate email, `404` missing role). |
| `PATCH` | `/api/roles/users/{user_id}` | `Roles & Permissions` : `edit` | — | Body: `AdminUserUpdate` (`{role_id?, is_active?}`). Returns `{id, is_active, role_id}` (`404` if missing). |

---

## 2. Catalog, Compatibility & Media Upload (`app/routers/products.py`)

### Categories
| Method | Path | Auth / RBAC | Params / Body | Response |
|---|---|---|---|---|
| `GET` | `/api/categories` | Public | — | Ordered list of `{id, name, slug, subtitle, description, image_url, seo_guide, display_order}`. |
| `POST` | `/api/categories` | `Products & Categories` : `create` | `CategoryCreate` (`name`, optional `slug`, `subtitle`, `description`, `image_url`, `seo_guide`, `display_order`) | `200` `{id, name, slug}` (`400` if duplicate name/slug). |
| `PUT` | `/api/categories/{category_id}` | `Products & Categories` : `edit` | `CategoryUpdate` (partial fields) | `200` `{updated: true, id}` (`404` if missing). |
| `DELETE` | `/api/categories/{category_id}` | `Products & Categories` : `delete` | Path: `category_id: int` | `200` `{deleted: true}` (`404` if missing). |
| `GET` | `/api/categories/{slug}` | Public | Path: `slug: str` | `200` `{category: {...}, products: [...]}` (only `Published` products; `404` if category missing). |

### Products & Bulk / CSV
| Method | Path | Auth / RBAC | Params / Body | Response |
|---|---|---|---|---|
| `GET` | `/api/products` | Public | Query: `q`, `category` (comma-sep), `brand` (comma-sep), `in_stock_only` (`bool`), `status`, `featured` (`bool`), `new_arrival` (`bool`), `sort` (`"featured"` \| `"yield-desc"` \| `"moq-asc"`), `limit` (`1..200`), `offset` (`>=0`) | `200` List of serialized products + `X-Total-Count` header. Includes aggregated `available_qty`, `reserved_qty`, `reorder_level`, and derived `stock_status`. |
| `GET` | `/api/products/export/csv` | `Products & Categories` : `export` | — | `text/csv` stream (`copian-products.csv`: SKU, Name, Category, Brand, OEM Code, Page Yield, MOQ, Dealer Price, Available Qty, Status). |
| `POST` | `/api/products/import/csv` | `Products & Categories` : `create` | `multipart/form-data` (`file`: CSV matching headers) | `200` `{"imported": int}` (skips existing SKUs; creates `InventoryItem` in first warehouse). |
| `GET` | `/api/products/{identifier}` | Public | Path: SKU (case-insensitive) or `slug` | `200` `{"product": {...}, "related": [...]}` (up to 3 published items; `404` if missing). |
| `POST` | `/api/products` | `Products & Categories` : `create` | `ProductCreate` (`sku`, `name`, `brand`, `category_name`, `oem_code`, `page_yield`, `moq`, `dealer_price`, `gst_rate`, `hsn_code`, `initial_stock`, `warehouse_name`, SEO & media fields) | `200` Serialized product + creates initial stock & `CREATE_PRODUCT` audit (`400` if SKU exists). |
| `PUT` | `/api/products/{product_id}` | `Products & Categories` : `edit` | `ProductUpdate` (partial) | `200` Serialized product + `UPDATE_PRODUCT` audit (`404` if missing). |
| `DELETE` | `/api/products/{product_id}` | `Products & Categories` : `delete` | Path: `product_id: int` | `200` `{"deleted": true, "id": int}` + `DELETE_PRODUCT` audit (`404` if missing). |
| `POST` | `/api/products/bulk` | `Products & Categories` : `edit` | `BulkProductAction` (`{ids: int[], action: "publish" \| "draft" \| "delete"}`) | `200` `{"affected": int, "action": str}`. |

### Printer Compatibility & Image Upload
| Method | Path | Auth / RBAC | Params / Body | Response |
|---|---|---|---|---|
| `GET` | `/api/compatibility/brands` | Public | — | `200` `{"brands": string[], "models_by_brand": {[brand]: [{id, model_name, series}]}}`. |
| `GET` | `/api/compatibility` | Public | Query: `brand?`, `model?` | `200` `{"brand": str, "model": str, "matches": [Product...]}` (junction match with text-search fallback). |
| `POST` | `/api/compatibility/models` | `Products & Categories` : `create` | `PrinterModelCreate` (`{brand, model_name, series="" }`) | `200` `{id, brand, model_name, series}`. |
| `DELETE` | `/api/compatibility/models/{model_id}` | `Products & Categories` : `delete` | Path: `model_id: int` | `200` `{deleted: true}` (`404` if missing). |
| `POST` | `/api/upload` | `Products & Categories` : `create` | `multipart/form-data` (`file`: PNG, JPG, JPEG, WEBP, GIF, SVG; max 10 MB) | `200` `{"url": str, "filename": str, "backend": "local" \| "s3" \| "r2"}` (`400` validation, `501` unconfigured cloud backend). |

---

## 3. Inventory & Warehouses (`app/routers/inventory.py`)

| Method | Path | Auth / RBAC | Params / Body | Response |
|---|---|---|---|---|
| `GET` | `/api/inventory` | `Inventory & Stock Ledger` : `view` | — | `200` `{"kpis": {...}, "warehouses": [...], "listing": [...], "transactions": [...] (latest 50), "alerts": [...]}`. |
| `POST` | `/api/inventory/warehouses` | `Inventory & Stock Ledger` : `create` | `WarehouseCreate` (`{name, code, city}`) | `200` `{id, name, code, city}` (`400` if code exists). |
| `DELETE` | `/api/inventory/warehouses/{warehouse_id}` | `Inventory & Stock Ledger` : `edit` | Path: `warehouse_id: int` | `200` `{deleted: true}` (`404` if missing). |
| `POST` | `/api/inventory/inward` | `Inventory & Stock Ledger` : `create` | `InventoryActionRequest` (`sku`, `warehouse_name`, `quantity`, `reference_code`, `reason`, `performed_by`) | `200` `{txn_code, sku, new_qty}` + `STOCK_INWARD` ledger/audit (`400`/`404`). |
| `POST` | `/api/inventory/outward` | `Inventory & Stock Ledger` : `edit` | `InventoryActionRequest` | `200` `{txn_code, sku, new_qty}` + `STOCK_OUTWARD` ledger/audit (`400` insufficient stock, `404`). |
| `POST` | `/api/inventory/adjust` | `Inventory & Stock Ledger` : `edit` | `InventoryActionRequest` (`reason` required; `adjustment_type` ending `"(+)"` adds, otherwise subtracts) | `200` `{txn_code, sku, new_qty}` + `STOCK_ADJUSTMENT` ledger/audit (`400`/`404`). |

---

## 4. Cart, Public Tracker, Buyer Portal, Inquiries, Quotations, Orders & Contact (`app/routers/sales.py`)

### Storefront Session Inquiry Cart
| Method | Path | Auth / RBAC | Params / Body | Response |
|---|---|---|---|---|
| `GET` | `/api/cart` | Public | Query: `session_id = "default"` | `200` List of `CartItem` rows for session. |
| `POST` | `/api/cart` | Public | `CartItemAdd` (`session_id`, `sku`, `product_name`, `moq`, `quantity`, `note`, ...) | `200` `{id, sku, product_name, quantity}` (increments existing SKU quantity in same session). |
| `PATCH` | `/api/cart/{item_id}` | Public | `CartItemUpdate` (`{quantity?, note?}`) | `200` `{updated: true}` (min quantity `1`; `404` if missing). |
| `DELETE` | `/api/cart/{item_id}` | Public | Path: `item_id: int` | `200` `{deleted: true}` (`404` if missing). |

### Public Tracker & Self-Service Buyer Portal
| Method | Path | Auth / RBAC | Rate Limit | Params / Body & Response |
|---|---|---|---|---|
| `POST` | `/api/track` | Public | `30 / 60s` | Body: `{reference_code (INQ/QT/ORD/INV), contact (email or 4+ phone digits)}`. Returns `200` `TrackResult` (`type: "Order" \| "Quotation" \| "Bulk Inquiry"`, `items`, `timeline`, carrier/tracking) or `404`. |
| `POST` | `/api/buyer/login` | Public | `15 / 60s` | Body: `{email, verification (GSTIN or 4+ trailing phone digits)}`. Returns `200` `{"access_token", "token_type": "bearer"}` (`401` on mismatch). |
| `GET` | `/api/buyer/portal` | `require_buyer` | — | Returns `200` `{"customer": {...credit_limit, credit_used, credit_available, overdue_30d_amount, overdue_count}, "orders": [...], "quotations": [...], "inquiries": [...]}` scoped to authenticated customer. |
| `GET` | `/api/buyer/orders/{order_id}/pdf` | `require_buyer` | — | Verifies `Order.customer_id == buyer.id`; streams `application/pdf` (`COPIAN-Invoice-<invoice_code>.pdf`) or `404`. |

### Bulk Inquiries (`INQ-*`)
| Method | Path | Auth / RBAC | Rate Limit | Params / Body & Response |
|---|---|---|---|---|
| `GET` | `/api/inquiries` | `Bulk Inquiries & Quotations` : `view` | — | Query: `status?`, `limit?`, `offset`. Returns `{"counts": {status: int, All: int}, "inquiries": [...]}` + `X-Total-Count`. |
| `POST` | `/api/inquiries` | Public | `20 / 60s` | Body: `InquiryCreate` (`company_name`, `contact_name`, `phone`, `email`, optional validated `gstin`, `delivery_city`, `session_id?`, `items`). Auto-creates `Customer` if email new, clears session cart, logs audit, queues email notification. `200` Serialized inquiry (`400` if empty items). |
| `PATCH` | `/api/inquiries/{inquiry_id}` | `Bulk Inquiries & Quotations` : `edit` | — | Body: `InquiryUpdate` (`{status?, assigned_salesperson?, internal_note?}`). Returns serialized inquiry (`404` if missing) + background email notification. |
| `POST` | `/api/inquiries/{inquiry_id}/convert-quotation` | `Bulk Inquiries & Quotations` : `create` | — | Generates `Draft` quotation (`QT-2026-*`, ₹800 shipping, 18% GST) priced from `Product.dealer_price`, moves inquiry to `"Under Review"`. Returns serialized quotation. |
| `POST` | `/api/inquiries/{inquiry_id}/convert-order` | `Orders & GST Invoices` : `create` | — | Creates `Order` (`ORD-*`, `INV-2026-*`, flat 18% GST), reserves inventory, sets inquiry `"Converted"`. Returns serialized order. |

### Quotations (`QT-2026-*`)
| Method | Path | Auth / RBAC | Params / Body & Response |
|---|---|---|---|
| `GET` | `/api/quotations` | `Bulk Inquiries & Quotations` : `view` | `200` List of serialized quotations (newest first). |
| `POST` | `/api/quotations` | `Bulk Inquiries & Quotations` : `create` | Body: `QuotationCreate` (`customer_name`, optional `customer_gstin`, `valid_until`, `gst_rate`, `discount_amount`, `shipping_amount`, `items`). Recomputes totals & returns serialized quotation. |
| `PUT` | `/api/quotations/{quote_id}` | `Bulk Inquiries & Quotations` : `edit` | Body: `QuotationUpdate` (replaces line items if provided, recalculates totals). Returns serialized quotation (`404` if missing). |
| `POST` | `/api/quotations/{quote_id}/send` | `Bulk Inquiries & Quotations` : `edit` | Sets quote `status="Sent"`, linked inquiry `status="Quotation Sent"`, logs `SEND_QUOTATION`, queues SMTP email with ReportLab PDF attachment. |
| `POST` | `/api/quotations/{quote_id}/convert-order` | `Orders & GST Invoices` : `create` | Creates `Order` copying totals, reserves stock, marks quote & linked inquiry `"Converted"`. |
| `GET` | `/api/quotations/{quote_id}/pdf` | `Bulk Inquiries & Quotations` : `export` | Streams binary `application/pdf` (`COPIAN-Quote-<quote_code>.pdf`, ReportLab A4 proforma with auto CGST+SGST / IGST). |

### Orders, Invoices & Contact Desk
| Method | Path | Auth / RBAC | Rate Limit | Params / Body & Response |
|---|---|---|---|---|
| `GET` | `/api/orders` | `Orders & GST Invoices` : `view` | — | Query: `limit?`, `offset`. Returns serialized orders (newest first) + `X-Total-Count`. |
| `POST` | `/api/orders` | `Orders & GST Invoices` : `create` | — | Body: `OrderCreate` (`customer_name`, `shipping_address`, `gstin`, `payment_status`, `fulfilment_status`, `items`). Reserves stock & creates initial timeline event. |
| `PATCH` | `/api/orders/{order_id}` | `Orders & GST Invoices` : `edit` | — | Body: `OrderUpdate` (`payment_status`, `fulfilment_status`, `shipping_address`, `courier_name`, `tracking_number`, `timeline_event`). Appends timeline entries; `"Dispatched"` commits outward stock deduction; `"Cancelled"` releases reserved stock. |
| `GET` | `/api/orders/{order_id}/pdf` | `Orders & GST Invoices` : `export` | — | Streams binary `application/pdf` (`COPIAN-Invoice-<invoice_code>.pdf`). |
| `POST` | `/api/contact` | Public | `15 / 60s` | Body: `ContactMessageCreate`. Logs `CONTACT_SUBMISSION` audit & returns `{"id": int, "status": "received"}`. |
| `GET` | `/api/contact` | `Bulk Inquiries & Quotations` : `view` | — | Returns list of `ContactMessage` rows ordered newest first. |
| `PATCH` | `/api/contact/{msg_id}` | `Bulk Inquiries & Quotations` : `edit` | — | Body: `{"status": str}`. Returns `{"id": int, "status": str}` (`404` if missing). |

---

## 5. CRM, Distributors, CMS/SEO & Analytics (`app/routers/crm_cms.py`)

### Customers & Distributors
| Method | Path | Auth / RBAC | Params / Body & Response |
|---|---|---|---|
| `GET` | `/api/customers` | `Customers & Distributors` : `view` | Query: `q?`, `classification?`, `limit?`, `offset`. Returns customer CRM rows + credit ledger (`credit_limit`, `credit_used`, `credit_available`, `overdue_30d_amount`, `overdue_count`) + nested `inquiries`/`orders` + `X-Total-Count`. |
| `GET` | `/api/customers/export/csv` | `Customers & Distributors` : `export` | Streams `text/csv` (`copian-customers.csv`). |
| `POST` | `/api/customers` | `Customers & Distributors` : `create` | Body: `CustomerCreate` (validates optional GSTIN). Returns created customer CRM shape. |
| `PUT` | `/api/customers/{customer_id}` | `Customers & Distributors` : `edit` | Body: `CustomerUpdate` (partial). Returns `{"updated": true, "id": int}` (`404` if missing). |
| `DELETE` | `/api/customers/{customer_id}` | `Customers & Distributors` : `approve` | Path: `customer_id: int`. Returns `{"deleted": true}` (`404` if missing). |
| `GET` | `/api/distributors` | Public | Query: `q?`, `active_only: bool = False`. Returns distributor list filtered across name/city/state/territory. |
| `POST` | `/api/distributors` | `Customers & Distributors` : `create` | Body: `DistributorCreate`. Returns created `Distributor`. |
| `PUT` | `/api/distributors/{dist_id}` | `Customers & Distributors` : `edit` | Body: `DistributorUpdate`. Returns updated `Distributor` (`404` if missing). |
| `DELETE` | `/api/distributors/{dist_id}` | `Customers & Distributors` : `approve` | Returns `{"deleted": true}` (`404` if missing). |

### Website CMS, Blog, FAQs & Redirects
| Method | Path | Auth / RBAC | Params / Body & Response |
|---|---|---|---|
| `GET` | `/api/cms` | Public | Returns merged `seo`, `homepage`, `contact`, `metrics`, `testimonials`, `volume_slabs`, `about`, plus `articles`, `faqs`, and `redirects`. |
| `PUT` | `/api/cms` | `Website & SEO` : `edit` | Body: `CmsSettingsUpdate` (partial upsert of any of the 7 JSON sections) + `PUBLISH_CMS` audit log. Returns `{"updated": true}`. |
| `GET` | `/api/articles` | Public | Query: `q?`. Returns published articles (`is_published=True`) ordered featured-first. |
| `POST` | `/api/articles` | `Website & SEO` : `create` | Body: `ArticleCreate`. Auto-generates unique slug. Returns created `Article`. |
| `DELETE` | `/api/articles/{art_id}` | `Website & SEO` : `delete` | Returns `{"deleted": true}` (`404` if missing). |
| `POST` | `/api/faqs` | `Website & SEO` : `create` | Body: `FaqCreate`. Returns created `Faq`. |
| `DELETE` | `/api/faqs/{faq_id}` | `Website & SEO` : `delete` | Returns `{"deleted": true}` (`404` if missing). |
| `POST` | `/api/redirects` | `Website & SEO` : `create` | Body: `RedirectCreate` (`source_path`, `target_path`, `status_code=301`). Returns `SeoRedirect`. |
| `DELETE` | `/api/redirects/{red_id}` | `Website & SEO` : `delete` | Returns `{"deleted": true}` (`404` if missing). |

### Executive Dashboard, Reports & Global Search
| Method | Path | Auth / RBAC | Params / Body & Response |
|---|---|---|---|
| `GET` | `/api/dashboard` | `require_admin` | Query: `range = "30d"` (`"ytd"` for Q1–Q4 breakdown). Returns `kpis`, `trends`, `category_shares`, `recent_inquiries` (top 5), `low_stock_products` (top 5). |
| `GET` | `/api/reports` | `Reports & Analytics` : `view` | Returns `summary` (`avg_order_value`, `quote_acceptance_rate`, `repeat_buyers_pct`), `top_skus`, `warehouse_valuation`, `customer_activity`, and `funnel`. |
| `GET` | `/api/reports/export/csv` | `Reports & Analytics` : `export` | Streams `text/csv` (`copian-sales-report.csv`). |
| `GET` | `/api/search` | `require_admin` | Query: `q = ""`. Searches top 5 matching products (`sku`/`name`/`oem_code`), inquiries (`code`/`company`), and orders (`code`/`customer`). Returns `{"products": [...], "inquiries": [...], "orders": [...]}`. |

---

## Example Workflow: End-to-End API Sequence

```bash
# 1. Add item to Buyer Cart
curl -X POST http://localhost:8000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"session_id":"sess-demo01","sku":"CPN-HP-88A","product_name":"Copian 88A Black Toner","quantity":50,"moq":10}'

# 2. Submit Bulk Inquiry (auto-clears cart for sess-demo01)
curl -X POST http://localhost:8000/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Metro Print","contact_name":"Anil Patel","phone":"+91 9820012345","email":"anil@metroprint.in","delivery_city":"Mumbai","session_id":"sess-demo01","items":[{"sku":"CPN-HP-88A","product_name":"Copian 88A Black Toner","quantity":50}]}'

# 3. Admin Login & Convert Inquiry to Quotation -> Order
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"arjun@copian.in","password":"copian@2026"}' | jq -r '.access_token')

curl -X POST http://localhost:8000/api/inquiries/1/convert-quotation -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:8000/api/quotations/1/convert-order -H "Authorization: Bearer $TOKEN"
```
