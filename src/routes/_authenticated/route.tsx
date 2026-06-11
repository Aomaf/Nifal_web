import { createFileRoute, Outlet, redirect, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NafalLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  Users,
  Inbox,
  Key,
  Wallet,
  Wrench,
  UserCircle,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { to: "/admin/properties", label: "العقارات", icon: Building2 },
  { to: "/admin/clients", label: "العملاء", icon: Users, disabled: true },
  { to: "/admin/leads", label: "الطلبات", icon: Inbox, disabled: true },
  { to: "/admin/rentals", label: "الإيجارات", icon: Key, disabled: true },
  { to: "/admin/collections", label: "التحصيلات", icon: Wallet, disabled: true },
  { to: "/admin/maintenance", label: "الصيانة", icon: Wrench, disabled: true },
  { to: "/admin/owners", label: "الملاك", icon: UserCircle, disabled: true },
  { to: "/admin/reports", label: "التقارير", icon: BarChart3, disabled: true },
  { to: "/admin/users", label: "المستخدمون", icon: Shield, disabled: true },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings, disabled: true },
];

function AdminLayout() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    router.navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar (right in RTL) */}
      <aside className={`fixed lg:sticky top-0 right-0 h-screen w-72 surface-hero z-40 transform transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-primary-foreground/10 flex items-center justify-between [&_*]:text-primary-foreground">
            <NafalLogo />
            <Button variant="ghost" size="icon" className="lg:hidden text-primary-foreground" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button>
          </div>
          <nav className="flex-1 p-3 overflow-y-auto space-y-1">
            {nav.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              const base = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors";
              if (item.disabled) {
                return (
                  <div key={item.to} className={`${base} text-primary-foreground/40 cursor-not-allowed`}>
                    <Icon className="h-4 w-4" /> {item.label}
                    <span className="ms-auto text-[10px] bg-primary-foreground/10 px-1.5 py-0.5 rounded">قريباً</span>
                  </div>
                );
              }
              return (
                <Link key={item.to} to={item.to} className={`${base} ${active ? "bg-accent text-primary" : "text-primary-foreground/80 hover:bg-primary-foreground/10"}`}>
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-primary-foreground/10">
            <Button variant="ghost" className="w-full justify-start text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={signOut}>
              <LogOut className="ms-2 h-4 w-4" /> تسجيل الخروج
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 sticky top-0 z-30 bg-surface border-b border-border flex items-center px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></Button>
          <div className="me-auto"><NafalLogo className="h-8 w-auto" showText={false} /></div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
