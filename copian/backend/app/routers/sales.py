from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, Query, Response
from sqlalchemy.orm import Session
from app.auth import require_buyer, require_permission
from app.database import get_db
from app.models import AdminUser, Customer
from app.schemas import (
    BuyerLoginRequest,
    CartItemAdd,
    CartItemUpdate,
    ContactMessageCreate,
    ContactMessageUpdate,
    InquiryCreate,
    InquiryUpdate,
    OrderCreate,
    OrderUpdate,
    QuotationCreate,
    QuotationUpdate,
    TrackLookupRequest,
)
from app.security import rate_limit
from app.services import pdf_service, sales_service

router = APIRouter(prefix="/api", tags=["sales"])


@router.get("/cart")
def get_cart(session_id: str = "default", db: Session = Depends(get_db)):
    return sales_service.get_cart(db, session_id)


@router.post("/cart")
def add_to_cart(payload: CartItemAdd, db: Session = Depends(get_db)):
    return sales_service.add_to_cart(db, payload)


@router.patch("/cart/{item_id}")
def update_cart_item(item_id: int, payload: CartItemUpdate, db: Session = Depends(get_db)):
    return sales_service.update_cart_item(db, item_id, payload)


@router.delete("/cart/{item_id}")
def remove_cart_item(item_id: int, db: Session = Depends(get_db)):
    return sales_service.remove_cart_item(db, item_id)


@router.post("/track", dependencies=[Depends(rate_limit("track_lookup", max_calls=30, window_seconds=60))])
def track_order_or_inquiry(payload: TrackLookupRequest, db: Session = Depends(get_db)):
    return sales_service.lookup_order_or_inquiry(db, payload)


@router.post("/buyer/login", dependencies=[Depends(rate_limit("buyer_login", max_calls=15, window_seconds=60))])
def buyer_login(payload: BuyerLoginRequest, db: Session = Depends(get_db)):
    return sales_service.authenticate_buyer(db, payload)


@router.get("/buyer/portal")
def get_buyer_portal(buyer: Customer = Depends(require_buyer), db: Session = Depends(get_db)):
    return sales_service.get_buyer_portal_overview(db, buyer)


@router.get("/buyer/orders/{order_id}/pdf")
def download_buyer_invoice_pdf(
    order_id: int,
    buyer: Customer = Depends(require_buyer),
    db: Session = Depends(get_db),
):
    fname, pdf_bytes = sales_service.download_buyer_invoice_pdf(db, buyer, order_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )


@router.get("/inquiries")
def list_inquiries(
    response: Response,
    status: Optional[str] = None,
    limit: Optional[int] = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _admin: AdminUser = Depends(require_permission("Bulk Inquiries & Quotations", "view")),
    db: Session = Depends(get_db),
):
    data, total = sales_service.list_inquiries_with_total(db, status, limit=limit, offset=offset)
    response.headers["X-Total-Count"] = str(total)
    return data


@router.post("/inquiries", dependencies=[Depends(rate_limit("create_inquiry", max_calls=20, window_seconds=60))])
def create_inquiry(payload: InquiryCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return sales_service.create_inquiry(db, payload, background_tasks=background_tasks)


@router.patch("/inquiries/{inquiry_id}")
def update_inquiry(
    inquiry_id: int,
    payload: InquiryUpdate,
    background_tasks: BackgroundTasks,
    _admin: AdminUser = Depends(require_permission("Bulk Inquiries & Quotations", "edit")),
    db: Session = Depends(get_db),
):
    return sales_service.update_inquiry(db, inquiry_id, payload, background_tasks=background_tasks)


@router.post("/inquiries/{inquiry_id}/convert-quotation")
def convert_inquiry_to_quotation(
    inquiry_id: int,
    _admin: AdminUser = Depends(require_permission("Bulk Inquiries & Quotations", "create")),
    db: Session = Depends(get_db),
):
    return sales_service.convert_inquiry_to_quotation(db, inquiry_id)


@router.post("/inquiries/{inquiry_id}/convert-order")
def convert_inquiry_to_order(
    inquiry_id: int,
    _admin: AdminUser = Depends(require_permission("Orders & GST Invoices", "create")),
    db: Session = Depends(get_db),
):
    return sales_service.convert_inquiry_to_order(db, inquiry_id)


@router.get("/quotations")
def list_quotations(
    _admin: AdminUser = Depends(require_permission("Bulk Inquiries & Quotations", "view")),
    db: Session = Depends(get_db),
):
    return sales_service.list_quotations(db)


@router.post("/quotations")
def create_quotation(
    payload: QuotationCreate,
    _admin: AdminUser = Depends(require_permission("Bulk Inquiries & Quotations", "create")),
    db: Session = Depends(get_db),
):
    return sales_service.create_quotation(db, payload)


@router.put("/quotations/{quote_id}")
def update_quotation(
    quote_id: int,
    payload: QuotationUpdate,
    _admin: AdminUser = Depends(require_permission("Bulk Inquiries & Quotations", "edit")),
    db: Session = Depends(get_db),
):
    return sales_service.update_quotation(db, quote_id, payload)


@router.post("/quotations/{quote_id}/send")
def send_quotation(
    quote_id: int,
    background_tasks: BackgroundTasks,
    _admin: AdminUser = Depends(require_permission("Bulk Inquiries & Quotations", "edit")),
    db: Session = Depends(get_db),
):
    return sales_service.send_quotation(db, quote_id, background_tasks=background_tasks)


@router.post("/quotations/{quote_id}/convert-order")
def convert_quotation_to_order(
    quote_id: int,
    _admin: AdminUser = Depends(require_permission("Orders & GST Invoices", "create")),
    db: Session = Depends(get_db),
):
    return sales_service.convert_quotation_to_order(db, quote_id)


@router.get("/quotations/{quote_id}/pdf")
def download_quotation_pdf(
    quote_id: int,
    _admin: AdminUser = Depends(require_permission("Bulk Inquiries & Quotations", "export")),
    db: Session = Depends(get_db),
):
    fname, pdf_bytes = pdf_service.generate_quotation_pdf(db, quote_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )


@router.get("/orders")
def list_orders(
    response: Response,
    limit: Optional[int] = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _admin: AdminUser = Depends(require_permission("Orders & GST Invoices", "view")),
    db: Session = Depends(get_db),
):
    items, total = sales_service.list_orders_with_total(db, limit=limit, offset=offset)
    response.headers["X-Total-Count"] = str(total)
    return items


@router.post("/orders")
def create_order(
    payload: OrderCreate,
    _admin: AdminUser = Depends(require_permission("Orders & GST Invoices", "create")),
    db: Session = Depends(get_db),
):
    return sales_service.create_order(db, payload)


@router.patch("/orders/{order_id}")
def update_order(
    order_id: int,
    payload: OrderUpdate,
    _admin: AdminUser = Depends(require_permission("Orders & GST Invoices", "edit")),
    db: Session = Depends(get_db),
):
    return sales_service.update_order(db, order_id, payload)


@router.get("/orders/{order_id}/pdf")
def download_invoice_pdf(
    order_id: int,
    _admin: AdminUser = Depends(require_permission("Orders & GST Invoices", "export")),
    db: Session = Depends(get_db),
):
    fname, pdf_bytes = pdf_service.generate_invoice_pdf(db, order_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )


@router.post("/contact", dependencies=[Depends(rate_limit("contact_submit", max_calls=15, window_seconds=60))])
def submit_contact_message(payload: ContactMessageCreate, db: Session = Depends(get_db)):
    return sales_service.submit_contact_message(db, payload)


@router.get("/contact")
def list_contact_messages(
    _admin: AdminUser = Depends(require_permission("Bulk Inquiries & Quotations", "view")),
    db: Session = Depends(get_db),
):
    return sales_service.list_contact_messages(db)


@router.patch("/contact/{msg_id}")
def update_contact_message(
    msg_id: int,
    payload: ContactMessageUpdate,
    _admin: AdminUser = Depends(require_permission("Bulk Inquiries & Quotations", "edit")),
    db: Session = Depends(get_db),
):
    return sales_service.update_contact_message_status(db, msg_id, payload)
