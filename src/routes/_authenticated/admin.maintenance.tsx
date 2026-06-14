import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import {
  Wind,
  Zap,
  Droplets,
  Hammer,
  Paintbrush,
  Wrench,
  Plus,
  UserPlus,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Clock,
  Phone,
} from "lucide-react";
import { PageHeader, KpiCard, EmptyState } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  listAdminMaintenanceRequests,
  upsertMaintenanceRequest,
  assignTechnician,
  closeRequest,
  reopenRequest,
  getMaintenanceStats,
} from "@/lib/maintenance.functions";
import { listAdminUnits } from "@/lib/rentals.functions";
import { buildWhatsAppUrl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/maintenance")({
  component: MaintenancePage,
});

type MaintenanceRequest = {
  id: string;
  unit_id: string | null;
  property_id: string | null;
  tenant_id: string | null;
  category: "ac" | "electrical" | "plumbing" | "carpentry" | "painting" | "other";
  priority: "high" | "medium" | "low";
  title: string;
  description: string | null;
  status: "new" | "in_progress" | "closed" | "reopened";
  technician_name: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  assigned_at: string | null;
  closed_at: string | null;
  closure_notes: string | null;
  created_at: string;
  unit: { id: string; unit_number: string } | null;
  property: { id: string; title: string } | null;
  tenant: { id: string; name: string; phone: string } | null;
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  ac: Wind,
  electrical: Zap,
  plumbing: Droplets,
  carpentry: Hammer,
  painting: Paintbrush,
  other: Wrench,
};

const CATEGORY_LABELS: Record<string, string> = {
  ac: "تكييف",
  electrical: "كهرباء",
  plumbing: "سباكة",
  carpentry: "نجارة",
  painting: "دهانات",
  other: "أخرى",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "عاجل",
  medium: "متوسط",
  low: "منخفض",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  in_progress: "قيد المعالجة",
  closed: "مغلق",
  reopened: "مُعاد فتحه",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  closed: "bg-green-100 text-green-800",
  reopened: "bg-orange-100 text-orange-800",
};

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

const newRequestSchema = z.object({
  unit_id: z.string().optional(),
  category: z.enum(["ac", "electrical", "plumbing", "carpentry", "painting", "other"]),
  priority: z.enum(["high", "medium", "low"]),
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().optional(),
});

const assignSchema = z.object({
  technician_name: z.string().min(1, "اسم الفني مطلوب"),
  estimated_cost: z.coerce.number().nonnegative().optional(),
  notes: z.string().optional(),
});

const closeSchema = z.object({
  actual_cost: z.coerce.number().nonnegative().optional(),
  closure_notes: z.string().optional(),
});

function buildWaMessage(req: MaintenanceRequest, priority: string): string {
  const shortId = req.id.slice(0, 8).toUpperCase();
  const name = req.tenant?.name ?? "العميل";
  if (priority === "high") {
    return `السيد/ة ${name}، تمت إحالة بلاغكم العاجل رقم #${shortId} إلى الفريق المختص وسيتواصل معكم الفني خلال ساعة. نعتذر عن الإزعاج.`;
  }
  return `السيد/ة ${name}، تم استلام بلاغكم رقم #${shortId} وسيتم معالجته خلال 24-48 ساعة. شكراً لتواصلكم.`;
}

function MaintenancePage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newDialog, setNewDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState<MaintenanceRequest | null>(null);
  const [closeDialog, setCloseDialog] = useState<MaintenanceRequest | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["maintenance-stats"],
    queryFn: () => getMaintenanceStats(),
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-maintenance", statusFilter, priorityFilter, categoryFilter],
    queryFn: () =>
      listAdminMaintenanceRequests({
        data: {
          status: statusFilter !== "all" ? statusFilter : undefined,
          priority: priorityFilter !== "all" ? priorityFilter : undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
        },
      }),
  });

  const { data: units = [] } = useQuery({
    queryKey: ["admin-units"],
    queryFn: () => listAdminUnits(),
  });

  const sorted = [...(requests as unknown as MaintenanceRequest[])].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 2;
    const pb = PRIORITY_ORDER[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const newForm = useForm<z.infer<typeof newRequestSchema>>({
    resolver: zodResolver(newRequestSchema),
    defaultValues: { priority: "medium", category: "other" },
  });

  const assignForm = useForm<z.infer<typeof assignSchema>>({
    resolver: zodResolver(assignSchema),
  });

  const closeForm = useForm<z.infer<typeof closeSchema>>({
    resolver: zodResolver(closeSchema),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-maintenance"] });
    qc.invalidateQueries({ queryKey: ["maintenance-stats"] });
  };

  const upsertMutation = useMutation({
    mutationFn: (vals: z.infer<typeof newRequestSchema>) =>
      upsertMaintenanceRequest({
        data: {
          category: vals.category,
          priority: vals.priority,
          title: vals.title,
          description: vals.description ?? null,
          unit_id: vals.unit_id ?? null,
          property_id: null,
          tenant_id: null,
        },
      }),
    onSuccess: () => {
      toast.success("تم إنشاء الطلب");
      setNewDialog(false);
      newForm.reset();
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignMutation = useMutation({
    mutationFn: (vals: z.infer<typeof assignSchema>) =>
      assignTechnician({
        data: {
          id: assignDialog!.id,
          technician_name: vals.technician_name,
          estimated_cost: vals.estimated_cost ?? null,
          notes: vals.notes ?? null,
        },
      }),
    onSuccess: () => {
      toast.success("تم تعيين الفني");
      setAssignDialog(null);
      assignForm.reset();
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeMutation = useMutation({
    mutationFn: (vals: z.infer<typeof closeSchema>) =>
      closeRequest({
        data: {
          id: closeDialog!.id,
          actual_cost: vals.actual_cost ?? null,
          closure_notes: vals.closure_notes ?? null,
        },
      }),
    onSuccess: () => {
      toast.success("تم إغلاق الطلب");
      setCloseDialog(null);
      closeForm.reset();
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reopenMutation = useMutation({
    mutationFn: (id: string) => reopenRequest({ data: { id } }),
    onSuccess: () => {
      toast.success("تمت إعادة فتح الطلب");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="الصيانة"
        breadcrumbs={[{ label: "لوحة التحكم", to: "/admin" }, { label: "الصيانة" }]}
        action={
          <Button onClick={() => setNewDialog(true)}>
            <Plus className="me-2 h-4 w-4" />
            طلب جديد
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="طلبات جديدة" value={stats?.newCount ?? 0} icon={Clock} tint="warning" />
        <KpiCard
          label="قيد المعالجة"
          value={stats?.inProgressCount ?? 0}
          icon={Wrench}
          tint="primary"
        />
        <KpiCard
          label="مغلقة هذا الشهر"
          value={stats?.closedThisMonth ?? 0}
          icon={CheckCircle2}
          tint="success"
        />
        <KpiCard
          label="عاجل مفتوح"
          value={stats?.highPriorityOpen ?? 0}
          icon={AlertTriangle}
          tint="destructive"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="new">جديد</SelectItem>
            <SelectItem value="in_progress">قيد المعالجة</SelectItem>
            <SelectItem value="closed">مغلق</SelectItem>
            <SelectItem value="reopened">مُعاد فتحه</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="الأولوية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأولويات</SelectItem>
            <SelectItem value="high">عاجل</SelectItem>
            <SelectItem value="medium">متوسط</SelectItem>
            <SelectItem value="low">منخفض</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="الفئة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الفئات</SelectItem>
            <SelectItem value="ac">تكييف</SelectItem>
            <SelectItem value="electrical">كهرباء</SelectItem>
            <SelectItem value="plumbing">سباكة</SelectItem>
            <SelectItem value="carpentry">نجارة</SelectItem>
            <SelectItem value="painting">دهانات</SelectItem>
            <SelectItem value="other">أخرى</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Request Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="لا توجد طلبات"
          description="لم يتم العثور على طلبات صيانة بهذه الفلاتر"
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((req) => {
            const CategoryIcon = CATEGORY_ICONS[req.category] ?? Wrench;
            return (
              <div
                key={req.id}
                className="group rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: Icon + Info */}
                  <div className="flex gap-3">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{req.title}</span>
                        <Badge variant="outline" className={PRIORITY_COLORS[req.priority]}>
                          {PRIORITY_LABELS[req.priority]}
                        </Badge>
                        <Badge className={STATUS_COLORS[req.status]}>
                          {STATUS_LABELS[req.status]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[req.category]}
                        </Badge>
                      </div>
                      {req.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {req.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {req.unit && <span>الوحدة: {req.unit.unit_number}</span>}
                        {req.tenant && <span>المستأجر: {req.tenant.name}</span>}
                        {req.technician_name && <span>الفني: {req.technician_name}</span>}
                        {req.estimated_cost != null && (
                          <span>تقدير: {req.estimated_cost.toLocaleString("en-US")} ر.س</span>
                        )}
                        {req.actual_cost != null && (
                          <span>فعلي: {req.actual_cost.toLocaleString("en-US")} ر.س</span>
                        )}
                        <span>{new Date(req.created_at).toLocaleDateString("ar-SA")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end lg:flex-row">
                    {(req.status === "new" || req.status === "reopened") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAssignDialog(req);
                          assignForm.reset();
                        }}
                      >
                        <UserPlus className="me-1 h-3.5 w-3.5" />
                        تعيين فني
                      </Button>
                    )}
                    {req.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCloseDialog(req);
                          closeForm.reset();
                        }}
                      >
                        <CheckCircle2 className="me-1 h-3.5 w-3.5" />
                        إغلاق الطلب
                      </Button>
                    )}
                    {(req.status === "closed" || req.status === "reopened") &&
                      req.status === "closed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reopenMutation.mutate(req.id)}
                          disabled={reopenMutation.isPending}
                        >
                          <RefreshCw className="me-1 h-3.5 w-3.5" />
                          إعادة فتح
                        </Button>
                      )}
                    {req.tenant?.phone && (
                      <Button size="sm" variant="ghost" asChild>
                        <a
                          href={buildWhatsAppUrl(
                            req.tenant.phone,
                            buildWaMessage(req, req.priority),
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Phone className="me-1 h-3.5 w-3.5" />
                          واتساب
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Request Dialog */}
      <Dialog open={newDialog} onOpenChange={setNewDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>طلب صيانة جديد</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={newForm.handleSubmit((v) => upsertMutation.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>عنوان الطلب *</Label>
              <Input {...newForm.register("title")} placeholder="وصف المشكلة" />
              {newForm.formState.errors.title && (
                <p className="text-xs text-destructive">{newForm.formState.errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الفئة</Label>
                <Select
                  value={newForm.watch("category")}
                  onValueChange={(v) =>
                    newForm.setValue("category", v as z.infer<typeof newRequestSchema>["category"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>الأولوية</Label>
                <Select
                  value={newForm.watch("priority")}
                  onValueChange={(v) =>
                    newForm.setValue("priority", v as z.infer<typeof newRequestSchema>["priority"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عاجل</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="low">منخفض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>الوحدة (اختياري)</Label>
              <Select
                value={newForm.watch("unit_id") ?? "__none__"}
                onValueChange={(v) => newForm.setValue("unit_id", v === "__none__" ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">بدون وحدة</SelectItem>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.unit_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>الوصف (اختياري)</Label>
              <Textarea
                {...newForm.register("description")}
                rows={3}
                placeholder="تفاصيل إضافية..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewDialog(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "جارٍ الحفظ..." : "إنشاء الطلب"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Technician Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={(o) => !o && setAssignDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعيين فني</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={assignForm.handleSubmit((v) => assignMutation.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>اسم الفني *</Label>
              <Input {...assignForm.register("technician_name")} placeholder="اسم الفني" />
              {assignForm.formState.errors.technician_name && (
                <p className="text-xs text-destructive">
                  {assignForm.formState.errors.technician_name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>التكلفة التقديرية (ر.س)</Label>
              <Input type="number" {...assignForm.register("estimated_cost")} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Textarea {...assignForm.register("notes")} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignDialog(null)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={assignMutation.isPending}>
                {assignMutation.isPending ? "جارٍ الحفظ..." : "تعيين"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Close Request Dialog */}
      <Dialog open={!!closeDialog} onOpenChange={(o) => !o && setCloseDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إغلاق الطلب</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={closeForm.handleSubmit((v) => closeMutation.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>التكلفة الفعلية (ر.س)</Label>
              <Input type="number" {...closeForm.register("actual_cost")} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات الإغلاق</Label>
              <Textarea
                {...closeForm.register("closure_notes")}
                rows={3}
                placeholder="وصف ما تم إصلاحه..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCloseDialog(null)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={closeMutation.isPending}>
                {closeMutation.isPending ? "جارٍ الإغلاق..." : "إغلاق الطلب"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
