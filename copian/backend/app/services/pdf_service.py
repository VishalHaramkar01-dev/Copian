"""Server-side A4 PDF generator for GST Proforma Quotations and Tax Invoices."""

import io
from fastapi import HTTPException
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session
from app.models import CmsSetting, Order, Quotation

INTRA_STATE_KEYWORDS = ("maharashtra", "mumbai", "thane", "pune", "nagpur", "nashik", "navi mumbai")


def _get_supplier_contact(db: Session) -> dict:
    row = db.query(CmsSetting).filter(CmsSetting.key == "contact").first()
    val = (row.value or {}) if row else {}
    return {
        "company": val.get("company", "Copian International"),
        "address": val.get("address", "Khopat Road, D-254 Amargian Industrial Estate, Thane, Maharashtra 400601"),
        "phone": val.get("phone_primary", "+91 93225 93719"),
        "email": val.get("email", "Copiantoner@gmail.com"),
    }


def _is_intra_state(gstin: str, address: str) -> bool:
    clean_gst = (gstin or "").strip().upper()
    if clean_gst.startswith("27"):
        return True
    if len(clean_gst) >= 2 and clean_gst[:2].isdigit() and not clean_gst.startswith("27"):
        return False
    low_addr = (address or "").lower()
    return any(k in low_addr for k in INTRA_STATE_KEYWORDS)


def _render_gst_document(
    *,
    doc_title: str,
    ref_line: str,
    supplier: dict,
    buyer_name: str,
    buyer_address: str,
    buyer_gstin: str,
    extra_meta: list[str],
    items: list[dict],
    subtotal: float,
    discount: float,
    shipping: float,
    gst_rate: int,
    gst_amount: float,
    grand_total: float,
) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story = []

    brand_navy = colors.HexColor("#00366B")
    slate_bg = colors.HexColor("#F3F5F8")
    border_col = colors.HexColor("#CBD5E1")

    header_tbl = Table(
        [[
            Paragraph(f"<font size='15' color='#00366B'><b>{doc_title}</b></font><br/><font size='9' color='#475569'>{ref_line}</font>", styles["Normal"]),
            Paragraph(f"<font size='10'><b>{supplier['company']}</b></font><br/><font size='8' color='#475569'>{supplier['address']}<br/>{supplier['phone']} | {supplier['email']}<br/>HSN: 8443</font>", styles["Normal"]),
        ]],
        colWidths=[270, 250],
    )
    header_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(header_tbl)
    story.append(Spacer(1, 14))

    meta_text = "<br/>".join(extra_meta)
    party_tbl = Table(
        [[
            Paragraph(f"<b>Billed / Supplied To</b><br/>{buyer_name}<br/><font size='8' color='#475569'>{buyer_address}<br/>GSTIN: {buyer_gstin or 'Unregistered / B2B Pending'}</font>", styles["Normal"]),
            Paragraph(f"<b>Document Summary</b><br/><font size='8' color='#475569'>{meta_text}</font>", styles["Normal"]),
        ]],
        colWidths=[270, 250],
    )
    party_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), slate_bg),
        ("BOX", (0, 0), (-1, -1), 0.5, border_col),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(party_tbl)
    story.append(Spacer(1, 14))

    rows = [["SKU", "Description", "Qty", "Rate (INR)", "Amount (INR)"]]
    for it in items:
        rows.append([
            it["sku"],
            Paragraph(str(it["product_name"]), styles["Normal"]),
            str(it["quantity"]),
            f"{it['unit_price']:,.2f}",
            f"{it['line_total']:,.2f}",
        ])

    item_tbl = Table(rows, colWidths=[85, 225, 45, 80, 85])
    item_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), brand_navy),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("GRID", (0, 0), (-1, -1), 0.5, border_col),
        ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(item_tbl)
    story.append(Spacer(1, 12))

    summary_rows = [["Subtotal", f"INR {subtotal:,.2f}"]]
    if discount > 0:
        summary_rows.append(["Volume Discount", f"-INR {discount:,.2f}"])
    if shipping > 0:
        summary_rows.append(["Freight / Shipping", f"INR {shipping:,.2f}"])

    if _is_intra_state(buyer_gstin, buyer_address):
        cgst = round(gst_amount / 2, 2)
        sgst = round(gst_amount - cgst, 2)
        summary_rows.append([f"CGST ({gst_rate / 2:g}%)", f"INR {cgst:,.2f}"])
        summary_rows.append([f"SGST ({gst_rate / 2:g}%)", f"INR {sgst:,.2f}"])
    else:
        summary_rows.append([f"IGST ({gst_rate}%)", f"INR {gst_amount:,.2f}"])

    summary_rows.append(["Grand Total", f"INR {grand_total:,.2f}"])

    sum_tbl = Table(summary_rows, colWidths=[150, 120], hAlign="RIGHT")
    sum_tbl.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEABOVE", (0, -1), (-1, -1), 1, brand_navy),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, -1), (-1, -1), brand_navy),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(sum_tbl)
    story.append(Spacer(1, 20))
    story.append(Paragraph("<font size='8' color='#64748B'>Computer-generated Copian B2B document · Goods covered under HSN 8443.</font>", styles["Normal"]))

    doc.build(story)
    return buf.getvalue()


def generate_quotation_pdf(db: Session, quote_id: int) -> tuple[str, bytes]:
    """Generate downloadable A4 GST Proforma Quotation PDF."""
    qt = db.query(Quotation).filter(Quotation.id == quote_id).first()
    if not qt:
        raise HTTPException(status_code=404, detail="Quotation not found")
    pdf_bytes = _render_gst_document(
        doc_title="PROFORMA QUOTATION",
        ref_line=f"Quote Code: {qt.quote_code} | Valid Until: {qt.valid_until or '2026-12-31'}",
        supplier=_get_supplier_contact(db),
        buyer_name=qt.customer_name,
        buyer_address=qt.customer_email or "Registered B2B Account",
        buyer_gstin=qt.customer_gstin,
        extra_meta=[f"Status: {qt.status}", f"Rate: {qt.gst_rate}% GST"],
        items=[
            {"sku": i.sku, "product_name": i.product_name, "quantity": i.quantity, "unit_price": i.unit_price, "line_total": i.line_total}
            for i in qt.items
        ],
        subtotal=qt.subtotal,
        discount=qt.discount_amount,
        shipping=qt.shipping_amount,
        gst_rate=qt.gst_rate,
        gst_amount=qt.gst_amount,
        grand_total=qt.grand_total,
    )
    return f"COPIAN-Quote-{qt.quote_code}.pdf", pdf_bytes


def generate_invoice_pdf(db: Session, order_id: int) -> tuple[str, bytes]:
    """Generate downloadable A4 GST Tax Invoice PDF."""
    ord_obj = db.query(Order).filter(Order.id == order_id).first()
    if not ord_obj:
        raise HTTPException(status_code=404, detail="Order not found")
    meta = [
        f"Payment: {ord_obj.payment_status}",
        f"Fulfilment: {ord_obj.fulfilment_status}",
    ]
    if ord_obj.tracking_number:
        meta.append(f"Tracking: {ord_obj.courier_name or 'Courier'} {ord_obj.tracking_number}")
    pdf_bytes = _render_gst_document(
        doc_title="GST TAX INVOICE",
        ref_line=f"Invoice #{ord_obj.invoice_code} | Order {ord_obj.order_code}",
        supplier=_get_supplier_contact(db),
        buyer_name=ord_obj.customer_name,
        buyer_address=ord_obj.shipping_address or "Verified B2B Delivery Address",
        buyer_gstin=ord_obj.gstin,
        extra_meta=meta,
        items=[
            {"sku": i.sku, "product_name": i.product_name, "quantity": i.quantity, "unit_price": i.unit_price, "line_total": i.line_total}
            for i in ord_obj.items
        ],
        subtotal=ord_obj.subtotal,
        discount=0.0,
        shipping=0.0,
        gst_rate=18,
        gst_amount=ord_obj.gst_amount,
        grand_total=ord_obj.total_amount,
    )
    return f"COPIAN-Invoice-{ord_obj.invoice_code}.pdf", pdf_bytes
