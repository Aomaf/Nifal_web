import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { listAdminProperties, getCurrentUserRole } from "@/lib/properties.functions";
import {
  Building2,
  Eye,
  Star,
  TrendingUp,
  Inbox,
  Home,
  Key,
  Clock,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  KpiCard,
  SectionCard,
  PageHeader,
  EmptyState,
  ActivityFeed,
  type ActivityItem,
} from "@/components/dashboard";
import { StatBadge } from "@/components/dashboard";

const propsQO = queryOptions({
  queryKey: ["admin-properties", 1, ""],
  queryFn: () => listAdminProperties({ data: { page: 1, pageSize: 100 } }),
  select: (d) => d.rows,
});
const roleQO = queryOptions({
  queryKey: ["my-role"],
  queryFn: () => getCurrentUserRole(),
});

const MONTHLY_DATA = [
  { month: "يناير", leads: 12, deals: 3 },
  { month: "فبراير", leads: 18, deals: 5 },
  { month: "مارس", leads: 24, deals: 7 },
  { month: "أبريل", leads: 15, deals: 4 },
  { month: "مايو", leads: 28, deals: 9 },
  { month: "يونيو", leads: 22, deals: 6 },
];

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: "1",
    icon: Building2,
    iconColor: "primary",
    text: "تم إضافة عقار جديد في الرياض",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    badge: "عقار",
  },
  {
    id: "2",
    icon: Inbox,
    iconColor: "success",
    text: "طلب تواصل جديد من أحمد محمد",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    badge: "طلب",
  },
  {
    id: "3",
    icon: Eye,
    iconColor: "accent",
    text: "تم نشر عقار في جدة",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
  },
  {
    id: "4",
    icon: Star,
    iconColor: "warning",
    text: "تم تمييز عقار الرياض - حي النرجس",
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
  },
  {
    id: "5",
    icon: TrendingUp,
    iconColor: "muted",
    text: "تحديث سعر فيلا الدرعية",
    timestamp: new Date(Date.now() - 1000 * 60 * 360),
  },
];

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: props, isLoading } = useQuery(propsQO);
  const { data: role } = useQuery(roleQO);

  const total = props?.length ?? 0;
  const published = props?.filter((p) => p.is_published).length ?? 0;
  const featured = props?.filter((p) => p.is_featured).length ?? 0;
  const totalViews = props?.reduce((sum, p) => sum + (p.views_count ?? 0), 0) ?? 0;
  const availableForSale =
    props?.filter((p) => p.status === "available" && p.purpose === "sale").length ?? 0;
  const forRent = props?.filter((p) => p.purpose === "rent").length ?? 0;
  const reserved = props?.filter((p) => p.status === "reserved").length ?? 0;
  const totalLeads = props?.reduce((sum, p) => sum + (p.leads_count ?? 0), 0) ?? 0;

  const noRoles = role && role.roles.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader title="لوحة التحكم" subtitle="نظرة عامة على نشاط منصة نِفال العقارية" />

      {noRoles && (
        <div className="card-elegant p-4 border-warning/40 bg-warning/5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">حسابك مفعّل لكن بدون صلاحيات بعد.</p>
            <p className="text-muted-foreground mt-1">
              يحتاج المدير العام إلى منحك دور (مثل: property_manager) لتتمكن من إدارة العقارات.
              معرف المستخدم:{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{role.userId}</code>
            </p>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <KpiCard
          icon={Building2}
          label="إجمالي العقارات"
          value={total}
          tint="primary"
          loading={isLoading}
        />
        <KpiCard icon={Eye} label="منشور" value={published} tint="success" loading={isLoading} />
        <KpiCard icon={Star} label="مميز" value={featured} tint="accent" loading={isLoading} />
        <KpiCard
          icon={TrendingUp}
          label="إجمالي المشاهدات"
          value={totalViews}
          tint="primary"
          loading={isLoading}
        />
        <KpiCard
          icon={Home}
          label="متاح للبيع"
          value={availableForSale}
          tint="success"
          loading={isLoading}
        />
        <KpiCard icon={Key} label="للإيجار" value={forRent} tint="accent" loading={isLoading} />
        <KpiCard icon={Clock} label="محجوز" value={reserved} tint="warning" loading={isLoading} />
        <KpiCard
          icon={Inbox}
          label="إجمالي الطلبات"
          value={totalLeads}
          tint="destructive"
          loading={isLoading}
        />
      </div>

      <div className="dashboard-grid-2">
        <SectionCard title="النشاط الشهري" subtitle="الطلبات والصفقات – آخر 6 أشهر">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_DATA} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "12px", fontFamily: "inherit" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  formatter={(v) => (v === "leads" ? "الطلبات" : "الصفقات")}
                />
                <Bar
                  dataKey="leads"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="deals"
                  fill="var(--color-accent)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="النشاط الأخير">
          <ActivityFeed items={MOCK_ACTIVITIES} />
        </SectionCard>
      </div>

      <SectionCard title="إجراءات سريعة">
        <div className="flex flex-wrap gap-3">
          <Button className="btn-hero" asChild>
            <Link to="/admin/properties">
              <Plus className="h-4 w-4 me-1.5" />
              عقار جديد
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/leads">
              <Inbox className="h-4 w-4 me-1.5" />
              طلب جديد
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/owners">
              <Building2 className="h-4 w-4 me-1.5" />
              مالك جديد
            </Link>
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="آخر العقارات المضافة"
        headerAction={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/properties">عرض الكل</Link>
          </Button>
        }
      >
        {props && props.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="لا توجد عقارات بعد"
            description="أضف أول عقار للبدء في إدارة المنصة"
            action={{ label: "أضف أول عقار", to: "/admin/properties" }}
          />
        ) : (
          <div className="space-y-1">
            {props?.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.city}
                    {p.district ? ` · ${p.district}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatBadge variant={p.is_published ? "published" : "draft"} />
                  {p.is_featured && <StatBadge variant="stage-active" label="مميز" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
