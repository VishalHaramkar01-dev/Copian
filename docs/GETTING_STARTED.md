# Getting Started, Configuration, Migrations & Testing

This guide explains how to run the **Copian B2B & ERP** platform locally, configure environment variables, run database migrations, log in to Storefront Buyer and Admin ERP demo accounts, expose local instances via ngrok, deploy with Docker Compose, and execute automated tests.

---

## 1. Prerequisites

- **Python**: `3.13` (matches CI in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) and [`copian/backend/Dockerfile`](../copian/backend/Dockerfile))
- **Node.js**: `22.x` + `npm`
- **PostgreSQL**: `17` (default connection string connects to database `copian` on port `5432`)

---

## 2. Quick Start on Windows (`start-dev.ps1`)

If your Python virtual environment (`copian/backend/.venv`) and PostgreSQL `copian` database already exist, run:

```powershell
cd <repo-root>\copian
.\start-dev.ps1
```

From workspace root `d:\stitch_copian_b2b_redesign\stitch_copian_b2b_redesign`:

```powershell
.\copian\start-dev.ps1
```

[`start-dev.ps1`](../copian/start-dev.ps1) opens two PowerShell terminals:
1. FastAPI Backend with `--reload` on `http://localhost:8000`
2. Next.js Frontend (`npm run dev`, Turbopack + `--host`) on `http://localhost:3000` (automatically switches to `3001` if port `3000` is occupied)

> **Primary URLs (Local):**
> - Public Storefront: `http://localhost:3000` (or `:3001`)
> - Admin ERP Workspace: `http://localhost:3000/admin`
> - FastAPI Swagger UI: `http://localhost:8000/docs`
> - Health Check: `http://localhost:8000/api/health` (`{"status": "ok", "service": "copian-backend"}`)

---

## 3. Manual Setup (Step-by-Step)

### 3.1 Backend Setup (`copian/backend`)

```powershell
cd copian\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` to match your local PostgreSQL instance (see [Environment Variables](#4-environment-variables)).

Apply Alembic migrations before running in production or after fresh DB creation:

```powershell
alembic upgrade head
```

Start the FastAPI server:

```powershell
.\.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

> On startup (`lifespan` in [`app/main.py`](../copian/backend/app/main.py)), when `ENABLE_SCHEMA_AUTO_CREATE` defaults to `true`, SQLAlchemy calls `Base.metadata.create_all(bind=engine)`, then `seed_database(db)` runs idempotently (populating roles, staff accounts, warehouses, 5 categories, 10 SKUs, printer compatibility links, customers, distributors, sample inquiries/quotes/orders, CMS settings, articles, FAQs, and redirects if `roles` is empty).

### 3.2 Frontend Setup (`copian/frontend`)

```powershell
cd copian\frontend
npm install
```

Ensure `copian/frontend/.env.local` exists (or create it):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start development server:

```powershell
npm run dev          # Turbopack + --host (default)
# OR:
npm run dev:webpack  # Classic Next.js webpack dev server
```

Build and run production bundle:

```powershell
npm run build
npm run start
```

---

## 4. Environment Variables

### 4.1 Backend (`copian/backend/.env` — template in [`copian/backend/.env.example`](../copian/backend/.env.example))

| Variable | Default / Example | Purpose |
|---|---|---|
| `POSTGRES_URI` | `postgresql://postgres:Vishal%402004%2F-@localhost:5432/copian` (code fallback) | PostgreSQL DSN. `postgresql://` and `postgres://` are normalized to `postgresql+psycopg://` in [`app/database.py`](../copian/backend/app/database.py). |
| `JWT_SECRET` | `"copian-b2b-enterprise-secret-key-2026"` | HS256 signing key for Admin & Buyer JWTs. **Replace with a 32+ byte secret in production** (`log_security_config` logs a warning if default). |
| `CORS_ORIGINS` | `"http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"` | Comma-separated origins allowed by FastAPI `CORSMiddleware` (trailing `/` trimmed). |
| `ENABLE_DEMO_AUTH` | `"true"` (code) / `"false"` (`.env.example`, Docker) | Controls whether `GET /api/auth/demo-session` issues instant JWTs. Set to `false` in production (`403`). |
| `ENABLE_SCHEMA_AUTO_CREATE` | `"true"` (code) / `"false"` (`.env.example`, Docker) | Runs `Base.metadata.create_all()` on startup when truthy. Set to `false` in production and rely on `alembic upgrade head`. |
| `UPLOAD_BACKEND` | `"local"` | Image storage driver (`"local"` writes to `copian/backend/uploads`; `"s3"` or `"r2"` uploads via `boto3`). |
| `PUBLIC_API_URL` | `"http://localhost:8000"` | Prefix returned for locally saved images (`/uploads/<filename>`). |
| `S3_BUCKET` | `""` | Target bucket when `UPLOAD_BACKEND` is `"s3"` or `"r2"`. |
| `S3_ENDPOINT_URL` | `""` | Custom S3-compatible endpoint URL (e.g., Cloudflare R2). |
| `S3_PUBLIC_URL` | `"https://{bucket}.s3.amazonaws.com"` | Public CDN/bucket base URL returned by `storage_service.py`. |
| `REDIS_URL` | `""` | Optional Redis connection URL for multi-worker distributed rate limiting (`security.py`). Falls back to in-memory `deque` if unset or unreachable. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | `SMTP_PORT=587`, `SMTP_FROM="Copian B2B <noreply@copian.in>"` | Optional SMTP relay for background inquiry & quotation emails (`notification_service.py`). Logs simulation message when `SMTP_HOST` is unset. |

### 4.2 Frontend (`copian/frontend/.env.local`)

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `"http://localhost:8000"` | Base URL for FastAPI API requests (`src/lib/api.ts`) and Next.js `/api/*` + `/uploads/*` proxy rewrites (`next.config.ts`). |
| `BACKEND_INTERNAL_URL` | Uses `NEXT_PUBLIC_API_URL` | Optional server-only override for `next.config.ts` `rewrites()` destination when frontend container talks to backend service. |
| `NEXT_PUBLIC_SITE_URL` | `"https://copian.in"` | Canonical origin used by `src/app/robots.ts` and `src/app/sitemap.xml/route.ts`. |
| `NEXT_DIST_DIR` | `".next"` | Custom build directory (useful for isolated verification builds alongside a running dev server). |
| `NEXT_IMAGE_UNOPTIMIZED` | `"true"` (unless `"false"`) | Disables server image optimization by default so dynamic uploaded/external images render directly. |

---

## 5. Seeded Accounts & Demo Credentials

### 5.1 Admin ERP Staff (`AdminUser` seeded in [`app/seed.py`](../copian/backend/app/seed.py))
All seeded admin accounts share the demo password **`copian@2026`**:

| Name | Email | Initials | Role | Primary Access Scope |
|---|---|---|---|---|
| Arjun Mehta | `arjun@copian.in` | `AM` | Super Admin (`super-admin`) | Full unrestricted access to all ERP modules & Role Matrix |
| R. Sharma | `sharma@copian.in` | `RS` | Inventory Manager (`inventory-manager`) | Products, full Inventory Ledger, Orders (view/edit), Customers (view), Reports |
| Rohan Deshmukh | `rohan@copian.in` | `RD` | Sales Manager (`sales-manager`) | Bulk Inquiries, Quotations, Orders & Invoices, Customers/Distributors, Reports |
| Priya Iyer | `priya@copian.in` | `PI` | Sales Executive (`sales-executive`) | Same permissions as `sales-manager` |

When `ENABLE_DEMO_AUTH=true`, visiting `/admin` automatically acquires a session for `arjun@copian.in`, and the Admin topbar profile dropdown lets you hot-switch between Arjun Mehta, R. Sharma, and Rohan Deshmukh to verify RBAC enforcement live.

### 5.2 Buyer Portal (`/account`) Test Logins
Buyers log in using `POST /api/buyer/login` with registered **Email + GSTIN or at least 4 trailing phone digits**:

| Company | Email | Phone (last 4 digits) | GSTIN |
|---|---|---|---|
| Deccan Office Supplies (`"Fill Demo"` button on `/account`) | `orders@deccanoffice.in` | `+91 98450 22311` (`2311`) | `29AAACD1234F1Z5` |
| Apex Managed Print Pvt. Ltd. | `procurement@apexprint.in` | `+91 98204 55110` (`5110`) | `27AABCU9603R1ZM` |
| Capital Print Hub | `neha@capitalprinthub.in` | `+91 98112 77420` (`7420`) | `07AAACB5678H1Z2` |

---

## 6. Database Migrations (`alembic/`)

Alembic reads `POSTGRES_URI` dynamically in [`copian/backend/alembic/env.py`](../copian/backend/alembic/env.py).

| Revision | Parent | Description |
|---|---|---|
| `0001_baseline` | `None` | Creates all SQLAlchemy tables defined in `app/models.py` (`Base.metadata.create_all`). |
| `0002_order_dispatch_tracking` | `0001_baseline` | Idempotently adds `courier_name` and `tracking_number` columns to `orders`. |
| `0003_customer_credit_limit` | `0002_order_dispatch_tracking` | Idempotently adds `credit_limit` (`Float`, default `250000.0`) column to `customers`. |

Common commands (from `copian/backend/`):

```powershell
alembic current
alembic upgrade head
alembic revision --autogenerate -m "describe_change"
```

---

## 7. Docker Compose Production Stack

Run PostgreSQL 17, FastAPI (`alembic upgrade head && uvicorn`), and Next.js production container together using [`copian/docker-compose.yml`](../copian/docker-compose.yml):

```powershell
cd copian
docker compose up --build
```

Key Docker behaviors:
- `backend` waits on `postgres` healthcheck (`pg_isready`), sets `ENABLE_SCHEMA_AUTO_CREATE="false"`, runs `alembic upgrade head` in [`backend/Dockerfile`](../copian/backend/Dockerfile) `CMD`, and mounts `copian_uploads` volume at `/app/uploads`.
- `frontend` runs multi-stage Next.js `node:22-alpine` build ([`frontend/Dockerfile`](../copian/frontend/Dockerfile)) with build args `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`, then serves `npm run start` on port `3000`.

---

## 8. Running Behind ngrok / Reverse Proxies

1. Start backend (`:8000`) and frontend (`:3000` or `:3001`) locally.
2. Add your ngrok origin to `CORS_ORIGINS` in `copian/backend/.env` if exposing backend directly (comma-separated).
3. [`copian/frontend/next.config.ts`](../copian/frontend/next.config.ts) already permits `*.ngrok-free.dev` and `*.ngrok.io` in `allowedDevOrigins` and rewrites `/api/:path*` + `/uploads/:path*` to `127.0.0.1:8000`.
4. [`copian/frontend/src/lib/api.ts`](../copian/frontend/src/lib/api.ts) detects non-localhost browser origins when `NEXT_PUBLIC_API_URL` points to `localhost`/`127.0.0.1`, routing browser calls same-origin cleanly while injecting `"ngrok-skip-browser-warning": "true"` when talking directly to an ngrok backend URL.
5. **PWA note**: On ngrok free tier, Chrome mobile service-worker navigation or installability can still be blocked by ngrok's browser interstitial if the app isn't served cleanly as a production build (`npm run build && npm run start`) behind a non-interstitial HTTPS origin (in development `NODE_ENV !== "production"`, `PwaInstallProvider` unregisters `/sw.js`).

---

## 9. Automated Testing & CI

### Backend Tests (`copian/backend/tests/`)
Uses Python standard library `unittest` with an in-memory SQLite (`sqlite:///:memory:` + `StaticPool`) FastAPI `TestClient` override:

```powershell
cd copian\backend
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

- [`tests/test_api_integration.py`](../copian/backend/tests/test_api_integration.py): **9 integration tests** covering health & 401 guards, RBAC matrix checks, rate limiting, upload extension checks, full RFQ -> Quotation -> Order -> Dispatch tracking lifecycle, GSTIN validation, Buyer Portal auth & PDF ownership scoping, pagination headers (`X-Total-Count`), and background email queuing.
- [`tests/test_services.py`](../copian/backend/tests/test_services.py): **5 unit tests** covering quotation totals/floor clamping, slug generation, bcrypt + JWT tokens, and global exception JSON handlers.

### Frontend Typecheck, Lint & Build (`copian/frontend/`)

```powershell
cd copian\frontend
npx tsc --noEmit
npm run lint
npm run build
```

Both suites run automatically on pushes/PRs to `main`/`master` via [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
