import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { listPublicProperties } from "@/lib/properties.functions";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PropertyCard } from "@/components/site/property-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Building2, Search, SlidersHorizontal } from "lucide-react";
import { PROPERTY_TYPE_LABELS, formatNumber } from "@/lib/format";

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
      { title: "العقارات | نفال العقارية" },
      {
        name: "description",
        content: "تصفح أفضل العقارات للبيع والإيجار في المملكة العربية السعودية.",
      },
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
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border/70 bg-surface">
        <div className="container mx-auto max-w-7xl px-6 py-20 md:px-8 md:py-28">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-5">
              <p
                dir="ltr"
                className="text-[11px] font-normal uppercase tracking-[0.18em] text-foreground/55"
              >
                <span className="text-primary">/</span> PROPERTIES
              </p>
              <h1 className="max-w-3xl text-[2.75rem] font-medium leading-[1.12] text-foreground md:text-[3.5rem]">
                ابحث عن العقار المناسب بهدوء ووضوح.
              </h1>
              <p className="max-w-[60ch] text-[15px] leading-[1.7] text-muted-foreground md:text-base">
                فلترة سريعة، بطاقات نظيفة، ومعلومات أساسية تساعدك على المقارنة قبل التواصل.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background px-6 py-5 md:min-w-56">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-accent-dark" />
                <div>
                  <p className="text-[11px] font-normal uppercase tracking-[0.14em] text-muted-foreground">
                    عقار متاح
                  </p>
                  <p className="tabular text-3xl font-medium text-primary">
                    {formatNumber(data?.total ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 bg-background">
        <div className="container mx-auto max-w-7xl px-6 py-6 md:px-8">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.8fr)_repeat(4,minmax(150px,1fr))]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ابحث بعنوان العقار..."
                className="h-12 rounded-md border-border bg-surface ps-3 pe-9 text-[14px] shadow-none"
                defaultValue={params.search ?? ""}
                onChange={(e) => update({ search: e.target.value || undefined })}
              />
            </div>

            <Select
              value={params.city ?? "all"}
              onValueChange={(v) => update({ city: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="h-12 rounded-md bg-surface text-[14px] shadow-none">
                <SelectValue placeholder="المدينة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المدن</SelectItem>
                {CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={params.type ?? "all"}
              onValueChange={(v) => update({ type: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="h-12 rounded-md bg-surface text-[14px] shadow-none">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأنواع</SelectItem>
                {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={params.purpose ?? "all"}
              onValueChange={(v) =>
                update({ purpose: v === "all" ? undefined : (v as "sale" | "rent") })
              }
            >
              <SelectTrigger className="h-12 rounded-md bg-surface text-[14px] shadow-none">
                <SelectValue placeholder="الغرض" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="sale">للبيع</SelectItem>
                <SelectItem value="rent">للإيجار</SelectItem>
              </SelectContent>
            </Select>

            <Select value={params.sort} onValueChange={(v) => update({ sort: v as never })}>
              <SelectTrigger className="h-12 rounded-md bg-surface text-[14px] shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="price_asc">السعر: من الأقل</SelectItem>
                <SelectItem value="price_desc">السعر: من الأعلى</SelectItem>
                <SelectItem value="most_viewed">الأكثر مشاهدة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>استخدم الفلاتر لتقليل النتائج حسب المدينة، النوع، والغرض.</span>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-6 py-14 md:px-8 md:py-20">
        {isFetching && !data && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-border bg-surface"
              >
                <div className="aspect-[4/3.35] animate-pulse bg-muted" />
                <div className="space-y-4 p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-10 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.rows.length === 0 && (
          <div className="mx-auto max-w-xl rounded-lg border border-border bg-surface px-6 py-16 text-center">
            <p
              dir="ltr"
              className="text-[11px] font-normal uppercase tracking-[0.18em] text-foreground/55"
            >
              <span className="text-primary">/</span> NO RESULTS
            </p>
            <h2 className="mt-4 text-[28px] font-medium">لا توجد عقارات تطابق البحث</h2>
            <p className="mt-3 text-[15px] leading-[1.7] text-muted-foreground">
              جرب إزالة بعض الفلاتر أو العودة إلى أحدث العقارات المتاحة.
            </p>
            <Button
              variant="outline"
              className="mt-6 h-11 rounded-md px-6 text-[13px] font-medium"
              onClick={() => navigate({ search: { sort: "newest", page: 1 } })}
            >
              إعادة ضبط البحث
            </Button>
          </div>
        )}

        {data && data.rows.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.rows.map((property) => (
              <PropertyCard key={property.id} p={property as never} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
