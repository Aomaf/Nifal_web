import { Link, useRouterState } from "@tanstack/react-router";
import { NafalLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const links = [
  { to: "/", label: "الرئيسية" },
  { to: "/properties", label: "العقارات" },
  { to: "/about", label: "من نحن" },
  { to: "/contact", label: "تواصل معنا" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Only homepage has a dark hero — all other pages use a solid header immediately
  const isHomePage = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Transparent/white-text only on homepage before scroll
  const dark = isHomePage && !scrolled;

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300",
        dark
          ? "border-b border-transparent bg-transparent"
          : "border-b border-border bg-background/98 shadow-sm backdrop-blur-sm",
      ].join(" ")}
    >
      <div className="container relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">

        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center">
          <NafalLogo
            className="h-9 w-auto transition-[filter] duration-300"
            inverted={dark}
          />
        </Link>

        {/* Desktop nav — absolutely centered so removing the CTA doesn't shift it */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={[
                "text-[13px] font-normal tracking-wide transition-colors",
                dark ? "text-white/70 hover:text-white" : "text-foreground/65 hover:text-foreground",
              ].join(" ")}
              activeProps={{
                className: dark ? "!text-white font-medium" : "!text-primary font-medium",
              }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className={dark ? "md:hidden text-white hover:bg-white/10" : "md:hidden"}
          onClick={() => setOpen((v) => !v)}
          aria-label="القائمة"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className={[
            "border-t md:hidden",
            dark
              ? "border-white/15 bg-[rgba(18,15,14,0.94)] backdrop-blur-md"
              : "border-border bg-background",
          ].join(" ")}
        >
          <nav className="container mx-auto flex max-w-7xl flex-col px-4 py-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={[
                  "px-3 py-2.5 text-[14px] border-b last:border-0",
                  dark
                    ? "border-white/10 text-white/80 hover:text-white"
                    : "border-border/60 text-foreground/75 hover:text-foreground",
                ].join(" ")}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
