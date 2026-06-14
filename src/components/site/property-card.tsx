import { Link } from "@tanstack/react-router";
import { MapPin, BedDouble, Bath, Maximize2 } from "lucide-react";
import { PROPERTY_TYPE_LABELS, PURPOSE_LABELS } from "@/lib/format";
import { SarAmount } from "@/components/ui/sar-icon";

const PROPERTY_FALLBACKS = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=75",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=75",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=75",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=75",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=75",
  "https://images.unsplash.com/photo-1570129477492-45c003dc5b69?w=800&q=75",
];

function getFallback(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PROPERTY_FALLBACKS[hash % PROPERTY_FALLBACKS.length];
}

type Img = { image_url: string; is_primary: boolean | null; sort_order: number | null };

export type PropertyCardData = {
  id: string;
  title: string;
  city: string;
  district: string | null;
  type: string;
  purpose: string;
  price: number;
  area_sqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  is_featured: boolean | null;
  sold_percentage?: number | null;
  property_images?: Img[] | null;
};

export function PropertyCard({ p }: { p: PropertyCardData }) {
  const imgs = (p.property_images ?? [])
    .slice()
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const cover = imgs[0]?.image_url;
  const meta = [
    p.area_sqm ? { icon: Maximize2, label: `${p.area_sqm} م²` } : null,
    p.bedrooms != null ? { icon: BedDouble, label: `${p.bedrooms} غرف` } : null,
    p.bathrooms != null ? { icon: Bath, label: `${p.bathrooms} دورات` } : null,
  ].filter(Boolean) as { icon: typeof MapPin; label: string }[];

  return (
    <Link
      to="/properties/$id"
      params={{ id: p.id }}
      className="group block overflow-hidden rounded-xl border border-border bg-surface transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_20px_55px_-34px_rgba(39,24,22,0.38)]"
    >
      <div className="relative aspect-[4/3.2] overflow-hidden bg-neutral-100">
        <img
          src={cover ?? getFallback(p.id)}
          alt={p.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
        />
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
          {p.is_featured ? (
            <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-primary-foreground">
              مميز
            </span>
          ) : (
            <span />
          )}
          <span className="rounded-full bg-surface/95 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground shadow-sm backdrop-blur">
            {PURPOSE_LABELS[p.purpose]}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5 md:p-6">
        <div className="space-y-2">
          <h3 className="line-clamp-1 text-[19px] font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
            {p.title}
          </h3>
          <p className="flex items-center gap-1.5 text-[13px] leading-6 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-accent-dark" />
            <span className="line-clamp-1">
              {p.city}
              {p.district ? ` · ${p.district}` : ""} · {PROPERTY_TYPE_LABELS[p.type]}
            </span>
          </p>
        </div>

        <div className="flex min-h-6 flex-wrap items-center gap-x-4 gap-y-2 border-y border-border/70 py-3 text-[11px] font-normal uppercase tracking-[0.08em] text-foreground/62">
          {meta.map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-muted-foreground/80" />
              {label}
            </span>
          ))}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-normal uppercase tracking-[0.14em] text-muted-foreground">
              السعر
            </p>
            <p className="tabular text-2xl font-medium leading-none text-primary">
              <SarAmount value={p.price} />
            </p>
          </div>
          <span className="text-[12px] font-medium text-accent-dark transition group-hover:text-primary">
            عرض التفاصيل
          </span>
        </div>
      </div>
    </Link>
  );
}
