// Single source of truth for type-specific property fields.
//
// Type-varying values are stored in the `properties.attributes` JSONB column.
// The admin form, the public detail page, and the public card all render from
// the maps below so the three surfaces stay in sync. To add a field: add it to
// ATTRIBUTE_FIELDS, then list its key under the relevant types in TYPE_FIELDS.
// No DB migration is needed (values live in JSONB).

export type AttributeKind = "number" | "select";

export type AttributeField = {
  label: string; // Arabic label shown in form + public
  kind: AttributeKind;
  options?: string[]; // for kind === "select" (values are the Arabic labels themselves)
  unit?: string; // appended after the value on the public side, e.g. "م²", "م"
  integer?: boolean; // number inputs that should be whole numbers
};

// Every possible attribute field. Keys are stored verbatim in `attributes`.
export const ATTRIBUTE_FIELDS: Record<string, AttributeField> = {
  land_category: {
    label: "نوع العقار",
    kind: "select",
    options: ["سكني", "تجاري", "صناعي", "زراعي"],
  },
  facing: {
    label: "الواجهة",
    kind: "select",
    options: ["شمال", "جنوب", "شرق", "غرب", "شمال شرقي", "شمال غربي", "جنوب شرقي", "جنوب غربي"],
  },
  street_width: { label: "عرض الشارع", kind: "number", unit: "م", integer: true },
  bedrooms: { label: "غرف النوم", kind: "number", integer: true },
  bathrooms: { label: "دورات المياه", kind: "number", integer: true },
  halls: { label: "الصالات", kind: "number", integer: true },
  floor_level: {
    label: "الدور",
    kind: "select",
    options: ["بدروم", "أرضي", "أول", "ثاني", "ثالث", "علوي", "دور كامل"],
  },
  property_age: {
    label: "عمر العقار",
    kind: "select",
    options: ["جديد", "سنة", "سنتين", "3-5 سنوات", "5-10 سنوات", "أكثر من 10 سنوات"],
  },
  ac_system: {
    label: "نظام التكييف",
    kind: "select",
    options: ["سبليت", "مركزي", "شباك", "بدون"],
  },
  family_category: {
    label: "الفئة",
    kind: "select",
    options: ["عوائل", "عزّاب", "الكل"],
  },
  master_rooms: { label: "غرف نوم ماستر", kind: "number", integer: true },
  reception_rooms: { label: "غرف استقبال / مجلس", kind: "number", integer: true },
  other_rooms: { label: "عدد الغرف الأخرى", kind: "number", integer: true },
  internal_area: { label: "المساحة الداخلية", kind: "number", unit: "م²" },
  external_area: { label: "المساحة الخارجية", kind: "number", unit: "م²" },
  price_per_meter: { label: "سعر المتر", kind: "number", unit: "ريال" },
};

// Which attribute fields each property type shows, in display order.
// (area_sqm + price are always shown separately as core columns.)
export const TYPE_FIELDS: Record<string, string[]> = {
  villa: [
    "bedrooms",
    "bathrooms",
    "halls",
    "facing",
    "street_width",
    "property_age",
    "master_rooms",
    "reception_rooms",
  ],
  house: [
    "bedrooms",
    "bathrooms",
    "halls",
    "facing",
    "street_width",
    "property_age",
    "master_rooms",
    "reception_rooms",
  ],
  apartment: [
    "bedrooms",
    "bathrooms",
    "halls",
    "floor_level",
    "family_category",
    "ac_system",
    "property_age",
    "master_rooms",
    "reception_rooms",
    "other_rooms",
    "internal_area",
    "external_area",
  ],
  floor: ["bedrooms", "bathrooms", "halls", "floor_level", "property_age", "ac_system"],
  building: ["bedrooms", "bathrooms", "floor_level", "street_width", "facing", "property_age"],
  chalet: ["bedrooms", "bathrooms", "halls", "facing", "property_age"],
  istiraha: ["bedrooms", "bathrooms", "halls", "facing", "property_age", "external_area"],
  office: ["bathrooms", "floor_level", "street_width", "facing"],
  shop: ["bathrooms", "floor_level", "street_width", "facing"],
  industrial: ["street_width", "facing"],
  residential_land: ["land_category", "facing", "street_width", "price_per_meter"],
  commercial_land: ["land_category", "facing", "street_width", "price_per_meter"],
  industrial_land: ["land_category", "facing", "street_width", "price_per_meter"],
  farm: ["land_category", "facing", "street_width", "external_area"],
};

// Compact subset shown on the listing/home card (max ~3 chips beyond area).
export const CARD_FIELDS: Record<string, string[]> = {
  villa: ["bedrooms", "bathrooms"],
  house: ["bedrooms", "bathrooms"],
  apartment: ["bedrooms", "bathrooms"],
  floor: ["bedrooms", "bathrooms"],
  building: ["bedrooms", "bathrooms"],
  chalet: ["bedrooms", "bathrooms"],
  istiraha: ["bedrooms", "bathrooms"],
  office: ["bathrooms", "street_width"],
  shop: ["bathrooms", "street_width"],
  industrial: ["street_width"],
  residential_land: ["street_width"],
  commercial_land: ["street_width"],
  industrial_land: ["street_width"],
  farm: ["street_width"],
};

export type PropertyAttributes = Record<string, string | number | null | undefined>;

// Format an attribute value for public display (unit + number formatting).
export function formatAttributeValue(
  key: string,
  raw: string | number | null | undefined,
): string | null {
  const field = ATTRIBUTE_FIELDS[key];
  if (field == null || raw == null || raw === "") return null;
  if (field.kind === "number") {
    const n = typeof raw === "number" ? raw : Number(raw);
    if (Number.isNaN(n)) return null;
    const num = new Intl.NumberFormat("en-US").format(n);
    return field.unit ? `${num} ${field.unit}` : num;
  }
  return String(raw); // select values are already Arabic labels
}
