"""Sales workflow services: persistent cart, bulk inquiries, GST quotations, orders, and contact messages."""

from datetime import date, timedelta
from typing import Any, Callable, Optional
from fastapi import BackgroundTasks, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload
from app.auth import create_buyer_token
from app.models import (
    AuditLog,
    BulkInquiry,
    BulkInquiryItem,
    CartItem,
    ContactMessage,
    Customer,
    Order,
    OrderItem,
    OrderTimeline,
    Product,
    Quotation,
    QuotationItem,
    utc_now,
)
from app.services.inventory_service import (
    commit_dispatch_for_order,
    release_reserved_stock_for_order,
    reserve_stock_for_order,
)
from app.services.notification_service import notify_inquiry_received, notify_quotation_sent
from app.services.pdf_service import generate_invoice_pdf, generate_quotation_pdf
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


def _dispatch_notification(
    background_tasks: Optional[BackgroundTasks],
    fn: Callable[..., Any],
    *args: Any,
    **kwargs: Any,
) -> None:
    """Queue notification delivery via FastAPI BackgroundTasks when available so requests do not block on SMTP."""
    if background_tasks is not None:
        background_tasks.add_task(fn, *args, **kwargs)
    else:
        fn(*args, **kwargs)


def compute_quote_totals(items: list[dict], discount: float, shipping: float, gst_rate: int) -> tuple[float, float, float]:
    """Compute subtotal, GST tax amount, and grand total cleanly from line items."""
    subtotal = sum(round(it["quantity"] * it["unit_price"], 2) for it in items)
    taxable = max(0.0, subtotal - discount + shipping)
    gst_amount = round(taxable * (gst_rate / 100.0), 2)
    grand_total = round(taxable + gst_amount, 2)
    return subtotal, gst_amount, grand_total


def serialize_inquiry(inq: BulkInquiry) -> dict:
    total_qty = sum(i.quantity for i in inq.items)
    return {
        "id": inq.id,
        "inquiry_code": inq.inquiry_code,
        "customer_id": inq.customer_id,
        "company_name": inq.company_name,
        "contact_name": inq.contact_name,
        "phone": inq.phone,
        "email": inq.email,
        "gstin": inq.gstin,
        "delivery_city": inq.delivery_city,
        "notes": inq.notes,
        "status": inq.status,
        "assigned_salesperson": inq.assigned_salesperson,
        "internal_note": inq.internal_note,
        "source": inq.source,
        "sku_count": len(inq.items),
        "total_qty": total_qty,
        "created_at": inq.created_at.isoformat(),
        "items": [
            {
                "id": it.id,
                "sku": it.sku,
                "product_name": it.product_name,
                "quantity": it.quantity,
                "unit_note": it.unit_note,
            }
            for it in inq.items
        ],
    }


def serialize_quotation(qt: Quotation) -> dict:
    return {
        "id": qt.id,
        "quote_code": qt.quote_code,
        "inquiry_id": qt.inquiry_id,
        "customer_id": qt.customer_id,
        "customer_name": qt.customer_name,
        "customer_email": qt.customer_email,
        "customer_phone": qt.customer_phone,
        "customer_gstin": qt.customer_gstin,
        "valid_until": qt.valid_until.isoformat() if qt.valid_until else "2026-12-31",
        "gst_rate": qt.gst_rate,
        "gst_label": qt.gst_label,
        "subtotal": qt.subtotal,
        "discount_amount": qt.discount_amount,
        "shipping_amount": qt.shipping_amount,
        "gst_amount": qt.gst_amount,
        "grand_total": qt.grand_total,
        "status": qt.status,
        "notes": qt.notes,
        "created_at": qt.created_at.isoformat(),
        "items": [
            {
                "id": it.id,
                "sku": it.sku,
                "product_name": it.product_name,
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "line_total": it.line_total,
            }
            for it in qt.items
        ],
    }


def serialize_order(o: Order) -> dict:
    return {
        "id": o.id,
        "order_code": o.order_code,
        "invoice_code": o.invoice_code,
        "quotation_id": o.quotation_id,
        "inquiry_id": o.inquiry_id,
        "customer_id": o.customer_id,
        "customer_name": o.customer_name,
        "shipping_address": o.shipping_address,
        "gstin": o.gstin,
        "subtotal": o.subtotal,
        "gst_amount": o.gst_amount,
        "total_amount": o.total_amount,
        "payment_status": o.payment_status,
        "fulfilment_status": o.fulfilment_status,
        "courier_name": o.courier_name or "",
        "tracking_number": o.tracking_number or "",
        "created_at": o.created_at.isoformat(),
        "items": [
            {
                "id": it.id,
                "sku": it.sku,
                "product_name": it.product_name,
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "line_total": it.line_total,
            }
            for it in o.items
        ],
        "timeline": [
            {
                "id": t.id,
                "event_title": t.event_title,
                "is_highlighted": t.is_highlighted,
                "created_at": t.created_at.strftime("%d %b, %H:%M"),
            }
            for t in o.timeline
        ],
    }


def _next_order_codes(db: Session) -> tuple[str, str]:
    count = db.query(Order).count()
    return f"ORD-{1093 + count}", f"INV-2026-{442 + count}"


def get_cart(db: Session, session_id: str) -> list[dict]:
    items = db.query(CartItem).filter(CartItem.session_id == session_id).order_by(CartItem.id).all()
    return [
        {
            "id": i.id,
            "session_id": i.session_id,
            "sku": i.sku,
            "product_name": i.product_name,
            "description_line": i.description_line,
            "image_url": i.image_url,
            "moq": i.moq,
            "moq_unit": i.moq_unit,
            "quantity": i.quantity,
            "note": i.note,
        }
        for i in items
    ]


def add_to_cart(db: Session, payload: CartItemAdd) -> dict:
    existing = db.query(CartItem).filter(CartItem.session_id == payload.session_id, CartItem.sku == payload.sku).first()
    product = db.query(Product).filter(Product.sku == payload.sku).first()
    if existing:
        existing.quantity += payload.quantity
        if payload.note:
            existing.note = payload.note
        db.commit()
        db.refresh(existing)
        item = existing
    else:
        item = CartItem(
            session_id=payload.session_id,
            product_id=product.id if product else None,
            sku=payload.sku,
            product_name=payload.product_name or (product.name if product else payload.sku),
            description_line=payload.description_line
            or (f"{product.page_yield:,}-page ISO yield · MOQ {product.moq} {product.moq_unit}" if product else ""),
            image_url=payload.image_url or (product.image_url if product else "/images/toner-cartridge.png"),
            moq=product.moq if product else payload.moq,
            moq_unit=product.moq_unit if product else payload.moq_unit,
            quantity=payload.quantity,
            note=payload.note,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
    return {
        "id": item.id,
        "sku": item.sku,
        "product_name": item.product_name,
        "quantity": item.quantity,
    }


def update_cart_item(db: Session, item_id: int, payload: CartItemUpdate) -> dict:
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if payload.quantity is not None:
        item.quantity = max(1, payload.quantity)
    if payload.note is not None:
        item.note = payload.note
    db.commit()
    return {"updated": True}


def remove_cart_item(db: Session, item_id: int) -> dict:
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()
    return {"deleted": True}


INQUIRY_STATUS_KEYS = ["New", "Under Review", "Quotation Sent", "Negotiation", "Approved", "Converted"]


def list_inquiries_with_total(
    db: Session,
    status: Optional[str] = None,
    limit: Optional[int] = None,
    offset: int = 0,
) -> tuple[dict, int]:
    """List inquiries with eager-loaded line items, SQL-grouped status counts, and optional pagination."""
    status_rows = db.query(BulkInquiry.status, func.count(BulkInquiry.id)).group_by(BulkInquiry.status).all()
    counts = {key: 0 for key in INQUIRY_STATUS_KEYS}
    for st_name, cnt in status_rows:
        if st_name in counts:
            counts[st_name] = int(cnt)
    counts["All"] = sum(int(cnt) for _, cnt in status_rows)

    query = db.query(BulkInquiry).options(selectinload(BulkInquiry.items)).order_by(BulkInquiry.created_at.desc())
    if status and status != "All":
        query = query.filter(BulkInquiry.status == status)
    total = query.order_by(None).count()
    if offset:
        query = query.offset(offset)
    if limit is not None:
        query = query.limit(limit)
    return {"counts": counts, "inquiries": [serialize_inquiry(i) for i in query.all()]}, total


def list_inquiries(
    db: Session,
    status: Optional[str] = None,
    limit: Optional[int] = None,
    offset: int = 0,
) -> dict:
    data, _ = list_inquiries_with_total(db, status=status, limit=limit, offset=offset)
    return data


def create_inquiry(
    db: Session,
    payload: InquiryCreate,
    background_tasks: Optional[BackgroundTasks] = None,
) -> dict:
    if not payload.items:
        raise HTTPException(status_code=400, detail="Inquiry must contain at least one product SKU")

    cust = db.query(Customer).filter(Customer.email == payload.email).first() if payload.email else None
    if not cust:
        cust = Customer(
            company_name=payload.company_name,
            contact_name=payload.contact_name,
            phone=payload.phone,
            email=payload.email,
            gstin=payload.gstin,
            city=payload.delivery_city,
            classification="Corporate Buyer",
        )
        db.add(cust)
        db.flush()

    inq_code = f"INQ-{4813 + db.query(BulkInquiry).count()}"
    inq = BulkInquiry(
        inquiry_code=inq_code,
        customer_id=cust.id,
        company_name=payload.company_name,
        contact_name=payload.contact_name,
        phone=payload.phone,
        email=payload.email,
        gstin=payload.gstin,
        delivery_city=payload.delivery_city,
        notes=payload.notes,
        status="New",
        source="Website Cart",
    )
    db.add(inq)
    db.flush()

    for it in payload.items:
        p = db.query(Product).filter(Product.sku == it.sku).first()
        db.add(
            BulkInquiryItem(
                inquiry_id=inq.id,
                product_id=p.id if p else None,
                sku=it.sku,
                product_name=it.product_name,
                quantity=it.quantity,
                unit_note=it.unit_note,
            )
        )

    if payload.session_id:
        db.query(CartItem).filter(CartItem.session_id == payload.session_id).delete()

    db.add(
        AuditLog(
            user_name=payload.contact_name,
            action="NEW_BULK_INQUIRY",
            module="Bulk Inquiries",
            entity_id=inq_code,
            details=f"Submitted by {payload.company_name}",
        )
    )
    db.commit()
    db.refresh(inq)
    res = serialize_inquiry(inq)
    _dispatch_notification(background_tasks, notify_inquiry_received, res)
    return res


def update_inquiry(
    db: Session,
    inquiry_id: int,
    payload: InquiryUpdate,
    background_tasks: Optional[BackgroundTasks] = None,
) -> dict:
    inq = db.query(BulkInquiry).filter(BulkInquiry.id == inquiry_id).first()
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(inq, k, v)
    db.commit()
    db.refresh(inq)
    res = serialize_inquiry(inq)
    _dispatch_notification(background_tasks, notify_inquiry_received, res)
    return res


def _line_items_from_inquiry(db: Session, inq: BulkInquiry) -> list[dict]:
    items = []
    for it in inq.items:
        p = db.query(Product).filter(Product.sku == it.sku).first()
        price = p.dealer_price if p else 500.0
        items.append(
            {
                "product_id": p.id if p else None,
                "sku": it.sku,
                "product_name": it.product_name,
                "quantity": it.quantity,
                "unit_price": price,
                "line_total": round(it.quantity * price, 2),
            }
        )
    return items


def convert_inquiry_to_quotation(db: Session, inquiry_id: int) -> dict:
    inq = db.query(BulkInquiry).filter(BulkInquiry.id == inquiry_id).first()
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    quote_code = f"QT-2026-0{843 + db.query(Quotation).count()}"
    line_items = _line_items_from_inquiry(db, inq)
    subtotal, gst_amount, grand_total = compute_quote_totals(line_items, 0.0, 800.0, 18)
    qt = Quotation(
        quote_code=quote_code,
        inquiry_id=inq.id,
        customer_id=inq.customer_id,
        customer_name=inq.company_name,
        customer_email=inq.email,
        customer_phone=inq.phone,
        customer_gstin=inq.gstin,
        valid_until=date(2026, 12, 31),
        gst_rate=18,
        subtotal=subtotal,
        discount_amount=0.0,
        shipping_amount=800.0,
        gst_amount=gst_amount,
        grand_total=grand_total,
        status="Draft",
        notes=inq.notes,
    )
    db.add(qt)
    db.flush()
    for li in line_items:
        db.add(QuotationItem(quotation_id=qt.id, **li))
    inq.status = "Under Review"
    db.commit()
    db.refresh(qt)
    return serialize_quotation(qt)


def convert_inquiry_to_order(db: Session, inquiry_id: int) -> dict:
    inq = db.query(BulkInquiry).filter(BulkInquiry.id == inquiry_id).first()
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    order_code, invoice_code = _next_order_codes(db)
    line_items = _line_items_from_inquiry(db, inq)
    subtotal = sum(x["line_total"] for x in line_items)
    gst_amount = round(subtotal * 0.18, 2)
    order = Order(
        order_code=order_code,
        invoice_code=invoice_code,
        inquiry_id=inq.id,
        customer_id=inq.customer_id,
        customer_name=inq.company_name,
        shipping_address=inq.delivery_city,
        gstin=inq.gstin,
        subtotal=subtotal,
        gst_amount=gst_amount,
        total_amount=round(subtotal + gst_amount, 2),
        payment_status="Pending",
        fulfilment_status="Ready to Dispatch",
    )
    db.add(order)
    db.flush()
    for li in line_items:
        db.add(OrderItem(order_id=order.id, **li))
    db.add(OrderTimeline(order_id=order.id, event_title="Converted from Bulk Inquiry & Stock Reserved", is_highlighted=True))
    reserve_stock_for_order(db, line_items, order.order_code)
    inq.status = "Converted"
    db.commit()
    db.refresh(order)
    return serialize_order(order)


def list_quotations(db: Session) -> list[dict]:
    rows = db.query(Quotation).options(selectinload(Quotation.items)).order_by(Quotation.created_at.desc()).all()
    return [serialize_quotation(q) for q in rows]


def create_quotation(db: Session, payload: QuotationCreate) -> dict:
    quote_code = f"QT-2026-0{843 + db.query(Quotation).count()}"
    items_data = []
    for it in payload.items:
        p = db.query(Product).filter(Product.sku == it.sku).first()
        items_data.append(
            {
                "product_id": p.id if p else None,
                "sku": it.sku,
                "product_name": it.product_name,
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "line_total": round(it.quantity * it.unit_price, 2),
            }
        )
    subtotal, gst_amount, grand_total = compute_quote_totals(
        items_data, payload.discount_amount, payload.shipping_amount, payload.gst_rate
    )
    qt = Quotation(
        quote_code=quote_code,
        inquiry_id=payload.inquiry_id,
        customer_id=payload.customer_id,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        customer_gstin=payload.customer_gstin,
        valid_until=payload.valid_until or date(2026, 12, 31),
        gst_rate=payload.gst_rate,
        gst_label=payload.gst_label,
        subtotal=subtotal,
        discount_amount=payload.discount_amount,
        shipping_amount=payload.shipping_amount,
        gst_amount=gst_amount,
        grand_total=grand_total,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(qt)
    db.flush()
    for li in items_data:
        db.add(QuotationItem(quotation_id=qt.id, **li))
    db.commit()
    db.refresh(qt)
    return serialize_quotation(qt)


def update_quotation(db: Session, quote_id: int, payload: QuotationUpdate) -> dict:
    qt = db.query(Quotation).filter(Quotation.id == quote_id).first()
    if not qt:
        raise HTTPException(status_code=404, detail="Quotation not found")
    updates = payload.model_dump(exclude_unset=True, exclude={"items"})
    for k, v in updates.items():
        setattr(qt, k, v)
    if payload.items is not None:
        db.query(QuotationItem).filter(QuotationItem.quotation_id == qt.id).delete()
        items_data = []
        for it in payload.items:
            p = db.query(Product).filter(Product.sku == it.sku).first()
            li = {
                "product_id": p.id if p else None,
                "sku": it.sku,
                "product_name": it.product_name,
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "line_total": round(it.quantity * it.unit_price, 2),
            }
            items_data.append(li)
            db.add(QuotationItem(quotation_id=qt.id, **li))
    else:
        items_data = [{"quantity": i.quantity, "unit_price": i.unit_price} for i in qt.items]

    subtotal, gst_amount, grand_total = compute_quote_totals(
        items_data, qt.discount_amount, qt.shipping_amount, qt.gst_rate
    )
    qt.subtotal = subtotal
    qt.gst_amount = gst_amount
    qt.grand_total = grand_total
    db.commit()
    db.refresh(qt)
    return serialize_quotation(qt)


def send_quotation(
    db: Session,
    quote_id: int,
    background_tasks: Optional[BackgroundTasks] = None,
) -> dict:
    qt = db.query(Quotation).filter(Quotation.id == quote_id).first()
    if not qt:
        raise HTTPException(status_code=404, detail="Quotation not found")
    qt.status = "Sent"
    if qt.inquiry_id:
        inq = db.query(BulkInquiry).filter(BulkInquiry.id == qt.inquiry_id).first()
        if inq:
            inq.status = "Quotation Sent"
    db.add(
        AuditLog(
            user_name="Arjun Mehta",
            action="SEND_QUOTATION",
            module="Quotations",
            entity_id=qt.quote_code,
            details=f"Sent quotation to {qt.customer_name}",
        )
    )
    db.commit()
    db.refresh(qt)
    res = serialize_quotation(qt)
    try:
        pdf_att = generate_quotation_pdf(db, qt.id)
    except Exception:
        pdf_att = None
    _dispatch_notification(background_tasks, notify_quotation_sent, res, pdf_attachment=pdf_att)
    return res


def convert_quotation_to_order(db: Session, quote_id: int) -> dict:
    qt = db.query(Quotation).filter(Quotation.id == quote_id).first()
    if not qt:
        raise HTTPException(status_code=404, detail="Quotation not found")
    order_code, invoice_code = _next_order_codes(db)
    order = Order(
        order_code=order_code,
        invoice_code=invoice_code,
        quotation_id=qt.id,
        inquiry_id=qt.inquiry_id,
        customer_id=qt.customer_id,
        customer_name=qt.customer_name,
        shipping_address="Verified B2B Billing Address",
        gstin=qt.customer_gstin,
        subtotal=qt.subtotal,
        gst_amount=qt.gst_amount,
        total_amount=qt.grand_total,
        payment_status="Pending",
        fulfilment_status="Ready to Dispatch",
    )
    db.add(order)
    db.flush()
    for it in qt.items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=it.product_id,
                sku=it.sku,
                product_name=it.product_name,
                quantity=it.quantity,
                unit_price=it.unit_price,
                line_total=it.line_total,
            )
        )
    db.add(OrderTimeline(order_id=order.id, event_title="Confirmed from Quotation & Stock Reserved", is_highlighted=True))
    reserve_stock_for_order(db, list(qt.items), order.order_code)
    qt.status = "Converted"
    if qt.inquiry_id:
        inq = db.query(BulkInquiry).filter(BulkInquiry.id == qt.inquiry_id).first()
        if inq:
            inq.status = "Converted"
    db.commit()
    db.refresh(order)
    return serialize_order(order)


def list_orders_with_total(db: Session, limit: Optional[int] = None, offset: int = 0) -> tuple[list[dict], int]:
    """List orders with eager-loaded items and timeline events plus optional pagination."""
    query = (
        db.query(Order)
        .options(selectinload(Order.items), selectinload(Order.timeline))
        .order_by(Order.created_at.desc())
    )
    total = query.order_by(None).count()
    if offset:
        query = query.offset(offset)
    if limit is not None:
        query = query.limit(limit)
    return [serialize_order(o) for o in query.all()], total


def list_orders(db: Session, limit: Optional[int] = None, offset: int = 0) -> list[dict]:
    items, _ = list_orders_with_total(db, limit=limit, offset=offset)
    return items


def create_order(db: Session, payload: OrderCreate) -> dict:
    order_code, invoice_code = _next_order_codes(db)
    subtotal = sum(round(i.quantity * i.unit_price, 2) for i in payload.items)
    gst_amount = round(subtotal * 0.18, 2)
    order = Order(
        order_code=order_code,
        invoice_code=invoice_code,
        quotation_id=payload.quotation_id,
        inquiry_id=payload.inquiry_id,
        customer_name=payload.customer_name,
        shipping_address=payload.shipping_address,
        gstin=payload.gstin,
        subtotal=subtotal,
        gst_amount=gst_amount,
        total_amount=round(subtotal + gst_amount, 2),
        payment_status=payload.payment_status,
        fulfilment_status=payload.fulfilment_status,
    )
    db.add(order)
    db.flush()
    for it in payload.items:
        p = db.query(Product).filter(Product.sku == it.sku).first()
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=p.id if p else None,
                sku=it.sku,
                product_name=it.product_name,
                quantity=it.quantity,
                unit_price=it.unit_price,
                line_total=round(it.quantity * it.unit_price, 2),
            )
        )
    db.add(OrderTimeline(order_id=order.id, event_title="Order Confirmed & Stock Reserved", is_highlighted=True))
    reserve_stock_for_order(db, payload.items, order.order_code)
    db.commit()
    db.refresh(order)
    return serialize_order(order)


def update_order(db: Session, order_id: int, payload: OrderUpdate) -> dict:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if payload.payment_status is not None:
        order.payment_status = payload.payment_status
    if payload.shipping_address is not None:
        order.shipping_address = payload.shipping_address
    if payload.courier_name is not None:
        order.courier_name = payload.courier_name.strip()
    if payload.tracking_number is not None:
        new_trk = payload.tracking_number.strip()
        if new_trk and new_trk != (order.tracking_number or ""):
            for t in order.timeline:
                t.is_highlighted = False
            carrier = order.courier_name or "Courier"
            db.add(OrderTimeline(order_id=order.id, event_title=f"Dispatched via {carrier} (AWB/LR: {new_trk})", is_highlighted=True))
        order.tracking_number = new_trk
    if payload.fulfilment_status is not None and payload.fulfilment_status != order.fulfilment_status:
        order.fulfilment_status = payload.fulfilment_status
        for t in order.timeline:
            t.is_highlighted = False
        db.add(OrderTimeline(order_id=order.id, event_title=f"Status updated: {payload.fulfilment_status}", is_highlighted=True))
        if payload.fulfilment_status == "Dispatched":
            commit_dispatch_for_order(db, list(order.items), order.order_code)
        elif payload.fulfilment_status == "Cancelled":
            release_reserved_stock_for_order(db, list(order.items), order.order_code)
    if payload.timeline_event:
        for t in order.timeline:
            t.is_highlighted = False
        db.add(OrderTimeline(order_id=order.id, event_title=payload.timeline_event, is_highlighted=True))
    db.commit()
    db.refresh(order)
    return serialize_order(order)


def submit_contact_message(db: Session, payload: ContactMessageCreate) -> dict:
    msg = ContactMessage(**payload.model_dump())
    db.add(msg)
    db.add(
        AuditLog(
            user_name=payload.full_name,
            action="CONTACT_SUBMISSION",
            module="Contact Desk",
            entity_id=payload.company_name,
            details=payload.inquiry_type,
        )
    )
    db.commit()
    db.refresh(msg)
    return {"id": msg.id, "status": "received"}


def list_contact_messages(db: Session) -> list[dict]:
    msgs = db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()
    return [
        {
            "id": m.id,
            "full_name": m.full_name,
            "company_name": m.company_name,
            "email": m.email,
            "phone": m.phone,
            "inquiry_type": m.inquiry_type,
            "message": m.message,
            "status": m.status,
            "created_at": m.created_at.isoformat(),
        }
        for m in msgs
    ]


def update_contact_message_status(db: Session, msg_id: int, payload: ContactMessageUpdate) -> dict:
    msg = db.query(ContactMessage).filter(ContactMessage.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Contact message not found")
    msg.status = payload.status
    db.commit()
    return {"id": msg.id, "status": msg.status}


def _contact_matches(entered: str, email: Optional[str], phone: Optional[str]) -> bool:
    """Verify buyer contact string against registered email or trailing phone digits."""
    clean = entered.strip().lower()
    if email and clean == email.strip().lower():
        return True
    entered_digits = "".join(ch for ch in clean if ch.isdigit())
    phone_digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    if len(entered_digits) >= 4 and phone_digits and phone_digits.endswith(entered_digits):
        return True
    return False


def lookup_order_or_inquiry(db: Session, payload: TrackLookupRequest) -> dict:
    """Public self-service lookup for buyer order, invoice, quotation, or inquiry status."""
    ref = payload.reference_code.strip().upper()
    contact = payload.contact.strip()

    order = (
        db.query(Order)
        .options(selectinload(Order.items), selectinload(Order.timeline))
        .filter((Order.order_code.ilike(ref)) | (Order.invoice_code.ilike(ref)))
        .first()
    )
    if order:
        cust = db.query(Customer).filter(Customer.id == order.customer_id).first() if order.customer_id else None
        inq = db.query(BulkInquiry).filter(BulkInquiry.id == order.inquiry_id).first() if order.inquiry_id else None
        if not (
            _contact_matches(contact, cust.email if cust else None, cust.phone if cust else None)
            or _contact_matches(contact, inq.email if inq else None, inq.phone if inq else None)
        ):
            raise HTTPException(status_code=404, detail="No matching reference and contact found")
        return {
            "type": "Order",
            "reference_code": order.order_code,
            "invoice_code": order.invoice_code,
            "customer_name": order.customer_name,
            "status": order.fulfilment_status,
            "payment_status": order.payment_status,
            "courier_name": order.courier_name or "",
            "tracking_number": order.tracking_number or "",
            "total_amount": order.total_amount,
            "created_at": order.created_at.isoformat(),
            "items": [{"sku": i.sku, "product_name": i.product_name, "quantity": i.quantity} for i in order.items],
            "timeline": [{"event_title": t.event_title, "is_highlighted": t.is_highlighted, "created_at": t.created_at.strftime("%d %b, %H:%M")} for t in order.timeline],
        }

    qt = db.query(Quotation).filter(Quotation.quote_code.ilike(ref)).first()
    if qt:
        cust = db.query(Customer).filter(Customer.id == qt.customer_id).first() if qt.customer_id else None
        if not (
            _contact_matches(contact, qt.customer_email, qt.customer_phone)
            or _contact_matches(contact, cust.email if cust else None, cust.phone if cust else None)
        ):
            raise HTTPException(status_code=404, detail="No matching reference and contact found")
        return {
            "type": "Quotation",
            "reference_code": qt.quote_code,
            "customer_name": qt.customer_name,
            "status": qt.status,
            "valid_until": qt.valid_until.isoformat() if qt.valid_until else "",
            "total_amount": qt.grand_total,
            "created_at": qt.created_at.isoformat(),
            "items": [{"sku": i.sku, "product_name": i.product_name, "quantity": i.quantity} for i in qt.items],
            "timeline": [{"event_title": f"Proforma Quotation Status: {qt.status}", "is_highlighted": True, "created_at": qt.created_at.strftime("%d %b, %H:%M")}],
        }

    inq = db.query(BulkInquiry).filter(BulkInquiry.inquiry_code.ilike(ref)).first()
    if inq:
        if not _contact_matches(contact, inq.email, inq.phone):
            raise HTTPException(status_code=404, detail="No matching reference and contact found")
        return {
            "type": "Bulk Inquiry",
            "reference_code": inq.inquiry_code,
            "customer_name": inq.company_name,
            "status": inq.status,
            "created_at": inq.created_at.isoformat(),
            "items": [{"sku": i.sku, "product_name": i.product_name, "quantity": i.quantity} for i in inq.items],
            "timeline": [{"event_title": f"Bulk Inquiry Status: {inq.status} ({inq.delivery_city})", "is_highlighted": True, "created_at": inq.created_at.strftime("%d %b, %H:%M")}],
        }

    raise HTTPException(status_code=404, detail="No matching order, quotation, or inquiry found")


def authenticate_buyer(db: Session, payload: BuyerLoginRequest) -> dict:
    """Authenticate a registered B2B Customer using business email plus phone digits or GSTIN."""
    email_clean = payload.email.strip().lower()
    cust = db.query(Customer).filter(Customer.email.ilike(email_clean)).first()
    if not cust:
        raise HTTPException(status_code=401, detail="No registered buyer account matches that email and verification.")

    ver_clean = payload.verification.strip().upper()
    gst_match = bool(cust.gstin and ver_clean == cust.gstin.strip().upper())
    phone_match = _contact_matches(payload.verification, None, cust.phone)
    if not (gst_match or phone_match):
        raise HTTPException(status_code=401, detail="No registered buyer account matches that email and verification.")

    token = create_buyer_token(cust.id, cust.email)
    return {"access_token": token, "token_type": "bearer"}


def get_buyer_portal_overview(db: Session, customer: Customer) -> dict:
    """Return customer credit utilization, orders, quotations, and inquiries scoped strictly to this buyer."""
    inquiries = (
        db.query(BulkInquiry)
        .options(selectinload(BulkInquiry.items))
        .filter(BulkInquiry.customer_id == customer.id)
        .order_by(BulkInquiry.created_at.desc())
        .all()
    )
    quotations = (
        db.query(Quotation)
        .options(selectinload(Quotation.items))
        .filter(Quotation.customer_id == customer.id)
        .order_by(Quotation.created_at.desc())
        .all()
    )
    orders = (
        db.query(Order)
        .options(selectinload(Order.items), selectinload(Order.timeline))
        .filter(Order.customer_id == customer.id)
        .order_by(Order.created_at.desc())
        .all()
    )

    cutoff_30d = utc_now() - timedelta(days=30)
    credit_limit = float(customer.credit_limit if customer.credit_limit is not None else 250000.0)
    unpaid = [o for o in orders if o.payment_status in ("Credit 30d", "Pending")]
    credit_used = round(sum(float(o.total_amount or 0) for o in unpaid), 2)
    overdue = [o for o in unpaid if o.created_at and o.created_at < cutoff_30d]
    overdue_amount = round(sum(float(o.total_amount or 0) for o in overdue), 2)

    return {
        "customer": {
            "id": customer.id,
            "company_name": customer.company_name,
            "contact_name": customer.contact_name,
            "email": customer.email,
            "phone": customer.phone,
            "gstin": customer.gstin,
            "city": customer.city,
            "state": customer.state,
            "classification": customer.classification,
            "credit_limit": credit_limit,
            "credit_used": credit_used,
            "credit_available": round(max(0.0, credit_limit - credit_used), 2),
            "overdue_30d_amount": overdue_amount,
            "overdue_count": len(overdue),
        },
        "orders": [serialize_order(o) for o in orders],
        "quotations": [
            {
                "id": q.id,
                "quote_code": q.quote_code,
                "status": q.status,
                "valid_until": q.valid_until.isoformat() if q.valid_until else "",
                "grand_total": q.grand_total,
            }
            for q in quotations
        ],
        "inquiries": [
            {
                "id": i.id,
                "inquiry_code": i.inquiry_code,
                "status": i.status,
                "delivery_city": i.delivery_city,
                "created_at": i.created_at.isoformat(),
            }
            for i in inquiries
        ],
    }


def download_buyer_invoice_pdf(db: Session, customer: Customer, order_id: int) -> tuple[str, bytes]:
    """Generate invoice PDF only if the requested order belongs to the authenticated buyer."""
    order = db.query(Order).filter(Order.id == order_id, Order.customer_id == customer.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order invoice not found for your account")
    return generate_invoice_pdf(db, order_id)
