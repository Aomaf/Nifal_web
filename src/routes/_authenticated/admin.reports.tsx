import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { SarIcon } from "@/components/ui/sar-icon";
import {
  getFinancialReport,
  getLeadFunnelReport,
  getClientStageReport,
  getPropertyPerformanceReport,
  getOccupancyReport,
} from "@/lib/reports.functions";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: ReportsPage,
});

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

type DatePreset = "this_month" | "last_month" | "this_quarter" | "this_year" | "custom";

function getPresetRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (preset === "this_month") {
    return {
      from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: fmt(now),
    };
  }
  if (preset === "last_month") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: fmt(first), to: fmt(last) };
  }
  if (preset === "this_quarter") {
    const q = Math.floor(now.getMonth() / 3);
    return {
      from: fmt(new Date(now.getFullYear(), q * 3, 1)),
      to: fmt(now),
    };
  }
  return {
    from: fmt(new Date(now.getFullYear(), 0, 1)),
    to: fmt(now),
  };
}

function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => r[h] ?? "").join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SectionCard({
  title,
  children,
  onExport,
}: {
  title: string;
  children: React.ReactNode;
  onExport?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
        {onExport && (
          <Button size="sm" variant="outline" onClick={onExport}>
            <Download className="me-2 h-3.5 w-3.5" />
            تصدير CSV
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

function ReportsPage() {
  const [preset, setPreset] = useState<DatePreset>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { from, to } = useMemo(() => {
    if (preset === "custom") {
      return {
        from: customFrom || getPresetRange("this_year").from,
        to: customTo || new Date().toISOString().slice(0, 10),
      };
    }
    return getPresetRange(preset);
  }, [preset, customFrom, customTo]);

  const { data: financial, isLoading: loadFin } = useQuery({
    queryKey: ["report-financial", from, to],
    queryFn: () => getFinancialReport({ data: { from, to } }),
  });

  const { data: leads, isLoading: loadLeads } = useQuery({
    queryKey: ["report-leads", from, to],
    queryFn: () => getLeadFunnelReport({ data: { from, to } }),
  });

  const { data: clientStages } = useQuery({
    queryKey: ["report-client-stages", from, to],
    queryFn: () => getClientStageReport({ data: { from, to } }),
  });

  const { data: props } = useQuery({
    queryKey: ["report-properties", from, to],
    queryFn: () => getPropertyPerformanceReport({ data: { from, to } }),
  });

  const { data: occupancy } = useQuery({
    queryKey: ["report-occupancy"],
    queryFn: () => getOccupancyReport(),
  });

  const PRESETS: { key: DatePreset; label: string }[] = [
    { key: "this_month", label: "هذا الشهر" },
    { key: "last_month", label: "الشهر الماضي" },
    { key: "this_quarter", label: "هذا الربع" },
    { key: "this_year", label: "هذا العام" },
    { key: "custom", label: "مخصص" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="التقارير والتحليلات"
        breadcrumbs={[{ label: "لوحة التحكم", to: "/admin" }, { label: "التقارير" }]}
      />

      {/* Date Range Bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-4">
        {PRESETS.map((p) => (
          <Button
            key={p.key}
            size="sm"
            variant={preset === p.key ? "default" : "outline"}
            onClick={() => setPreset(p.key)}
          >
            {p.label}
          </Button>
        ))}
        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <div className="space-y-0.5">
              <Label className="text-xs">من</Label>
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs">إلى</Label>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
        )}
        <span className="ms-auto text-sm text-muted-foreground">
          {from} — {to}
        </span>
      </div>

      {/* 1. Financial Section */}
      <SectionCard
        title="المالية"
        onExport={() => exportCSV(financial?.monthly ?? [], `financial-${from}-${to}.csv`)}
      >
        {loadFin ? (
          <div className="h-52 animate-pulse rounded-lg bg-muted" />
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">إجمالي المحصّل</p>
                <p className="text-lg font-bold text-green-600">
                  {(financial?.totalCollected ?? 0).toLocaleString("en-US")} <SarIcon />
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">معلّق</p>
                <p className="text-lg font-bold text-amber-600">
                  {(financial?.totalPending ?? 0).toLocaleString("en-US")} <SarIcon />
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">متأخر</p>
                <p className="text-lg font-bold text-red-600">
                  {(financial?.totalOverdue ?? 0).toLocaleString("en-US")} <SarIcon />
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">نسبة التحصيل</p>
                <p className="text-lg font-bold">{financial?.collectionRate ?? 0}%</p>
              </div>
            </div>
            {(financial?.monthly ?? []).length > 0 && (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={financial?.monthly ?? []}>
                  <defs>
                    <linearGradient id="grad-collected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad-maintenance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString("en-US")} ر.س`} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    name="محصّل"
                    stroke="#22c55e"
                    fill="url(#grad-collected)"
                  />
                  <Area
                    type="monotone"
                    dataKey="maintenance"
                    name="صيانة"
                    stroke="#ef4444"
                    fill="url(#grad-maintenance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </SectionCard>

      {/* 2. Sales / Lead Funnel Section */}
      <SectionCard
        title="المبيعات والطلبات"
        onExport={() => exportCSV(leads?.funnel ?? [], `lead-funnel-${from}-${to}.csv`)}
      >
        {loadLeads ? (
          <div className="h-52 animate-pulse rounded-lg bg-muted" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                قمع الطلبات (إجمالي: {leads?.total ?? 0})
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={leads?.funnel ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" name="عدد" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">مراحل العملاء</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={clientStages ?? []}
                    dataKey="count"
                    nameKey="stage"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ stage, count }: { stage: string; count: number }) =>
                      count > 0 ? `${stage}: ${count}` : ""
                    }
                  >
                    {(clientStages ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </SectionCard>

      {/* 3. Rentals / Occupancy Section */}
      <SectionCard title="الإيجارات والإشغال">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">نسبة الإشغال</span>
              <span className="text-3xl font-bold text-primary">
                {occupancy?.occupancyRate ?? 0}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${occupancy?.occupancyRate ?? 0}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-muted-foreground">إجمالي</p>
                <p className="font-bold">{occupancy?.total ?? 0}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2">
                <p className="text-blue-700">مؤجّر</p>
                <p className="font-bold text-blue-800">{occupancy?.rented ?? 0}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-2">
                <p className="text-green-700">شاغر</p>
                <p className="font-bold text-green-800">{occupancy?.vacant ?? 0}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              متوسط الإيجار:{" "}
              <span className="font-medium text-foreground">
                {(occupancy?.avgRent ?? 0).toLocaleString("en-US")} <SarIcon /> / شهر
              </span>
            </p>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              أعلى عقارات بالدخل الإيجاري
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={occupancy?.topByRent ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString("en-US")} ر.س`} />
                <Bar dataKey="total" name="دخل" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SectionCard>

      {/* 4. Properties Section */}
      <SectionCard
        title="العقارات"
        onExport={() =>
          exportCSV(props?.topViewed ?? [], `properties-performance-${from}-${to}.csv`)
        }
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">الأكثر مشاهدة</p>
            <div className="space-y-2">
              {(props?.topViewed ?? []).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate text-foreground">{p.title}</span>
                  <span className="shrink-0 ms-2 text-muted-foreground">{p.views} مشاهدة</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">الأكثر استفسارات</p>
            <div className="space-y-2">
              {(props?.topInquired ?? []).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate text-foreground">{p.title}</span>
                  <span className="shrink-0 ms-2 text-muted-foreground">{p.count} طلب</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">القيمة حسب المدينة</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={props?.byCity ?? []}
                  dataKey="value"
                  nameKey="city"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label={({ city }: { city: string }) => city}
                >
                  {(props?.byCity ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${(v / 1_000_000).toFixed(1)}M ر.س`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
