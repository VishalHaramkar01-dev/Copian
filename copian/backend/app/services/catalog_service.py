"""Catalog, category, printer compatibility lookup, and product CSV/upload services."""

import csv
import io
import re
import uuid
from pathlib import Path
from typing import Optional
from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload
from app.models import (
    AuditLog,
    Category,
    InventoryItem,
    PrinterModel,
    Product,
    ProductPrinterCompatibility,
    Warehouse,
)
from app.schemas import (
    BulkProductAction,
    CategoryCreate,
    CategoryUpdate,
    PrinterModelCreate,
    ProductCreate,
    ProductUpdate,
)

from app.services.storage_service import save_upload_file


def slugify(text: str) -> str:
    """Generate a URL-safe kebab-case slug from product names or titles."""
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower()).strip("-")
    return cleaned or f"sku-{uuid.uuid4().hex[:6]}"


def serialize_product(p: Product) -> dict:
    """Serialize a Product ORM record including aggregated multi-warehouse stock."""
    total_avail = sum(inv.available_qty for inv in p.inventory_items) if p.inventory_items else 0
    total_res = sum(inv.reserved_qty for inv in p.inventory_items) if p.inventory_items else 0
    min_reorder = min((inv.reorder_level for inv in p.inventory_items), default=50)
    computed_stock = p.stock_status
    if p.inventory_items:
        if total_avail <= 0:
            computed_stock = "Out of Stock"
        elif total_avail <= min_reorder:
            computed_stock = "Low Stock"
        elif p.moq >= 25 and p.stock_status == "MOQ 25":
            computed_stock = "MOQ 25"
        else:
            computed_stock = "In Stock"

    return {
        "id": p.id,
        "sku": p.sku,
        "name": p.name,
        "slug": p.slug,
        "category_id": p.category_id,
        "category_name": p.category_name,
        "brand": p.brand,
        "oem_code": p.oem_code,
        "short_desc": p.short_desc,
        "detailed_desc": p.detailed_desc,
        "page_yield": p.page_yield,
        "yield_text": p.yield_text or f"{p.page_yield:,} pages",
        "weight_grams": p.weight_grams,
        "chip_included": p.chip_included,
        "master_carton_qty": p.master_carton_qty,
        "moq": p.moq,
        "moq_unit": p.moq_unit,
        "dealer_price": p.dealer_price,
        "gst_rate": p.gst_rate,
        "hsn_code": p.hsn_code,
        "compatible_printers_text": p.compatible_printers_text,
        "compatible_models": p.compatible_models or [],
        "variants": p.variants or [],
        "features": p.features or [],
        "image_url": p.image_url or "/images/toner-cartridge.png",
        "gallery_images": p.gallery_images or [p.image_url or "/images/toner-cartridge.png"],
        "is_featured": p.is_featured,
        "is_new_arrival": p.is_new_arrival,
        "status": p.status,
        "stock_status": computed_stock,
        "available_qty": total_avail,
        "reserved_qty": total_res,
        "reorder_level": min_reorder,
        "seo_title": p.seo_title,
        "meta_description": p.meta_description,
    }


def list_categories(db: Session) -> list[dict]:
    cats = db.query(Category).order_by(Category.display_order, Category.id).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "subtitle": c.subtitle,
            "description": c.description,
            "image_url": c.image_url,
            "seo_guide": c.seo_guide,
            "display_order": c.display_order,
        }
        for c in cats
    ]


def get_category_with_products(db: Session, slug: str) -> dict:
    c = db.query(Category).filter(Category.slug == slug).first()
    if not c:
        raise HTTPException(status_code=404, detail="Category not found")
    products = (
        db.query(Product)
        .options(selectinload(Product.inventory_items))
        .filter(Product.category_id == c.id, Product.status == "Published")
        .all()
    )
    return {
        "category": {
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "subtitle": c.subtitle,
            "description": c.description,
            "image_url": c.image_url,
            "seo_guide": c.seo_guide,
        },
        "products": [serialize_product(p) for p in products],
    }


def list_products_with_total(
    db: Session,
    q: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    in_stock_only: bool = False,
    status: Optional[str] = None,
    featured: Optional[bool] = None,
    new_arrival: Optional[bool] = None,
    sort: str = "featured",
    limit: Optional[int] = None,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """Filter, sort, and optionally paginate products with eager-loaded stock balances."""
    query = db.query(Product).options(selectinload(Product.inventory_items))
    if status:
        query = query.filter(Product.status == status)
    if featured is not None:
        query = query.filter(Product.is_featured == featured)
    if new_arrival is not None:
        query = query.filter(Product.is_new_arrival == new_arrival)
    if category and category != "All Categories":
        cats = [c.strip() for c in category.split(",") if c.strip()]
        query = query.filter(Product.category_name.in_(cats))
    if brand and brand != "All Brands":
        brands = [b.strip() for b in brand.split(",") if b.strip()]
        query = query.filter(Product.brand.in_(brands))
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Product.sku.ilike(term),
                Product.name.ilike(term),
                Product.oem_code.ilike(term),
                Product.compatible_printers_text.ilike(term),
                Product.short_desc.ilike(term),
            )
        )

    if sort == "yield-desc":
        query = query.order_by(Product.page_yield.desc(), Product.id.asc())
    elif sort == "moq-asc":
        query = query.order_by(Product.moq.asc(), Product.id.asc())
    else:
        query = query.order_by(Product.is_featured.desc(), Product.id.asc())

    if not in_stock_only:
        total = query.order_by(None).count()
        if offset:
            query = query.offset(offset)
        if limit is not None:
            query = query.limit(limit)
        return [serialize_product(p) for p in query.all()], total

    items = [serialize_product(p) for p in query.all()]
    items = [x for x in items if x["stock_status"] == "In Stock"]
    total = len(items)
    if limit is not None:
        items = items[offset : offset + limit]
    elif offset:
        items = items[offset:]
    return items, total


def list_products(
    db: Session,
    q: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    in_stock_only: bool = False,
    status: Optional[str] = None,
    featured: Optional[bool] = None,
    new_arrival: Optional[bool] = None,
    sort: str = "featured",
    limit: Optional[int] = None,
    offset: int = 0,
) -> list[dict]:
    items, _ = list_products_with_total(
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
    return items


def export_products_csv_content(db: Session) -> str:
    products = db.query(Product).options(selectinload(Product.inventory_items)).order_by(Product.id).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        ["SKU", "Name", "Category", "Brand", "OEM Code", "Page Yield", "MOQ", "Dealer Price", "Available Qty", "Status"]
    )
    for p in products:
        s = serialize_product(p)
        writer.writerow(
            [
                s["sku"],
                s["name"],
                s["category_name"],
                s["brand"],
                s["oem_code"],
                s["page_yield"],
                s["moq"],
                s["dealer_price"],
                s["available_qty"],
                s["status"],
            ]
        )
    return buf.getvalue()


def import_products_csv(db: Session, csv_text: str) -> dict:
    reader = csv.DictReader(io.StringIO(csv_text))
    imported = 0
    wh = db.query(Warehouse).first()
    for row in reader:
        sku = (row.get("SKU") or row.get("sku") or "").strip()
        name = (row.get("Name") or row.get("name") or "").strip()
        if not sku or not name or db.query(Product).filter(Product.sku == sku).first():
            continue
        cat_name = (row.get("Category") or "Toner Cartridges").strip()
        cat = db.query(Category).filter(Category.name == cat_name).first()
        p = Product(
            sku=sku,
            name=name,
            slug=slugify(f"{name}-{sku}"),
            category_id=cat.id if cat else None,
            category_name=cat_name,
            brand=(row.get("Brand") or "HP").strip(),
            oem_code=(row.get("OEM Code") or "").strip(),
            page_yield=int(row.get("Page Yield") or 1500),
            moq=int(row.get("MOQ") or 10),
            dealer_price=float(row.get("Dealer Price") or 500),
            status=(row.get("Status") or "Published").strip(),
            image_url="/images/toner-cartridge.png",
        )
        db.add(p)
        db.flush()
        if wh:
            qty = int(row.get("Available Qty") or 100)
            db.add(InventoryItem(product_id=p.id, warehouse_id=wh.id, available_qty=qty, reorder_level=50))
        imported += 1
    db.commit()
    return {"imported": imported}


def get_product_detail(db: Session, identifier: str) -> dict:
    p = (
        db.query(Product)
        .options(selectinload(Product.inventory_items))
        .filter(or_(Product.sku.ilike(identifier), Product.slug == identifier))
        .first()
    )
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    related = (
        db.query(Product)
        .options(selectinload(Product.inventory_items))
        .filter(Product.id != p.id, Product.status == "Published")
        .limit(3)
        .all()
    )
    return {
        "product": serialize_product(p),
        "related": [serialize_product(r) for r in related],
    }


def create_product(db: Session, payload: ProductCreate) -> dict:
    if db.query(Product).filter(Product.sku == payload.sku.strip()).first():
        raise HTTPException(status_code=400, detail=f"SKU {payload.sku} already exists")
    cat = db.query(Category).filter(Category.name == payload.category_name).first()
    slug = payload.slug.strip() if payload.slug else slugify(f"{payload.name}-{payload.sku}")
    if db.query(Product).filter(Product.slug == slug).first():
        slug = slugify(f"{slug}-{uuid.uuid4().hex[:4]}")

    data = payload.model_dump(exclude={"initial_stock", "warehouse_name", "slug"})
    data["slug"] = slug
    data["category_id"] = cat.id if cat else None
    if not data.get("yield_text"):
        data["yield_text"] = f"{payload.page_yield:,} pages @ 5% A4 coverage"
    if not data.get("gallery_images"):
        data["gallery_images"] = [payload.image_url]
    if not data.get("compatible_models") and payload.compatible_printers_text:
        data["compatible_models"] = [m.strip() for m in payload.compatible_printers_text.split(",") if m.strip()]

    p = Product(**data)
    db.add(p)
    db.flush()

    wh = db.query(Warehouse).filter(Warehouse.name == payload.warehouse_name).first() or db.query(Warehouse).first()
    if wh:
        db.add(InventoryItem(product_id=p.id, warehouse_id=wh.id, available_qty=payload.initial_stock, reorder_level=50))
    db.add(
        AuditLog(
            user_name="Arjun Mehta",
            action="CREATE_PRODUCT",
            module="Product Management",
            entity_id=p.sku,
            details=f"Created product {p.name}",
        )
    )
    db.commit()
    db.refresh(p)
    return serialize_product(p)


def update_product(db: Session, product_id: int, payload: ProductUpdate) -> dict:
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    updates = payload.model_dump(exclude_unset=True)
    if "category_name" in updates:
        cat = db.query(Category).filter(Category.name == updates["category_name"]).first()
        p.category_id = cat.id if cat else p.category_id
    for k, v in updates.items():
        setattr(p, k, v)
    if "compatible_printers_text" in updates and "compatible_models" not in updates:
        p.compatible_models = [m.strip() for m in (p.compatible_printers_text or "").split(",") if m.strip()]
    db.add(
        AuditLog(
            user_name="Arjun Mehta",
            action="UPDATE_PRODUCT",
            module="Product Management",
            entity_id=p.sku,
            details=f"Updated product {p.name}",
        )
    )
    db.commit()
    db.refresh(p)
    return serialize_product(p)


def delete_product(db: Session, product_id: int) -> dict:
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    sku = p.sku
    db.delete(p)
    db.add(
        AuditLog(
            user_name="Arjun Mehta",
            action="DELETE_PRODUCT",
            module="Product Management",
            entity_id=sku,
            details=f"Deleted product {sku}",
        )
    )
    db.commit()
    return {"deleted": True, "id": product_id}


def bulk_update_products(db: Session, payload: BulkProductAction) -> dict:
    items = db.query(Product).filter(Product.id.in_(payload.ids)).all()
    if payload.action == "publish":
        for p in items:
            p.status = "Published"
    elif payload.action == "draft":
        for p in items:
            p.status = "Draft"
    elif payload.action == "delete":
        for p in items:
            db.delete(p)
    db.commit()
    return {"affected": len(items), "action": payload.action}


def get_compatibility_brands(db: Session) -> dict:
    models = db.query(PrinterModel).order_by(PrinterModel.brand, PrinterModel.model_name).all()
    grouped: dict[str, list[dict]] = {}
    for m in models:
        grouped.setdefault(m.brand, []).append({"id": m.id, "model_name": m.model_name, "series": m.series})
    return {"brands": list(grouped.keys()), "models_by_brand": grouped}


def find_compatible_products(db: Session, brand: Optional[str] = None, model: Optional[str] = None) -> dict:
    matched_products = []
    if model:
        pm = db.query(PrinterModel).filter(PrinterModel.model_name.ilike(f"%{model.strip()}%"))
        if brand:
            pm = pm.filter(PrinterModel.brand.ilike(brand.strip()))
        printer_ids = [x.id for x in pm.all()]
        if printer_ids:
            links = (
                db.query(ProductPrinterCompatibility)
                .filter(ProductPrinterCompatibility.printer_model_id.in_(printer_ids))
                .all()
            )
            pids = list({link.product_id for link in links})
            if pids:
                matched_products = db.query(Product).filter(Product.id.in_(pids), Product.status == "Published").all()

    if not matched_products:
        query = db.query(Product).filter(Product.status == "Published")
        if brand:
            query = query.filter(
                or_(Product.brand.ilike(brand.strip()), Product.compatible_printers_text.ilike(f"%{brand.strip()}%"))
            )
        if model:
            m_clean = model.strip().split()[0] if " " in model.strip() else model.strip()
            query = query.filter(
                or_(
                    Product.compatible_printers_text.ilike(f"%{model.strip()}%"),
                    Product.compatible_printers_text.ilike(f"%{m_clean}%"),
                )
            )
        matched_products = query.all()

    return {
        "brand": brand or "HP",
        "model": model or "LaserJet Pro M402dn",
        "matches": [serialize_product(p) for p in matched_products],
    }


def save_uploaded_image(filename: Optional[str], content: bytes) -> dict:
    return save_upload_file(filename, content)


def create_category(db: Session, payload: CategoryCreate) -> dict:
    slug = payload.slug.strip() if payload.slug else slugify(payload.name)
    if db.query(Category).filter(or_(Category.slug == slug, Category.name == payload.name.strip())).first():
        raise HTTPException(status_code=400, detail="Category name or slug already exists")
    cat = Category(
        name=payload.name.strip(),
        slug=slug,
        subtitle=payload.subtitle,
        description=payload.description,
        image_url=payload.image_url,
        seo_guide=payload.seo_guide,
        display_order=payload.display_order,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return {"id": cat.id, "name": cat.name, "slug": cat.slug}


def update_category(db: Session, category_id: int, payload: CategoryUpdate) -> dict:
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(cat, k, v)
    db.commit()
    return {"updated": True, "id": cat.id}


def delete_category(db: Session, category_id: int) -> dict:
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"deleted": True}


def create_printer_model(db: Session, payload: PrinterModelCreate) -> dict:
    pm = PrinterModel(
        brand=payload.brand.strip(),
        model_name=payload.model_name.strip(),
        series=payload.series.strip(),
    )
    db.add(pm)
    db.commit()
    db.refresh(pm)
    return {"id": pm.id, "brand": pm.brand, "model_name": pm.model_name, "series": pm.series}


def delete_printer_model(db: Session, model_id: int) -> dict:
    pm = db.query(PrinterModel).filter(PrinterModel.id == model_id).first()
    if not pm:
        raise HTTPException(status_code=404, detail="Printer model not found")
    db.delete(pm)
    db.commit()
    return {"deleted": True}
