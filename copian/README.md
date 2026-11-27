# Copian B2B & Enterprise ERP Platform

Full-stack **Next.js 15 (Tailwind CSS + TypeScript + PWA)** + **Python FastAPI (`app/services/` + `app/routers/`)** + **PostgreSQL 17** platform implementing all 23+ storefront and admin ERP modules for Copian International.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for a quick system summary, or browse the complete developer documentation suite in [`../docs/README.md`](../docs/README.md):
- [Getting Started, Env Config & Testing](../docs/GETTING_STARTED.md)
- [Backend Architecture, Auth & Database Models](../docs/BACKEND_ARCHITECTURE_AND_DB.md)
- [Complete REST API Reference (81 Endpoints)](../docs/API_REFERENCE.md)
- [Storefront Pages & Features](../docs/STOREFRONT_PAGES_AND_FEATURES.md)
- [Admin ERP Workspace & RBAC Guide](../docs/ADMIN_ERP_GUIDE.md)
- [Frontend Architecture, Skeletons & PWA](../docs/FRONTEND_ARCHITECTURE_AND_PWA.md)

## Folder Structure
- `backend/` — Python FastAPI REST API (`app/routers/` + `app/services/`), SQLAlchemy ORM, unit tests (`tests/`), and PostgreSQL seed (`POSTGRES_URI=postgresql://postgres:Vishal%402004%2F-@localhost:5432/copian`).
- `frontend/` — Next.js 15 App Router + TypeScript + Tailwind CSS + installable PWA (`public/images/` and `public/icons/`).

## Running Locally

### 1. Start Python Backend (Port 8000)
```powershell
cd backend
.\.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

### 2. Run Backend Unit Tests
```powershell
cd backend
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

### 3. Start Next.js Frontend
```powershell
cd frontend
npm run dev
```

Or run `.\start-dev.ps1` from `copian/`.
- **Public Storefront**: `http://localhost:3000` (or `3001` if port `3000` is occupied)
- **Admin ERP Portal**: `http://localhost:3000/admin` (Demo login: `arjun@copian.in` / `copian@2026`)
- **FastAPI Interactive Docs**: `http://localhost:8000/docs`
