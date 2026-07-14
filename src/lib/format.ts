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

export const COMPANY_WHATSAPP = "966500000000";
