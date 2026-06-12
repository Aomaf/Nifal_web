import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPublicProperties, getHomeStats, listLatestProjects, listBestSellingProjects } from "@/lib/properties.functions";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { PropertyCard } from "@/components/site/property-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, HandshakeIcon, Eye, Target, Shield, MessageCircle, CheckCircle2 } from "lucide-react";
import { buildWhatsAppUrl, COMPANY_WHATSAPP, formatNumber, formatSAR } from "@/lib/format";

const featuredQO = queryOptions({
  queryKey: ["home-featured"],
  queryFn: () => listPublicProperties({ data: { featuredOnly: true, pageSize: 6, sort: "newest", page: 1 } }),
});
const statsQO = queryOptions({ queryKey: ["home-stats"], queryFn: () => getHomeStats() });
const latestQO = queryOptions({ queryKey: ["home-latest"], queryFn: () => listLatestProjects() });
const bestSellingQO = queryOptions({ queryKey: ["home-best-selling"], queryFn: () => listBestSellingProjects() });

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

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="surface-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, var(--accent) 0px, transparent 400px), radial-gradient(circle at 80% 80%, var(--accent) 0px, transparent 400px)" }} />
        <div className="container mx-auto max-w-7xl px-4 py-20 md:py-28 relative">
          <div className="max-w-3xl space-y-6">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-medium border border-accent/30">
              نِفال العقارية · شريكك في الاستثمار العقاري
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              عقارك المثالي <br />
              <span className="text-accent">بين يديك</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl leading-relaxed">
              اكتشف أفضل العقارات السكنية والتجارية في الرياض وجدة والدمام. خدمة احترافية، شفافية كاملة، وأسعار تنافسية.
            </p>
            <div className="flex flex-wrap gap-3 pt-4">
              <Link to="/properties"><Button className="btn-hero h-12 px-8 text-base">تصفح العقارات</Button></Link>
              <a href={buildWhatsAppUrl(COMPANY_WHATSAPP, "السلام عليكم، أرغب بالاستفسار عن خدماتكم العقارية")} target="_blank" rel="noopener">
                <Button variant="outline" className="h-12 px-8 text-base border-accent/40 text-primary-foreground hover:bg-accent/10">
                  <MessageCircle className="ms-2 h-4 w-4" /> تواصل واتساب
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container mx-auto max-w-7xl px-4 -mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((s) => (
            <div key={s.label} className="card-elegant p-6 text-center">
              <s.icon className="h-7 w-7 mx-auto text-accent-dark mb-2" />
              <div className="text-3xl font-bold text-primary tabular">{formatNumber(s.value)}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">مشاريع مميزة</h2>
            <p className="text-muted-foreground mt-1">اختيارات منتقاة لأبرز مشاريعنا المتاحة</p>
          </div>
          <Link to="/properties" className="text-sm font-medium text-accent-dark hover:text-primary">عرض الكل ←</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.rows.map((p) => <PropertyCard key={p.id} p={p as never} />)}
        </div>
      </section>

      {/* LATEST PROJECTS */}
      {latest.length > 0 && (
        <section className="bg-primary-tint py-16">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold">أحدث المشاريع</h2>
                <p className="text-muted-foreground mt-1">مشاريع متاحة أضيفت حديثاً</p>
              </div>
              <Link to="/properties" className="text-sm font-medium text-accent-dark hover:text-primary">
                جميع المشاريع ←
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((p) => <PropertyCard key={p.id} p={p as never} />)}
            </div>
          </div>
        </section>
      )}

      {/* BEST SELLING */}
      {bestSelling.length > 0 && (
        <section className="container mx-auto max-w-7xl px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">المشاريع الأكثر مبيعاً</h2>
              <p className="text-muted-foreground mt-1">المشاريع الأعلى نسبة مبيعات لدينا</p>
            </div>
            <Link to="/properties" className="text-sm font-medium text-accent-dark hover:text-primary">
              عرض الكل ←
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bestSelling.map((p) => (
              <Link
                key={p.id}
                to="/properties/$id"
                params={{ id: p.id }}
                className="card-elegant overflow-hidden block group"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-muted">
                  {(() => {
                    const imgs = (p.property_images ?? []).slice().sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
                    const cover = imgs[0]?.image_url ?? "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200";
                    return (
                      <img
                        src={cover}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    );
                  })()}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {p.sold_percentage != null && (
                      <Badge className="bg-primary text-primary-foreground">
                        {p.sold_percentage}% مباع
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">{p.title}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {p.city}{p.district ? ` · ${p.district}` : ""}
                  </p>
                  {p.sold_percentage != null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>نسبة المبيعات</span>
                        <span className="font-semibold text-primary">{p.sold_percentage}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-linear-to-l from-accent to-accent-dark transition-all"
                          style={{ width: `${p.sold_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-lg font-bold text-primary tabular">{formatSAR(p.price)}</span>
                    <span className="text-xs text-accent-dark font-medium">شاهد التفاصيل ←</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* WHY US */}
      <section className="bg-primary-tint py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">لماذا تختار نِفال؟</h2>
            <p className="text-muted-foreground mt-2">قيمنا التي نلتزم بها مع كل عميل</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Eye, title: "رؤيتنا", text: "أن نكون الخيار الأول للعملاء في تقديم الحلول العقارية المتكاملة في المملكة." },
              { icon: Target, title: "رسالتنا", text: "تمكين عملائنا من اتخاذ قرارات عقارية ذكية من خلال الشفافية والاحترافية." },
              { icon: Shield, title: "قيمنا", text: "النزاهة، الجودة، الالتزام، والشغف بخدمة عملائنا في كل تفاصيل التعامل." },
            ].map((v) => (
              <div key={v.title} className="card-elegant p-8 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark text-primary mb-4">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{v.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">الإحصائيات</h2>
          <p className="text-muted-foreground mt-2">أرقام تعكس ثقة عملائنا وحجم تجربتنا</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Building2, value: formatNumber(stats.totalProperties), label: "إجمالي العقارات" },
            { icon: CheckCircle2, value: formatNumber(stats.availableProjects), label: "مشروع متاح" },
            { icon: HandshakeIcon, value: formatNumber(stats.completedDeals), label: "صفقة منجزة" },
            { icon: Eye, value: formatNumber(stats.happyClients), label: "عميل سعيد" },
          ].map((s) => (
            <div key={s.label} className="card-elegant p-8 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-accent/20 to-accent/40 text-accent-dark mb-4">
                <s.icon className="h-6 w-6" />
              </div>
              <div className="text-4xl font-bold text-primary tabular mb-1">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-7xl px-4 py-16">
        <div className="surface-hero rounded-3xl p-10 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">جاهز لتجد عقارك المثالي؟</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">فريقنا جاهز للإجابة على استفساراتك ومساعدتك في اتخاذ القرار الأفضل</p>
          <a href={buildWhatsAppUrl(COMPANY_WHATSAPP, "السلام عليكم، أرغب بالتواصل معكم")} target="_blank" rel="noopener">
            <Button className="btn-hero h-12 px-8 text-base"><MessageCircle className="ms-2 h-4 w-4" /> تواصل عبر واتساب</Button>
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
