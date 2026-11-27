from datetime import datetime, date, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now() -> datetime:
    """Return current UTC timestamp (naive-aligned for SQLAlchemy DateTime columns without deprecation warnings)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text, default="")
    permissions = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

    users = relationship("AdminUser", back_populates="role")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    initials = Column(String(10), nullable=False, default="AD")
    email = Column(String(200), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    role = relationship("Role", back_populates="users")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String(150), nullable=False)
    action = Column(String(100), nullable=False)
    module = Column(String(100), nullable=False)
    entity_id = Column(String(100), default="")
    details = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, nullable=False, index=True)
    subtitle = Column(String(255), default="")
    description = Column(Text, default="")
    image_url = Column(String(500), default="/images/toner-cartridge.png")
    seo_guide = Column(Text, default="")
    display_order = Column(Integer, default=0)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    category_name = Column(String(150), nullable=False)
    brand = Column(String(100), nullable=False, index=True)
    oem_code = Column(String(100), default="")
    short_desc = Column(String(500), default="")
    detailed_desc = Column(Text, default="")
    page_yield = Column(Integer, default=1500)
    yield_text = Column(String(200), default="")
    weight_grams = Column(String(50), default="800g")
    chip_included = Column(String(200), default="Yes — Firmware-compatible smart chip")
    master_carton_qty = Column(Integer, default=20)
    moq = Column(Integer, default=10)
    moq_unit = Column(String(50), default="units")
    dealer_price = Column(Float, default=500.0)
    gst_rate = Column(Integer, default=18)
    hsn_code = Column(String(50), default="8443")
    compatible_printers_text = Column(Text, default="")
    compatible_models = Column(JSON, default=list)
    variants = Column(JSON, default=list)
    features = Column(JSON, default=list)
    image_url = Column(String(500), default="/images/toner-cartridge.png")
    gallery_images = Column(JSON, default=list)
    is_featured = Column(Boolean, default=True)
    is_new_arrival = Column(Boolean, default=False)
    status = Column(String(50), default="Published")
    stock_status = Column(String(50), default="In Stock")
    seo_title = Column(String(255), default="")
    meta_description = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    category = relationship("Category", back_populates="products")
    inventory_items = relationship("InventoryItem", back_populates="product", cascade="all, delete-orphan")


class PrinterModel(Base):
    __tablename__ = "printer_models"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(100), nullable=False, index=True)
    model_name = Column(String(200), nullable=False, index=True)
    series = Column(String(150), default="")


class ProductPrinterCompatibility(Base):
    __tablename__ = "product_printer_compatibility"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    printer_model_id = Column(Integer, ForeignKey("printer_models.id", ondelete="CASCADE"), nullable=False)


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    available_qty = Column(Integer, default=0, nullable=False)
    reserved_qty = Column(Integer, default=0, nullable=False)
    reorder_level = Column(Integer, default=50, nullable=False)
    suggested_reorder_qty = Column(Integer, default=200, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    product = relationship("Product", back_populates="inventory_items")
    warehouse = relationship("Warehouse")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    txn_code = Column(String(50), unique=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    txn_type = Column(String(50), nullable=False)  # Inward, Outward, Adjustment
    prev_qty = Column(Integer, nullable=False)
    delta_qty = Column(Integer, nullable=False)
    new_qty = Column(Integer, nullable=False)
    reference_code = Column(String(100), default="")
    reason = Column(Text, default="")
    performed_by = Column(String(150), default="A. Mehta")
    created_at = Column(DateTime, default=utc_now)

    product = relationship("Product")
    warehouse = relationship("Warehouse")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False)
    contact_name = Column(String(150), nullable=False)
    phone = Column(String(50), default="")
    email = Column(String(200), default="")
    gstin = Column(String(50), default="")
    city = Column(String(120), default="")
    state = Column(String(120), default="")
    pincode = Column(String(20), default="")
    classification = Column(String(80), default="Corporate Buyer")
    credit_limit = Column(Float, default=250000.0)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)


class Distributor(Base):
    __tablename__ = "distributors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    city = Column(String(120), nullable=False)
    state = Column(String(120), nullable=False)
    territory = Column(String(120), default="West India")
    address = Column(Text, default="")
    phone = Column(String(50), default="")
    email = Column(String(200), default="")
    gstin = Column(String(50), default="")
    status = Column(String(50), default="Active")
    associated_dealers = Column(Integer, default=15)
    ytd_orders_value = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)


class BulkInquiry(Base):
    __tablename__ = "bulk_inquiries"

    id = Column(Integer, primary_key=True, index=True)
    inquiry_code = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    company_name = Column(String(255), nullable=False)
    contact_name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(200), nullable=False)
    gstin = Column(String(50), default="")
    delivery_city = Column(String(150), nullable=False)
    notes = Column(Text, default="")
    status = Column(String(50), default="New")
    assigned_salesperson = Column(String(150), default="Rohan Deshmukh")
    internal_note = Column(Text, default="")
    source = Column(String(80), default="Website Cart")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    items = relationship("BulkInquiryItem", back_populates="inquiry", cascade="all, delete-orphan")


class BulkInquiryItem(Base):
    __tablename__ = "bulk_inquiry_items"

    id = Column(Integer, primary_key=True, index=True)
    inquiry_id = Column(Integer, ForeignKey("bulk_inquiries.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    sku = Column(String(100), nullable=False)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False, default=10)
    unit_note = Column(Text, default="")

    inquiry = relationship("BulkInquiry", back_populates="items")


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    quote_code = Column(String(50), unique=True, nullable=False, index=True)
    inquiry_id = Column(Integer, ForeignKey("bulk_inquiries.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(200), default="")
    customer_phone = Column(String(50), default="")
    customer_gstin = Column(String(50), default="")
    valid_until = Column(Date, default=date(2026, 12, 31))
    gst_rate = Column(Integer, default=18)
    gst_label = Column(String(80), default="18% IGST / CGST+SGST")
    subtotal = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    shipping_amount = Column(Float, default=0.0)
    gst_amount = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    status = Column(String(50), default="Draft")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")


class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    sku = Column(String(100), nullable=False)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False, default=10)
    unit_price = Column(Float, nullable=False, default=0.0)
    line_total = Column(Float, nullable=False, default=0.0)

    quotation = relationship("Quotation", back_populates="items")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, nullable=False, index=True)
    invoice_code = Column(String(50), unique=True, nullable=False)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=True)
    inquiry_id = Column(Integer, ForeignKey("bulk_inquiries.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(255), nullable=False)
    shipping_address = Column(Text, default="")
    gstin = Column(String(50), default="")
    subtotal = Column(Float, default=0.0)
    gst_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    payment_status = Column(String(50), default="Pending")  # Paid, Credit 30d, Pending
    fulfilment_status = Column(String(50), default="Ready to Dispatch")
    courier_name = Column(String(120), default="")
    tracking_number = Column(String(120), default="")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    timeline = relationship("OrderTimeline", back_populates="order", cascade="all, delete-orphan", order_by="OrderTimeline.id")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    sku = Column(String(100), nullable=False)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False, default=0.0)
    line_total = Column(Float, nullable=False, default=0.0)

    order = relationship("Order", back_populates="items")


class OrderTimeline(Base):
    __tablename__ = "order_timeline"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    event_title = Column(String(255), nullable=False)
    is_highlighted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    order = relationship("Order", back_populates="timeline")


class CmsSetting(Base):
    __tablename__ = "cms_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(120), unique=True, nullable=False, index=True)
    value = Column(JSON, default=dict)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text, default="")
    content = Column(Text, default="")
    image_url = Column(String(500), default="/images/copian-blog-banner.png")
    is_featured = Column(Boolean, default=False)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)


class Faq(Base):
    __tablename__ = "faqs"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String(500), nullable=False)
    answer = Column(Text, nullable=False)
    display_order = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)


class SeoRedirect(Base):
    __tablename__ = "seo_redirects"

    id = Column(Integer, primary_key=True, index=True)
    source_path = Column(String(255), nullable=False)
    target_path = Column(String(255), nullable=False)
    status_code = Column(Integer, default=301)
    is_active = Column(Boolean, default=True)


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    company_name = Column(String(255), nullable=False)
    email = Column(String(200), nullable=False)
    phone = Column(String(50), nullable=False)
    inquiry_type = Column(String(150), default="Bulk Purchase Quotation")
    message = Column(Text, nullable=False)
    status = Column(String(50), default="New")
    created_at = Column(DateTime, default=utc_now)


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(120), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    sku = Column(String(100), nullable=False)
    product_name = Column(String(255), nullable=False)
    description_line = Column(String(255), default="")
    image_url = Column(String(500), default="/images/toner-cartridge.png")
    moq = Column(Integer, default=10)
    moq_unit = Column(String(50), default="units")
    quantity = Column(Integer, default=10)
    note = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)
