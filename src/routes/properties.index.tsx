import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
import { listPublicProperties, getPropertyByRegaCode } from "@/lib/properties.functions";
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
import { Search, Hash, ArrowUpLeft, Loader2 } from "lucide-react";
import { PROPERTY_TYPE_LABELS } from "@/lib/format";

const search = z.object({
  city: z.string().optional(),
  type: z.string().optional(),
  purpose: z.enum(["sale", "rent"]).optional(),
  search: z.string().optional(),
  sort: z.enum(["price_asc", "price_desc", "most_viewed"]).default("price_asc"),
  page: z.number().int().min(1).default(1),
});

export const Route = createFileRoute("/properties/")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "العقارات | نفال العقارية" },
      {
        name: "description",
        content:
          "تصفّح عقارات للبيع والإيجار في مدن المملكة، مع تفاصيل واضحة تساعدك على المقارنة قبل التواصل.",
      },
    ],
  }),
  component: PropertiesPage,
});

const CITIES = ["الرياض", "جدة", "الدمام"];

function PropertiesPage() {
  const params = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [searchMode, setSearchMode] = useState<"title" | "rega">("title");

  const { data, isFetching } = useQuery({
    queryKey: ["properties", params],
    queryFn: () => listPublicProperties({ data: { ...params, pageSize: 20 } }),
    placeholderData: keepPreviousData,
  });

  const update = (patch: Partial<typeof params>) =>
    navigate({ search: (prev: typeof params) => ({ ...prev, ...patch, page: patch.page ?? 1 }) });

  const totalCount = data?.total ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* ─── Hero — full bleed, fixed height, dark overlay, text + search inset at bottom ─── */}
      <section className="relative isolate overflow-hidden bg-neutral-900 pt-16">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        {/* Gradient overlay — stronger at bottom so search bar pops */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,15,14,0.15)_0%,rgba(18,15,14,0.65)_60%,rgba(18,15,14,0.92)_100%)]" />

        {/* Content sits at the very bottom of the hero */}
        <div className="container relative mx-auto flex max-w-7xl flex-col justify-end gap-8 px-6 pb-10 pt-32 md:px-8 md:pb-14 md:pt-44">
          {/* Headline */}
          <div className="space-y-3 text-right">
            <h1 className="text-[2rem] font-semibold leading-[1.12] text-white md:text-[2.65rem]">
              ابحث عن العقار المناسب بوضوح.
            </h1>
            <p className="max-w-[50ch] text-[14px] leading-[1.65] text-white/60">
              فلترة سريعة ومعلومات أساسية لكل عقار تساعدك على المقارنة قبل التواصل.
            </p>
          </div>

          {/* Search mode toggle + inputs — pinned to hero bottom like Rakez CTA bar */}
          <div className="rounded-xl border border-border bg-background p-5 shadow-lg">
            {/* Mode pills */}
            <div className="mb-4 flex items-center gap-1 border-b border-border pb-3.5">
              <button
                onClick={() => setSearchMode("title")}
                className={[
                  "flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                  searchMode === "title"
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <Search className="h-3.5 w-3.5" />
                بحث بالعنوان
              </button>
              <button
                onClick={() => setSearchMode("rega")}
                className={[
                  "flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                  searchMode === "rega"
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                <Hash className="h-3.5 w-3.5" />
                رقم الإعلان
              </button>
            </div>

            {searchMode === "rega" ? (
              <RegaSearchDark />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
                {/* Title search */}
                <div className="relative">
                  <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="ابحث بعنوان العقار..."
                    className="h-11 rounded-lg border-border bg-background ps-9 text-[13px] shadow-none focus-visible:ring-1 focus-visible:ring-primary/30"
                    defaultValue={params.search ?? ""}
                    onChange={(e) => update({ search: e.target.value || undefined })}
                  />
                </div>

                {/* City */}
                <Select
                  value={params.city ?? "all"}
                  onValueChange={(v) => update({ city: v === "all" ? undefined : v })}
                >
                  <SelectTrigger className="h-11 rounded-lg border-border bg-background text-[13px] shadow-none">
                    <SelectValue placeholder="كل المدن" />
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

                {/* Type */}
                <Select
                  value={params.type ?? "all"}
                  onValueChange={(v) => update({ type: v === "all" ? undefined : v })}
                >
                  <SelectTrigger className="h-11 rounded-lg border-border bg-background text-[13px] shadow-none">
                    <SelectValue placeholder="كل الأنواع" />
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

                {/* Purpose */}
                <Select
                  value={params.purpose ?? "all"}
                  onValueChange={(v) =>
                    update({ purpose: v === "all" ? undefined : (v as "sale" | "rent") })
                  }
                >
                  <SelectTrigger className="h-11 rounded-lg border-border bg-background text-[13px] shadow-none">
                    <SelectValue placeholder="الغرض" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="sale">للبيع</SelectItem>
                    <SelectItem value="rent">للإيجار</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={params.sort} onValueChange={(v) => update({ sort: v as never })}>
                  <SelectTrigger className="h-11 rounded-lg border-border bg-background text-[13px] shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_asc">السعر: من الأقل للأعلى</SelectItem>
                    <SelectItem value="price_desc">السعر: من الأعلى</SelectItem>
                    <SelectItem value="most_viewed">الأكثر مشاهدة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Results bar ─── */}
      <div className="border-b border-border/60 bg-surface">
        <div className="container mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5 md:px-8">
          <p className="text-[13px] text-muted-foreground">
            {isFetching ? "جارٍ التحميل…" : totalCount != null ? `${totalCount} عقار` : ""}
          </p>
          {/* Active filter pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {params.city && (
              <FilterPill label={params.city} onRemove={() => update({ city: undefined })} />
            )}
            {params.type && (
              <FilterPill
                label={PROPERTY_TYPE_LABELS[params.type] ?? params.type}
                onRemove={() => update({ type: undefined })}
              />
            )}
            {params.purpose && (
              <FilterPill
                label={params.purpose === "sale" ? "للبيع" : "للإيجار"}
                onRemove={() => update({ purpose: undefined })}
              />
            )}
            {params.search && (
              <FilterPill
                label={`"${params.search}"`}
                onRemove={() => update({ search: undefined })}
              />
            )}
          </div>
        </div>
      </div>

      {/* ─── Grid ─── */}
      <section className="container mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-16">
        {isFetching && !data && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
                <div className="aspect-[4/3] animate-pulse bg-muted" />
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
          <div className="mx-auto max-w-sm rounded-xl border border-border bg-surface px-8 py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/8 text-primary">
              <Search className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-[22px] font-semibold text-foreground">لا توجد نتائج</h2>
            <p className="mt-2 text-[14px] leading-[1.7] text-muted-foreground">
              عدّل الفلاتر أو وسّع نطاق البحث.
            </p>
            <Button
              variant="outline"
              className="mt-6 h-10 rounded-lg px-6 text-[13px]"
              onClick={() => navigate({ search: { sort: "price_asc", page: 1 } })}
            >
              إعادة ضبط
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

        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="mt-14 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={params.page <= 1}
              onClick={() => update({ page: params.page - 1 })}
              className="h-9 rounded-lg px-4 text-[13px]"
            >
              السابق
            </Button>
            <span className="px-4 text-[13px] text-muted-foreground">
              صفحة {params.page} من {Math.ceil(data.total / 20)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={params.page >= Math.ceil(data.total / 20)}
              onClick={() => update({ page: params.page + 1 })}
              className="h-9 rounded-lg px-4 text-[13px]"
            >
              التالي
            </Button>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

/** Dark-mode REGA search — used inside the hero panel */
function RegaSearchDark() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setNotFound(false);
    try {
      const property = await getPropertyByRegaCode({ data: { rega_ad_code: trimmed } });
      if (property) {
        navigate({ to: "/properties/$id", params: { id: property.id } });
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSearch} className="flex items-start gap-2">
      <div className="relative flex-1">
        <Hash className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <Input
          dir="ltr"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setNotFound(false);
          }}
          placeholder="أدخل رقم الإعلان (مثال: 1234567890)"
          className="h-11 rounded-lg border-white/12 bg-white/8 ps-9 text-[13px] text-white shadow-none placeholder:text-white/35 placeholder:text-right focus-visible:border-white/30 focus-visible:ring-0"
          disabled={loading}
          autoComplete="off"
        />
        {notFound && (
          <p className="absolute top-full mt-1.5 text-[12px] text-red-400">
            لم يوجد عقار بهذا الرقم. تحقق من الرقم وحاول مجددًا.
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-primary px-5 text-[13px] font-medium text-primary-foreground transition hover:bg-primary/88 disabled:opacity-40"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowUpLeft className="h-4 w-4" />
        )}
        {loading ? "جارٍ البحث…" : "بحث"}
      </button>
    </form>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] text-foreground/70 transition hover:border-destructive/40 hover:text-destructive"
    >
      {label}
      <span className="text-[13px] leading-none">×</span>
    </button>
  );
}
