import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { listAdminProperties, getCurrentUserRole } from "@/lib/properties.functions";
import { Building2, Eye, TrendingUp, Inbox, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

const propsQO = queryOptions({ queryKey: ["admin-properties"], queryFn: () => listAdminProperties() });
const roleQO = queryOptions({ queryKey: ["my-role"], queryFn: () => getCurrentUserRole() });

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: props } = useQuery(propsQO);
  const { data: role } = useQuery(roleQO);

  const total = props?.length ?? 0;
  const published = props?.filter((p) => p.is_published).length ?? 0;
  const featured = props?.filter((p) => p.is_featured).length ?? 0;
  const totalViews = props?.reduce((sum, p) => sum + (p.views_count ?? 0), 0) ?? 0;

  const noRoles = role && role.roles.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground text-sm mt-1">نظرة عامة على نشاط منصة نِفال العقارية</p>
        </div>
        <Link to="/admin/properties"><Button className="btn-hero h-10"><Plus className="ms-2 h-4 w-4" /> عقار جديد</Button></Link>
      </div>

      {noRoles && (
        <div className="card-elegant p-4 border-warning/40 bg-warning/5 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">حسابك مفعّل لكن بدون صلاحيات بعد.</p>
            <p className="text-muted-foreground mt-1">
              يحتاج المدير العام إلى منحك دور (مثل: property_manager) لتتمكن من إدارة العقارات. معرف المستخدم: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{role.userId}</code>
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Building2} label="إجمالي العقارات" value={total} tint="primary" />
        <Kpi icon={Eye} label="منشور" value={published} tint="success" />
        <Kpi icon={TrendingUp} label="مميز" value={featured} tint="accent" />
        <Kpi icon={Inbox} label="إجمالي المشاهدات" value={totalViews} tint="primary" />
      </div>

      <div className="card-elegant p-6">
        <h2 className="text-lg font-bold mb-4">آخر العقارات</h2>
        {props && props.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>لا توجد عقارات بعد</p>
            <Link to="/admin/properties"><Button className="mt-3" variant="outline"><Plus className="ms-2 h-4 w-4" /> أضف أول عقار</Button></Link>
          </div>
        )}
        <div className="space-y-2">
          {props?.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.city}{p.district ? ` · ${p.district}` : ""}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {p.is_published ? <span className="px-2 py-0.5 rounded-full bg-success/10 text-success">منشور</span> : <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">مسودة</span>}
                {p.is_featured && <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent-dark">مميز</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tint }: { icon: typeof Building2; label: string; value: number; tint: "primary" | "success" | "accent" }) {
  const tintCls = tint === "success" ? "bg-success/10 text-success" : tint === "accent" ? "bg-accent/15 text-accent-dark" : "bg-primary-tint text-primary";
  return (
    <div className="card-elegant p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tintCls}`}><Icon className="h-5 w-5" /></div>
      </div>
      <div className="text-2xl font-bold tabular">{formatNumber(value)}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
