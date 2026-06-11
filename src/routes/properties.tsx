import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { z } from "zod";
import { listPublicProperties } from "@/lib/properties.functions";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PropertyCard } from "@/components/site/property-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { PROPERTY_TYPE_LABELS } from "@/lib/format";

const search = z.object({
  city: z.string().optional(),
  type: z.string().optional(),
  purpose: z.enum(["sale", "rent"]).optional(),
  search: z.string().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "most_viewed"]).default("newest"),
  page: z.number().int().min(1).default(1),
});

export const Route = createFileRoute("/properties")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "العقارات | نِفال العقارية" },
      { name: "description", content: "تصفح أفضل العقارات للبيع والإيجار في المملكة العربية السعودية." },
    ],
  }),
  component: PropertiesPage,
});

const CITIES = ["الرياض", "جدة", "الدمام"];

function PropertiesPage() {
  const params = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data, isFetching } = useQuery({
    queryKey: ["properties", params],
    queryFn: () => listPublicProperties({ data: { ...params, pageSize: 20 } }),
    placeholderData: keepPreviousData,
  });

  const update = (patch: Partial<typeof params>) =>
    navigate({ search: (prev: typeof params) => ({ ...prev, ...patch, page: patch.page ?? 1 }) });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="surface-hero py-12">
        <div className="container mx-auto max-w-7xl px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">جميع العقارات</h1>
          <p className="text-primary-foreground/80">{data?.total ?? 0} عقار متاح</p>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 -mt-8 relative z-10">
        <div className="card-elegant p-4 grid gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بعنوان العقار..."
              className="ps-3 pe-9"
              defaultValue={params.search ?? ""}
              onChange={(e) => update({ search: e.target.value || undefined })}
            />
          </div>
          <Select value={params.city ?? "all"} onValueChange={(v) => update({ city: v === "all" ? undefined : v })}>
            <SelectTrigger><SelectValue placeholder="المدينة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المدن</SelectItem>
              {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={params.type ?? "all"} onValueChange={(v) => update({ type: v === "all" ? undefined : v })}>
            <SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={params.purpose ?? "all"} onValueChange={(v) => update({ purpose: v === "all" ? undefined : v as "sale" | "rent" })}>
            <SelectTrigger><SelectValue placeholder="الغرض" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="sale">للبيع</SelectItem>
              <SelectItem value="rent">للإيجار</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><SlidersHorizontal className="h-3 w-3" /> ترتيب</span>
          <Select value={params.sort} onValueChange={(v) => update({ sort: v as never })}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">الأحدث</SelectItem>
              <SelectItem value="price_asc">السعر: من الأقل</SelectItem>
              <SelectItem value="price_desc">السعر: من الأعلى</SelectItem>
              <SelectItem value="most_viewed">الأكثر مشاهدة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-10">
        {isFetching && !data && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card-elegant aspect-[4/3.5] animate-pulse bg-muted" />)}
          </div>
        )}
        {data && data.rows.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">لا توجد عقارات تطابق البحث</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate({ search: { sort: "newest", page: 1 } })}>إعادة ضبط البحث</Button>
          </div>
        )}
        {data && data.rows.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.rows.map((p) => <PropertyCard key={p.id} p={p as never} />)}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
