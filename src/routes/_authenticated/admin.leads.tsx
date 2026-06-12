import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  listAdminLeads,
  upsertLead,
  deleteLead,
  convertLeadToClient,
} from "@/lib/leads.functions";
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
} from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

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

function LeadsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: () => listAdminLeads(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      property_id: "",
      notes: "",
      status: "new",
      source: "",
    },
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
    onError: () => {
      setDeleteError("حدث خطأ أثناء الحذف");
    },
  });

  function openCreate() {
    form.reset({
      name: "",
      phone: "",
      email: "",
      property_id: "",
      notes: "",
      status: "new",
      source: "",
    });
    setOpen(true);
  }

  function openEdit(lead: (typeof leads)[0]) {
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

  async function handleConvert(leadId: string) {
    setConvertingId(leadId);
    try {
      await convertLeadToClient({ data: { leadId } });
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      toast.success("تم تحويل الطلب إلى عميل");
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setConvertingId(null);
    }
  }

  const filtered = leads.filter(
    (l) => statusFilter === "all" || l.status === statusFilter
  );

  return (
    <div>
      <PageHeader
        title="الطلبات"
        breadcrumbs={[
          { label: "لوحة التحكم", to: "/admin" },
          { label: "الطلبات" },
        ]}
        action={
          <Button onClick={openCreate} className="btn-hero">
            <Plus className="h-4 w-4 ms-2" />
            إضافة طلب
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {[
          { label: "إجمالي الطلبات", value: leads.length },
          {
            label: "طلبات جديدة",
            value: leads.filter((l) => l.status === "new").length,
          },
          {
            label: "تم التحويل",
            value: leads.filter((l) => l.status === "converted").length,
          },
          {
            label: "خسارة",
            value: leads.filter((l) => l.status === "lost").length,
          },
        ].map((s) => (
          <div key={s.label} className="card-elegant p-5 text-center">
            <div className="text-3xl font-bold text-primary tabular">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 px-4 pb-4">
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
      </div>

      {isLoading && (
        <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div>
      )}

      {!isLoading && leads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Inbox className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">لا توجد طلبات</p>
          <Button onClick={openCreate} className="btn-hero">
            <Plus className="h-4 w-4 ms-2" />
            إضافة طلب
          </Button>
        </div>
      )}

      {/* Lead Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 px-4 pb-4">
        {filtered.map((lead) => {
          const isOld =
            lead.status === "new" &&
            new Date(lead.created_at) < new Date(Date.now() - 7 * 86400000);
          const property = lead.property as unknown as {
            id: string;
            title: string;
            city: string;
          } | null;
          return (
            <div key={lead.id} className="card-elegant p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">{lead.name}</h3>
                    {isOld && <span title="طلب قديم لم يُتابع">⚠️</span>}
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status ?? "new"]}`}
                  >
                    {STATUS_LABELS[lead.status ?? "new"]}
                  </span>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {lead.status !== "converted" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      disabled={convertingId === lead.id}
                      onClick={() => handleConvert(lead.id)}
                    >
                      <ArrowRightLeft className="h-3 w-3 ms-1" />
                      {convertingId === lead.id ? "…" : "تحويل"}
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => openEdit(lead)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      setDeleteId(lead.id);
                      setDeleteError(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{lead.phone}</span>
                    <a
                      href={buildWhatsAppUrl(
                        lead.phone,
                        `السلام عليكم ${lead.name}`
                      )}
                      target="_blank"
                      rel="noopener"
                      className="ms-auto text-green-600"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
                {property && (
                  <div className="text-xs bg-muted rounded px-2 py-1">
                    {property.title} · {property.city}
                  </div>
                )}
                {lead.notes && (
                  <p className="text-xs line-clamp-2">{lead.notes}</p>
                )}
                <div className="flex items-center gap-1 text-xs pt-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(lead.created_at), {
                    addSuffix: true,
                    locale: ar,
                  })}
                </div>
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
              {form.getValues("id") ? "تعديل طلب" : "إضافة طلب"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((v) => save.mutate(v as unknown as FormValues))}
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

            {/* Phone + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>الهاتف</Label>
                <Input {...form.register("phone")} dir="ltr" />
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

            {/* Source + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>المصدر</Label>
                <Input {...form.register("source")} />
              </div>
              <div className="space-y-1">
                <Label>الحالة</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">جديد</SelectItem>
                        <SelectItem value="contacted">تم التواصل</SelectItem>
                        <SelectItem value="qualified">مؤهل</SelectItem>
                        <SelectItem value="converted">محوّل</SelectItem>
                        <SelectItem value="lost">خسارة</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Property ID (optional) */}
            <div className="space-y-1">
              <Label>معرّف العقار (اختياري)</Label>
              <Input {...form.register("property_id")} dir="ltr" placeholder="UUID" />
              {form.formState.errors.property_id && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.property_id.message}
                </p>
              )}
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
                "هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع."
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
