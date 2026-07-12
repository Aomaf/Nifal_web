import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState, Component, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NafalLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Bell,
  ChevronsLeft,
  ChevronsRight,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

// Error boundary for individual admin route crashes
class RouteErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
          <p className="text-lg font-medium text-destructive">حدث خطأ غير متوقع</p>
          <p className="text-sm text-muted-foreground max-w-md">{this.state.message}</p>
          <button
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/85"
            onClick={() => this.setState({ hasError: false, message: "" })}
          >
            حاول مجدداً
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/nifal-console" });
    return { user: data.session.user };
  },
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: React.ElementType; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "عام",
    items: [
      { to: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "المبيعات والعملاء",
    items: [
      { to: "/admin/properties", label: "العقارات", icon: Building2 },
      { to: "/admin/owners", label: "الملاك", icon: UserCircle },
      { to: "/admin/clients", label: "العملاء", icon: Users },
      { to: "/admin/leads", label: "الطلبات", icon: Inbox },
    ],
  },
  {
    label: "الإيجارات والمالية",
    items: [
      { to: "/admin/rentals", label: "الإيجارات", icon: Key },
      { to: "/admin/collections", label: "التحصيلات", icon: Wallet },
      { to: "/admin/maintenance", label: "الصيانة", icon: Wrench },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { to: "/admin/reports", label: "التقارير", icon: BarChart3 },
      { to: "/admin/users", label: "المستخدمون", icon: Shield },
      { to: "/admin/settings", label: "الإعدادات", icon: Settings },
    ],
  },
];

const MOBILE_NAV = [
  { to: "/admin", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { to: "/admin/properties", label: "العقارات", icon: Building2 },
  { to: "/admin/clients", label: "العملاء", icon: Users },
  { to: "/admin/leads", label: "الطلبات", icon: Inbox },
  { to: "/admin/rentals", label: "الإيجارات", icon: Key },
];

function AdminLayout() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "true",
  );
  const [userEmail, setUserEmail] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  // Session lifecycle: redirect on sign-out, refresh queries on token refresh
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.navigate({ to: "/nifal-console", replace: true });
      } else if (event === "TOKEN_REFRESHED") {
        queryClient.invalidateQueries();
      }
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  // Cmd+K global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    router.navigate({ to: "/nifal-console", replace: true });
  };

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  }

  const avatarInitial = userEmail ? userEmail[0].toUpperCase() : "؟";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Overlay for mobile */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 h-screen surface-hero z-40 transform transition-all duration-200
          ${collapsed ? "w-16" : "w-64"}
          ${open ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="px-4 py-3 border-b border-primary-foreground/10 flex items-center justify-between min-h-14">
            <NafalLogo className={collapsed ? "h-7 w-7" : "h-8 w-auto"} inverted />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-primary-foreground shrink-0"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Nav groups */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                {!collapsed && (
                  <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/40 select-none">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to as never}
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${active
                            ? "bg-primary-foreground/15 text-white"
                            : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                          }
                          ${collapsed ? "justify-center" : ""}`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : ""}`} />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom: user + collapse */}
          <div className="border-t border-primary-foreground/10">
            {/* User row */}
            {!collapsed && (
              <div className="px-4 py-3 flex items-center gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary-foreground/20 text-white text-sm font-bold">
                    {avatarInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 truncate">{userEmail || "..."}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  title="تسجيل الخروج"
                  className="h-7 w-7 text-primary-foreground/50 hover:text-white hover:bg-primary-foreground/10 shrink-0"
                  onClick={signOut}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {/* Collapse toggle (desktop) */}
            <div className={`px-2 ${collapsed ? "py-3" : "pb-2"}`}>
              <Button
                variant="ghost"
                size="icon"
                title={collapsed ? "توسيع القائمة" : "طي القائمة"}
                className={`w-full h-8 text-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-primary-foreground hidden lg:flex
                  ${collapsed ? "justify-center" : "justify-end px-2"}`}
                onClick={toggleCollapsed}
              >
                {collapsed ? (
                  <ChevronsLeft className="h-4 w-4" />
                ) : (
                  <ChevronsRight className="h-4 w-4" />
                )}
              </Button>
              {/* Collapsed sign-out */}
              {collapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="تسجيل الخروج"
                  className="w-full h-8 mt-1 text-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-white flex justify-center"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header — always visible */}
        <header className="h-14 sticky top-0 z-30 bg-surface border-b border-border flex items-center px-4 gap-3">
          {/* Mobile: hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Mobile: logo */}
          <div className="lg:hidden me-auto">
            <NafalLogo className="h-8 w-auto" />
          </div>

          {/* Desktop: spacer */}
          <div className="hidden lg:block flex-1" />

          {/* Global search trigger */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex items-center gap-2 text-muted-foreground border border-border rounded-lg px-3 h-9"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">بحث...</span>
            <kbd className="ms-2 text-xs bg-muted rounded px-1.5 py-0.5">⌘K</kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Notification bell */}
          <div className="relative">
            <Button variant="ghost" size="icon" aria-label="الإشعارات">
              <Bell className="h-5 w-5" />
            </Button>
            {/* Badge — uncomment when count > 0:
            <span className="absolute -top-0.5 -end-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
              3
            </span>
            */}
          </div>

          {/* User avatar + dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {avatarInitial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {userEmail && (
                <div className="px-3 py-2 text-xs text-muted-foreground truncate">{userEmail}</div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/settings" className="w-full cursor-pointer">
                  <Settings className="h-4 w-4 me-2" />
                  الإعدادات
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4 me-2" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-20 lg:pb-6 overflow-x-hidden">
          <RouteErrorBoundary>
            <Outlet />
          </RouteErrorBoundary>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border flex lg:hidden">
          {MOBILE_NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors min-h-14 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground min-h-14"
            onClick={() => setOpen(true)}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>المزيد</span>
          </button>
        </nav>
      </div>

      {/* Global search dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">بحث</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="ابحث في العقارات، العملاء، الطلبات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9"
            />
          </div>
          {searchQuery.length > 0 && (
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p className="px-2 text-xs font-medium text-muted-foreground mb-2">نتائج البحث</p>
              <Link
                to="/admin/properties"
                onClick={() => setSearchOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted"
              >
                <Building2 className="h-4 w-4 text-primary" />
                <span>العقارات التي تحتوي على &quot;{searchQuery}&quot;</span>
              </Link>
              <Link
                to="/admin/clients"
                onClick={() => setSearchOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted"
              >
                <Users className="h-4 w-4 text-primary" />
                <span>العملاء الذين يحتوي اسمهم على &quot;{searchQuery}&quot;</span>
              </Link>
              <Link
                to="/admin/leads"
                onClick={() => setSearchOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted"
              >
                <Inbox className="h-4 w-4 text-primary" />
                <span>الطلبات المرتبطة بـ &quot;{searchQuery}&quot;</span>
              </Link>
            </div>
          )}
          {searchQuery.length === 0 && (
            <div className="mt-2 space-y-1">
              <p className="px-2 text-xs text-muted-foreground mb-2">الوصول السريع</p>
              {navGroups.flatMap((g) => g.items).slice(0, 6).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to as never}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted text-sm"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
