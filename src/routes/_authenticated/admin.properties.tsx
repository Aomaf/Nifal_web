import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  listAdminProperties,
  upsertProperty,
  deleteProperty,
  togglePropertyFlag,
} from "@/lib/properties.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, Eye, Star, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatSAR, PROPERTY_TYPE_LABELS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/properties")({
  component: AdminProperties,
});

const schema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2, "العنوان مطلوب").max(200),
  description: z.string().max(5000).optional().nullable(),
  city: z.string().min(1, "المدينة مطلوبة"),
  district: z.string().optional().nullable(),
  type: z.enum(["villa", "apartment", "office", "shop", "industrial", "residential_land", "commercial_land", "industrial_land", "building"]),
  purpose: z.enum(["sale", "rent"]),
  price: z.coerce.number().nonnegative(),
  area_sqm: z.coerce.number().nonnegative().optional().nullable(),
  bedrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  bathrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  status: z.enum(["available", "sold", "rented", "reserved"]).default("available"),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(false),
  rega_ad_code: z.string().optional().nullable(),
});
type FormValues = z.infer<typeof schema>;

function AdminProperties() {
  const qc = useQueryClient();
  const { data: items, isLoading } = useQuery({ queryKey: ["admin-properties"], queryFn: () => listAdminProperties() });
  const [editing, setEditing] = useState<FormValues | null>(null);
  const [open, setOpen] = useState(false);

  const toggle = useMutation({
    mutationFn: (vars: { id: string; field: "is_published" | "is_featured"; value: boolean }) =>
      togglePropertyFlag({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-properties"] }),
    onError: (e) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteProperty({ data: { id } }),
    onSuccess: () => { toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["admin-properties"] }); },
    onError: (e) => toast.error(e.message),
  });

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (p: { id: string; title: string; description: string | null; city: string; district: string | null; type: string; purpose: string; price: number; area_sqm: number | null; bedrooms: number | null; bathrooms: number | null; status: string; is_featured: boolean | null; is_published: boolean | null; rega_ad_code: string | null }) => {
    setEditing({
      id: p.id, title: p.title, description: p.description, city: p.city, district: p.district,
      type: p.type as FormValues["type"], purpose: p.purpose as FormValues["purpose"],
      price: Number(p.price), area_sqm: p.area_sqm ? Number(p.area_sqm) : null,
      bedrooms: p.bedrooms, bathrooms: p.bathrooms,
      status: p.status as FormValues["status"], is_featured: !!p.is_featured, is_published: !!p.is_published,
      rega_ad_code: p.rega_ad_code,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">إدارة العقارات</h1>
          <p className="text-muted-foreground text-sm mt-1">{items?.length ?? 0} عقار</p>
        </div>
        <Button className="btn-hero h-10" onClick={openNew}><Plus className="ms-2 h-4 w-4" /> عقار جديد</Button>
      </div>

      {isLoading && <div className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>}

      <div className="grid gap-4">
        {items?.map((p) => {
          const cover = p.property_images?.find((i) => i.is_primary)?.image_url ?? p.property_images?.[0]?.image_url;
          return (
            <div key={p.id} className="card-elegant p-4 flex flex-wrap gap-4 items-center">
              <div className="h-20 w-28 rounded-lg bg-muted overflow-hidden shrink-0">
                {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold">{p.title}</h3>
                  {p.is_published ? <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">منشور</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">مسودة</span>}
                </div>
                <p className="text-xs text-muted-foreground">{p.city}{p.district ? ` · ${p.district}` : ""} · {PROPERTY_TYPE_LABELS[p.type]}</p>
                <p className="text-sm font-semibold text-primary tabular mt-1">{formatSAR(Number(p.price))}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" title="نشر" onClick={() => toggle.mutate({ id: p.id, field: "is_published", value: !p.is_published })}>
                  <Eye className={`h-4 w-4 ${p.is_published ? "text-success" : "text-muted-foreground"}`} />
                </Button>
                <Button variant="ghost" size="icon" title="مميز" onClick={() => toggle.mutate({ id: p.id, field: "is_featured", value: !p.is_featured })}>
                  <Star className={`h-4 w-4 ${p.is_featured ? "text-accent-dark fill-accent" : "text-muted-foreground"}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(p as never)}><Edit2 className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف العقار</AlertDialogTitle>
                      <AlertDialogDescription>هل أنت متأكد من حذف "{p.title}"؟ لا يمكن التراجع.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate(p.id)}>حذف</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </div>

      <PropertyDialog open={open} onOpenChange={setOpen} initial={editing} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-properties"] })} />
    </div>
  );
}

function PropertyDialog({ open, onOpenChange, initial, onSaved }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: FormValues | null;
  onSaved: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    values: (initial ?? {
      title: "", city: "الرياض", type: "apartment", purpose: "sale",
      price: 0, status: "available", is_featured: false, is_published: false,
    }) as FormValues,
  });
  const save = useMutation({
    mutationFn: (v: FormValues) => upsertProperty({ data: v }),
    onSuccess: () => { toast.success("تم الحفظ"); onOpenChange(false); onSaved(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "تعديل عقار" : "عقار جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <div>
            <Label>العنوان</Label>
            <Input {...form.register("title")} />
            {form.formState.errors.title && <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>المدينة</Label>
              <Input {...form.register("city")} />
            </div>
            <div>
              <Label>الحي</Label>
              <Input {...form.register("district")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>النوع</Label>
              <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as FormValues["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الغرض</Label>
              <Select value={form.watch("purpose")} onValueChange={(v) => form.setValue("purpose", v as FormValues["purpose"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">للبيع</SelectItem>
                  <SelectItem value="rent">للإيجار</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>السعر (ر.س)</Label>
              <Input type="number" step="1000" {...form.register("price")} />
            </div>
            <div>
              <Label>المساحة (م²)</Label>
              <Input type="number" {...form.register("area_sqm")} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>غرف النوم</Label><Input type="number" {...form.register("bedrooms")} /></div>
            <div><Label>الحمامات</Label><Input type="number" {...form.register("bathrooms")} /></div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as FormValues["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">متاح</SelectItem>
                  <SelectItem value="sold">مباع</SelectItem>
                  <SelectItem value="rented">مؤجر</SelectItem>
                  <SelectItem value="reserved">محجوز</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>الوصف</Label>
            <Textarea rows={4} {...form.register("description")} />
          </div>
          <div>
            <Label>رمز الإعلان (REGA)</Label>
            <Input dir="ltr" {...form.register("rega_ad_code")} />
          </div>
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted">
            <Label htmlFor="pub" className="cursor-pointer">منشور للعامة</Label>
            <Switch id="pub" checked={form.watch("is_published")} onCheckedChange={(v) => form.setValue("is_published", v)} />
          </div>
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted">
            <Label htmlFor="feat" className="cursor-pointer">عقار مميز (يظهر في الصفحة الرئيسية)</Label>
            <Switch id="feat" checked={form.watch("is_featured")} onCheckedChange={(v) => form.setValue("is_featured", v)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" className="btn-hero" disabled={save.isPending}>
              {save.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
