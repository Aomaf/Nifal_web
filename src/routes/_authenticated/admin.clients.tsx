import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { listAdminClients, upsertClient, deleteClient } from "@/lib/clients.functions";
import { PageHeader } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Phone, MessageCircle, Users, Calendar } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/clients")({
  component: ClientsPage,
});

const STAGE_LABELS: Record<string, string> = {
  lead: "طلب",
  prospect: "محتمل",
  active: "نشط",
  negotiation: "تفاوض",
  closed: "مغلق",
  lost: "خسارة",
};

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "الاسم مطلوب"),
  type: z.enum(["individual", "company", "foundation", "group"]),
  phone: z.string().min(9, "الهاتف مطلوب"),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  city: z.string().optional().nullable(),
  stage: z.enum(["lead", "prospect", "active", "negotiation", "closed", "lost"]),
  source: z.string().optional().nullable(),
  interest_type: z.string().optional().nullable(),
  budget: z.coerce.number().nonnegative().optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  next_followup_at: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
type FormValues = z.infer<typeof schema>;

function ClientsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => listAdminClients(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "individual",
      phone: "",
      email: "",
      city: "",
      stage: "lead",
      source: "",
      interest_type: "",
      budget: undefined,
      rating: undefined,
      next_followup_at: "",
      notes: "",
    },
  });

  const save = useMutation({
    mutationFn: (v: FormValues) => upsertClient({ data: v as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      setOpen(false);
      toast.success("تم الحفظ");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteClient({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      setDeleteId(null);
      setDeleteError(null);
      toast.success("تم الحذف");
    },
    onError: () => {
      setDeleteError("حدث خطأ أثناء الحذف");
    },
  });

  function openCreate() {
    form.reset({
      name: "",
      type: "individual",
      phone: "",
      email: "",
      city: "",
      stage: "lead",
      source: "",
      interest_type: "",
      budget: undefined,
      rating: undefined,
      next_followup_at: "",
      notes: "",
    });
    setOpen(true);
  }

  function openEdit(c: (typeof clients)[0]) {
    form.reset({
      ...c,
      email: c.email ?? "",
      city: c.city ?? "",
      source: c.source ?? "",
      interest_type: c.interest_type ?? "",
      budget: c.budget ?? undefined,
      rating: c.rating ?? undefined,
      next_followup_at: c.next_followup_at
        ? new Date(c.next_followup_at).toISOString().slice(0, 10)
        : "",
      notes: c.notes ?? "",
    });
    setOpen(true);
  }

  const filtered = clients.filter((c) => {
    if (stageFilter !== "all" && c.stage !== stageFilter) return false;
    if (search && !c.name.includes(search) && !(c.phone ?? "").includes(search)) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="العملاء (CRM)"
        breadcrumbs={[{ label: "لوحة التحكم", to: "/admin" }, { label: "العملاء" }]}
        action={
          <Button onClick={openCreate} className="btn-hero">
            <Plus className="h-4 w-4 ms-2" />
            إضافة عميل
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {[
          { label: "إجمالي العملاء", value: clients.length },
          {
            label: "نشط / تفاوض",
            value: clients.filter((c) => ["active", "negotiation"].includes(c.stage ?? "")).length,
          },
          {
            label: "صفقات مغلقة",
            value: clients.filter((c) => c.stage === "closed").length,
          },
          {
            label: "متابعات اليوم",
            value: clients.filter(
              (c) => c.next_followup_at && new Date(c.next_followup_at) <= new Date()
            ).length,
          },
        ].map((s) => (
          <div key={s.label} className="card-elegant p-5 text-center">
            <div className="text-3xl font-bold text-primary tabular">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Stage filter pills + search */}
      <div className="flex flex-wrap gap-2 px-4 pb-4">
        {[
          { value: "all", label: "الكل" },
          { value: "lead", label: "طلب" },
          { value: "prospect", label: "محتمل" },
          { value: "active", label: "نشط" },
          { value: "negotiation", label: "تفاوض" },
          { value: "closed", label: "مغلق" },
          { value: "lost", label: "خسارة" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => setStageFilter(s.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              stageFilter === s.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:border-primary/50"
            }`}
          >
            {s.label}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو الهاتف…"
          className="px-3 py-1.5 rounded-full text-xs border border-border bg-background ms-auto min-w-40 focus:outline-none focus:border-primary"
        />
      </div>

      {isLoading && (
        <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div>
      )}

      {!isLoading && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Users className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">لا يوجد عملاء</p>
          <Button onClick={openCreate} className="btn-hero">
            <Plus className="h-4 w-4 ms-2" />
            إضافة عميل
          </Button>
        </div>
      )}

      {/* Client Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 px-4 pb-4">
        {filtered.map((c) => {
          const isOverdue =
            c.next_followup_at && new Date(c.next_followup_at) <= new Date();
          return (
            <div key={c.id} className="card-elegant p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="font-bold text-base">{c.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`stage-${c.stage}`}>{STAGE_LABELS[c.stage ?? "lead"]}</span>
                    {c.city && (
                      <span className="text-xs text-muted-foreground">{c.city}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      setDeleteId(c.id);
                      setDeleteError(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{c.phone}</span>
                    <a
                      href={buildWhatsAppUrl(c.phone, `السلام عليكم ${c.name}`)}
                      target="_blank"
                      rel="noopener"
                      className="ms-auto text-green-600 hover:text-green-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                )}
                {c.rating != null && (
                  <div className="text-xs">
                    {"★".repeat(c.rating)}{"☆".repeat(5 - c.rating)}
                  </div>
                )}
                {c.next_followup_at && (
                  <div
                    className={`text-xs flex items-center gap-1 ${
                      isOverdue ? "text-destructive font-medium" : ""
                    }`}
                  >
                    <Calendar className="h-3 w-3" />
                    {new Date(c.next_followup_at).toLocaleDateString("ar-SA")}
                    {isOverdue && " ⚠️"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.getValues("id") ? "تعديل عميل" : "إضافة عميل"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((v) => save.mutate(v as FormValues))}
            className="space-y-4"
          >
            {/* Name */}
            <div className="space-y-1">
              <Label>الاسم *</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Type + Stage */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>النوع</Label>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="النوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">فرد</SelectItem>
                        <SelectItem value="company">شركة</SelectItem>
                        <SelectItem value="foundation">مؤسسة</SelectItem>
                        <SelectItem value="group">مجموعة</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label>المرحلة</Label>
                <Controller
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="المرحلة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">طلب</SelectItem>
                        <SelectItem value="prospect">محتمل</SelectItem>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="negotiation">تفاوض</SelectItem>
                        <SelectItem value="closed">مغلق</SelectItem>
                        <SelectItem value="lost">خسارة</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>الهاتف *</Label>
                <Input {...form.register("phone")} dir="ltr" />
                {form.formState.errors.phone && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>البريد الإلكتروني</Label>
                <Input {...form.register("email")} dir="ltr" />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* City + Source */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>المدينة</Label>
                <Input {...form.register("city")} />
              </div>
              <div className="space-y-1">
                <Label>المصدر</Label>
                <Input {...form.register("source")} />
              </div>
            </div>

            {/* Interest type + Budget */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>نوع الاهتمام</Label>
                <Input {...form.register("interest_type")} />
              </div>
              <div className="space-y-1">
                <Label>الميزانية (ر.س)</Label>
                <Input {...form.register("budget")} type="number" min="0" dir="ltr" />
              </div>
            </div>

            {/* Rating + Next followup */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>التقييم</Label>
                <Controller
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <Select
                      value={field.value != null ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">★☆☆☆☆</SelectItem>
                        <SelectItem value="2">★★☆☆☆</SelectItem>
                        <SelectItem value="3">★★★☆☆</SelectItem>
                        <SelectItem value="4">★★★★☆</SelectItem>
                        <SelectItem value="5">★★★★★</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label>موعد المتابعة</Label>
                <Input {...form.register("next_followup_at")} type="date" dir="ltr" />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>ملاحظات</Label>
              <Textarea {...form.register("notes")} rows={3} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" className="btn-hero" disabled={save.isPending}>
                {save.isPending ? "جاري الحفظ…" : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteId(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ? (
                <span className="text-destructive">{deleteError}</span>
              ) : (
                "هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                onClick={() => deleteId && remove.mutate(deleteId)}
                disabled={remove.isPending}
              >
                {remove.isPending ? "جاري الحذف…" : "حذف"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
