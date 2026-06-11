import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { getPublicProperty } from "@/lib/properties.functions";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BedDouble, Bath, Maximize2, Calendar, MessageCircle, Phone, X } from "lucide-react";
import { buildWhatsAppUrl, COMPANY_WHATSAPP, formatSAR, PROPERTY_TYPE_LABELS, PURPOSE_LABELS, STATUS_LABELS } from "@/lib/format";

const propQO = (id: string) => queryOptions({
  queryKey: ["property", id],
  queryFn: () => getPublicProperty({ data: { id } }),
});

export const Route = createFileRoute("/properties/$id")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(propQO(params.id));
    if (!p) throw notFound();
  },
  head: ({ params }) => ({
    meta: [
      { title: `عقار رقم ${params.id.slice(0, 8)} | نِفال العقارية` },
    ],
  }),
  component: PropertyDetail,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><h2 className="text-2xl font-bold">العقار غير موجود</h2></div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center text-center"><p>{error.message}</p></div>
  ),
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(propQO(id));
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (!data) return null;

  const images = (data.property_images ?? []).slice().sort((a: { sort_order: number | null }, b: { sort_order: number | null }) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const cover = images[0]?.image_url;

  const waMessage = `السلام عليكم، أنا مهتم بالعقار: ${data.title} (${data.city}). أرجو التواصل معي.`;
  const waUrl = buildWhatsAppUrl(COMPANY_WHATSAPP, waMessage);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="text-xs text-muted-foreground mb-4">
          <a href="/" className="hover:text-primary">الرئيسية</a> / <a href="/properties" className="hover:text-primary">العقارات</a> / <span>{data.title}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {cover && (
              <button onClick={() => setLightbox(cover)} className="block w-full aspect-[16/10] rounded-2xl overflow-hidden bg-muted">
                <img src={cover} alt={data.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </button>
            )}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(1, 5).map((img: { id: string; image_url: string }) => (
                  <button key={img.id} onClick={() => setLightbox(img.image_url)} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={img.image_url} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform" />
                  </button>
                ))}
              </div>
            )}

            <div className="card-elegant p-6 mt-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex gap-2 mb-2">
                    <Badge className="bg-primary text-primary-foreground">{PURPOSE_LABELS[data.purpose]}</Badge>
                    <Badge variant="secondary">{PROPERTY_TYPE_LABELS[data.type]}</Badge>
                    <Badge variant="outline">{STATUS_LABELS[data.status]}</Badge>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold">{data.title}</h1>
                  <p className="text-muted-foreground text-sm flex items-center gap-1 mt-2">
                    <MapPin className="h-4 w-4" /> {data.city}{data.district ? ` · ${data.district}` : ""}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                {data.area_sqm && <Spec icon={Maximize2} label="المساحة" value={`${data.area_sqm} م²`} />}
                {data.bedrooms != null && <Spec icon={BedDouble} label="غرف النوم" value={data.bedrooms} />}
                {data.bathrooms != null && <Spec icon={Bath} label="الحمامات" value={data.bathrooms} />}
                <Spec icon={Calendar} label="تاريخ الإدراج" value={data.list_date ?? "—"} />
              </div>
            </div>

            {data.description && (
              <div className="card-elegant p-6">
                <h2 className="text-lg font-bold mb-3">الوصف</h2>
                <p className="text-muted-foreground leading-loose whitespace-pre-line">{data.description}</p>
              </div>
            )}

            {data.property_amenities && data.property_amenities.length > 0 && (
              <div className="card-elegant p-6">
                <h2 className="text-lg font-bold mb-4">المميزات</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {data.property_amenities.map((a: { id: string; amenity_name: string }) => (
                    <div key={a.id} className="flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full bg-accent" /> {a.amenity_name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.rega_ad_code && (
              <p className="text-xs text-muted-foreground">رمز الإعلان (الهيئة العامة للعقار): {data.rega_ad_code}</p>
            )}
          </div>

          {/* Sticky sidebar */}
          <aside className="space-y-4">
            <div className="card-elegant p-6 lg:sticky lg:top-20 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">السعر</p>
                <p className="text-3xl font-bold text-primary tabular">{formatSAR(data.price)}</p>
                {data.purpose === "rent" && <p className="text-xs text-muted-foreground mt-1">سنوياً</p>}
              </div>
              <a href={waUrl} target="_blank" rel="noopener" className="block">
                <Button className="w-full bg-whatsapp text-white hover:bg-whatsapp/90 h-12">
                  <MessageCircle className="ms-2 h-5 w-5" /> تواصل عبر واتساب
                </Button>
              </a>
              <a href={`tel:+${COMPANY_WHATSAPP}`} className="block">
                <Button variant="outline" className="w-full h-12"><Phone className="ms-2 h-4 w-4" /> اتصل بنا</Button>
              </a>
              <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                مشاهدات: {data.views_count ?? 0}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white" aria-label="إغلاق"><X className="h-6 w-6" /></button>
          <img src={lightbox} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

function Spec({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary-tint flex items-center justify-center text-primary"><Icon className="h-4 w-4" /></div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-sm">{value}</p>
      </div>
    </div>
  );
}
