import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { NafalLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirm"],
  });

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "إعادة تعيين كلمة المرور | نِفال العقارية" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = async (vals: z.infer<typeof schema>) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: vals.password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث كلمة المرور بنجاح");
    navigate({ to: "/nifal-console" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 surface-hero opacity-95" />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-6">
          <NafalLogo className="h-16 w-auto mx-auto brightness-0 invert" />
          <h1 className="mt-3 text-2xl font-bold text-primary-foreground">
            إعادة تعيين كلمة المرور
          </h1>
        </div>
        <div className="card-elegant p-6 bg-surface">
          {!ready ? (
            <p className="text-center text-sm text-muted-foreground">
              يرجى الانتظار... جارٍ التحقق من الرابط.
            </p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>كلمة المرور الجديدة</Label>
                <Input type="password" dir="ltr" {...register("password")} />
                {formState.errors.password && (
                  <p className="text-xs text-destructive">{formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>تأكيد كلمة المرور</Label>
                <Input type="password" dir="ltr" {...register("confirm")} />
                {formState.errors.confirm && (
                  <p className="text-xs text-destructive">{formState.errors.confirm.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full btn-hero h-11" disabled={loading}>
                {loading ? "جارٍ التحديث..." : "تحديث كلمة المرور"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
