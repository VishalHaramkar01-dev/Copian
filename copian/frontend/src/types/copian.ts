/**
 * Centralized TypeScript domain contracts matching FastAPI backend schemas.
 * Platform-agnostic (zero DOM/Next.js dependencies) for Web PWA and mobile reuse.
 */

export interface ProductVariant {
  label: string;
  code: string;
  yield_text: string;
  moq: number;
  dealer_price: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  category_id: number | null;
  category_name: string;
  brand: string;
  oem_code: string;
  short_desc: string;
  detailed_desc: string;
  page_yield: number;
  yield_text: string;
  weight_grams: string;
  chip_included: string;
  master_carton_qty: number;
  moq: number;
  moq_unit: string;
  dealer_price: number;
  gst_rate: number;
  hsn_code: string;
  compatible_printers_text: string;
  compatible_models: string[];
  variants: ProductVariant[];
  features: string[];
  image_url: string;
  gallery_images: string[];
  is_featured: boolean;
  is_new_arrival: boolean;
  status: string;
  stock_status: string;
  available_qty: number;
  reserved_qty: number;
  reorder_level: number;
  seo_title: string;
  meta_description: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  image_url: string;
  seo_guide: string;
  display_order: number;
}

export interface CartItem {
  id: number;
  session_id: string;
  sku: string;
  product_name: string;
  description_line: string;
  image_url: string;
  moq: number;
  moq_unit: string;
  quantity: number;
  note: string;
}

export interface QuoteItem {
  id?: number;
  sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Quotation {
  id: number;
  quote_code: string;
  customer_name: string;
  customer_phone: string;
  customer_gstin: string;
  valid_until: string;
  gst_rate: number;
  gst_label: string;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  gst_amount: number;
  grand_total: number;
  status: string;
  notes: string;
  items: QuoteItem[];
}

export interface OrderItem {
  id: number;
  sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface OrderTimelineEvent {
  id: number;
  event_title: string;
  is_highlighted: boolean;
  created_at: string;
}

export interface Order {
  id: number;
  order_code: string;
  invoice_code: string;
  customer_name: string;
  shipping_address: string;
  gstin: string;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  payment_status: string;
  fulfilment_status: string;
  courier_name?: string;
  tracking_number?: string;
  created_at: string;
  items: OrderItem[];
  timeline: OrderTimelineEvent[];
}

export interface TrackResult {
  type: "Order" | "Quotation" | "Bulk Inquiry";
  reference_code: string;
  invoice_code?: string;
  customer_name: string;
  status: string;
  payment_status?: string;
  courier_name?: string;
  tracking_number?: string;
  valid_until?: string;
  total_amount?: number;
  created_at: string;
  items: { sku: string; product_name: string; quantity: number }[];
  timeline: { event_title: string; is_highlighted: boolean; created_at: string }[];
}

export interface Distributor {
  id: number;
  name: string;
  city: string;
  state: string;
  territory: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  status: string;
  associated_dealers: number;
  ytd_orders_value: number;
}

export interface Article {
  id: number;
  slug: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  image_url: string;
  is_featured: boolean;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  display_order: number;
}

export interface HomepageSettings {
  hero_badge?: string;
  hero_headline?: string;
  hero_subheadline?: string;
  primary_cta_label?: string;
  secondary_cta_label?: string;
  sales_phone?: string;
  sales_email?: string;
}

export interface ContactSettings {
  company: string;
  established_year: number;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  whatsapp_number: string;
  address: string;
  office_hours: string;
}

export interface MetricItem {
  value: string;
  label: string;
  detail: string;
}

export interface TestimonialItem {
  quote: string;
  author: string;
  role_company: string;
}

export interface VolumeSlabItem {
  min_qty: number;
  max_qty: number | null;
  label: string;
  discount_pct: number;
}

export interface AboutSettings {
  title: string;
  intro: string;
  oem_brands: string[];
}

export interface CmsResponse {
  seo: Record<string, string | number>;
  homepage: HomepageSettings;
  contact?: ContactSettings;
  metrics?: MetricItem[];
  testimonials?: TestimonialItem[];
  volume_slabs?: VolumeSlabItem[];
  about?: AboutSettings;
  articles: Article[];
  faqs: Faq[];
  redirects: { id: number; source_path: string; target_path: string; status_code: number }[];
}

export interface DashboardData {
  kpis: {
    total_products: number;
    total_customers: number;
    inventory_value: number;
    low_stock_count: number;
    new_inquiries_count: number;
    awaiting_review_count: number;
    pending_quotations_count: number;
    pending_quotations_value: number;
    confirmed_orders_count: number;
    monthly_sales: number;
    warehouse_count: number;
  };
  trends: { month: string; revenue_lakhs: number; height_pct: number }[];
  category_shares: { category: string; pct: number }[];
  recent_inquiries: { id: number; inquiry_code: string; company_name: string; total_qty: number; status: string }[];
  low_stock_products: { sku: string; name: string; available_qty: number; reorder_level: number }[];
}
