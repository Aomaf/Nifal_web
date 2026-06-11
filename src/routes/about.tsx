import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Eye, Target, Shield } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "من نحن | نِفال العقارية" },
    { name: "description", content: "تعرّف على نِفال العقارية، قصتنا، رؤيتنا، رسالتنا وقيمنا." },
  ]}),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <section className="surface-hero py-16">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">من نحن</h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">قصة شغف بالعقار، وخبرة تمتد لسنوات في خدمة سوق العقار السعودي.</p>
        </div>
      </section>
      <section className="container mx-auto max-w-4xl px-4 py-16 space-y-12">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">قصتنا</h2>
          <p className="text-muted-foreground leading-loose">
            تأسست نِفال العقارية بهدف تقديم تجربة عقارية مختلفة تمزج بين الأصالة في القيم والاحترافية في الأداء.
            نؤمن أن العقار ليس مجرد صفقة، بل قرار حياتي يستحق الاهتمام والمصداقية. فريقنا يعمل بشغف لتقديم
            الحلول العقارية الأنسب لعملائنا الكرام في مختلف مدن المملكة.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Eye, title: "رؤيتنا", text: "أن نكون الخيار الأول للعملاء في تقديم الحلول العقارية." },
            { icon: Target, title: "رسالتنا", text: "تمكين عملائنا من اتخاذ قرارات عقارية ذكية بثقة." },
            { icon: Shield, title: "قيمنا", text: "النزاهة، الجودة، الالتزام، والشغف بخدمة العميل." },
          ].map((v) => (
            <div key={v.title} className="card-elegant p-6 text-center">
              <v.icon className="h-7 w-7 text-accent-dark mx-auto mb-3" />
              <h3 className="font-bold mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
