import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  getHomeStats,
  getPropertyByRegaCode,
  listBestSellingProjects,
  listLatestProjects,
  listPublicProperties,
} from "@/lib/properties.functions";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PropertyCard, type PropertyCardData } from "@/components/site/property-card";
import { Button } from "@/components/ui/button";
import {
  ArrowUpLeft,
  Building2,
  ChevronDown,
  ChevronUp,
  Eye,
  HandshakeIcon,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { buildWhatsAppUrl, COMPANY_WHATSAPP, formatNumber } from "@/lib/format";

const featuredQO = queryOptions({
  queryKey: ["home-featured"],
  queryFn: () =>
    listPublicProperties({ data: { featuredOnly: true, pageSize: 6, sort: "newest", page: 1 } }),
});
const statsQO = queryOptions({ queryKey: ["home-stats"], queryFn: () => getHomeStats() });
const latestQO = queryOptions({ queryKey: ["home-latest"], queryFn: () => listLatestProjects() });
const bestSellingQO = queryOptions({
  queryKey: ["home-best-selling"],
  queryFn: () => listBestSellingProjects(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(featuredQO);
    context.queryClient.ensureQueryData(statsQO);
    context.queryClient.ensureQueryData(latestQO);
    context.queryClient.ensureQueryData(bestSellingQO);
  },
  component: Home,
});

function Home() {
  const { data: featured } = useSuspenseQuery(featuredQO);
  const { data: stats } = useSuspenseQuery(statsQO);
  const { data: latest } = useSuspenseQuery(latestQO);
  const { data: bestSelling } = useSuspenseQuery(bestSellingQO);

  const statItems = [
    { icon: Building2, label: "عقار متاح", value: stats.totalProperties },
    { icon: MapPin, label: "مدن نخدمها", value: stats.citiesServed },
    { icon: HandshakeIcon, label: "صفقة منجزة", value: stats.completedDeals },
    { icon: Eye, label: "عميل نخدمه", value: stats.happyClients },
  ];

  const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
  ];
  const valueImage =
    getCover(featured.rows[0]) ??
    getCover(latest[0]) ??
    getCover(bestSelling[0]) ??
    FALLBACK_IMAGES[0];
  const navigationCards = [
    {
      label: "العقارات",
      to: "/properties",
      image: getCover(featured.rows[1]) ?? FALLBACK_IMAGES[1],
    },
    {
      label: "أحدث المشاريع",
      to: "/properties",
      image: getCover(latest[1]) ?? getCover(featured.rows[2]) ?? FALLBACK_IMAGES[2],
    },
    {
      label: "تواصل معنا",
      to: "/contact",
      image: getCover(bestSelling[1]) ?? FALLBACK_IMAGES[3],
    },
  ] as const;
  const valueItems = [
    {
      icon: "shield",
      title: "شفافية حقيقية",
      text: "السعر، الموقع، وحالة العقار تظهر بصورة مباشرة دون مبالغة.",
    },
    {
      icon: "search",
      title: "فرز سريع",
      text: "تصفية حسب المدينة، النوع، الغرض، والأحدث أو السعر.",
    },
    {
      icon: "data",
      title: "بيانات مفيدة",
      text: "المساحة، الغرف، ونوع العقار ضمن بطاقة نظيفة وسهلة القراءة.",
    },
    {
      icon: "calm",
      title: "عرض بصري هادئ",
      text: "صور كبيرة ومساحات بيضاء بدون مؤثرات مشتتة.",
    },
  ] satisfies Array<{
    icon: keyof typeof pixelPatterns;
    title: string;
    text: string;
  }>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section
        data-hero
        className="relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden text-white"
        style={{ background: "rgb(18,15,14)" }}
      >
        {/* Background video — dark overlay keeps it atmospheric not distracting */}
        <iframe
          className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0 opacity-30 mix-blend-screen"
          src="https://www.youtube-nocookie.com/embed/0I-umxn_qtE?autoplay=1&mute=1&loop=1&playlist=0I-umxn_qtE&controls=0&modestbranding=1&playsinline=1&rel=0&disablekb=1&fs=0"
          title="Nifal property showcase"
          allow="autoplay; encrypted-media; picture-in-picture"
          aria-hidden="true"
          tabIndex={-1}
        />
        {/* Single dark overlay — no gradient blobs */}
        <div className="pointer-events-none absolute inset-0 bg-[rgba(18,15,14,0.55)]" />
        {/* Bottom vignette */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(0deg,rgba(18,15,14,0.8),transparent)]" />

        <div className="container relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl items-end px-6 py-16 md:px-8 md:py-24">
          <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.7fr] lg:items-end">
            <div className="max-w-4xl space-y-8 text-center sm:text-right">
              <div className="space-y-5">
                <h1 className="text-[2.2rem] font-semibold leading-[1.12] tracking-[-0.01em] sm:text-[2.8rem] lg:text-[3.2rem]">
                  بداية موثوقة لرحلتك العقارية
                </h1>
                <p className="mx-auto max-w-[320px] text-[15px] font-normal leading-[1.7] text-white/55 sm:mx-0 sm:max-w-[52ch] md:text-base">
                  مشاريع وعقارات مختارة، نعرضها بمعلومات واضحة وتفاصيل دقيقة، لتتخذ قرارك بثقة.
                </p>
              </div>
              <div className="grid gap-3 pt-1 sm:flex sm:flex-wrap">
                <Link to="/properties" className="w-full sm:w-auto">
                  <Button className="h-11 w-full rounded bg-primary px-7 text-[13px] font-medium text-primary-foreground shadow-sm transition hover:bg-primary/88 sm:w-auto">
                    تصفح العقارات
                    <ArrowUpLeft className="ms-2 h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href={buildWhatsAppUrl(
                    COMPANY_WHATSAPP,
                    "السلام عليكم، أرغب بالاستفسار عن عقارات نفال",
                  )}
                  target="_blank"
                  rel="noopener"
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded border-white/25 bg-transparent px-7 text-[13px] font-medium text-white transition hover:border-white/45 hover:bg-transparent sm:w-auto"
                  >
                    <MessageCircle className="ms-2 h-4 w-4" />
                    راسلنا عبر واتساب
                  </Button>
                </a>
              </div>
            </div>

            <div className="hidden justify-self-end md:block lg:w-96">
              <RegaSearchCard />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 bg-surface">
        <div className="container mx-auto max-w-7xl px-6 md:px-8">
          <div className="grid grid-cols-2 divide-x divide-x-reverse divide-border/60 md:grid-cols-4">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 px-6 py-7 first:ps-0 last:pe-0 md:py-9"
              >
                <item.icon className="h-6 w-6 shrink-0 text-accent-dark" />
                <div>
                  <div className="tabular text-[1.75rem] font-medium leading-none text-primary">
                    {formatNumber(item.value)}
                  </div>
                  <div className="mt-1.5 text-[12px] text-muted-foreground">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-7xl px-6 md:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {navigationCards.map((card) => (
              <Link
                key={card.label}
                to={card.to}
                className="group relative block aspect-[4/3] overflow-hidden rounded-lg bg-neutral-100"
              >
                <img
                  src={card.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,20,18,0.02),rgba(24,20,18,0.58))]" />
                <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-4">
                  <span className="text-[21px] font-medium leading-none text-white">
                    {card.label}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/12 text-white backdrop-blur transition group-hover:bg-white/20">
                    <ArrowUpLeft className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PropertySection
        title="عقارات موثوقة للسكن والاستثمار"
        description="مختارة بعناية من فريق نفال. سهولة المقارنة بين السعر والموقع والمساحة."
        properties={featured.rows as PropertyCardData[]}
      />

      {latest.length > 0 && (
        <PropertySection
          title="فرص أضيفت حديثا"
          description="تابع أحدث العقارات المتاحة في المدن التي نخدمها، مع تفاصيل مركزة وصور تقود القرار."
          properties={latest as PropertyCardData[]}
          muted
        />
      )}

      <ValueSection
        valueItems={valueItems}
        images={[
          getCover(featured.rows[0]) ?? FALLBACK_IMAGES[0],
          getCover(featured.rows[1]) ?? FALLBACK_IMAGES[1],
          getCover(latest[0]) ?? FALLBACK_IMAGES[2],
          getCover(bestSelling[0]) ?? FALLBACK_IMAGES[3],
        ]}
      />

      {bestSelling.length > 0 && (
        <PropertySection
          title="مشاريع عليها طلب واضح"
          description="عقارات لقيت اهتماماً أكبر من غيرها، تفيدك إن أردت أن ترى ما يطلبه الناس قبل أن تقرر."
          properties={bestSelling as PropertyCardData[]}
        />
      )}

      <section className="px-6 pb-20 md:px-8 md:pb-28">
        <div className="container mx-auto max-w-7xl rounded-lg bg-primary px-6 py-12 text-primary-foreground md:px-10 md:py-16">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="mt-4 text-3xl font-medium leading-[1.25] md:text-[2rem]">
                كل قرار عقاري يبدأ بمعلومة واضحة.
              </h2>
              <p className="mt-5 max-w-2xl text-[15px] leading-[1.7] text-primary-foreground/72">
                تواصل مع فريق نفال للحصول على المعلومات التي تحتاجها، والإجابة عن استفساراتك،
                ومساعدتك في اتخاذ قرار عقاري بثقة.
              </p>
            </div>
            <a
              href={buildWhatsAppUrl(COMPANY_WHATSAPP, "السلام عليكم، أرغب بالتواصل معكم")}
              target="_blank"
              rel="noopener"
            >
              <Button className="h-12 rounded-md bg-primary px-8 text-[13px] font-medium text-primary-foreground hover:bg-primary/85">
                <MessageCircle className="ms-2 h-4 w-4" />
                تواصل عبر واتساب
              </Button>
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function PropertySection({
  title,
  description,
  properties,
  muted = false,
}: {
  title: string;
  description: string;
  properties: PropertyCardData[];
  muted?: boolean;
}) {
  if (properties.length === 0) return null;

  return (
    <section className={muted ? "bg-surface py-20 md:py-28" : "bg-background py-20 md:py-28"}>
      <div className="container mx-auto max-w-7xl px-6 md:px-8">
        <div className="mb-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-5">
            <h2 className="max-w-3xl text-[2.5rem] font-medium leading-[1.12] text-foreground md:text-[2.75rem]">
              {title}
            </h2>
            <p className="max-w-[60ch] text-[15px] leading-[1.7] text-muted-foreground md:text-base">
              {description}
            </p>
          </div>
          <Link
            to="/properties"
            className="inline-flex h-12 w-fit items-center justify-center rounded-md bg-primary px-7 text-[13px] font-medium text-primary-foreground transition hover:bg-primary-hover"
          >
            عرض الكل
            <ArrowUpLeft className="ms-2 h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.slice(0, 6).map((property) => (
            <PropertyCard key={property.id} p={property} />
          ))}
        </div>
      </div>
    </section>
  );
}

const pixelPatterns = {
  shield: [
    "00111100",
    "01111110",
    "11011011",
    "11011011",
    "11111111",
    "01111110",
    "00111100",
    "00011000",
  ],
  search: [
    "00111100",
    "01100110",
    "11000011",
    "11000011",
    "01100110",
    "00111100",
    "00001100",
    "00000110",
  ],
  data: [
    "01111110",
    "01000010",
    "01111110",
    "01000010",
    "01111110",
    "01000010",
    "01111110",
    "00000000",
  ],
  calm: [
    "00011000",
    "10011001",
    "01111110",
    "00111100",
    "01111110",
    "10011001",
    "00011000",
    "00000000",
  ],
} as const;

function PixelIcon({ kind }: { kind: keyof typeof pixelPatterns }) {
  return (
    <span className="grid h-9 w-9 grid-cols-8 gap-[2px]" aria-hidden="true">
      {pixelPatterns[kind].flatMap((row, rowIndex) =>
        row
          .split("")
          .map((cell, columnIndex) => (
            <span
              key={`${rowIndex}-${columnIndex}`}
              className={
                cell === "1" ? "h-[3px] w-[3px] rounded-full bg-foreground" : "h-[3px] w-[3px]"
              }
            />
          )),
      )}
    </span>
  );
}

function RegaSearchCard() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "not_found" | "error">("idle");
  const navigate = useNavigate();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.replace(/\s/g, "");
    if (!trimmed) return;
    setStatus("loading");
    try {
      const property = await getPropertyByRegaCode({ data: { rega_ad_code: trimmed } });
      if (property) {
        navigate({ to: "/properties/$id", params: { id: property.id } });
      } else {
        setStatus("not_found");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-md border border-border bg-background p-6 shadow-md">
      <h3 className="text-[17px] font-semibold leading-snug text-foreground text-right">
        ابحث برقم الإعلان
      </h3>
      <p className="mt-2 text-[13px] leading-[1.6] text-muted-foreground text-right">
        أدخل رقم الإعلان العقاري للوصول مباشرة إلى تفاصيل العقار.
      </p>
      <form onSubmit={handleSearch} className="mt-4 space-y-2.5">
        <Input
          dir="ltr"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setStatus("idle");
          }}
          placeholder="مثال: 1234567890"
          className={[
            "h-10 rounded text-foreground placeholder:text-right placeholder:text-muted-foreground/50 focus-visible:ring-1",
            status === "not_found" || status === "error"
              ? "border-destructive/60 focus-visible:ring-destructive/30"
              : "border-border bg-background focus-visible:ring-primary/40",
          ].join(" ")}
          disabled={status === "loading"}
          autoComplete="off"
          inputMode="numeric"
        />
        {status === "not_found" && (
          <p className="text-[12px] text-destructive text-right">
            لم يوجد عقار بهذا الرقم. تحقق من الرقم وحاول مجددًا.
          </p>
        )}
        {status === "error" && (
          <p className="text-[12px] text-destructive text-right">
            حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.
          </p>
        )}
        <button
          type="submit"
          disabled={status === "loading" || !code.trim()}
          className="flex h-10 w-full items-center justify-center gap-2 rounded bg-primary text-[13px] font-medium text-primary-foreground transition hover:bg-primary/88 disabled:opacity-40"
        >
          {status === "loading" ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <ArrowUpLeft className="h-3.5 w-3.5" />
          )}
          {status === "loading" ? "جارٍ البحث…" : "بحث"}
        </button>
      </form>
    </div>
  );
}

function ValueSection({
  valueItems,
  images,
}: {
  valueItems: Array<{ icon: keyof typeof pixelPatterns; title: string; text: string }>;
  images: (string | undefined)[];
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const total = images.length;

  const prev = () => setSlideIndex((i) => (i - 1 + total) % total);
  const next = () => setSlideIndex((i) => (i + 1) % total);

  // Auto-advance every 4s unless user is hovering
  useEffect(() => {
    if (hoverPaused) return;
    const id = setTimeout(() => setSlideIndex((i) => (i + 1) % total), 4000);
    return () => clearTimeout(id);
  }, [slideIndex, hoverPaused, total]);

  return (
    <section className="bg-surface py-20 md:py-28">
      <div className="container mx-auto grid max-w-7xl gap-12 px-6 md:px-8 lg:grid-cols-2 lg:items-center">
        {/* Feature cards — right column in RTL (col-start-2) */}
        <div className="space-y-8 lg:col-start-2 lg:row-start-1">
          <div className="space-y-4 text-right">
            <h2 className="text-[2.4rem] font-semibold leading-[1.15] text-foreground md:text-[3rem]">
              الأساسيات العقارية،
              <br />
              واضحة ومرتبة.
            </h2>
            <p className="text-[15px] leading-[1.75] text-muted-foreground">
              نضع الصورة والمعلومة في المقدمة، مع تفاصيل عملية تساعدك على المقارنة قبل التواصل.
            </p>
          </div>

          <div className="space-y-3">
            {valueItems.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-4 rounded-xl border border-border bg-background p-5 text-right"
              >
                {/* Text first (RTL: renders on right), icon second (renders on left) */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-0.5 text-[13px] leading-[1.6] text-muted-foreground">
                    {item.text}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground">
                  <PixelIcon kind={item.icon} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image slider — left column in RTL (col-start-1) */}
        <div
          className="relative overflow-hidden rounded-2xl border border-border bg-neutral-100 lg:col-start-1 lg:row-start-1"
          style={{ aspectRatio: "4/5" }}
          onMouseEnter={() => setHoverPaused(true)}
          onMouseLeave={() => setHoverPaused(false)}
        >
          {images.map((src, i) => (
            <img
              key={i}
              src={
                src ?? "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80"
              }
              alt=""
              className={[
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
                i === slideIndex ? "opacity-100" : "opacity-0",
              ].join(" ")}
              loading="lazy"
              // If an image (often an external fallback) fails, swap to a known-good
              // one once so the slide never shows an empty black frame.
              onError={(e) => {
                const img = e.currentTarget;
                if (img.dataset.fallbackApplied) return;
                img.dataset.fallbackApplied = "true";
                img.src =
                  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80";
              }}
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,24,22,0.00),rgba(28,24,22,0.12))]" />

          {/* Caption overlay — bottom start corner */}
          <div className="absolute bottom-20 inset-s-4 inset-e-4 rounded-xl bg-[rgba(18,15,14,0.82)] px-5 py-4 text-white backdrop-blur-sm">
            <p className="text-[14px] font-medium leading-[1.6] text-right">
              تفاصيل واضحة تساعدك على اختيار العقار بثقة.
            </p>
          </div>

          {/* Arrow buttons — bottom end */}
          <div className="absolute bottom-5 inset-e-4 flex gap-2">
            <button
              onClick={prev}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface/90 text-foreground shadow-sm backdrop-blur transition hover:bg-surface"
              aria-label="الصورة السابقة"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface/90 text-foreground shadow-sm backdrop-blur transition hover:bg-surface"
              aria-label="الصورة التالية"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* Dot indicators */}
          <div className="absolute bottom-6 inset-s-6 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                aria-label={`الصورة ${i + 1}`}
                className={[
                  "h-1.5 rounded-full transition-all duration-300",
                  i === slideIndex ? "w-5 bg-white" : "w-1.5 bg-white/40",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function getCover(property?: {
  property_images?:
    | { image_url: string; is_primary: boolean | null; sort_order: number | null }[]
    | null;
}) {
  return property?.property_images
    ?.slice()
    .sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )[0]?.image_url;
}
