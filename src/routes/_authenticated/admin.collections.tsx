import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  listAdminInvoices,
  recordPayment,
  cancelInvoice,
  getCollectionStats,
  createInvoice,
} from "@/lib/invoices.functions";
import { listAdminContracts } from "@/lib/rentals.functions";
import { PageHeader } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Wallet,
  Plus,
  MessageCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/format";
import { SarAmount } from "@/components/ui/sar-icon";

export const Route = createFileRoute("/_authenticated/admin/collections")({
  component: CollectionsPage,
});

const STATUS_LABELS: Record<string, string> = {
  pending: "معلق",
  paid: "مدفوع",
  overdue: "متأخرة",
  partially_paid: "مدفوع جزئياً",
  cancelled: "ملغي",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  partially_paid: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const paymentSchema = z.object({
  method: z.enum(["bank_transfer", "cheque", "cash", "credit_card", "stc_pay", "apple_pay"]),
  date: z.string().min(1, "تاريخ الدفع مطلوب"),
  amountPaid: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من 0"),
  notes: z.string().optional().nullable(),
});
type PaymentForm = z.infer<typeof paymentSchema>;

const newInvoiceSchema = z.object({
  contract_id: z.string().uuid("العقد مطلوب"),
  amount: z.coerce.number().positive("المبلغ مطلوب"),
  due_date: z.string().min(1, "تاريخ الاستحقاق مطلوب"),
  period_start: z.string().min(1, "بداية الفترة مطلوبة"),
  period_end: z.string().min(1, "نهاية الفترة مطلوبة"),
  notes: z.string().optional().nullable(),
});
type NewInvoiceForm = z.infer<typeof newInvoiceSchema>;

type Invoice = Awaited<ReturnType<typeof listAdminInvoices>>[0];

function CollectionsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);

  const { data: invoices = [], isLoading, isError } = useQuery({
    queryKey: ["admin-invoices", statusFilter],
    queryFn: () => listAdminInvoices({ data: { status: statusFilter } }),
  });

  const { data: stats } = useQuery({
    queryKey: ["collection-stats"],
    queryFn: () => getCollectionStats(),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["admin-contracts"],
    queryFn: () => listAdminContracts(),
  });

  const payForm = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: "bank_transfer", date: new Date().toISOString().split("T")[0], amountPaid: 0, notes: "" },
  });

  const newInvForm = useForm<NewInvoiceForm>({
    resolver: zodResolver(newInvoiceSchema),
    defaultValues: { contract_id: "", amount: 0, due_date: "", period_start: "", period_end: "", notes: "" },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-invoices"] });
    qc.invalidateQueries({ queryKey: ["collection-stats"] });
  };

  const payment = useMutation({
    mutationFn: (v: PaymentForm) =>
      recordPayment({ data: { invoiceId: payingInvoice!.id, ...v } }),
    onSuccess: () => {
      invalidate();
      setPayingInvoice(null);
      toast.success("تم تسجيل الدفعة");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: (invoiceId: string) => cancelInvoice({ data: { invoiceId } }),
    onSuccess: () => {
      invalidate();
      setCancelId(null);
      toast.success("تم إلغاء الفاتورة");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createInv = useMutation({
    mutationFn: (v: NewInvoiceForm) => createInvoice({ data: v }),
    onSuccess: () => {
      invalidate();
      setNewInvoiceOpen(false);
      newInvForm.reset();
      toast.success("تم إنشاء الفاتورة");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="التحصيلات"
        breadcrumbs={[{ label: "لوحة التحكم", to: "/admin" }, { label: "التحصيلات" }]}
        action={
          <Button className="btn-hero" onClick={() => setNewInvoiceOpen(true)}>
            <Plus className="h-4 w-4 ms-2" />فاتورة جديدة
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {[
          {
            label: "نسبة التحصيل",
            value: `${stats?.collectionRate ?? 0}%`,
            icon: CheckCircle2,
            color: "text-success",
            sarValue: null as number | null,
          },
          {
            label: "إجمالي المحصّل",
            value: null as string | null,
            icon: Wallet,
            color: "text-primary",
            sarValue: stats?.totalPaid ?? 0,
          },
          {
            label: "معلق",
            value: null as string | null,
            icon: Clock,
            color: "text-blue-600",
            sarValue: stats?.totalPending ?? 0,
          },
          {
            label: "متأخرة",
            value: null as string | null,
            icon: AlertCircle,
            color: "text-destructive",
            sarValue: stats?.totalOverdue ?? 0,
          },
        ].map((s) => (
          <div key={s.label} className="card-elegant p-5 text-center">
            <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
            <div className={`text-xl font-bold tabular ${s.color}`}>
              {s.sarValue != null ? <SarAmount value={s.sarValue} /> : s.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 px-4 pb-4">
        {[
          { value: "all", label: "الكل" },
          { value: "overdue", label: "متأخرة" },
          { value: "pending", label: "معلق" },
          { value: "paid", label: "مدفوع" },
          { value: "partially_paid", label: "مدفوع جزئياً" },
          { value: "cancelled", label: "ملغي" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:border-primary/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div>}

      {isError && <div className="p-8 text-center text-destructive">فشل تحميل الفواتير. حاول مجدداً.</div>}

      {!isLoading && !isError && invoices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Wallet className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">لا توجد فواتير</p>
        </div>
      )}

      {/* Invoice list */}
      <div className="grid gap-3 px-4 pb-4">
        {invoices.map((inv) => {
          const contract = inv.contract as unknown as {
            id: string;
            unit?: { unit_number: string };
            tenant?: { name: string; phone: string };
          } | null;
          const remaining = Number(inv.amount) - Number(inv.amount_paid ?? 0);
          const isOverdue = inv.status === "overdue";

          return (
            <div
              key={inv.id}
              className={`card-elegant p-4 flex flex-wrap items-center gap-4 ${isOverdue ? "border-s-4 border-destructive" : ""}`}
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{contract?.tenant?.name ?? "—"}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status]}`}>
                    {STATUS_LABELS[inv.status]}
                  </span>
                  {isOverdue && (
                    <span className="text-xs text-destructive">
                      منذ {Math.abs(Math.ceil((new Date(inv.due_date).getTime() - Date.now()) / 86400000))} يوم
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {contract?.unit?.unit_number ?? "—"}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-primary"><SarAmount value={Number(inv.amount)} /></span>
                  {remaining > 0 && inv.status !== "cancelled" && (
                    <span className="text-xs text-muted-foreground">متبقي: <SarAmount value={remaining} /></span>
                  )}
                  <span className="text-xs text-muted-foreground">استحقاق: {inv.due_date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {contract?.tenant?.phone && (
                  <a
                    href={buildWhatsAppUrl(
                      contract.tenant.phone,
                      `السيد/ة ${contract.tenant.name}، نُذكّركم بأن فاتورة الإيجار بقيمة ${Number(inv.amount).toLocaleString("en-US")} ريال كانت مستحقة في ${inv.due_date}. يُرجى التكرم بسداد المبلغ في أقرب وقت ممكن. شكراً لتعاونكم.`,
                    )}
                    target="_blank"
                    rel="noopener"
                  >
                    <Button size="sm" variant="outline" className="text-green-700 border-green-200 h-8 text-xs">
                      <MessageCircle className="h-3 w-3 ms-1" />تذكير
                    </Button>
                  </a>
                )}
                {["pending", "overdue", "partially_paid"].includes(inv.status) && (
                  <Button
                    size="sm"
                    className="btn-hero h-8 text-xs"
                    onClick={() => {
                      setPayingInvoice(inv);
                      payForm.reset({
                        method: "bank_transfer",
                        date: new Date().toISOString().split("T")[0],
                        amountPaid: remaining,
                        notes: "",
                      });
                    }}
                  >
                    <CheckCircle2 className="h-3 w-3 ms-1" />دفعة
                  </Button>
                )}
                {!["paid", "cancelled"].includes(inv.status) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive h-8"
                    onClick={() => setCancelId(inv.id)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment dialog */}
      <Dialog open={!!payingInvoice} onOpenChange={(o) => !o && setPayingInvoice(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة</DialogTitle>
          </DialogHeader>
          <form onSubmit={payForm.handleSubmit((v) => payment.mutate(v))} className="space-y-4">
            <div className="space-y-1">
              <Label>طريقة الدفع</Label>
              <Controller
                control={payForm.control}
                name="method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                      <SelectItem value="cheque">شيك</SelectItem>
                      <SelectItem value="cash">نقد</SelectItem>
                      <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
                      <SelectItem value="stc_pay">STC Pay</SelectItem>
                      <SelectItem value="apple_pay">Apple Pay</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>تاريخ الدفع</Label>
                <Input type="date" {...payForm.register("date")} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>المبلغ المدفوع</Label>
                <Input type="number" {...payForm.register("amountPaid")} dir="ltr" step="0.01" />
                {payForm.formState.errors.amountPaid && (
                  <p className="text-xs text-destructive">{payForm.formState.errors.amountPaid.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label>ملاحظات</Label>
              <Textarea {...payForm.register("notes")} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayingInvoice(null)}>إلغاء</Button>
              <Button type="submit" className="btn-hero" disabled={payment.isPending}>
                {payment.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                تسجيل
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New invoice dialog */}
      <Dialog open={newInvoiceOpen} onOpenChange={setNewInvoiceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>فاتورة جديدة</DialogTitle>
          </DialogHeader>
          <form onSubmit={newInvForm.handleSubmit((v) => createInv.mutate(v))} className="space-y-4">
            <div className="space-y-1">
              <Label>العقد *</Label>
              <Controller
                control={newInvForm.control}
                name="contract_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="اختر العقد" /></SelectTrigger>
                    <SelectContent>
                      {contracts.map((c) => {
                        const tenant = c.tenant as unknown as { name: string } | null;
                        const unit = c.unit as unknown as { unit_number: string } | null;
                        return (
                          <SelectItem key={c.id} value={c.id}>
                            {tenant?.name} — {unit?.unit_number}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
              {newInvForm.formState.errors.contract_id && (
                <p className="text-xs text-destructive">{newInvForm.formState.errors.contract_id.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>المبلغ *</Label>
              <Input type="number" {...newInvForm.register("amount")} dir="ltr" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>تاريخ الاستحقاق</Label>
                <Input type="date" {...newInvForm.register("due_date")} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>بداية الفترة</Label>
                <Input type="date" {...newInvForm.register("period_start")} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>نهاية الفترة</Label>
                <Input type="date" {...newInvForm.register("period_end")} dir="ltr" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>ملاحظات</Label>
              <Textarea {...newInvForm.register("notes")} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewInvoiceOpen(false)}>إلغاء</Button>
              <Button type="submit" className="btn-hero" disabled={createInv.isPending}>
                {createInv.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                إنشاء
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء الفاتورة</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من إلغاء هذه الفاتورة؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => cancelId && cancel.mutate(cancelId)}
              disabled={cancel.isPending}
            >
              {cancel.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
              إلغاء الفاتورة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
