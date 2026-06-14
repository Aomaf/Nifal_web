import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  listAdminContracts,
  upsertContract,
  deleteContract,
  listAdminUnits,
  upsertUnit,
  deleteUnit,
  listAdminTenants,
  upsertTenant,
  deleteTenant,
} from "@/lib/rentals.functions";
import { PageHeader } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Edit2, Trash2, Phone, MessageCircle, Key, Home, Users } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/format";
import { SarAmount } from "@/components/ui/sar-icon";

export const Route = createFileRoute("/_authenticated/admin/rentals")({
  component: RentalsPage,
});

// ──────────────────────────────────────────────
// Labels / colors
// ──────────────────────────────────────────────
const FREQ_LABELS: Record<string, string> = {
  monthly: "شهري",
  quarterly: "ربع سنوي",
  biannual: "نصف سنوي",
  annual: "سنوي",
};

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  active: "نشط",
  expired: "منتهي",
  cancelled: "ملغي",
};
const CONTRACT_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  expired: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};

const UNIT_STATUS_LABELS: Record<string, string> = {
  vacant: "شاغر",
  rented: "مؤجر",
  under_maintenance: "صيانة",
};
const UNIT_STATUS_COLORS: Record<string, string> = {
  vacant: "bg-green-100 text-green-700",
  rented: "bg-blue-100 text-blue-700",
  under_maintenance: "bg-yellow-100 text-yellow-700",
};

// ──────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────
const unitSchema = z.object({
  id: z.string().uuid().optional(),
  property_id: z.string().uuid("معرّف العقار غير صحيح"),
  unit_number: z.string().min(1, "رقم الوحدة مطلوب").max(50),
  floor: z.coerce.number().int().optional().nullable(),
  area_sqm: z.coerce.number().nonnegative().optional().nullable(),
  bedrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  bathrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  status: z.enum(["vacant", "rented", "under_maintenance"]).optional(),
  notes: z.string().max(1000).optional().nullable(),
});
type UnitFormValues = z.infer<typeof unitSchema>;

const tenantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "الاسم مطلوب").max(200),
  phone: z.string().min(9, "الهاتف مطلوب").max(20),
  email: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")).nullable(),
  national_id: z.string().max(20).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});
type TenantFormValues = z.infer<typeof tenantSchema>;

const contractSchema = z.object({
  id: z.string().uuid().optional(),
  unit_id: z.string().uuid("الوحدة مطلوبة"),
  tenant_id: z.string().uuid("المستأجر مطلوب"),
  start_date: z.string().min(1, "تاريخ البداية مطلوب"),
  end_date: z.string().min(1, "تاريخ النهاية مطلوب"),
  rent_amount: z.coerce.number().positive("مبلغ الإيجار مطلوب"),
  payment_frequency: z.enum(["monthly", "quarterly", "biannual", "annual"]).optional(),
  deposit_amount: z.coerce.number().nonnegative().optional().nullable(),
  status: z.enum(["draft", "active", "expired", "cancelled"]).optional(),
  notes: z.string().max(2000).optional().nullable(),
});
type ContractFormValues = z.infer<typeof contractSchema>;

// ──────────────────────────────────────────────
// Page root
// ──────────────────────────────────────────────
function RentalsPage() {
  return (
    <div>
      <PageHeader
        title="الإيجارات"
        breadcrumbs={[{ label: "لوحة التحكم", to: "/admin" }, { label: "الإيجارات" }]}
      />
      <div className="px-4 pb-4">
        <Tabs defaultValue="contracts">
          <TabsList className="mb-4">
            <TabsTrigger value="contracts">العقود</TabsTrigger>
            <TabsTrigger value="units">الوحدات</TabsTrigger>
            <TabsTrigger value="tenants">المستأجرون</TabsTrigger>
          </TabsList>
          <TabsContent value="contracts">
            <ContractsTab />
          </TabsContent>
          <TabsContent value="units">
            <UnitsTab />
          </TabsContent>
          <TabsContent value="tenants">
            <TenantsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Contracts Tab
// ──────────────────────────────────────────────
function ContractsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [contractFilter, setContractFilter] = useState("all");

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["admin-contracts"],
    queryFn: () => listAdminContracts(),
  });

  // Annual income KPI
  const annualIncome = contracts
    .filter((c) => c.status === "active")
    .reduce((s, c) => {
      const mult: Record<string, number> = { monthly: 12, quarterly: 4, biannual: 2, annual: 1 };
      return s + c.rent_amount * (mult[c.payment_frequency] ?? 12);
    }, 0);

  const filteredContracts = contracts.filter((c) => {
    if (contractFilter === "all") return true;
    if (contractFilter === "expiring") {
      const days = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000);
      return c.status === "active" && days <= 60 && days > 0;
    }
    return c.status === contractFilter;
  });
  const { data: units = [] } = useQuery({
    queryKey: ["admin-units"],
    queryFn: () => listAdminUnits(),
  });
  const { data: tenants = [] } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: () => listAdminTenants(),
  });

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      unit_id: "",
      tenant_id: "",
      start_date: "",
      end_date: "",
      rent_amount: 0,
      payment_frequency: "monthly",
      deposit_amount: null,
      status: "draft",
      notes: "",
    },
  });

  const save = useMutation({
    mutationFn: (v: ContractFormValues) => upsertContract({ data: v as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-contracts"] });
      qc.invalidateQueries({ queryKey: ["admin-units"] });
      setOpen(false);
      toast.success("تم الحفظ");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteContract({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-contracts"] });
      setDeleteId(null);
      setDeleteError(null);
      toast.success("تم الحذف");
    },
    onError: () => {
      setDeleteError("لا يمكن حذف هذا العقد");
    },
  });

  function openCreate() {
    form.reset({
      unit_id: "",
      tenant_id: "",
      start_date: "",
      end_date: "",
      rent_amount: 0,
      payment_frequency: "monthly",
      deposit_amount: null,
      status: "draft",
      notes: "",
    });
    setOpen(true);
  }

  function openEdit(c: (typeof contracts)[0]) {
    form.reset({
      id: c.id,
      unit_id: c.unit_id,
      tenant_id: c.tenant_id,
      start_date: c.start_date,
      end_date: c.end_date,
      rent_amount: c.rent_amount,
      payment_frequency: c.payment_frequency as ContractFormValues["payment_frequency"],
      deposit_amount: c.deposit_amount,
      status: c.status as ContractFormValues["status"],
      notes: c.notes ?? "",
    });
    setOpen(true);
  }

  return (
    <>
      {/* Annual income KPI */}
      {annualIncome > 0 && (
        <div className="card-elegant p-4 mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">إجمالي الدخل السنوي (العقود النشطة)</span>
          <span className="text-xl font-bold text-primary"><SarAmount value={annualIncome} /></span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "الكل" },
            { value: "active", label: "نشط" },
            { value: "expiring", label: "ينتهي قريباً" },
            { value: "expired", label: "منتهي" },
            { value: "cancelled", label: "ملغي" },
            { value: "draft", label: "مسودة" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setContractFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                contractFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button onClick={openCreate} className="btn-hero">
          <Plus className="h-4 w-4 ms-2" />إضافة عقد
        </Button>
      </div>

      {isLoading && <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div>}

      {!isLoading && contracts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Key className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">لا توجد عقود</p>
          <Button onClick={openCreate} className="btn-hero">
            <Plus className="h-4 w-4 ms-2" />إضافة عقد
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredContracts.map((c) => {
          const daysLeft = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000);
          const unit = c.unit as unknown as {
            id: string;
            unit_number: string;
          } | null;
          const tenant = c.tenant as unknown as { id: string; name: string; phone: string } | null;
          return (
            <div key={c.id} className="card-elegant p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{tenant?.name ?? "—"}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {unit?.unit_number ?? "—"}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
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

              <div className="flex flex-wrap gap-2 text-xs">
                <span
                  className={`px-2 py-0.5 rounded-full font-medium ${CONTRACT_STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {CONTRACT_STATUS_LABELS[c.status] ?? c.status}
                </span>
                {c.status === "active" && daysLeft <= 30 && (
                  <span className="px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                    ينتهي خلال {daysLeft} يوم
                  </span>
                )}
                {c.status === "active" && daysLeft > 30 && daysLeft <= 60 && (
                  <span className="px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
                    ينتهي قريباً
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {FREQ_LABELS[c.payment_frequency] ?? c.payment_frequency}
                </span>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  {c.start_date} ← {c.end_date}
                </p>
                <p className="font-semibold text-foreground"><SarAmount value={c.rent_amount} /></p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.getValues("id") ? "تعديل عقد" : "إضافة عقد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
            {/* Unit select */}
            <div className="space-y-1">
              <Label>الوحدة *</Label>
              <Controller
                control={form.control}
                name="unit_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الوحدة" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => {
                        const prop = u.property as unknown as {
                          id: string;
                          title: string;
                          city: string;
                        } | null;
                        return (
                          <SelectItem key={u.id} value={u.id}>
                            {u.unit_number}
                            {prop ? ` · ${prop.title}` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.unit_id && (
                <p className="text-xs text-destructive">{form.formState.errors.unit_id.message}</p>
              )}
            </div>

            {/* Tenant select */}
            <div className="space-y-1">
              <Label>المستأجر *</Label>
              <Controller
                control={form.control}
                name="tenant_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المستأجر" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} — {t.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.tenant_id && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.tenant_id.message}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>تاريخ البداية *</Label>
                <Input type="date" {...form.register("start_date")} dir="ltr" />
                {form.formState.errors.start_date && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.start_date.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>تاريخ النهاية *</Label>
                <Input type="date" {...form.register("end_date")} dir="ltr" />
                {form.formState.errors.end_date && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.end_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>مبلغ الإيجار *</Label>
                <Input type="number" {...form.register("rent_amount")} dir="ltr" />
                {form.formState.errors.rent_amount && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.rent_amount.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>مبلغ التأمين</Label>
                <Input type="number" {...form.register("deposit_amount")} dir="ltr" />
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-1">
              <Label>دورية الدفع</Label>
              <Controller
                control={form.control}
                name="payment_frequency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر دورية الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">شهري</SelectItem>
                      <SelectItem value="quarterly">ربع سنوي</SelectItem>
                      <SelectItem value="biannual">نصف سنوي</SelectItem>
                      <SelectItem value="annual">سنوي</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label>الحالة</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">مسودة</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="expired">منتهي</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

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
                "هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع."
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
    </>
  );
}

// ──────────────────────────────────────────────
// Units Tab
// ──────────────────────────────────────────────
function UnitsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: units = [], isLoading } = useQuery({
    queryKey: ["admin-units"],
    queryFn: () => listAdminUnits(),
  });

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      property_id: "",
      unit_number: "",
      floor: null,
      area_sqm: null,
      bedrooms: null,
      bathrooms: null,
      status: "vacant",
      notes: "",
    },
  });

  const save = useMutation({
    mutationFn: (v: UnitFormValues) => upsertUnit({ data: v as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-units"] });
      setOpen(false);
      toast.success("تم الحفظ");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteUnit({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-units"] });
      setDeleteId(null);
      setDeleteError(null);
      toast.success("تم الحذف");
    },
    onError: () => {
      setDeleteError("لا يمكن حذف هذه الوحدة لأنها مرتبطة بعقود");
    },
  });

  function openCreate() {
    form.reset({
      property_id: "",
      unit_number: "",
      floor: null,
      area_sqm: null,
      bedrooms: null,
      bathrooms: null,
      status: "vacant",
      notes: "",
    });
    setOpen(true);
  }

  function openEdit(u: (typeof units)[0]) {
    form.reset({
      id: u.id,
      property_id: u.property_id,
      unit_number: u.unit_number,
      floor: u.floor,
      area_sqm: u.area_sqm,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      status: u.status as UnitFormValues["status"],
      notes: u.notes ?? "",
    });
    setOpen(true);
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} className="btn-hero">
          <Plus className="h-4 w-4 ms-2" />
          إضافة وحدة
        </Button>
      </div>

      {isLoading && <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div>}

      {!isLoading && units.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Home className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">لا توجد وحدات</p>
          <Button onClick={openCreate} className="btn-hero">
            <Plus className="h-4 w-4 ms-2" />
            إضافة وحدة
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {units.map((u) => {
          const prop = u.property as unknown as { id: string; title: string; city: string } | null;
          return (
            <div key={u.id} className="card-elegant p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base">{u.unit_number}</h3>
                  {prop && (
                    <p className="text-sm text-muted-foreground truncate">
                      {prop.title} — {prop.city}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(u)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      setDeleteId(u.id);
                      setDeleteError(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span
                  className={`px-2 py-0.5 rounded-full font-medium ${UNIT_STATUS_COLORS[u.status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {UNIT_STATUS_LABELS[u.status] ?? u.status}
                </span>
              </div>

              <div className="text-sm text-muted-foreground space-y-0.5">
                {u.floor != null && <p>الطابق: {u.floor}</p>}
                {u.area_sqm != null && <p>المساحة: {u.area_sqm} م²</p>}
                {u.bedrooms != null && <p>غرف النوم: {u.bedrooms}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.getValues("id") ? "تعديل وحدة" : "إضافة وحدة"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <div className="space-y-1">
              <Label>معرّف العقار *</Label>
              <Input {...form.register("property_id")} dir="ltr" placeholder="UUID" />
              {form.formState.errors.property_id && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.property_id.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>رقم الوحدة *</Label>
              <Input {...form.register("unit_number")} />
              {form.formState.errors.unit_number && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.unit_number.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>الطابق</Label>
                <Input type="number" {...form.register("floor")} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>المساحة (م²)</Label>
                <Input type="number" {...form.register("area_sqm")} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>غرف النوم</Label>
                <Input type="number" {...form.register("bedrooms")} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>الحمامات</Label>
                <Input type="number" {...form.register("bathrooms")} dir="ltr" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>الحالة</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacant">شاغر</SelectItem>
                      <SelectItem value="rented">مؤجر</SelectItem>
                      <SelectItem value="under_maintenance">صيانة</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
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
                "هل أنت متأكد من حذف هذه الوحدة؟ لا يمكن التراجع."
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
    </>
  );
}

// ──────────────────────────────────────────────
// Tenants Tab
// ──────────────────────────────────────────────
function TenantsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: () => listAdminTenants(),
  });

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { name: "", phone: "", email: "", national_id: "", notes: "" },
  });

  const save = useMutation({
    mutationFn: (v: TenantFormValues) => upsertTenant({ data: v as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tenants"] });
      setOpen(false);
      toast.success("تم الحفظ");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTenant({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tenants"] });
      setDeleteId(null);
      setDeleteError(null);
      toast.success("تم الحذف");
    },
    onError: () => {
      setDeleteError("لا يمكن حذف هذا المستأجر لأنه مرتبط بعقود");
    },
  });

  function openCreate() {
    form.reset({ name: "", phone: "", email: "", national_id: "", notes: "" });
    setOpen(true);
  }

  function openEdit(t: (typeof tenants)[0]) {
    form.reset({
      id: t.id,
      name: t.name,
      phone: t.phone,
      email: t.email ?? "",
      national_id: t.national_id ?? "",
      notes: t.notes ?? "",
    });
    setOpen(true);
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} className="btn-hero">
          <Plus className="h-4 w-4 ms-2" />
          إضافة مستأجر
        </Button>
      </div>

      {isLoading && <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div>}

      {!isLoading && tenants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Users className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">لا يوجد مستأجرون</p>
          <Button onClick={openCreate} className="btn-hero">
            <Plus className="h-4 w-4 ms-2" />
            إضافة مستأجر
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tenants.map((t) => (
          <div key={t.id} className="card-elegant p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base">{t.name}</h3>
                {t.national_id && (
                  <p className="text-xs text-muted-foreground">
                    هوية: ***{t.national_id.slice(-4)}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    setDeleteId(t.id);
                    setDeleteError(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {t.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{t.phone}</span>
                  <a
                    href={buildWhatsAppUrl(t.phone, `السلام عليكم ${t.name}`)}
                    target="_blank"
                    rel="noopener"
                    className="ms-auto text-green-600 hover:text-green-700"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </div>
              )}
              {t.email && <p className="truncate">{t.email}</p>}
              {t.notes && (
                <p className="text-xs line-clamp-2 pt-1 border-t border-border">{t.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.getValues("id") ? "تعديل مستأجر" : "إضافة مستأجر"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <div className="space-y-1">
              <Label>الاسم *</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>الهاتف *</Label>
              <Input {...form.register("phone")} dir="ltr" />
              {form.formState.errors.phone && (
                <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>البريد الإلكتروني</Label>
              <Input {...form.register("email")} dir="ltr" />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>رقم الهوية</Label>
              <Input {...form.register("national_id")} dir="ltr" />
            </div>
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
                "هل أنت متأكد من حذف هذا المستأجر؟ لا يمكن التراجع."
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
    </>
  );
}
