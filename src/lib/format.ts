export function formatSAR(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  villa: "فيلا",
  apartment: "شقة",
  house: "بيت",
  floor: "دور",
  building: "عمارة",
  chalet: "شاليه",
  istiraha: "استراحة",
  office: "مكتب",
  shop: "محل تجاري",
  commercial_hall: "صالات تجارية",
  industrial: "صناعي",
  residential_land: "أرض سكنية",
  commercial_land: "أرض تجارية",
  industrial_land: "أرض صناعية",
  farm: "مزرعة",
};

export const PURPOSE_LABELS: Record<string, string> = {
  sale: "للبيع",
  rent: "للإيجار",
};

export const STATUS_LABELS: Record<string, string> = {
  available: "متاح",
  sold: "تم البيع",
  rented: "مؤجر",
  reserved: "محجوز",
};

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// Department phone numbers. COMPANY_WHATSAPP stays the default (sales) so
// existing WhatsApp CTAs keep working without a per-call-site change.
export const SALES_PHONE = "0550052129";
export const RENTALS_PHONE = "0542352129";

export const SALES_WHATSAPP = "966550052129";
export const RENTALS_WHATSAPP = "966542352129";

export const COMPANY_WHATSAPP = SALES_WHATSAPP;

export const DEPARTMENT_CONTACTS = [
  { label: "قسم البيع", phone: SALES_PHONE, whatsapp: SALES_WHATSAPP },
  { label: "قسم الإيجار", phone: RENTALS_PHONE, whatsapp: RENTALS_WHATSAPP },
] as const;

// Format a Saudi local number for display in an LTR-safe grouped form.
export function formatPhone(local: string): string {
  const d = local.replace(/\D/g, "");
  if (d.length !== 10) return local;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

// --- Google Maps link handling (item: خانة قوقل ماب) ---------------------
// Admins paste a link straight from the Maps app. We keep the original link
// (properties.map_url) and, when coordinates are recoverable, also store them
// in location_lat/location_lng so the public page can embed a map.
//
// Handles the common shapes:
//   .../@24.7136,46.6753,15z...        (desktop share)
//   ...?q=24.7136,46.6753              (query form)
//   ...!3d24.7136!4d46.6753            (place URLs)
//   plain "24.7136, 46.6753"           (pasted coordinates)
// Short links (maps.app.goo.gl / goo.gl/maps) carry no coordinates until
// resolved, so those return null and the link alone is stored.
export function parseMapCoords(input: string): { lat: number; lng: number } | null {
  if (!input) return null;
  const text = input.trim();

  // Order matters: place URLs carry both the map centre (@lat,lng) and the
  // exact pin (!3d/!4d). The pin is the property, so it is checked first.
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // !3dlat!4dlng (exact pin)
    /[?&](?:q|query|ll|center|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // q=lat,lng
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // @lat,lng (map centre)
    /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/, // bare "lat, lng"
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    // Reject out-of-range values (a mis-parsed zoom level, for instance).
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    return { lat, lng };
  }
  return null;
}

// Embeddable map URL. Uses the keyless `output=embed` endpoint so no API key
// is required; falls back to the pasted link's own coordinates.
export function buildMapEmbedUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}&hl=ar&z=15&output=embed`;
}

// "Open in Google Maps" / directions target for a real user click.
export function buildMapDirectionsUrl(
  lat: number | null | undefined,
  lng: number | null | undefined,
  fallbackUrl?: string | null,
): string | null {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return fallbackUrl ?? null;
}
