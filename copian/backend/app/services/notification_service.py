"""Notification delivery service supporting optional SMTP (with PDF attachment) and log fallback."""

import logging
import os
import smtplib
from email.message import EmailMessage
from typing import Optional

logger = logging.getLogger("copian.notifications")


def send_email_notification(
    to_email: str,
    subject: str,
    body: str,
    attachment: Optional[tuple[str, bytes]] = None,
) -> bool:
    """Dispatch an email via SMTP when configured; otherwise log safely without failing workflows."""
    if not to_email or "@" not in to_email:
        return False

    smtp_host = os.getenv("SMTP_HOST", "").strip()
    if not smtp_host:
        att_info = f" attachment={attachment[0]}" if attachment else ""
        logger.info("Notification simulated (SMTP_HOST unset) -> to=%s subject=%s%s", to_email, subject, att_info)
        return False

    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASS", "").strip()
    smtp_from = os.getenv("SMTP_FROM", "Copian B2B <noreply@copian.in>")

    try:
        msg = EmailMessage()
        msg["From"] = smtp_from
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.set_content(body)
        if attachment:
            fname, pdf_bytes = attachment
            msg.add_attachment(pdf_bytes, maintype="application", subtype="pdf", filename=fname)

        with smtplib.SMTP(smtp_host, smtp_port, timeout=5) as server:
            server.starttls()
            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        logger.info("Sent notification email to %s subject=%s", to_email, subject)
        return True
    except Exception:
        logger.exception("Non-blocking SMTP delivery failure for to=%s", to_email)
        return False


def notify_inquiry_received(inquiry: dict) -> None:
    """Notify buyer confirming submission of a Bulk Inquiry Cart request."""
    code = inquiry.get("inquiry_code", "")
    company = inquiry.get("company_name", "")
    to_email = inquiry.get("email", "")
    body = (
        f"Hello {inquiry.get('contact_name', 'Partner')},\n\n"
        f"Thank you for submitting bulk inquiry {code} for {company}.\n"
        f"Our B2B sales desk is reviewing your {inquiry.get('sku_count', 1)} SKU request.\n"
        f"You can track live updates anytime at /track-order using reference {code}.\n\n"
        "Regards,\nCopian International B2B Desk"
    )
    send_email_notification(to_email, f"Copian B2B Inquiry Confirmation — {code}", body)


def notify_quotation_sent(quotation: dict, pdf_attachment: Optional[tuple[str, bytes]] = None) -> None:
    """Notify buyer when a formal GST Proforma Quotation is issued (attaching PDF when provided)."""
    code = quotation.get("quote_code", "")
    to_email = quotation.get("customer_email", "")
    body = (
        f"Dear {quotation.get('customer_name', 'Customer')},\n\n"
        f"Your GST Proforma Quotation {code} (Grand Total: INR {quotation.get('grand_total', 0):,.2f}) "
        f"has been issued and is valid until {quotation.get('valid_until', '')}.\n"
        f"Track quotation status anytime at /track-order with reference {code}.\n\n"
        "Regards,\nCopian International B2B Desk"
    )
    send_email_notification(
        to_email,
        f"Copian B2B Proforma Quotation {code}",
        body,
        attachment=pdf_attachment,
    )
