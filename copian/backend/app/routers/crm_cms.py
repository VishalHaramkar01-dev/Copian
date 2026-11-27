from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.auth import require_admin, require_permission
from app.database import get_db
from app.models import AdminUser
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
from app.services import crm_analytics_service

router = APIRouter(prefix="/api", tags=["crm-cms-reports"])


@router.get("/customers")
def list_customers(
    response: Response,
    q: Optional[str] = None,
    classification: Optional[str] = None,
    limit: Optional[int] = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _admin: AdminUser = Depends(require_permission("Customers & Distributors", "view")),
    db: Session = Depends(get_db),
):
    items, total = crm_analytics_service.list_customers_with_total(db, q, classification, limit=limit, offset=offset)
    response.headers["X-Total-Count"] = str(total)
    return items


@router.get("/customers/export/csv")
def export_customers_csv(
    _admin: AdminUser = Depends(require_permission("Customers & Distributors", "export")),
    db: Session = Depends(get_db),
):
    csv_body = crm_analytics_service.export_customers_csv_content(db)
    return StreamingResponse(
        iter([csv_body]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=copian-customers.csv"},
    )


@router.post("/customers")
def create_customer(
    payload: CustomerCreate,
    _admin: AdminUser = Depends(require_permission("Customers & Distributors", "create")),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.create_customer(db, payload)


@router.put("/customers/{customer_id}")
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    _admin: AdminUser = Depends(require_permission("Customers & Distributors", "edit")),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.update_customer(db, customer_id, payload)


@router.delete("/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    _admin: AdminUser = Depends(require_permission("Customers & Distributors", "approve")),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.delete_customer(db, customer_id)


@router.get("/distributors")
def list_distributors(q: Optional[str] = None, active_only: bool = False, db: Session = Depends(get_db)):
    return crm_analytics_service.list_distributors(db, q, active_only)


@router.post("/distributors")
def create_distributor(
    payload: DistributorCreate,
    _admin: AdminUser = Depends(require_permission("Customers & Distributors", "create")),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.create_distributor(db, payload)


@router.put("/distributors/{dist_id}")
def update_distributor(
    dist_id: int,
    payload: DistributorUpdate,
    _admin: AdminUser = Depends(require_permission("Customers & Distributors", "edit")),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.update_distributor(db, dist_id, payload)


@router.delete("/distributors/{dist_id}")
def delete_distributor(
    dist_id: int,
    _admin: AdminUser = Depends(require_permission("Customers & Distributors", "approve")),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.delete_distributor(db, dist_id)


@router.get("/cms")
def get_cms_data(db: Session = Depends(get_db)):
    return crm_analytics_service.get_cms_data(db)


@router.put("/cms")
def update_cms_settings(
    payload: CmsSettingsUpdate,
    _admin: AdminUser = Depends(require_permission("Website & SEO", "edit")),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.update_cms_settings(db, payload)


@router.get("/articles")
def list_articles(q: Optional[str] = None, db: Session = Depends(get_db)):
    return crm_analytics_service.list_articles(db, q)


@router.post("/articles")
def create_article(
    payload: ArticleCreate,
    _admin: AdminUser = Depends(require_permission("Website & SEO", "create")),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.create_article(db, payload)


@router.delete("/articles/{art_id}")
def delete_article(
    art_id: int,
    _admin: AdminUser = Depends(require_permission("Website & SEO", "delete")),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.delete_article(db, art_id)


@router.post("/faqs")
def create_faq(
    payload: FaqCreate,
    _admin: AdminUser = Depends(require_permission("Website & SEO", "create")),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.create_faq(db, payload)


@router.delete("/faqs/{faq_id}")
def delete_faq(
    faq_id: int,
    _admin: AdminUser = Depends(require_permission("Website & SEO", "delete")),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.delete_faq(db, faq_id)


@router.post("/redirects")
def create_redirect(
    payload: RedirectCreate,
    _admin: AdminUser = Depends(require_permission("Website & SEO", "create")),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.create_redirect(db, payload)


@router.delete("/redirects/{red_id}")
def delete_redirect(
    red_id: int,
    _admin: AdminUser = Depends(require_permission("Website & SEO", "delete")),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.delete_redirect(db, red_id)


@router.get("/dashboard")
def get_dashboard(
    range: str = "30d",
    _admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.get_dashboard_overview(db, range)


@router.get("/reports")
def get_reports(
    _admin: AdminUser = Depends(require_permission("Reports & Analytics", "view")),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.get_reports_overview(db)


@router.get("/reports/export/csv")
def export_reports_csv(
    _admin: AdminUser = Depends(require_permission("Reports & Analytics", "export")),
    db: Session = Depends(get_db),
):
    csv_body = crm_analytics_service.export_reports_csv_content(db)
    return StreamingResponse(
        iter([csv_body]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=copian-sales-report.csv"},
    )


@router.get("/search")
def global_admin_search(
    q: str = "",
    _admin: AdminUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return crm_analytics_service.global_admin_search(db, q)
