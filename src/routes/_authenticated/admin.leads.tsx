import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { listAdminLeads, upsertLead, deleteLead, convertLeadToClient } from "@/lib/leads.functions";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MessageCircle,
  Inbox,
  ArrowRightLeft,
  Clock,
  UserPlus,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  component: LeadsPage,
});

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  qualified: "مؤهل",
  converted: "محوّل",
  lost: "خسارة",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  qualified: "bg-green-100 text-green-700",
  converted: "bg-purple-100 text-purple-700",
  lost: "bg-red-100 text-red-700",
};

function buildWaTemplate(tpl: number, name: string, propertyTitle: string, phone: string) {
  const templates = [
    `السلام عليكم ${name}، شكراً لاهتمامك بـ ${propertyTitle}. يسعدنا مساعدتك. متى يناسبك التواصل؟`,
    `مرحباً ${name}، أردت التحقق معك بشأن استفسارك عن ${propertyTitle}. هل ما زلت مهتماً؟`,
    `مرحباً ${name}، يسرنا دعوتك لمعاينة ${propertyTitle}. ما الوقت المناسب لك؟`,
  ];
  return buildWhatsAppUrl(phone, templates[tpl] ?? templates[0]);
}

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  property_id: z.string().uuid().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).default("new"),
  source: z.string().optional().nullable(),
});
type FormValues = z.infer<typeof schema>;
type Lead = Awaited<ReturnType<typeof listAdminLeads>>[0];

function LeadsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("contacted");
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: () => listAdminLeads(),
  });

  // Real-time subscription for new leads
  const lastLeadId = useRef<string | null>(null);
  useEffect(() => {
    const channel = supabase
      .channel("leads-rt")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const newLead = payload.new as Lead;
          if (newLead.id === lastLeadId.current) return;
          lastLeadId.current = newLead.id;
          qc.invalidateQueries({ queryKey: ["admin-leads"] });
          toast.info(`طلب جديد من ${newLead.name}`, {
            duration: 8000,
            description: "اضغط لعرض الطلبات",
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { name: "", phone: "", email: "", property_id: "", notes: "", status: "new", source: "" },
  });

  const save = useMutation({
    mutationFn: (v: FormValues) => upsertLead({ data: v as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
      setOpen(false);
      toast.success("تم الحفظ");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteLead({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
      setDeleteId(null);
      setDeleteError(null);
      toast.success("تم الحذف");
    },
    onError: () => setDeleteError("حدث خطأ أثناء الحذف"),
  });

  async function handleConvert(lead: Lead) {
    setConvertingId(lead.id);
    try {
      // Pre-fill form values from lead
      await convertLeadToClient({ data: { leadId: lead.id } });
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      toast.success("تم تحويل الطلب إلى عميل");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setConvertingId(null);
    }
  }

  async function handleBulkStatus() {
    if (!selectedIds.size) return;
    setBulkBusy(true);
    try {
      for (const id of selectedIds) {
        const lead = leads.find((l) => l.id === id);
        if (lead) await upsertLead({ data: { ...lead, status: bulkStatus as Lead["status"], property_id: lead.property_id ?? undefined } as never });
      }
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
      toast.success(`تم تحديث ${selectedIds.size} طلب`);
      setSelectedIds(new Set());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBulkBusy(false);
    }
  }

  function openCreate() {
    form.reset({ name: "", phone: "", email: "", property_id: "", notes: "", status: "new", source: "" });
    setOpen(true);
  }

  function openEdit(lead: Lead) {
    form.reset({
      ...lead,
      phone: lead.phone ?? "",
      email: lead.email ?? "",
      property_id: lead.property_id ?? "",
      notes: lead.notes ?? "",
      source: lead.source ?? "",
    });
    setOpen(true);
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  }

  const filtered = leads.filter((l) => statusFilter === "all" || l.status === statusFilter);
  const conversionRate = leads.length
    ? Math.round((leads.filter((l) => l.status === "converted").length / leads.length) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title="الطلبات"
        breadcrumbs={[{ label: "لوحة التحكم", to: "/admin" }, { label: "الطلبات" }]}
        action={
          <Button onClick={openCreate} className="btn-hero">
            <Plus className="h-4 w-4 ms-2" />إضافة طلب
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {[
          { label: "إجمالي الطلبات", value: leads.length },
          { label: "طلبات جديدة", value: leads.filter((l) => l.status === "new").length },
          { label: "تم التحويل", value: leads.filter((l) => l.status === "converted").length },
          { label: "نسبة التحويل", value: `${conversionRate}%` },
        ].map((s) => (
          <div key={s.label} className="card-elegant p-5 text-center">
            <div className="text-3xl font-bold text-primary tabular">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 px-4 pb-4 items-center">
        {[
          { value: "all", label: "الكل" },
          { value: "new", label: "جديد" },
          { value: "contacted", label: "تم التواصل" },
          { value: "qualified", label: "مؤهل" },
          { value: "converted", label: "محوّل" },
          { value: "lost", label: "خسارة" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:border-primary/50"
            }`}
          >
            {s.label}
          </button>
        ))}

        {/* Bulk status update */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ms-auto">
            <span className="text-xs text-muted-foreground">{selectedIds.size} محدد</span>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contacted">تم التواصل</SelectItem>
                <SelectItem value="qualified">مؤهل</SelectItem>
                <SelectItem value="converted">محوّل</SelectItem>
                <SelectItem value="lost">خسارة</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleBulkStatus} disabled={bulkBusy}>
              {bulkBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : "تطبيق"}
            </Button>
          </div>
        )}
      </div>

      {isLoading && <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div>}

      {!isLoading && leads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Inbox className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">لا توجد طلبات</p>
          <Button onClick={openCreate} className="btn-hero"><Plus className="h-4 w-4 ms-2" />إضافة طلب</Button>
        </div>
      )}

      {/* Lead Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 px-4 pb-4">
        {filtered.map((lead) => {
          const isOld = lead.status === "new" && new Date(lead.created_at) < new Date(Date.now() - 7 * 86400000);
          const property = lead.property as unknown as { id: string; title: string; city: string } | null;
          const isUnassigned = !(lead as unknown as Record<string, unknown>).assigned_to;
          const isSelected = selectedIds.has(lead.id);

          return (
            <div
              key={lead.id}
              className={`card-elegant p-5 space-y-3 transition-colors ${isSelected ? "ring-2 ring-primary/40 bg-primary/5" : ""} ${isUnassigned ? "border-s-4 border-amber-400" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleOne(lead.id)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base">{lead.name}</h3>
                      {isOld && <span title="طلب قديم لم يُتابع" className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">⚠️ بدون متابعة</span>}
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status ?? "new"]}`}>
                      {STATUS_LABELS[lead.status ?? "new"]}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap justify-end shrink-0">
                  {lead.status !== "converted" && (
                    <Button size="sm" variant="outline" className="text-xs h-7" disabled={convertingId === lead.id} onClick={() => handleConvert(lead)}>
                      <ArrowRightLeft className="h-3 w-3 ms-1" />
                      {convertingId === lead.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "تحويل"}
                    </Button>
                  )}
                  {/* WhatsApp templates popover */}
                  {lead.phone && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-200">
                          <MessageCircle className="h-3 w-3 ms-1" />
                          واتساب
                          <ChevronDown className="h-3 w-3 ms-1" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 space-y-1" align="end">
                        {["ترحيب", "متابعة", "دعوة للمعاينة"].map((label, i) => (
                          <a
                            key={i}
                            href={buildWaTemplate(i, lead.name, property?.title ?? "العقار", lead.phone!)}
                            target="_blank"
                            rel="noopener"
                            className="block text-xs px-3 py-2 rounded hover:bg-muted transition-colors"
                          >
                            {label}
                          </a>
                        ))}
                      </PopoverContent>
                    </Popover>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => openEdit(lead)}><Edit2 className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { setDeleteId(lead.id); setDeleteError(null); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{lead.phone}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
                {property && (
                  <div className="text-xs bg-muted rounded px-2 py-1">{property.title} · {property.city}</div>
                )}
                {lead.notes && <p className="text-xs line-clamp-2">{lead.notes}</p>}
                <div className="flex items-center gap-1 text-xs pt-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ar })}
                </div>
              </div>

              {/* Assign if unassigned */}
              {isUnassigned && lead.status === "new" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs h-7 border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    await upsertLead({ data: { ...lead, assigned_to: user.id, property_id: lead.property_id ?? undefined } as never });
                    qc.invalidateQueries({ queryKey: ["admin-leads"] });
                    toast.success("تم استلام الطلب");
                  }}
                >
                  <UserPlus className="h-3 w-3 ms-1" />استلم الطلب
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.getValues("id") ? "تعديل طلب" : "إضافة طلب"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v as unknown as FormValues))} className="space-y-4">
            <div className="space-y-1">
              <Label>الاسم *</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>الهاتف</Label>
                <Input {...form.register("phone")} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>البريد الإلكتروني</Label>
                <Input {...form.register("email")} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>المصدر</Label>
                <Input {...form.register("source")} />
              </div>
              <div className="space-y-1">
                <Label>الحالة</Label>
                <Controller control={form.control} name="status" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">جديد</SelectItem>
                      <SelectItem value="contacted">تم التواصل</SelectItem>
                      <SelectItem value="qualified">مؤهل</SelectItem>
                      <SelectItem value="converted">محوّل</SelectItem>
                      <SelectItem value="lost">خسارة</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>معرّف العقار (اختياري)</Label>
              <Input {...form.register("property_id")} dir="ltr" placeholder="UUID" />
            </div>
            <div className="space-y-1">
              <Label>ملاحظات</Label>
              <Textarea {...form.register("notes")} rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button type="submit" className="btn-hero" disabled={save.isPending}>
                {save.isPending ? "جاري الحفظ…" : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) { setDeleteId(null); setDeleteError(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ? <span className="text-destructive">{deleteError}</span> : "هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteId && remove.mutate(deleteId)} disabled={remove.isPending}>
                {remove.isPending ? "جاري الحذف…" : "حذف"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
