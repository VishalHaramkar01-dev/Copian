/**
 * Pure platform-agnostic pricing, slab discount, and currency helpers.
 * Safe to share directly across Next.js Web/PWA and React Native / Android builds.
 */

export interface VolumeSlab {
  minQty: number;
  maxQty: number | null;
  label: string;
  discountPct: number;
}

export const VOLUME_SLABS: VolumeSlab[] = [
  { minQty: 1, maxQty: 49, label: "Standard Dealer Rate", discountPct: 0 },
  { minQty: 50, maxQty: 199, label: "8% Volume Discount", discountPct: 8 },
  { minQty: 200, maxQty: null, label: "15% Contract Rate", discountPct: 15 },
];

export function getVolumeDiscountPct(quantity: number): number {
  if (quantity >= 200) return 15;
  if (quantity >= 50) return 8;
  return 0;
}

export function computeBulkUnitPrice(baseDealerPrice: number, quantity: number): number {
  const discountPct = getVolumeDiscountPct(quantity);
  return Math.round(baseDealerPrice * (1 - discountPct / 100) * 100) / 100;
}

const INTRA_STATE_KEYWORDS = ["maharashtra", "mumbai", "thane", "pune", "nagpur", "nashik", "aurangabad", "navi mumbai"];

export function isIntraStateSupply(buyerGstin?: string, buyerAddress?: string): boolean {
  const gst = (buyerGstin || "").trim().toUpperCase();
  if (gst.startsWith("27")) return true;
  if (/^\d{2}/.test(gst) && !gst.startsWith("27")) return false;
  const addr = (buyerAddress || "").toLowerCase();
  return INTRA_STATE_KEYWORDS.some((k) => addr.includes(k));
}

export function computeGstBreakdown(params: {
  subtotal: number;
  discountAmount?: number;
  shippingAmount?: number;
  gstRate?: number;
  buyerGstin?: string;
  buyerAddress?: string;
}) {
  const discount = params.discountAmount ?? 0;
  const shipping = params.shippingAmount ?? 0;
  const gstRate = params.gstRate ?? 18;
  const taxable = Math.max(0, params.subtotal - discount + shipping);
  const gstAmount = Math.round(taxable * (gstRate / 100) * 100) / 100;
  const intra = isIntraStateSupply(params.buyerGstin, params.buyerAddress);
  const halfGst = Math.round((gstAmount / 2) * 100) / 100;
  const cgstAmount = intra ? halfGst : 0;
  const sgstAmount = intra ? Math.round((gstAmount - halfGst) * 100) / 100 : 0;
  const igstAmount = intra ? 0 : gstAmount;
  const taxMode: "CGST+SGST" | "IGST" = intra ? "CGST+SGST" : "IGST";
  const grandTotal = Math.round((taxable + gstAmount) * 100) / 100;
  return {
    taxable,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    taxMode,
    grandTotal,
  };
}

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function isValidOptionalGstin(value: string): boolean {
  const cleaned = value.trim().toUpperCase();
  return cleaned === "" || GSTIN_REGEX.test(cleaned);
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace(/\.00$/, "");
}

export function formatINRLakhs(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return formatINR(amount);
}
