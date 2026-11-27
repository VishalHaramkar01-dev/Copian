from typing import Optional
from fastapi import APIRouter, Depends, File, Query, Response, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.auth import require_permission
from app.database import get_db
from app.models import AdminUser
from app.schemas import (
    BulkProductAction,
    CategoryCreate,
    CategoryUpdate,
    PrinterModelCreate,
    ProductCreate,
    ProductUpdate,
)
from app.services import catalog_service

router = APIRouter(prefix="/api", tags=["products"])


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    return catalog_service.list_categories(db)


@router.post("/categories")
def create_category(
    payload: CategoryCreate,
    _admin: AdminUser = Depends(require_permission("Products & Categories", "create")),
    db: Session = Depends(get_db),
):
    return catalog_service.create_category(db, payload)


@router.put("/categories/{category_id}")
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    _admin: AdminUser = Depends(require_permission("Products & Categories", "edit")),
    db: Session = Depends(get_db),
):
    return catalog_service.update_category(db, category_id, payload)


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    _admin: AdminUser = Depends(require_permission("Products & Categories", "delete")),
    db: Session = Depends(get_db),
):
    return catalog_service.delete_category(db, category_id)


@router.get("/categories/{slug}")
def get_category(slug: str, db: Session = Depends(get_db)):
    return catalog_service.get_category_with_products(db, slug)


@router.get("/products")
def list_products(
    response: Response,
    q: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    in_stock_only: bool = False,
    status: Optional[str] = None,
    featured: Optional[bool] = None,
    new_arrival: Optional[bool] = None,
    sort: str = "featured",
    limit: Optional[int] = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    items, total = catalog_service.list_products_with_total(
        db=db,
        q=q,
        category=category,
        brand=brand,
        in_stock_only=in_stock_only,
        status=status,
        featured=featured,
        new_arrival=new_arrival,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    response.headers["X-Total-Count"] = str(total)
    return items


@router.get("/products/export/csv")
def export_products_csv(
    _admin: AdminUser = Depends(require_permission("Products & Categories", "export")),
    db: Session = Depends(get_db),
):
    csv_body = catalog_service.export_products_csv_content(db)
    return StreamingResponse(
        iter([csv_body]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=copian-products.csv"},
    )


@router.post("/products/import/csv")
async def import_products_csv(
    file: UploadFile = File(...),
    _admin: AdminUser = Depends(require_permission("Products & Categories", "create")),
    db: Session = Depends(get_db),
):
    text = (await file.read()).decode("utf-8", errors="ignore")
    return catalog_service.import_products_csv(db, text)


@router.get("/products/{identifier}")
def get_product(identifier: str, db: Session = Depends(get_db)):
    return catalog_service.get_product_detail(db, identifier)


@router.post("/products")
def create_product(
    payload: ProductCreate,
    _admin: AdminUser = Depends(require_permission("Products & Categories", "create")),
    db: Session = Depends(get_db),
):
    return catalog_service.create_product(db, payload)


@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    payload: ProductUpdate,
    _admin: AdminUser = Depends(require_permission("Products & Categories", "edit")),
    db: Session = Depends(get_db),
):
    return catalog_service.update_product(db, product_id, payload)


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    _admin: AdminUser = Depends(require_permission("Products & Categories", "delete")),
    db: Session = Depends(get_db),
):
    return catalog_service.delete_product(db, product_id)


@router.post("/products/bulk")
def bulk_product_action(
    payload: BulkProductAction,
    _admin: AdminUser = Depends(require_permission("Products & Categories", "edit")),
    db: Session = Depends(get_db),
):
    return catalog_service.bulk_update_products(db, payload)


@router.get("/compatibility/brands")
def get_compatibility_brands(db: Session = Depends(get_db)):
    return catalog_service.get_compatibility_brands(db)


@router.get("/compatibility")
def find_compatible_products(
    brand: Optional[str] = None,
    model: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return catalog_service.find_compatible_products(db, brand, model)


@router.post("/compatibility/models")
def create_printer_model(
    payload: PrinterModelCreate,
    _admin: AdminUser = Depends(require_permission("Products & Categories", "create")),
    db: Session = Depends(get_db),
):
    return catalog_service.create_printer_model(db, payload)


@router.delete("/compatibility/models/{model_id}")
def delete_printer_model(
    model_id: int,
    _admin: AdminUser = Depends(require_permission("Products & Categories", "delete")),
    db: Session = Depends(get_db),
):
    return catalog_service.delete_printer_model(db, model_id)


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    _admin: AdminUser = Depends(require_permission("Products & Categories", "create")),
):
    content = await file.read()
    return catalog_service.save_uploaded_image(file.filename, content)
