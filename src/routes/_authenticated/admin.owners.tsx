import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useMemo } from "react";
import { listAdminOwners, upsertOwner, deleteOwner } from "@/lib/owners.functions";
import { PageHeader, KpiCard } from "@/components/dashboard";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  UserCircle,
  MessageCircle,
  Building2,
  TrendingUp,
  ArrowDownUp,
  Search,
} from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/format";
import { SarIcon } from "@/components/ui/sar-icon";

export const Route = createFileRoute("/_authenticated/admin/owners")({
  component: OwnersPage,
});

type Property = {
  id: string;
  price: number | null;
  status: string | null;
  title: string | null;
  city: string | null;
  type: string | null;
};

type Owner = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  national_id: string | null;
  notes: string | null;
  created_at: string;
  properties: Property[];
};

const PROPERTY_STATUS_LABELS: Record<string, string> = {
  available: "متاح",
  rented: "مؤجر",
  sold: "مباع",
  under_construction: "تحت الإنشاء",
};

const PROPERTY_STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  rented: "bg-blue-100 text-blue-800",
  sold: "bg-gray-100 text-gray-700",
  under_construction: "bg-amber-100 text-amber-800",
};

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z.string().min(9).max(20).optional().nullable(),
  email: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")).nullable(),
  national_id: z.string().max(20).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});
type FormValues = z.infer<typeof schema>;

function portfolioValue(owner: Owner): number {
  return (owner.properties ?? []).reduce((s, p) => s + (p.price ?? 0), 0);
}

function OwnersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [portfolioOwner, setPortfolioOwner] = useState<Owner | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "portfolio">("created_at");

  const { data: rawOwners = [], isLoading } = useQuery({
    queryKey: ["admin-owners"],
    queryFn: () => listAdminOwners(),
  });

  const owners = useMemo(() => {
    let list = (rawOwners as Owner[]).filter(
      (o) =>
        !search ||
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        (o.phone ?? "").includes(search),
    );
    if (sortBy === "portfolio") {
      list = [...list].sort((a, b) => portfolioValue(b) - portfolioValue(a));
    }
    return list;
  }, [rawOwners, search, sortBy]);

  const totalPortfolio = useMemo(
    () => (rawOwners as Owner[]).reduce((s, o) => s + portfolioValue(o), 0),
    [rawOwners],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", national_id: "", notes: "" },
  });

  const save = useMutation({
    mutationFn: (v: FormValues) => upsertOwner({ data: v as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-owners"] });
      setOpen(false);
      toast.success("تم الحفظ");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteOwner({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-owners"] });
      setDeleteId(null);
      setDeleteError(null);
      toast.success("تم الحذف");
    },
    onError: () => {
      setDeleteError("لا يمكن حذف هذا المالك لأنه مرتبط بعقارات");
    },
  });

  function openCreate() {
    form.reset({ name: "", phone: "", email: "", national_id: "", notes: "" });
    setOpen(true);
  }

  function openEdit(o: Owner) {
    form.reset(o as FormValues);
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="الملاك"
        breadcrumbs={[{ label: "لوحة التحكم", to: "/admin" }, { label: "الملاك" }]}
        action={
          <Button onClick={openCreate}>
            <Plus className="me-2 h-4 w-4" />
            إضافة مالك
          </Button>
        }
      />

      {/* Portfolio KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="إجمالي الملاك" value={(rawOwners as Owner[]).length} icon={UserCircle} />
        <KpiCard
          label="إجمالي العقارات"
          value={(rawOwners as Owner[]).reduce((s, o) => s + (o.properties?.length ?? 0), 0)}
          icon={Building2}
        />
        <KpiCard
          label="قيمة المحافظ الإجمالية"
          value={`${(totalPortfolio / 1_000_000).toFixed(1)}M`}
          icon={TrendingUp}
          tint="success"
        />
        <KpiCard
          label="متوسط قيمة المحفظة"
          value={
            (rawOwners as Owner[]).length > 0
              ? `${(totalPortfolio / (rawOwners as Owner[]).length / 1_000_000).toFixed(1)}M`
              : "0"
          }
          icon={TrendingUp}
        />
      </div>

      {/* Search + Sort */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-52">
            <ArrowDownUp className="me-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">ترتيب حسب التاريخ</SelectItem>
            <SelectItem value="portfolio">ترتيب حسب قيمة المحفظة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && owners.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <UserCircle className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">لا يوجد ملاك</p>
          <Button onClick={openCreate}>
            <Plus className="me-2 h-4 w-4" />
            إضافة مالك
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {owners.map((o) => {
          const props = o.properties ?? [];
          const pv = portfolioValue(o);
          const available = props.filter((p) => p.status === "available").length;
          return (
            <div key={o.id} className="card-elegant p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base">{o.name}</h3>
                  {o.national_id && (
                    <p className="text-xs text-muted-foreground">
                      هوية: ***{o.national_id.slice(-4)}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(o)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      setDeleteId(o.id);
                      setDeleteError(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Portfolio summary */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  <Building2 className="me-1 h-3 w-3" />
                  {props.length} عقار
                </Badge>
                {pv > 0 && (
                  <Badge variant="outline" className="text-xs text-green-700">
                    {(pv / 1_000_000).toFixed(1)}M <SarIcon />
                  </Badge>
                )}
                {available > 0 && (
                  <Badge className="bg-green-100 text-green-800 text-xs">{available} متاح</Badge>
                )}
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                {o.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{o.phone}</span>
                    <a
                      href={buildWhatsAppUrl(o.phone, `السلام عليكم ${o.name}`)}
                      target="_blank"
                      rel="noopener"
                      className="ms-auto text-green-600 hover:text-green-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                )}
                {o.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{o.email}</span>
                  </div>
                )}
                {o.notes && (
                  <p className="text-xs line-clamp-2 pt-1 border-t border-border">{o.notes}</p>
                )}
              </div>

              {props.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setPortfolioOwner(o)}
                >
                  <Building2 className="me-2 h-3.5 w-3.5" />
                  عرض العقارات
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Portfolio Sheet */}
      <Sheet open={!!portfolioOwner} onOpenChange={(o) => !o && setPortfolioOwner(null)}>
        <SheetContent side="left" className="sm:w-105 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              عقارات {portfolioOwner?.name} ({portfolioOwner?.properties?.length ?? 0})
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {(portfolioOwner?.properties ?? []).map((p) => (
              <div key={p.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{p.title ?? "عقار بدون عنوان"}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.city ?? "—"} · {p.type ?? "—"}
                    </p>
                  </div>
                  <Badge
                    className={
                      PROPERTY_STATUS_COLORS[p.status ?? ""] ?? "bg-gray-100 text-gray-700"
                    }
                  >
                    {PROPERTY_STATUS_LABELS[p.status ?? ""] ?? p.status ?? "—"}
                  </Badge>
                </div>
                {p.price != null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.price.toLocaleString("en-US")} <SarIcon />
                  </p>
                )}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.getValues("id") ? "تعديل مالك" : "إضافة مالك"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <div className="space-y-1">
              <Label>الاسم *</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>الهاتف</Label>
                <Input {...form.register("phone")} dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label>البريد الإلكتروني</Label>
                <Input {...form.register("email")} dir="ltr" />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
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
              <Button type="submit" disabled={save.isPending}>
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
                "هل أنت متأكد من حذف هذا المالك؟ لا يمكن التراجع."
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
