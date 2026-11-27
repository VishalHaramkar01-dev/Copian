import re
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")


def validate_optional_gstin(value: Optional[str]) -> Optional[str]:
    """Allow blank GSTIN or enforce 15-character Indian GSTIN format."""
    if value is None:
        return None
    cleaned = value.strip().upper()
    if not cleaned:
        return ""
    if not GSTIN_REGEX.match(cleaned):
        raise ValueError("Invalid GSTIN format (expected 15-character format like 27AABCU9603R1ZM)")
    return cleaned


class LoginRequest(BaseModel):
    email: str
    password: str


class RoleUpdate(BaseModel):
    permissions: Dict[str, Dict[str, bool]]


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    subtitle: str
    description: str
    image_url: str
    seo_guide: str
    display_order: int

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    sku: str
    name: str
    slug: Optional[str] = None
    category_name: str = "Toner Cartridges"
    brand: str = "HP"
    oem_code: str = ""
    short_desc: str = ""
    detailed_desc: str = ""
    page_yield: int = 1500
    yield_text: str = ""
    weight_grams: str = "840g"
    chip_included: str = "Yes — Firmware-compatible smart chip"
    master_carton_qty: int = 20
    moq: int = 10
    moq_unit: str = "units"
    dealer_price: float = 500.0
    gst_rate: int = 18
    hsn_code: str = "8443"
    compatible_printers_text: str = ""
    compatible_models: List[str] = Field(default_factory=list)
    variants: List[Dict[str, Any]] = Field(default_factory=list)
    features: List[str] = Field(default_factory=list)
    image_url: str = "/images/toner-cartridge.png"
    gallery_images: List[str] = Field(default_factory=list)
    is_featured: bool = True
    is_new_arrival: bool = False
    status: str = "Published"
    initial_stock: int = 100
    warehouse_name: str = "Mumbai Central"
    seo_title: str = ""
    meta_description: str = ""


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    category_name: Optional[str] = None
    brand: Optional[str] = None
    oem_code: Optional[str] = None
    short_desc: Optional[str] = None
    detailed_desc: Optional[str] = None
    page_yield: Optional[int] = None
    yield_text: Optional[str] = None
    weight_grams: Optional[str] = None
    chip_included: Optional[str] = None
    master_carton_qty: Optional[int] = None
    moq: Optional[int] = None
    moq_unit: Optional[str] = None
    dealer_price: Optional[float] = None
    gst_rate: Optional[int] = None
    hsn_code: Optional[str] = None
    compatible_printers_text: Optional[str] = None
    compatible_models: Optional[List[str]] = None
    variants: Optional[List[Dict[str, Any]]] = None
    features: Optional[List[str]] = None
    image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    status: Optional[str] = None
    seo_title: Optional[str] = None
    meta_description: Optional[str] = None


class BulkProductAction(BaseModel):
    ids: List[int]
    action: str  # publish, draft, delete


class InventoryActionRequest(BaseModel):
    sku: str
    warehouse_name: str = "Mumbai Central"
    quantity: int
    reference_code: str = ""
    reason: str = ""
    adjustment_type: Optional[str] = None  # Damaged (-), Lost (-), Audit (+)
    performed_by: str = "Arjun Mehta"


class CartItemAdd(BaseModel):
    session_id: str
    sku: str
    product_name: str
    description_line: str = ""
    image_url: str = "/images/toner-cartridge.png"
    moq: int = 10
    moq_unit: str = "units"
    quantity: int = 10
    note: str = ""


class CartItemUpdate(BaseModel):
    quantity: Optional[int] = None
    note: Optional[str] = None


class InquiryItemIn(BaseModel):
    sku: str
    product_name: str
    quantity: int = 10
    unit_note: str = ""


class InquiryCreate(BaseModel):
    company_name: str
    contact_name: str
    phone: str
    email: str
    gstin: str = ""
    delivery_city: str
    notes: str = ""
    session_id: Optional[str] = None
    items: List[InquiryItemIn] = Field(default_factory=list)

    @field_validator("gstin")
    @classmethod
    def check_gstin(cls, v: str) -> str:
        return validate_optional_gstin(v) or ""


class InquiryUpdate(BaseModel):
    status: Optional[str] = None
    assigned_salesperson: Optional[str] = None
    internal_note: Optional[str] = None


class QuotationItemIn(BaseModel):
    sku: str
    product_name: str
    quantity: int
    unit_price: float


class QuotationCreate(BaseModel):
    inquiry_id: Optional[int] = None
    customer_id: Optional[int] = None
    customer_name: str
    customer_email: str = ""
    customer_phone: str = ""
    customer_gstin: str = ""
    valid_until: Optional[date] = None
    gst_rate: int = 18
    gst_label: str = "18% IGST / CGST+SGST"
    discount_amount: float = 0.0
    shipping_amount: float = 800.0
    status: str = "Draft"
    notes: str = ""
    items: List[QuotationItemIn] = Field(default_factory=list)

    @field_validator("customer_gstin")
    @classmethod
    def check_customer_gstin(cls, v: str) -> str:
        return validate_optional_gstin(v) or ""


class QuotationUpdate(BaseModel):
    customer_name: Optional[str] = None
    valid_until: Optional[date] = None
    gst_rate: Optional[int] = None
    gst_label: Optional[str] = None
    discount_amount: Optional[float] = None
    shipping_amount: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[QuotationItemIn]] = None


class OrderCreate(BaseModel):
    quotation_id: Optional[int] = None
    inquiry_id: Optional[int] = None
    customer_name: str
    shipping_address: str = ""
    gstin: str = ""
    payment_status: str = "Pending"
    fulfilment_status: str = "Ready to Dispatch"
    items: List[QuotationItemIn] = Field(default_factory=list)


class OrderUpdate(BaseModel):
    payment_status: Optional[str] = None
    fulfilment_status: Optional[str] = None
    shipping_address: Optional[str] = None
    courier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    timeline_event: Optional[str] = None


class TrackLookupRequest(BaseModel):
    reference_code: str = Field(..., min_length=3, max_length=60)
    contact: str = Field(..., min_length=4, max_length=200)


class BuyerLoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)
    verification: str = Field(..., min_length=4, max_length=200)


class CustomerCreate(BaseModel):
    company_name: str
    contact_name: str
    phone: str = ""
    email: str = ""
    gstin: str = ""
    city: str = ""
    state: str = ""
    pincode: str = ""
    classification: str = "Corporate Buyer"
    credit_limit: float = 250000.0
    notes: str = ""

    @field_validator("gstin")
    @classmethod
    def check_gstin(cls, v: str) -> str:
        return validate_optional_gstin(v) or ""


class CustomerUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    classification: Optional[str] = None
    credit_limit: Optional[float] = None
    notes: Optional[str] = None

    @field_validator("gstin")
    @classmethod
    def check_gstin(cls, v: Optional[str]) -> Optional[str]:
        return validate_optional_gstin(v)


class DistributorCreate(BaseModel):
    name: str
    city: str
    state: str
    territory: str = "West India"
    address: str = ""
    phone: str = ""
    email: str = ""
    gstin: str = ""
    status: str = "Active"
    associated_dealers: int = 10
    ytd_orders_value: float = 0.0


class DistributorUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    territory: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    status: Optional[str] = None
    associated_dealers: Optional[int] = None
    ytd_orders_value: Optional[float] = None


class CmsSettingsUpdate(BaseModel):
    seo: Optional[Dict[str, Any]] = None
    homepage: Optional[Dict[str, Any]] = None
    contact: Optional[Dict[str, Any]] = None
    metrics: Optional[List[Dict[str, Any]]] = None
    testimonials: Optional[List[Dict[str, Any]]] = None
    volume_slabs: Optional[List[Dict[str, Any]]] = None
    about: Optional[Dict[str, Any]] = None


class CategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    subtitle: str = ""
    description: str = ""
    image_url: str = "/images/toner-cartridge.png"
    seo_guide: str = ""
    display_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    seo_guide: Optional[str] = None
    display_order: Optional[int] = None


class WarehouseCreate(BaseModel):
    name: str
    code: str
    city: str


class PrinterModelCreate(BaseModel):
    brand: str
    model_name: str
    series: str = ""


class AdminUserCreate(BaseModel):
    name: str
    email: str
    password: str
    role_id: int


class AdminUserUpdate(BaseModel):
    role_id: Optional[int] = None
    is_active: Optional[bool] = None


class ContactMessageUpdate(BaseModel):
    status: str


class ArticleCreate(BaseModel):
    slug: Optional[str] = None
    category: str = "Procurement Guide"
    title: str
    summary: str = ""
    content: str = ""
    image_url: str = "/images/copian-blog-banner.png"
    is_featured: bool = False
    is_published: bool = True


class FaqCreate(BaseModel):
    question: str
    answer: str
    display_order: int = 0
    is_published: bool = True


class RedirectCreate(BaseModel):
    source_path: str
    target_path: str
    status_code: int = 301


class ContactMessageCreate(BaseModel):
    full_name: str
    company_name: str
    email: str
    phone: str
    inquiry_type: str = "Bulk Purchase Quotation"
    message: str
