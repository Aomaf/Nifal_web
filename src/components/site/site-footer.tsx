import { NafalLogo } from "@/components/brand/logo";
import { Link } from "@tanstack/react-router";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="surface-hero mt-20">
      <div className="container mx-auto max-w-7xl px-4 py-12 grid gap-10 md:grid-cols-4">
        <div className="space-y-4">
          <div className="[&_*]:text-primary-foreground"><NafalLogo /></div>
          <p className="text-sm text-primary-foreground/80 leading-relaxed">
            شريكك الموثوق في عالم العقارات بالمملكة العربية السعودية. خدمات شاملة للبيع والإيجار والاستثمار.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-4">روابط سريعة</h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            <li><Link to="/properties" className="hover:text-accent">العقارات</Link></li>
            <li><Link to="/about" className="hover:text-accent">من نحن</Link></li>
            <li><Link to="/contact" className="hover:text-accent">تواصل معنا</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">تواصل معنا</h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> 920000000</li>
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-accent" /> واتساب</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> info@nafal.sa</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> الرياض، المملكة العربية السعودية</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">رؤيتنا</h3>
          <p className="text-sm text-primary-foreground/80 leading-relaxed">
            نسعى لأن نكون الخيار الأول للعملاء في تقديم الحلول العقارية المبتكرة والموثوقة.
          </p>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-4 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} نِفال العقارية. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
