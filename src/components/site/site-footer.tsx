import { NafalLogo } from "@/components/brand/logo";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { DEPARTMENT_CONTACTS, buildWhatsAppUrl, formatPhone } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="surface-hero mt-20">
      <div className="container mx-auto max-w-7xl px-4 py-12 grid gap-10 md:grid-cols-4">
        <div className="space-y-4">
          <div className="[&_*]:text-primary-foreground">
            <NafalLogo />
          </div>
          <p className="text-sm text-primary-foreground/80 leading-relaxed">
            نفال العقارية في المملكة العربية السعودية. تسويق عقاري، بيع وشراء، وتأجير، بمعلومات
            واضحة وتواصل مباشر.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-4">روابط سريعة</h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            <li>
              <Link to="/properties" className="hover:text-accent">
                العقارات
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-accent">
                من نحن
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-accent">
                تواصل معنا
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">تواصل معنا</h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            {DEPARTMENT_CONTACTS.map((d) => (
              <li key={d.label} className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-primary-foreground/60">{d.label}</span>
                <a href={`tel:+966${d.phone.slice(1)}`} dir="ltr" className="hover:text-accent">
                  {formatPhone(d.phone)}
                </a>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0 text-accent" />
              <a
                href={buildWhatsAppUrl(
                  DEPARTMENT_CONTACTS[0].whatsapp,
                  "السلام عليكم، أرغب بالاستفسار عن عقارات نفال",
                )}
                target="_blank"
                rel="noopener"
                className="hover:text-accent"
              >
                واتساب
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent" /> nafal.com.sa@gmail.com
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> الرياض، المملكة العربية السعودية
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">رؤيتنا</h3>
          <p className="text-sm text-primary-foreground/80 leading-relaxed">
            أن نكون الخيار الأول لمن يبحث عن قرار عقاري واضح يثق به.
          </p>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-4 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} نفال العقارية. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
