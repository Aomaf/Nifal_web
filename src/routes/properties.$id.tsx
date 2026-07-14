import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { getPublicProperty } from "@/lib/properties.functions";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Calendar,
  MessageCircle,
  Phone,
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  Share2,
  CheckCircle2,
} from "lucide-react";
import {
  buildWhatsAppUrl,
  COMPANY_WHATSAPP,
  PROPERTY_TYPE_LABELS,
  PURPOSE_LABELS,
  STATUS_LABELS,
  formatNumber,
} from "@/lib/format";
import { ATTRIBUTE_FIELDS, TYPE_FIELDS, formatAttributeValue } from "@/lib/property-fields";
import { SarAmount, SarIcon } from "@/components/ui/sar-icon";

const DETAIL_FALLBACKS = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1400&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1400&q=80",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1400&q=80",
];

const propQO = (id: string) =>
  queryOptions({
    queryKey: ["property", id],
    queryFn: () => getPublicProperty({ data: { id } }),
  });

export const Route = createFileRoute("/properties/$id")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(propQO(params.id));
    if (!p) throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `تفاصيل العقار | نِفال العقارية` }],
  }),
  component: PropertyDetail,
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center pt-16 text-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">العقار غير موجود</h2>
          <p className="text-muted-foreground">ربما تم حذف هذا العقار أو لم يُنشر بعد.</p>
          <Link
            to="/properties"
            className="inline-flex h-10 items-center gap-2 rounded bg-primary px-6 text-[13px] font-medium text-primary-foreground hover:bg-primary/88"
          >
            عرض جميع العقارات
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center text-center">
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(propQO(id));
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!data) return null;

  const images = (data.property_images ?? [])
    .slice()
    .sort(
      (a: { sort_order: number | null }, b: { sort_order: number | null }) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )
    .map((img: { id: string; image_url: string }) => img.image_url);

  // Fill with fallbacks if no images
  let idHash = 0;
  for (let i = 0; i < data.id.length; i++) idHash = (idHash * 31 + data.id.charCodeAt(i)) >>> 0;
  const displayImages =
    images.length > 0 ? images : [DETAIL_FALLBACKS[idHash % DETAIL_FALLBACKS.length]];

  const waMessage = `السلام عليكم، أنا مهتم بهذا العقار:\n${data.title}${data.city ? ` - ${data.city}` : ""}${data.rega_ad_code ? `\nرقم الإعلان: ${data.rega_ad_code}` : ""}\n\nأرجو التواصل معي.`;
  const waUrl = buildWhatsAppUrl(COMPANY_WHATSAPP, waMessage);

  function openLightbox(i: number) {
    setLightboxIndex(i);
    setLightboxOpen(true);
  }

  const purposeLabel = PURPOSE_LABELS[data.purpose] ?? data.purpose;
  const typeLabel = PROPERTY_TYPE_LABELS[data.type] ?? data.type;
  const statusLabel = STATUS_LABELS[data.status] ?? data.status;

  const isSale = data.purpose === "sale";
  const isAvailable = data.status === "available";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero gallery */}
      <section className="relative bg-neutral-900 pt-16">
        <div className="relative aspect-[16/9] max-h-[580px] overflow-hidden md:aspect-[21/9]">
          {displayImages.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={i === 0 ? data.title : ""}
              className={[
                "absolute inset-0 h-full w-full cursor-pointer object-cover transition-opacity duration-500",
                i === activeIndex ? "opacity-100" : "opacity-0",
              ].join(" ")}
              onClick={() => openLightbox(i)}
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.35))]" />

          {/* Gallery nav arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActiveIndex((i) => (i - 1 + displayImages.length) % displayImages.length)
                }
                className="absolute end-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
                aria-label="الصورة السابقة"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => setActiveIndex((i) => (i + 1) % displayImages.length)}
                className="absolute start-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
                aria-label="الصورة التالية"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Counter badge */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 end-4 rounded-full bg-black/50 px-3 py-1 text-[12px] text-white backdrop-blur">
              {activeIndex + 1} / {displayImages.length}
            </div>
          )}

          {/* Purpose + status badges */}
          <div className="absolute start-4 top-4 flex gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-[12px] font-medium text-primary-foreground">
              {purposeLabel}
            </span>
            <span
              className={[
                "rounded-full px-3 py-1 text-[12px] font-medium",
                isAvailable ? "bg-green-600/90 text-white" : "bg-black/50 text-white backdrop-blur",
              ].join(" ")}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Thumbnail strip */}
        {displayImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto bg-neutral-950 px-4 py-2 scrollbar-none">
            {displayImages.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={[
                  "h-14 w-20 shrink-0 overflow-hidden rounded border-2 transition",
                  i === activeIndex
                    ? "border-primary"
                    : "border-transparent opacity-60 hover:opacity-90",
                ].join(" ")}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Breadcrumb */}
      <div className="border-b border-border/60 bg-surface">
        <div className="container mx-auto max-w-7xl px-6 py-3 md:px-8">
          <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              الرئيسية
            </Link>
            <ChevronLeft className="h-3 w-3" />
            <Link to="/properties" className="hover:text-foreground">
              العقارات
            </Link>
            <ChevronLeft className="h-3 w-3" />
            <span className="text-foreground line-clamp-1">{data.title}</span>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto max-w-7xl px-6 py-10 md:px-8 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
          {/* Left: Details */}
          <div className="space-y-8">
            {/* Title + location */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  {typeLabel}
                </span>
                {data.rega_ad_code && (
                  <span className="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    رقم REGA: {data.rega_ad_code}
                  </span>
                )}
                <span className="ms-auto flex items-center gap-1 text-[12px] text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  {formatNumber(data.views_count ?? 0)} مشاهدة
                </span>
              </div>
              <h1 className="text-[1.75rem] font-semibold leading-[1.2] text-foreground md:text-[2.25rem]">
                {data.title}
              </h1>
              {(data.city || data.district) && (
                <p className="flex items-center gap-1.5 text-[14px] text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  {[data.city, data.district].filter(Boolean).join("، ")}
                </p>
              )}
            </div>

            {/* Price (mobile only — shown above specs) */}
            <div className="rounded-lg border border-border bg-surface p-5 lg:hidden">
              <p className="text-[12px] text-muted-foreground">السعر</p>
              <p className="mt-1 text-[2rem] font-bold text-primary tabular">
                <SarAmount value={data.price} />
              </p>
              {!isSale && <p className="mt-0.5 text-[11px] text-muted-foreground">سنوياً</p>}
              <div className="mt-4 grid gap-2.5">
                <a href={waUrl} target="_blank" rel="noopener">
                  <Button className="h-11 w-full gap-2 bg-[#25D366] text-white hover:bg-[#20bc5a]">
                    <MessageCircle className="h-4 w-4" />
                    تواصل عبر واتساب
                  </Button>
                </a>
                <a href={`tel:+${COMPANY_WHATSAPP}`}>
                  <Button variant="outline" className="h-11 w-full gap-2">
                    <Phone className="h-4 w-4" />
                    اتصل بنا
                  </Button>
                </a>
              </div>
            </div>

            {/* Key specs grid */}
            <div className="rounded-lg border border-border bg-surface">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-[15px] font-semibold text-foreground">تفاصيل العقار</h2>
              </div>
              <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3">
                {[
                  data.area_sqm != null && {
                    label: "المساحة",
                    value: `${formatNumber(data.area_sqm)} م²`,
                    icon: Maximize2,
                  },
                  { label: "النوع", value: typeLabel, icon: null },
                  { label: "الغرض", value: purposeLabel, icon: null },
                  { label: "الحالة", value: statusLabel, icon: null },
                  // Type-specific fields, in the order defined for this type.
                  // bedrooms/bathrooms come from their columns; the rest from `attributes`.
                  ...(TYPE_FIELDS[data.type as string] ?? []).map((key) => {
                    const field = ATTRIBUTE_FIELDS[key];
                    if (!field) return false;
                    const icon = key === "bedrooms" ? BedDouble : key === "bathrooms" ? Bath : null;
                    if (key === "bedrooms")
                      return (
                        data.bedrooms != null && {
                          label: field.label,
                          value: formatNumber(data.bedrooms),
                          icon,
                        }
                      );
                    if (key === "bathrooms")
                      return (
                        data.bathrooms != null && {
                          label: field.label,
                          value: formatNumber(data.bathrooms),
                          icon,
                        }
                      );
                    const attributes = (data as { attributes?: Record<string, string | number> })
                      .attributes;
                    const val = formatAttributeValue(key, attributes?.[key]);
                    return val != null && { label: field.label, value: val, icon };
                  }),
                  data.list_date && {
                    label: "تاريخ الإدراج",
                    value: data.list_date,
                    icon: Calendar,
                  },
                  data.sold_percentage != null && {
                    label: "نسبة المبيع",
                    value: `${data.sold_percentage}%`,
                    icon: null,
                  },
                ]
                  .filter(Boolean)
                  .map((spec) => {
                    if (!spec) return null;
                    const s = spec as {
                      label: string;
                      value: string;
                      icon: typeof Maximize2 | null;
                    };
                    return (
                      <div key={s.label} className="flex items-center gap-3 bg-surface px-5 py-4">
                        {s.icon && <s.icon className="h-4 w-4 shrink-0 text-primary" />}
                        <div>
                          <p className="text-[11px] text-muted-foreground">{s.label}</p>
                          <p className="text-[14px] font-medium text-foreground">{s.value}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Description */}
            {data.description && (
              <div className="space-y-3">
                <h2 className="text-[17px] font-semibold text-foreground">الوصف</h2>
                <p className="text-[15px] leading-[1.85] text-muted-foreground whitespace-pre-line">
                  {data.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {data.property_amenities && data.property_amenities.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-[17px] font-semibold text-foreground">المميزات والخدمات</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {(data.property_amenities as { id: string; amenity_name: string }[]).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2.5 text-[14px] text-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      {a.amenity_name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Owner info (if available) */}
            {data.owner && (
              <div className="rounded-lg border border-border bg-surface p-5">
                <h2 className="text-[15px] font-semibold text-foreground">المالك / المسوّق</h2>
                <p className="mt-2 text-[14px] text-muted-foreground">
                  {(data.owner as { name?: string }).name}
                </p>
              </div>
            )}

            {/* REGA disclaimer */}
            {data.rega_ad_code && (
              <p className="text-[12px] text-muted-foreground/70">
                هذا الإعلان مرخص من الهيئة العامة للعقار برقم: {data.rega_ad_code}
              </p>
            )}
          </div>

          {/* Right: Sticky contact sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
              {/* Price */}
              <div>
                <p className="text-[12px] text-muted-foreground">السعر</p>
                <p className="mt-1 text-[2.25rem] font-bold leading-none text-primary tabular">
                  <SarAmount value={data.price} />
                </p>
                {!isSale && <p className="mt-1 text-[12px] text-muted-foreground">سنوياً</p>}
              </div>

              <div className="border-t border-border pt-4" />

              {/* CTA buttons */}
              <div className="space-y-2.5">
                <a href={waUrl} target="_blank" rel="noopener" className="block">
                  <Button className="h-12 w-full gap-2 bg-[#25D366] text-[14px] text-white hover:bg-[#20bc5a]">
                    <MessageCircle className="h-4.5 w-4.5" />
                    تواصل عبر واتساب
                  </Button>
                </a>
                <a href={`tel:+${COMPANY_WHATSAPP}`} className="block">
                  <Button variant="outline" className="h-11 w-full gap-2 text-[14px]">
                    <Phone className="h-4 w-4" />
                    اتصل بنا
                  </Button>
                </a>
              </div>

              <div className="border-t border-border" />

              {/* Quick info */}
              <div className="space-y-2.5">
                {data.city && (
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">المدينة</span>
                    <span className="font-medium text-foreground">{data.city}</span>
                  </div>
                )}
                {data.type && (
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">نوع العقار</span>
                    <span className="font-medium text-foreground">{typeLabel}</span>
                  </div>
                )}
                {data.area_sqm != null && (
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">المساحة</span>
                    <span className="font-medium text-foreground">
                      {formatNumber(data.area_sqm)} م²
                    </span>
                  </div>
                )}
                {data.bedrooms != null && (
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">غرف النوم</span>
                    <span className="font-medium text-foreground">{data.bedrooms}</span>
                  </div>
                )}
              </div>

              {/* Share */}
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: data.title, url: window.location.href });
                  } else {
                    navigator.clipboard?.writeText(window.location.href);
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-[13px] text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              >
                <Share2 className="h-3.5 w-3.5" />
                مشاركة العقار
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="إغلاق"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>

          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i - 1 + displayImages.length) % displayImages.length);
                }}
                className="absolute end-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="السابق"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i + 1) % displayImages.length);
                }}
                className="absolute start-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="التالي"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}

          <img
            src={displayImages[lightboxIndex]}
            alt=""
            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 text-[12px] text-white/60">
            {lightboxIndex + 1} / {displayImages.length}
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
