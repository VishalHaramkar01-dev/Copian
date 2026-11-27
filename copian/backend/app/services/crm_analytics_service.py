"""CRM (Customers, Distributors), Website CMS/SEO, Executive Dashboard, and Reporting services."""

import csv
import io
import re
import uuid
from datetime import timedelta
from typing import Optional
from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload, selectinload
from app.models import (
    utc_now,
    Article,
    AuditLog,
    BulkInquiry,
    CmsSetting,
    Customer,
    Distributor,
    Faq,
    InventoryItem,
    Order,
    Product,
    Quotation,
    SeoRedirect,
    Warehouse,
)
from app.schemas import (
    ArticleCreate,
    CmsSettingsUpdate,
    CustomerCreate,
    CustomerUpdate,
    DistributorCreate,
    DistributorUpdate,
    FaqCreate,
    RedirectCreate,
)


def list_customers_with_total(
    db: Session,
    q: Optional[str] = None,
    classification: Optional[str] = None,
    limit: Optional[int] = None,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """List CRM customers with batched inquiry/order/credit ledger aggregation and optional pagination."""
    query = db.query(Customer).order_by(Customer.id)
    if classification and classification != "All Classifications":
        query = query.filter(Customer.classification == classification)
    if q:
        t = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Customer.company_name.ilike(t),
                Customer.contact_name.ilike(t),
                Customer.gstin.ilike(t),
                Customer.city.ilike(t),
            )
        )
    total = query.order_by(None).count()
    if offset:
        query = query.offset(offset)
    if limit is not None:
        query = query.limit(limit)
    customers = query.all()

    cids = [c.id for c in customers]
    inqs_by_cid: dict[int, list[BulkInquiry]] = {}
    orders_by_cid: dict[int, list[Order]] = {}
    if cids:
        for inq in db.query(BulkInquiry).filter(BulkInquiry.customer_id.in_(cids)).all():
            if inq.customer_id is not None:
                inqs_by_cid.setdefault(inq.customer_id, []).append(inq)
        for ord_row in db.query(Order).filter(Order.customer_id.in_(cids)).all():
            if ord_row.customer_id is not None:
                orders_by_cid.setdefault(ord_row.customer_id, []).append(ord_row)

    res = []
    cutoff_30d = utc_now() - timedelta(days=30)
    for c in customers:
        inquiries = inqs_by_cid.get(c.id, [])
        orders = orders_by_cid.get(c.id, [])
        credit_limit = float(c.credit_limit if c.credit_limit is not None else 250000.0)
        unpaid_orders = [o for o in orders if o.payment_status in ("Credit 30d", "Pending")]
        credit_used = round(sum(float(o.total_amount or 0) for o in unpaid_orders), 2)
        overdue_orders = [o for o in unpaid_orders if o.created_at and o.created_at < cutoff_30d]
        overdue_30d_amount = round(sum(float(o.total_amount or 0) for o in overdue_orders), 2)
        credit_available = round(max(0.0, credit_limit - credit_used), 2)
        res.append(
            {
                "id": c.id,
                "company_name": c.company_name,
                "contact_name": c.contact_name,
                "phone": c.phone,
                "email": c.email,
                "gstin": c.gstin,
                "city": c.city,
                "state": c.state,
                "pincode": c.pincode,
                "classification": c.classification,
                "credit_limit": credit_limit,
                "credit_used": credit_used,
                "credit_available": credit_available,
                "overdue_30d_amount": overdue_30d_amount,
                "overdue_count": len(overdue_orders),
                "notes": c.notes,
                "inquiries_count": len(inquiries),
                "orders_count": len(orders),
                "inquiries": [{"id": i.id, "inquiry_code": i.inquiry_code, "status": i.status} for i in inquiries],
                "orders": [
                    {
                        "id": o.id,
                        "order_code": o.order_code,
                        "total_amount": o.total_amount,
                        "payment_status": o.payment_status,
                        "fulfilment_status": o.fulfilment_status,
                    }
                    for o in orders
                ],
            }
        )
    return res, total


def list_customers(
    db: Session,
    q: Optional[str] = None,
    classification: Optional[str] = None,
    limit: Optional[int] = None,
    offset: int = 0,
) -> list[dict]:
    items, _ = list_customers_with_total(db, q=q, classification=classification, limit=limit, offset=offset)
    return items


def export_customers_csv_content(db: Session) -> str:
    customers = db.query(Customer).order_by(Customer.id).all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Company Name", "Contact Name", "Classification", "City", "State", "GSTIN", "Phone", "Email"])
    for c in customers:
        w.writerow([c.company_name, c.contact_name, c.classification, c.city, c.state, c.gstin, c.phone, c.email])
    return buf.getvalue()


def create_customer(db: Session, payload: CustomerCreate) -> dict:
    c = Customer(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return {
        "id": c.id,
        "company_name": c.company_name,
        "contact_name": c.contact_name,
        "phone": c.phone,
        "email": c.email,
        "gstin": c.gstin,
        "city": c.city,
        "state": c.state,
        "classification": c.classification,
        "credit_limit": float(c.credit_limit if c.credit_limit is not None else 250000.0),
        "credit_used": 0.0,
        "credit_available": float(c.credit_limit if c.credit_limit is not None else 250000.0),
        "overdue_30d_amount": 0.0,
        "overdue_count": 0,
        "notes": c.notes,
        "inquiries_count": 0,
        "orders_count": 0,
        "inquiries": [],
        "orders": [],
    }


DEFAULT_CONTACT = {
    "company": "Copian International",
    "established_year": 1997,
    "phone_primary": "+91 93225 93719",
    "phone_secondary": "+91 83568 85132",
    "email": "Copiantoner@gmail.com",
    "whatsapp_number": "919322593719",
    "address": "Khopat Road, D-254 Amargian Industrial Estate, Thane, Maharashtra 400601, India",
    "office_hours": "Mon-Sat, 9:30 AM - 6:30 PM IST",
}

DEFAULT_METRICS = [
    {"value": "27+ Yrs", "label": "Industry Excellence", "detail": "Established in 1997 in Thane"},
    {"value": "5k+", "label": "Businesses Served", "detail": "Commercial & dealer print partners"},
    {"value": "98%", "label": "Customer Retention Rate", "detail": "Multi-year recurring B2B accounts"},
    {"value": "45+", "label": "Awards & Recognitions", "detail": "Indian imaging channel distinctions"},
]

DEFAULT_TESTIMONIALS = [
    {
        "quote": "We have been associated with COPIAN since more than 15 years. We are selling all Copian products and Copian cartridges — would just say COPIAN Cartridges are at par with OEM quality and hence we have satisfied customers.",
        "author": "Mahavir Impex",
        "role_company": "Authorized Channel Partner (15+ Years) · Bengaluru",
    },
    {
        "quote": "The compatibility matrix cuts counter lookup time to seconds for our regional dealers, and master cartons arrive pre-labeled with SKU barcodes for fast inward scanning.",
        "author": "Karthik Rao",
        "role_company": "Managing Partner · Deccan Office Supplies, Bengaluru",
    },
    {
        "quote": "Same-day GST proforma quotes and reliable 1kg universal toner powder batches keep our commercial print and cartridge remanufacturing lines running without downtime.",
        "author": "Neha Kapoor",
        "role_company": "Operations Director · Capital Print Hub, New Delhi",
    },
]

DEFAULT_VOLUME_SLABS = [
    {"min_qty": 1, "max_qty": 49, "label": "Standard Dealer Rate", "discount_pct": 0},
    {"min_qty": 50, "max_qty": 199, "label": "8% Volume Discount", "discount_pct": 8},
    {"min_qty": 200, "max_qty": None, "label": "15% Contract Rate", "discount_pct": 15},
]

DEFAULT_ABOUT = {
    "title": "Your Trusted Partner in Printer Consumables Since 1997",
    "intro": "Incorporated in 1997 in Thane, Maharashtra, Copian International has grown into a Pan-India wholesale provider of compatible laser toner cartridges, toner powders, inkjet inks, OPC drums, wiper & doctor blades, PCRs, magnetic rollers, and printer spares across 10 OEM ecosystems.",
    "oem_brands": ["HP", "Canon", "Brother", "Samsung", "Ricoh", "Kyocera", "Konica", "Sharp", "Toshiba", "Pantum"],
}


def update_customer(db: Session, customer_id: int, payload: CustomerUpdate) -> dict:
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return {"updated": True, "id": c.id}


def delete_customer(db: Session, customer_id: int) -> dict:
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(c)
    db.commit()
    return {"deleted": True}


def list_distributors(db: Session, q: Optional[str] = None, active_only: bool = False) -> list[dict]:
    query = db.query(Distributor).order_by(Distributor.id)
    if active_only:
        query = query.filter(Distributor.status == "Active")
    if q:
        t = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Distributor.name.ilike(t),
                Distributor.city.ilike(t),
                Distributor.state.ilike(t),
                Distributor.territory.ilike(t),
            )
        )
    return [
        {
            "id": d.id,
            "name": d.name,
            "city": d.city,
            "state": d.state,
            "territory": d.territory,
            "address": d.address,
            "phone": d.phone,
            "email": d.email,
            "gstin": d.gstin,
            "status": d.status,
            "associated_dealers": d.associated_dealers,
            "ytd_orders_value": d.ytd_orders_value,
        }
        for d in query.all()
    ]


def create_distributor(db: Session, payload: DistributorCreate) -> Distributor:
    d = Distributor(**payload.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


def update_distributor(db: Session, dist_id: int, payload: DistributorUpdate) -> Distributor:
    d = db.query(Distributor).filter(Distributor.id == dist_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Distributor not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return d


def delete_distributor(db: Session, dist_id: int) -> dict:
    d = db.query(Distributor).filter(Distributor.id == dist_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Distributor not found")
    db.delete(d)
    db.commit()
    return {"deleted": True}


def get_cms_data(db: Session) -> dict:
    settings = {s.key: s.value for s in db.query(CmsSetting).all()}
    articles = db.query(Article).order_by(Article.is_featured.desc(), Article.id.desc()).all()
    faqs = db.query(Faq).order_by(Faq.display_order, Faq.id).all()
    redirects = db.query(SeoRedirect).order_by(SeoRedirect.id).all()
    return {
        "seo": settings.get("seo", {}),
        "homepage": settings.get("homepage", {}),
        "contact": {**DEFAULT_CONTACT, **(settings.get("contact") or {})},
        "metrics": settings.get("metrics") or DEFAULT_METRICS,
        "testimonials": settings.get("testimonials") or DEFAULT_TESTIMONIALS,
        "volume_slabs": settings.get("volume_slabs") or DEFAULT_VOLUME_SLABS,
        "about": {**DEFAULT_ABOUT, **(settings.get("about") or {})},
        "articles": [
            {
                "id": a.id,
                "slug": a.slug,
                "category": a.category,
                "title": a.title,
                "summary": a.summary,
                "content": a.content,
                "image_url": a.image_url,
                "is_featured": a.is_featured,
                "is_published": a.is_published,
            }
            for a in articles
        ],
        "faqs": [
            {
                "id": f.id,
                "question": f.question,
                "answer": f.answer,
                "display_order": f.display_order,
                "is_published": f.is_published,
            }
            for f in faqs
        ],
        "redirects": [
            {
                "id": r.id,
                "source_path": r.source_path,
                "target_path": r.target_path,
                "status_code": r.status_code,
                "is_active": r.is_active,
            }
            for r in redirects
        ],
    }


def _upsert_cms_setting(db: Session, key: str, value: object) -> None:
    row = db.query(CmsSetting).filter(CmsSetting.key == key).first()
    if row:
        row.value = value
    else:
        db.add(CmsSetting(key=key, value=value))


def update_cms_settings(db: Session, payload: CmsSettingsUpdate) -> dict:
    for field in ("seo", "homepage", "contact", "metrics", "testimonials", "volume_slabs", "about"):
        val = getattr(payload, field, None)
        if val is not None:
            _upsert_cms_setting(db, field, val)
    db.add(
        AuditLog(
            user_name="Arjun Mehta",
            action="PUBLISH_CMS",
            module="Website & SEO",
            entity_id="CMS",
            details="Published CMS, SEO, contact & storefront configuration",
        )
    )
    db.commit()
    return {"updated": True}


def list_articles(db: Session, q: Optional[str] = None) -> list[dict]:
    query = db.query(Article).filter(Article.is_published == True).order_by(Article.is_featured.desc(), Article.id.desc())
    if q:
        t = f"%{q.strip()}%"
        query = query.filter(or_(Article.title.ilike(t), Article.category.ilike(t), Article.summary.ilike(t)))
    return [
        {
            "id": a.id,
            "slug": a.slug,
            "category": a.category,
            "title": a.title,
            "summary": a.summary,
            "content": a.content,
            "image_url": a.image_url,
            "is_featured": a.is_featured,
        }
        for a in query.all()
    ]


def create_article(db: Session, payload: ArticleCreate) -> Article:
    slug = payload.slug or re.sub(r"[^a-zA-Z0-9]+", "-", payload.title.lower()).strip("-")
    if db.query(Article).filter(Article.slug == slug).first():
        slug = f"{slug}-{uuid.uuid4().hex[:4]}"
    art = Article(
        slug=slug,
        category=payload.category,
        title=payload.title,
        summary=payload.summary,
        content=payload.content,
        image_url=payload.image_url,
        is_featured=payload.is_featured,
        is_published=payload.is_published,
    )
    db.add(art)
    db.commit()
    db.refresh(art)
    return art


def delete_article(db: Session, art_id: int) -> dict:
    a = db.query(Article).filter(Article.id == art_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(a)
    db.commit()
    return {"deleted": True}


def create_faq(db: Session, payload: FaqCreate) -> Faq:
    f = Faq(**payload.model_dump())
    db.add(f)
    db.commit()
    db.refresh(f)
    return f


def delete_faq(db: Session, faq_id: int) -> dict:
    f = db.query(Faq).filter(Faq.id == faq_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(f)
    db.commit()
    return {"deleted": True}


def create_redirect(db: Session, payload: RedirectCreate) -> SeoRedirect:
    r = SeoRedirect(**payload.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


def delete_redirect(db: Session, red_id: int) -> dict:
    r = db.query(SeoRedirect).filter(SeoRedirect.id == red_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Redirect not found")
    db.delete(r)
    db.commit()
    return {"deleted": True}


def get_dashboard_overview(db: Session, range_key: str = "30d") -> dict:
    products = db.query(Product).all()
    customers = db.query(Customer).all()
    inv_items = db.query(InventoryItem).options(joinedload(InventoryItem.product)).all()
    inquiries = (
        db.query(BulkInquiry)
        .options(selectinload(BulkInquiry.items))
        .order_by(BulkInquiry.created_at.desc())
        .all()
    )
    quotations = db.query(Quotation).all()
    orders = db.query(Order).all()

    inv_value = sum(i.available_qty * (i.product.dealer_price if i.product else 0) for i in inv_items)
    low_stock = [i for i in inv_items if i.available_qty <= i.reorder_level]
    new_inquiries = [i for i in inquiries if i.status == "New"]
    pending_quotes = [q for q in quotations if q.status in ("Draft", "Sent")]
    pending_quote_val = sum(q.grand_total for q in pending_quotes)
    total_sales = sum(o.total_amount for o in orders)

    cat_totals: dict[str, int] = {}
    for i in inv_items:
        cname = i.product.category_name if i.product else "Other"
        cat_totals[cname] = cat_totals.get(cname, 0) + max(i.available_qty, 1)
    grand_qty = sum(cat_totals.values()) or 1
    cat_shares = [
        {"category": k, "pct": round((v / grand_qty) * 100)}
        for k, v in sorted(cat_totals.items(), key=lambda kv: kv[1], reverse=True)
    ]

    # Aggregate real order revenue grouped by month from PostgreSQL
    month_buckets: dict[str, float] = {}
    for o in orders:
        key = o.created_at.strftime("%b") if o.created_at else "Nov"
        month_buckets[key] = month_buckets.get(key, 0.0) + round(o.total_amount / 100000.0, 2)

    if range_key == "ytd":
        quarter_totals = {"Q1": 0.0, "Q2": 0.0, "Q3": 0.0, "Q4": 0.0}
        for o in orders:
            m = o.created_at.month if o.created_at else 11
            q_label = f"Q{((m - 1) // 3) + 1}"
            quarter_totals[q_label] += round(o.total_amount / 100000.0, 2)
        max_q = max(list(quarter_totals.values()) + [1.0])
        computed_trends = [
            {
                "month": q_label,
                "revenue_lakhs": round(val, 2),
                "height_pct": max(14, min(98, round((val / max_q) * 95))),
            }
            for q_label, val in quarter_totals.items()
        ]
    else:
        # Build recent 6-month series seeded with any real PostgreSQL order months
        base_months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] if "Dec" in month_buckets else ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]
        vals = {m: month_buckets.get(m, 0.0) for m in base_months}
        max_m = max(list(vals.values()) + [1.0])
        computed_trends = [
            {
                "month": m,
                "revenue_lakhs": round(vals[m], 2),
                "height_pct": max(12, min(98, round((vals[m] / max_m) * 95))) if vals[m] > 0 else 12,
            }
            for m in base_months
        ]

    return {
        "kpis": {
            "total_products": len(products),
            "total_customers": len(customers),
            "inventory_value": inv_value,
            "low_stock_count": len(low_stock),
            "new_inquiries_count": len(inquiries),
            "awaiting_review_count": len(new_inquiries),
            "pending_quotations_count": len(pending_quotes),
            "pending_quotations_value": pending_quote_val,
            "confirmed_orders_count": len(orders),
            "monthly_sales": total_sales,
            "warehouse_count": db.query(Warehouse).count(),
        },
        "trends": computed_trends,
        "category_shares": cat_shares,
        "recent_inquiries": [
            {
                "id": i.id,
                "inquiry_code": i.inquiry_code,
                "company_name": i.company_name,
                "total_qty": sum(it.quantity for it in i.items),
                "status": i.status,
            }
            for i in inquiries[:5]
        ],
        "low_stock_products": [
            {
                "sku": i.product.sku if i.product else "",
                "name": i.product.name if i.product else "",
                "available_qty": i.available_qty,
                "reorder_level": i.reorder_level,
            }
            for i in low_stock[:5]
        ],
    }


def get_reports_overview(db: Session) -> dict:
    orders = db.query(Order).options(selectinload(Order.items)).all()
    quotations = db.query(Quotation).all()
    inquiries = db.query(BulkInquiry).all()
    customers = db.query(Customer).all()
    inv_items = db.query(InventoryItem).options(joinedload(InventoryItem.product), joinedload(InventoryItem.warehouse)).all()

    avg_order_val = round(sum(o.total_amount for o in orders) / max(len(orders), 1))
    accepted_quotes = sum(1 for q in quotations if q.status in ("Accepted", "Converted", "Sent"))
    quote_accept_rate = round((accepted_quotes / max(len(quotations), 1)) * 100, 1)

    sku_stats: dict[str, dict] = {}
    for o in orders:
        for it in o.items:
            entry = sku_stats.setdefault(it.sku, {"sku": it.sku, "name": it.product_name, "units": 0, "revenue": 0.0})
            entry["units"] += it.quantity
            entry["revenue"] += it.line_total
    top_skus = sorted(sku_stats.values(), key=lambda x: x["revenue"], reverse=True)

    wh_valuation: dict[str, dict] = {}
    for i in inv_items:
        wname = i.warehouse.name if i.warehouse else "Mumbai Central"
        val = i.available_qty * (i.product.dealer_price if i.product else 0)
        entry = wh_valuation.setdefault(wname, {"warehouse": wname, "units": 0, "value": 0.0, "skus": 0})
        entry["units"] += i.available_qty
        entry["value"] += val
        entry["skus"] += 1

    inq_counts_by_cid: dict[int, int] = {}
    for inq in inquiries:
        if inq.customer_id is not None:
            inq_counts_by_cid[inq.customer_id] = inq_counts_by_cid.get(inq.customer_id, 0) + 1

    orders_by_cid: dict[int, list[Order]] = {}
    for o in orders:
        if o.customer_id is not None:
            orders_by_cid.setdefault(o.customer_id, []).append(o)

    customer_activity = []
    for c in customers:
        c_orders = orders_by_cid.get(c.id, [])
        customer_activity.append(
            {
                "id": c.id,
                "company_name": c.company_name,
                "classification": c.classification,
                "city": c.city,
                "inquiries": inq_counts_by_cid.get(c.id, 0),
                "orders": len(c_orders),
                "total_spend": sum(o.total_amount for o in c_orders),
            }
        )

    funnel = {
        "total_inquiries": len(inquiries),
        "quotations_issued": len(quotations),
        "orders_confirmed": len(orders),
        "conversion_rate_pct": round((len(orders) / max(len(inquiries), 1)) * 100, 1),
    }

    repeat_customers = sum(1 for row in customer_activity if (row["inquiries"] + row["orders"]) >= 2)
    repeat_buyers_pct = round((repeat_customers / max(len(customers), 1)) * 100, 1)

    return {
        "summary": {
            "avg_order_value": avg_order_val,
            "quote_acceptance_rate": quote_accept_rate,
            "repeat_buyers_pct": repeat_buyers_pct,
        },
        "top_skus": top_skus,
        "warehouse_valuation": list(wh_valuation.values()),
        "customer_activity": customer_activity,
        "funnel": funnel,
    }


def export_reports_csv_content(db: Session) -> str:
    orders = db.query(Order).all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Order Code", "Invoice Code", "Customer", "GSTIN", "Subtotal", "GST", "Total Amount", "Payment", "Fulfilment"])
    for o in orders:
        w.writerow(
            [o.order_code, o.invoice_code, o.customer_name, o.gstin, o.subtotal, o.gst_amount, o.total_amount, o.payment_status, o.fulfilment_status]
        )
    return buf.getvalue()


def global_admin_search(db: Session, q: str = "") -> dict:
    if not q.strip():
        return {"products": [], "inquiries": [], "orders": []}
    term = f"%{q.strip()}%"
    prods = db.query(Product).filter(or_(Product.sku.ilike(term), Product.name.ilike(term), Product.oem_code.ilike(term))).limit(5).all()
    inqs = db.query(BulkInquiry).filter(or_(BulkInquiry.inquiry_code.ilike(term), BulkInquiry.company_name.ilike(term))).limit(5).all()
    ords = db.query(Order).filter(or_(Order.order_code.ilike(term), Order.customer_name.ilike(term))).limit(5).all()
    return {
        "products": [{"sku": p.sku, "name": p.name} for p in prods],
        "inquiries": [{"id": i.id, "code": i.inquiry_code, "company": i.company_name} for i in inqs],
        "orders": [{"id": o.id, "code": o.order_code, "customer": o.customer_name} for o in ords],
    }
