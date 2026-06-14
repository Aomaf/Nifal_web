import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, UserX, ShieldCheck, Mail } from "lucide-react";
import { PageHeader } from "@/components/dashboard";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { z as zod } from "zod";

const supabaseAdmin = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("user_id, role, is_active, display_name, last_login_at");
    return roles ?? [];
  });

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    zod.object({ email: zod.string().email(), role: zod.string() }).parse(data),
  )
  .handler(async ({ data }) => {
    const admin = supabaseAdmin();
    const { error } = await admin.auth.admin.inviteUserByEmail(data.email, {
      data: { role: data.role },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    zod.object({ userId: zod.string().uuid(), role: zod.string() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_roles")
      .update({ role: data.role } as never)
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deactivateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => zod.object({ userId: zod.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("لا يمكن إلغاء تفعيل حسابك الخاص");
    const { error } = await context.supabase
      .from("user_roles")
      .update({ is_active: false } as never)
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

const ROLE_LABELS: Record<string, string> = {
  super_admin: "مدير عام",
  sales_manager: "مدير مبيعات",
  sales_agent: "موظف مبيعات",
  property_manager: "مدير عقارات",
  accountant: "محاسب",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-800",
  sales_manager: "bg-blue-100 text-blue-800",
  sales_agent: "bg-sky-100 text-sky-800",
  property_manager: "bg-green-100 text-green-800",
  accountant: "bg-amber-100 text-amber-800",
};

const inviteSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  role: z.string().min(1, "الدور مطلوب"),
});

type UserRow = {
  user_id: string;
  role: string;
  is_active: boolean;
  display_name: string | null;
  last_login_at: string | null;
};

function UsersPage() {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [changeRole, setChangeRole] = useState<{ userId: string; role: string } | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listAdminUsers(),
  });

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "sales_agent" },
  });

  const inviteMutation = useMutation({
    mutationFn: (vals: z.infer<typeof inviteSchema>) => inviteUser({ data: vals }),
    onSuccess: () => {
      toast.success("تمت الدعوة بنجاح — سيتلقى المستخدم رابط البريد الإلكتروني");
      setInviteOpen(false);
      form.reset();
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateUserRole({ data: { userId, role } }),
    onSuccess: () => {
      toast.success("تم تحديث الدور");
      setChangeRole(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => deactivateUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("تم إلغاء تفعيل المستخدم");
      setDeactivateId(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="المستخدمون"
        breadcrumbs={[{ label: "لوحة التحكم", to: "/admin" }, { label: "المستخدمون" }]}
        action={
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="me-2 h-4 w-4" />
            دعوة مستخدم
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-start font-medium">المعرّف</th>
                <th className="px-4 py-3 text-start font-medium">الدور</th>
                <th className="px-4 py-3 text-start font-medium">الحالة</th>
                <th className="px-4 py-3 text-start font-medium">آخر دخول</th>
                <th className="px-4 py-3 text-start font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(users as unknown as UserRow[]).map((u) => (
                <tr key={u.user_id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {u.display_name ?? u.user_id.slice(0, 12) + "..."}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-700"}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <Badge className="bg-green-100 text-green-800">نشط</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">معطّل</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString("ar-SA") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setChangeRole({ userId: u.user_id, role: u.role })}
                      >
                        <ShieldCheck className="me-1 h-3.5 w-3.5" />
                        تغيير الدور
                      </Button>
                      {u.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeactivateId(u.user_id)}
                        >
                          <UserX className="me-1 h-3.5 w-3.5" />
                          تعطيل
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>دعوة مستخدم جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((v) => inviteMutation.mutate(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني *</Label>
              <div className="relative">
                <Mail className="absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...form.register("email")}
                  type="email"
                  placeholder="user@example.com"
                  dir="ltr"
                  className="ps-9"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>الدور *</Label>
              <Select value={form.watch("role")} onValueChange={(v) => form.setValue("role", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? "جارٍ الإرسال..." : "إرسال الدعوة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={!!changeRole} onOpenChange={(o) => !o && setChangeRole(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تغيير الدور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={changeRole?.role ?? "sales_agent"}
              onValueChange={(v) => setChangeRole((r) => (r ? { ...r, role: v } : null))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChangeRole(null)}>
                إلغاء
              </Button>
              <Button
                onClick={() => changeRole && roleMutation.mutate(changeRole)}
                disabled={roleMutation.isPending}
              >
                {roleMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirm */}
      <AlertDialog open={!!deactivateId} onOpenChange={(o) => !o && setDeactivateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تعطيل المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم منع هذا المستخدم من الدخول. يمكنك إعادة تفعيله لاحقاً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deactivateId && deactivateMutation.mutate(deactivateId)}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? "جارٍ التعطيل..." : "تعطيل"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
