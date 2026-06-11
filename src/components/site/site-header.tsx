import { Link } from "@tanstack/react-router";
import { NafalLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

const links = [
  { to: "/", label: "الرئيسية" },
  { to: "/properties", label: "العقارات" },
  { to: "/about", label: "من نحن" },
  { to: "/contact", label: "تواصل معنا" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur border-b border-border">
      <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center"><NafalLogo /></Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors rounded-md hover:bg-primary-tint"
              activeProps={{ className: "text-primary bg-primary-tint" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <Link to="/login"><Button variant="outline" size="sm">دخول الإدارة</Button></Link>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="القائمة">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-surface">
          <nav className="container mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="px-3 py-2 rounded-md hover:bg-primary-tint" onClick={() => setOpen(false)}>{l.label}</Link>
            ))}
            <Link to="/login" className="px-3 py-2 rounded-md text-primary font-medium" onClick={() => setOpen(false)}>دخول الإدارة</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
