import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Eye, Target, Shield } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن | نفال العقارية" },
      { name: "description", content: "تعرّف على نِفال العقارية، رؤيتنا، رسالتنا وقيمنا." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col pt-16">
      <SiteHeader />
      <section className="surface-hero py-16">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">من نحن</h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            نفال العقارية شركة عقارية سعودية متخصصة في التسويق العقاري، وبيع وشراء العقارات،
            وتأجيرها، وتسويق المشاريع العقارية، تعمل وفق مبادئ الوضوح، والجودة، والثقة.
          </p>
        </div>
      </section>
      <section className="container mx-auto max-w-4xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Eye,
              title: "رؤيتنا",
              text: "أن تكون نفال مرجعًا موثوقًا في تقديم الحلول العقارية، وبناء قيمة مستدامة تمتد أثرًا عبر الأجيال.",
            },
            {
              icon: Target,
              title: "رسالتنا",
              text: "نمكّن عملاءنا من اتخاذ قرارات عقارية واثقة، من خلال معلومات واضحة، وتسويق احترافي، وتجربة موثوقة ترتكز على الجودة، وتحقق قيمة مستدامة لجميع الأطراف.",
            },
            {
              icon: Shield,
              title: "قيمنا",
              values: ["الثقة", "الجودة", "الاحترافية", "الشفافية", "الابتكار", "الاستدامة"],
            },
          ].map((v) => (
            <div key={v.title} className="card-elegant p-6 text-center">
              <v.icon className="h-7 w-7 text-accent-dark mx-auto mb-3" />
              <h3 className="font-bold mb-2">{v.title}</h3>
              {v.text ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{v.text}</p>
              ) : (
                <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-muted-foreground">
                  {v.values?.map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
