import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Clock } from "lucide-react";
import { PageHeader } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSettings, saveSetting, getAuditLog } from "@/lib/settings.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

const ACTION_LABELS: Record<string, string> = {
  create: "إنشاء",
  update: "تحديث",
  delete: "حذف",
  upsert: "حفظ",
  convert: "تحويل",
  payment: "دفعة",
};

const ENTITY_LABELS: Record<string, string> = {
  property: "عقار",
  client: "عميل",
  lead: "طلب",
  contract: "عقد",
  invoice: "فاتورة",
  owner: "مالك",
};

function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings = {} } = useQuery({
    queryKey: ["system-settings"],
    queryFn: () => getSettings(),
  });

  const { data: auditLog = [] } = useQuery({
    queryKey: ["audit-log"],
    queryFn: () => getAuditLog(),
  });

  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      saveSetting({ data: { key, value } }),
    onSuccess: () => {
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function get(key: string, fallback = ""): string {
    const v = (settings as Record<string, unknown>)[key];
    if (typeof v === "string") return v;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) return JSON.stringify(v);
    return fallback;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإعدادات"
        breadcrumbs={[{ label: "لوحة التحكم", to: "/admin" }, { label: "الإعدادات" }]}
      />

      <Tabs defaultValue="company" dir="rtl">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="company">الشركة</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          <TabsTrigger value="defaults">الافتراضيات</TabsTrigger>
          <TabsTrigger value="templates">القوالب</TabsTrigger>
          <TabsTrigger value="audit">سجل النشاط</TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company">
          <CompanyTab
            settings={settings as Record<string, unknown>}
            onSave={save.mutate}
            saving={save.isPending}
          />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">إعدادات الإشعارات</h2>
            {[
              { key: "new_lead_email", label: "إشعار بريدي عند ورود طلب جديد" },
              { key: "overdue_invoice_email", label: "إشعار بريدي عند تأخر فاتورة" },
              { key: "contract_expiry_email", label: "إشعار بريدي عند اقتراب انتهاء عقد" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label>{label}</Label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={get(key) === "true"}
                  onClick={() =>
                    save.mutate({ key, value: get(key) !== "true" ? "true" : "false" })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    get(key) === "true" ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      get(key) === "true" ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني لاستقبال الإشعارات</Label>
              <Input
                defaultValue={get("notification_email")}
                onBlur={(e) => save.mutate({ key: "notification_email", value: e.target.value })}
                type="email"
                dir="ltr"
                placeholder="admin@company.com"
              />
            </div>
          </div>
        </TabsContent>

        {/* Defaults Tab */}
        <TabsContent value="defaults">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">الافتراضيات</h2>
            <div className="space-y-1.5">
              <Label>نسبة العمولة الافتراضية (%)</Label>
              <Input
                type="number"
                defaultValue={get("default_commission_rate", "2.5")}
                onBlur={(e) =>
                  save.mutate({ key: "default_commission_rate", value: e.target.value })
                }
                min={0}
                max={100}
                step={0.5}
              />
            </div>
            <div className="space-y-1.5">
              <Label>دورة الدفع الافتراضية</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={get("default_payment_frequency", "monthly")}
                onChange={(e) =>
                  save.mutate({ key: "default_payment_frequency", value: e.target.value })
                }
              >
                <option value="monthly">شهري</option>
                <option value="quarterly">ربع سنوي</option>
                <option value="biannual">نصف سنوي</option>
                <option value="annual">سنوي</option>
              </select>
            </div>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">قوالب رسائل واتساب</h2>
            {[
              {
                key: "wa_template_lead_new",
                label: "رسالة استقبال الطلب الجديد",
                placeholder: "السلام عليكم {name}، شكراً لاهتمامك بـ {property}. يسعدنا مساعدتك.",
              },
              {
                key: "wa_template_invoice_overdue",
                label: "رسالة تذكير الفاتورة المتأخرة",
                placeholder:
                  "السيد/ة {name}، نُذكّركم بأن فاتورة الإيجار بقيمة {amount} ريال مستحقة منذ {date}.",
              },
              {
                key: "wa_template_maintenance_high",
                label: "رسالة الصيانة العاجلة",
                placeholder: "السيد/ة {name}، تمت إحالة بلاغكم العاجل رقم #{id} إلى الفريق المختص.",
              },
              {
                key: "wa_template_maintenance_low",
                label: "رسالة الصيانة العادية",
                placeholder:
                  "السيد/ة {name}، تم استلام بلاغكم رقم #{id} وسيتم معالجته خلال 24-48 ساعة.",
              },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Textarea
                  key={`${key}-${JSON.stringify(settings)}`}
                  defaultValue={get(key, placeholder)}
                  onBlur={(e) => save.mutate({ key, value: e.target.value })}
                  rows={3}
                />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-5 py-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">آخر 100 نشاط</span>
            </div>
            <div className="divide-y divide-border">
              {(
                auditLog as {
                  id: string;
                  user_id: string | null;
                  action: string;
                  entity_type: string;
                  entity_id: string | null;
                  created_at: string;
                }[]
              ).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-muted/20"
                >
                  <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span className="text-muted-foreground font-mono text-xs">
                    {entry.user_id?.slice(0, 8) ?? "—"}
                  </span>
                  <span className="flex-1">
                    <span className="font-medium">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </span>{" "}
                    {ENTITY_LABELS[entry.entity_type] ?? entry.entity_type}
                    {entry.entity_id && (
                      <span className="ms-1 text-muted-foreground font-mono text-xs">
                        #{entry.entity_id.slice(0, 8)}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString("ar-SA")}
                  </span>
                </div>
              ))}
              {(auditLog as unknown[]).length === 0 && (
                <p className="px-5 py-8 text-center text-muted-foreground text-sm">
                  لا توجد سجلات بعد
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CompanyTab({
  settings,
  onSave,
  saving,
}: {
  settings: Record<string, unknown>;
  onSave: (args: { key: string; value: unknown }) => void;
  saving: boolean;
}) {
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [taxId, setTaxId] = useState("");

  useEffect(() => {
    setCompanyName((settings["company_name"] as string) ?? "");
    setCompanyEmail((settings["company_email"] as string) ?? "");
    setCompanyAddress((settings["company_address"] as string) ?? "");
    setWhatsapp((settings["company_whatsapp"] as string) ?? "");
    setTaxId((settings["company_tax_id"] as string) ?? "");
  }, [settings]);

  function handleSaveAll() {
    onSave({ key: "company_name", value: companyName });
    onSave({ key: "company_email", value: companyEmail });
    onSave({ key: "company_address", value: companyAddress });
    onSave({ key: "company_whatsapp", value: whatsapp });
    onSave({ key: "company_tax_id", value: taxId });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">معلومات الشركة</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>اسم الشركة</Label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>البريد الإلكتروني</Label>
          <Input
            value={companyEmail}
            onChange={(e) => setCompanyEmail(e.target.value)}
            type="email"
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <Label>رقم واتساب للتواصل</Label>
          <div className="flex gap-2">
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              dir="ltr"
              placeholder="+966500000000"
            />
            {whatsapp && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  اختبار
                </a>
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>الرقم الضريبي</Label>
          <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} dir="ltr" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>العنوان</Label>
        <Textarea
          value={companyAddress}
          onChange={(e) => setCompanyAddress(e.target.value)}
          rows={2}
        />
      </div>
      <Button onClick={handleSaveAll} disabled={saving}>
        <Save className="me-2 h-4 w-4" />
        {saving ? "جارٍ الحفظ..." : "حفظ"}
      </Button>
    </div>
  );
}
