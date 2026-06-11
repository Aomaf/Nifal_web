import { Link } from "@tanstack/react-router";
import { MapPin, BedDouble, Bath, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatSAR, PROPERTY_TYPE_LABELS, PURPOSE_LABELS } from "@/lib/format";

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
  property_images?: Img[] | null;
};

const FALLBACK = "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200";

export function PropertyCard({ p }: { p: PropertyCardData }) {
  const imgs = (p.property_images ?? []).slice().sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const cover = imgs[0]?.image_url ?? FALLBACK;
  return (
    <Link to="/properties/$id" params={{ id: p.id }} className="card-elegant overflow-hidden block group">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={cover}
          alt={p.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          {p.is_featured && <Badge className="bg-accent text-accent-foreground">مميز</Badge>}
          <Badge variant="secondary" className="bg-surface/95 text-foreground">{PURPOSE_LABELS[p.purpose]}</Badge>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">{p.title}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {p.city}{p.district ? ` · ${p.district}` : ""} · {PROPERTY_TYPE_LABELS[p.type]}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
          {p.area_sqm && <span className="flex items-center gap-1"><Maximize2 className="h-3 w-3" />{p.area_sqm} م²</span>}
          {p.bedrooms != null && <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{p.bedrooms}</span>}
          {p.bathrooms != null && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{p.bathrooms}</span>}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-bold text-primary tabular">{formatSAR(p.price)}</span>
          <span className="text-xs text-accent-dark font-medium">عرض التفاصيل ←</span>
        </div>
      </div>
    </Link>
  );
}
