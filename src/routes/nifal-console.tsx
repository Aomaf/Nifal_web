import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { NafalLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const loginSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
});
const signupSchema = loginSchema.extend({ full_name: z.string().min(2, "الاسم مطلوب") });

export const Route = createFileRoute("/nifal-console")({
  head: () => ({ meta: [{ title: "تسجيل الدخول | نِفال العقارية" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const signupForm = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", full_name: "" },
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    const { error, data: authData } = await supabase.auth.signInWithPassword(data);
    setLoading(false);
    if (error) return toast.error("فشل تسجيل الدخول: " + error.message);
    if (!authData.session) return toast.error("فشل تسجيل الدخول: لم يتم إنشاء جلسة");
    toast.success("تم تسجيل الدخول");
    navigate({ to: "/admin" });
  };

  const onSignup = async (data: z.infer<typeof signupSchema>) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin + "/admin" : undefined,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء الحساب. أنت بحاجة لمنح صلاحية من المدير لاستخدام لوحة الإدارة.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 surface-hero opacity-95" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <NafalLogo className="h-16 w-auto mx-auto brightness-0 invert" />
          <p className="text-sm text-primary-foreground/80 mt-2">لوحة الإدارة</p>
        </div>
        <div className="card-elegant p-6 bg-surface">
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">تسجيل دخول</TabsTrigger>
              <TabsTrigger value="signup">حساب جديد</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-3">
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" dir="ltr" {...loginForm.register("email")} />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-destructive mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label>كلمة المرور</Label>
                  <Input type="password" dir="ltr" {...loginForm.register("password")} />
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-destructive mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full btn-hero h-11" disabled={loading}>
                  {loading ? "جاري الدخول..." : "تسجيل الدخول"}
                </Button>
                <button
                  type="button"
                  className="w-full text-xs text-muted-foreground hover:text-foreground text-center mt-1"
                  onClick={() => setForgotOpen((v) => !v)}
                >
                  نسيت كلمة المرور؟
                </button>
                {forgotOpen && (
                  <div className="mt-2 space-y-2 rounded-lg bg-muted/50 p-3">
                    {forgotSent ? (
                      <p className="text-xs text-green-700">
                        تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">
                          أدخل بريدك لإرسال رابط إعادة تعيين كلمة المرور
                        </p>
                        <Input
                          type="email"
                          dir="ltr"
                          placeholder="your@email.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="w-full"
                          disabled={loading}
                          onClick={async () => {
                            if (!forgotEmail) return;
                            setLoading(true);
                            const { error } = await supabase.auth.resetPasswordForEmail(
                              forgotEmail,
                              {
                                redirectTo:
                                  typeof window !== "undefined"
                                    ? window.location.origin + "/reset-password"
                                    : undefined,
                              },
                            );
                            setLoading(false);
                            if (error) {
                              toast.error(error.message);
                            } else {
                              setForgotSent(true);
                            }
                          }}
                        >
                          {loading ? "..." : "إرسال الرابط"}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </form>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-3">
                <div>
                  <Label>الاسم الكامل</Label>
                  <Input {...signupForm.register("full_name")} />
                  {signupForm.formState.errors.full_name && (
                    <p className="text-xs text-destructive mt-1">
                      {signupForm.formState.errors.full_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" dir="ltr" {...signupForm.register("email")} />
                  {signupForm.formState.errors.email && (
                    <p className="text-xs text-destructive mt-1">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label>كلمة المرور</Label>
                  <Input type="password" dir="ltr" {...signupForm.register("password")} />
                </div>
                <Button type="submit" className="w-full btn-hero h-11" disabled={loading}>
                  {loading ? "..." : "إنشاء حساب"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
            بعد التسجيل، يجب أن يقوم المدير العام بمنحك الصلاحية المناسبة.
          </p>
        </div>
        <p className="text-center mt-4 text-sm text-primary-foreground/80">
          <a href="/" className="hover:text-accent">
            ← العودة للموقع
          </a>
        </p>
      </div>
    </div>
  );
}
