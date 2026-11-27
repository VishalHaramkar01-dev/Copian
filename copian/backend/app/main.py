import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.database import Base, SessionLocal, engine
from app.security import log_security_config
from app.seed import seed_database
from app.routers import auth_roles, products, inventory, sales, crm_cms

logger = logging.getLogger("copian.api")

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log_security_config(logger)
    if os.getenv("ENABLE_SCHEMA_AUTO_CREATE", "true").lower() in ("1", "true", "yes"):
        Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception:
        db.rollback()
        logger.exception("Database startup seeding failed")
    finally:
        db.close()
    yield


app = FastAPI(
    title="Copian B2B & Enterprise ERP API",
    version="1.0.0",
    lifespan=lifespan,
)

cors_origins = [
    o.strip().rstrip("/")
    for o in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001",
    ).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else None
    msg = f"{'.'.join(str(x) for x in first.get('loc', []) if x != 'body')}: {first.get('msg')}" if first else "Invalid request payload"
    return JSONResponse(
        status_code=422,
        content={"detail": msg, "errors": jsonable_encoder(exc.errors(), custom_encoder={Exception: str})},
    )


@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request: Request, exc: IntegrityError):
    logger.warning("Database integrity conflict on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=409,
        content={"detail": "Duplicate or conflicting record. Please verify unique identifiers such as SKU, email, or slug."},
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.exception("Database error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=503,
        content={"detail": "Database operation failed safely and was rolled back. Please try again."},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again."},
    )

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(auth_roles.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(crm_cms.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "copian-backend"}
