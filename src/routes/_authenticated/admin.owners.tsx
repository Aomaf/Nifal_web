import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { listAdminOwners, upsertOwner, deleteOwner } from "@/lib/owners.functions";
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
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Phone, Mail, UserCircle, MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/owners")({
  component: OwnersPage,
});

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z.string().min(9).max(20).optional().nullable(),
  email: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")).nullable(),
  national_id: z.string().max(20).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});
type FormValues = z.infer<typeof schema>;

function OwnersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: owners = [], isLoading } = useQuery({
    queryKey: ["admin-owners"],
    queryFn: () => listAdminOwners(),
  });

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

  function openEdit(o: typeof owners[0]) {
    form.reset(o);
    setOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="الملاك"
        breadcrumbs={[{ label: "لوحة التحكم", to: "/admin" }, { label: "الملاك" }]}
        action={
          <Button onClick={openCreate} className="btn-hero">
            <Plus className="h-4 w-4 ms-2" />
            إضافة مالك
          </Button>
        }
      />

      {isLoading && (
        <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div>
      )}

      {!isLoading && owners.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <UserCircle className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">لا يوجد ملاك</p>
          <Button onClick={openCreate} className="btn-hero">
            <Plus className="h-4 w-4 ms-2" />
            إضافة مالك
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
        {owners.map((o) => (
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
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {form.getValues("id") ? "تعديل مالك" : "إضافة مالك"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((v) => save.mutate(v))}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label>الاسم *</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
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
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
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
