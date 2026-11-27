/**
 * Verified Copian International company metrics, OEM support list, and HQ details
 * sourced from https://copian.in/ and https://copian.in/about-us/.
 */

export const COPIAN_METRICS = [
  { value: "27+ Yrs", label: "Industry Excellence", detail: "Established in 1997 in Thane" },
  { value: "5k+", label: "Businesses Served", detail: "Commercial & dealer print partners" },
  { value: "98%", label: "Customer Retention Rate", detail: "Multi-year recurring B2B accounts" },
  { value: "45+", label: "Awards & Recognitions", detail: "Indian imaging channel distinctions" },
] as const;

export const COPIAN_SUPPORTED_BRANDS = [
  "HP",
  "Canon",
  "Brother",
  "Samsung",
  "Ricoh",
  "Kyocera",
  "Konica",
  "Sharp",
  "Toshiba",
  "Pantum",
] as const;

export const COPIAN_CONTACT = {
  company: "Copian International",
  establishedYear: 1997,
  email: "Copiantoner@gmail.com",
  phonePrimary: "+91 93225 93719",
  phoneSecondary: "+91 83568 85132",
  whatsappUrl: "https://wa.me/919322593719",
  address: "Khopat Road, D-254 Amargian Industrial Estate, Thane, Maharashtra 400601, India",
} as const;
