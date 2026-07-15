import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { buildWhatsAppUrl, COMPANY_WHATSAPP } from "@/lib/format";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا | نفال العقارية" },
      {
        name: "description",
        content: "تواصل مع فريق نِفال العقارية للاستفسار عن العقارات والخدمات.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `السلام عليكم،\nالاسم: ${form.name}\nالجوال: ${form.phone}\n${form.message}`;
    window.open(buildWhatsAppUrl(COMPANY_WHATSAPP, msg), "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <SiteHeader />
      <section className="surface-hero py-16">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">تواصل معنا</h1>
          <p className="text-primary-foreground/80">
            أرسل استفسارك وسيتواصل معك فريق نِفال في أقرب وقت.
          </p>
        </div>
      </section>
      <section className="container mx-auto max-w-6xl px-4 py-16 grid gap-8 md:grid-cols-2">
        <div className="card-elegant p-6 space-y-4">
          <h2 className="text-xl font-bold">معلومات التواصل</h2>
          {[
            { icon: Phone, label: "الهاتف", value: "0550052120" },
            { icon: MessageCircle, label: "واتساب", value: "+966 55 005 2120" },
            { icon: Mail, label: "البريد", value: "nafal.com.sa@gmail.com" },
            { icon: MapPin, label: "العنوان", value: "الرياض، المملكة العربية السعودية" },
            { icon: Clock, label: "ساعات العمل", value: "السبت - الخميس: 9 صباحاً - 9 مساءً" },
          ].map((i) => (
            <div key={i.label} className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-tint flex items-center justify-center text-primary">
                <i.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{i.label}</p>
                <p className="font-medium">{i.value}</p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={onSubmit} className="card-elegant p-6 space-y-4">
          <h2 className="text-xl font-bold">أرسل لنا رسالة</h2>
          <div>
            <Label>الاسم</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <Label>رقم الجوال</Label>
            <Input
              required
              dir="ltr"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <Label>الرسالة</Label>
            <Textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
          </div>
          <Button type="submit" className="w-full btn-hero h-11">
            <MessageCircle className="ms-2 h-4 w-4" /> إرسال عبر واتساب
          </Button>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}
