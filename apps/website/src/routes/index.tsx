import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  getHomeStats,
  listBestSellingProjects,
  listLatestProjects,
  listPublicProperties,
} from "@/lib/properties.functions";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PropertyCard, type PropertyCardData } from "@/components/site/property-card";
import { Button } from "@/components/ui/button";
import { ArrowUpLeft, Building2, Eye, HandshakeIcon, MapPin, MessageCircle } from "lucide-react";
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
    { icon: Eye, label: "عميل سعيد", value: stats.happyClients },
  ];

  const valueImage =
    getCover(featured.rows[0]) ??
    getCover(latest[0]) ??
    getCover(bestSelling[0]) ??
    "https://img.youtube.com/vi/0I-umxn_qtE/maxresdefault.jpg";
  const navigationCards = [
    {
      label: "العقارات",
      to: "/properties",
      image: getCover(featured.rows[1]) ?? valueImage,
    },
    {
      label: "أحدث المشاريع",
      to: "/properties",
      image: getCover(latest[1]) ?? getCover(featured.rows[2]) ?? valueImage,
    },
    {
      label: "تواصل معنا",
      to: "/contact",
      image: getCover(bestSelling[1]) ?? "https://img.youtube.com/vi/0I-umxn_qtE/maxresdefault.jpg",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden bg-[rgb(28,24,22)] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--primary-dark),rgb(28,24,22)_58%,rgb(12,11,10))]" />
        <iframe
          className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0 opacity-55 mix-blend-screen"
          src="https://www.youtube-nocookie.com/embed/0I-umxn_qtE?autoplay=1&mute=1&loop=1&playlist=0I-umxn_qtE&controls=0&modestbranding=1&playsinline=1&rel=0&disablekb=1&fs=0"
          title="Nifal property showcase background video"
          allow="autoplay; encrypted-media; picture-in-picture"
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(20,18,16,0.96),rgba(20,18,16,0))] md:h-28" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,18,16,0.30),rgba(20,18,16,0.84)_72%,rgba(20,18,16,0.96))]" />

        <div className="container relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl items-end px-6 py-16 md:px-8 md:py-24">
          <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.75fr] lg:items-end">
            <div className="max-w-4xl space-y-8 text-center sm:text-right">
              <SectionKicker tone="dark">WELCOME TO NIFAL</SectionKicker>
              <div className="space-y-6">
                <h1 className="max-w-full text-[3rem] font-medium leading-[1.08] tracking-normal sm:text-[4.5rem] md:max-w-4xl lg:text-[5rem]">
                  بداية موثوقة لرحلتك العقارية
                </h1>
                <p className="mx-auto max-w-[320px] text-base leading-[1.65] text-white/68 sm:mx-0 sm:max-w-[58ch] md:text-[17px]">
                  مشاريع وعقارات مختارة، نعرضها بمعلومات واضحة وتفاصيل دقيقة، لتتخذ قرارك بثقة.
                </p>
              </div>
              <div className="grid gap-3 pt-1 sm:flex sm:flex-wrap">
                <Link to="/properties" className="w-full sm:w-auto">
                  <Button className="h-12 w-full rounded-md bg-accent px-8 text-[13px] font-medium text-accent-foreground hover:bg-accent-hover sm:w-auto">
                    تصفح العقارات
                    <ArrowUpLeft className="ms-2 h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href={buildWhatsAppUrl(
                    COMPANY_WHATSAPP,
                    "السلام عليكم، أرغب بالاستفسار عن عقارات نِفال",
                  )}
                  target="_blank"
                  rel="noopener"
                >
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-md border-white/25 bg-white/8 px-8 text-[13px] font-medium text-white backdrop-blur hover:bg-white/14 sm:w-auto"
                  >
                    <MessageCircle className="ms-2 h-4 w-4" />
                    تواصل واتساب
                  </Button>
                </a>
              </div>
            </div>

            <div className="hidden justify-self-end rounded-lg border border-white/12 bg-[rgba(20,18,16,0.66)] p-6 shadow-[0_24px_80px_-44px_rgba(0,0,0,0.9)] backdrop-blur md:block lg:w-[390px]">
              <p className="text-[17px] font-medium leading-8 text-white">
                تجربة عقارية أكثر هدوءا: صورة واضحة، تفاصيل كافية، وتواصل سريع قبل أي زيارة.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-6 text-center">
                {statItems.slice(0, 3).map((item) => (
                  <div key={item.label}>
                    <div className="tabular text-2xl font-medium text-accent">
                      {formatNumber(item.value)}
                    </div>
                    <div className="mt-1 text-[11px] font-normal tracking-[0.04em] text-white/56">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 bg-surface">
        <div className="container mx-auto grid max-w-7xl grid-cols-2 divide-x divide-x-reverse divide-border/70 px-6 md:grid-cols-4 md:px-8">
          {statItems.map((item) => (
            <div key={item.label} className="flex items-center gap-4 py-6 md:py-8">
              <item.icon className="h-5 w-5 shrink-0 text-accent-dark" />
              <div>
                <div className="tabular text-2xl font-medium leading-none text-primary md:text-3xl">
                  {formatNumber(item.value)}
                </div>
                <div className="mt-1 text-[11px] font-normal uppercase tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
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
        kicker="FEATURED PROPERTIES"
        title="اختيارات تناسب السكن والاستثمار"
        description="عقارات منتقاة من فريق نِفال، مرتبة بصورة واضحة حتى تقارن بين السعر، الموقع، والمساحة بسرعة."
        properties={featured.rows as PropertyCardData[]}
      />

      {latest.length > 0 && (
        <PropertySection
          kicker="LATEST PROJECTS"
          title="فرص أضيفت حديثا"
          description="تابع أحدث العقارات المتاحة في المدن التي نخدمها، مع تفاصيل مركزة وصور تقود القرار."
          properties={latest as PropertyCardData[]}
          muted
        />
      )}

      <section className="bg-surface py-20 md:py-28">
        <div className="container mx-auto grid max-w-7xl gap-10 px-6 md:px-8 lg:grid-cols-[0.96fr_1.04fr] lg:items-start">
          <div className="space-y-8 lg:col-start-2 lg:row-start-1">
            <div className="space-y-5">
              <SectionKicker>WHY NIFAL</SectionKicker>
              <h2 className="max-w-xl text-[2.6rem] font-medium leading-[1.1] text-foreground md:text-[3.35rem]">
                الأساسيات العقارية، مرتبة بوضوح.
              </h2>
              <p className="max-w-[58ch] text-[15px] leading-[1.7] text-muted-foreground md:text-base">
                تجربة نِفال تضع الصورة والمعلومة في المقدمة، مع تفاصيل عملية تساعد العميل على
                المقارنة قبل التواصل.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  icon: "shield",
                  title: "شفافية العرض",
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
              ].map((item) => (
                <div
                  key={item.title}
                  className="grid grid-cols-[56px_1fr] gap-4 rounded-lg border border-border bg-surface p-5"
                >
                  <div className="flex h-11 w-11 items-center justify-center text-foreground">
                    <PixelIcon kind={item.icon} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-[14px] leading-[1.55] text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[480px] overflow-hidden rounded-lg border border-border bg-neutral-100 md:min-h-[560px] lg:col-start-1 lg:row-start-1">
            <img
              src={valueImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,24,22,0.00),rgba(28,24,22,0.10))]" />
            <div className="absolute left-6 top-6 max-w-xs rounded-lg bg-[rgba(24,20,18,0.88)] p-6 text-white shadow-[0_20px_60px_-35px_rgba(0,0,0,0.85)] backdrop-blur">
              <p className="text-base font-medium leading-8 md:text-lg">
                تفاصيل واضحة تساعد العميل على اختيار العقار بثقة.
              </p>
            </div>
            <div className="absolute bottom-6 left-6 flex gap-2">
              <button
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface text-foreground shadow-sm"
                aria-label="السابق"
              >
                <ArrowUpLeft className="h-5 w-5 rotate-45" />
              </button>
              <button
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface text-foreground shadow-sm"
                aria-label="التالي"
              >
                <ArrowUpLeft className="h-5 w-5 -rotate-[135deg]" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        className="overflow-hidden border-y border-border bg-surface py-6"
        aria-hidden="true"
      >
        <div className="flex w-max gap-10 whitespace-nowrap text-[4rem] font-semibold uppercase leading-none tracking-[0.16em] text-transparent [-webkit-text-stroke:1px_rgba(74,21,24,0.26)] md:text-[5.5rem]">
          <span>NIFAL REAL ESTATE</span>
          <span>NIFAL REAL ESTATE</span>
          <span>NIFAL REAL ESTATE</span>
        </div>
      </section>

      {bestSelling.length > 0 && (
        <PropertySection
          kicker="BEST SELLING"
          title="مشاريع عليها طلب واضح"
          description="عقارات حققت اهتماما أعلى، مناسبة لمن يبحث عن مؤشرات طلب قبل التواصل."
          properties={bestSelling as PropertyCardData[]}
        />
      )}

      <section className="px-6 pb-20 md:px-8 md:pb-28">
        <div className="container mx-auto max-w-7xl rounded-lg bg-primary px-6 py-12 text-primary-foreground md:px-10 md:py-16">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <SectionKicker tone="dark">START THE CONVERSATION</SectionKicker>
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
              <Button className="h-12 rounded-md bg-accent px-8 text-[13px] font-medium text-accent-foreground hover:bg-accent-hover">
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
  kicker,
  title,
  description,
  properties,
  muted = false,
}: {
  kicker: string;
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
            <SectionKicker>{kicker}</SectionKicker>
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

function SectionKicker({
  children,
  tone = "light",
}: {
  children: string;
  tone?: "light" | "dark";
}) {
  return (
    <p
      dir="ltr"
      className={
        tone === "dark"
          ? "text-[11px] font-normal uppercase tracking-[0.18em] text-white/58"
          : "text-[11px] font-normal uppercase tracking-[0.18em] text-foreground/55"
      }
    >
      <span className={tone === "dark" ? "text-accent" : "text-primary"}>/</span> {children}
    </p>
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
