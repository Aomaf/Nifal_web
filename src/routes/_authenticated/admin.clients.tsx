import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { listAdminClients, upsertClient, deleteClient } from "@/lib/clients.functions";
import { listClientActivities, addClientActivity } from "@/lib/client-activities.functions";
import { PageHeader } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MessageCircle,
  Users,
  Calendar,
  LayoutGrid,
  List,
  Loader2,
  PhoneCall,
  Mail,
  UserCheck,
  MapPin,
  StickyNote,
  Star,
  AlertCircle,
} from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/format";
import { SarAmount } from "@/components/ui/sar-icon";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/admin/clients")({
  component: ClientsPage,
});

const STAGES = [
  { value: "lead", label: "طلب" },
  { value: "prospect", label: "محتمل" },
  { value: "active", label: "نشط" },
  { value: "negotiation", label: "تفاوض" },
  { value: "closed", label: "مغلق" },
  { value: "lost", label: "خسارة" },
];

const STAGE_COLORS: Record<string, string> = {
  lead: "bg-blue-100 text-blue-700 border-blue-200",
  prospect: "bg-yellow-100 text-yellow-700 border-yellow-200",
  active: "bg-green-100 text-green-700 border-green-200",
  negotiation: "bg-purple-100 text-purple-700 border-purple-200",
  closed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  lost: "bg-red-100 text-red-700 border-red-200",
};

const ACTIVITY_ICONS: Record<string, typeof PhoneCall> = {
  call: PhoneCall,
  meeting: UserCheck,
  whatsapp: MessageCircle,
  email: Mail,
  visit: MapPin,
  note: StickyNote,
  stage_change: Star,
  lead_converted: UserCheck,
};

const ACTIVITY_LABELS: Record<string, string> = {
  call: "مكالمة",
  meeting: "اجتماع",
  whatsapp: "واتساب",
  email: "بريد إلكتروني",
  visit: "زيارة",
  note: "ملاحظة",
  stage_change: "تغيير المرحلة",
  lead_converted: "تحويل طلب",
};

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "الاسم مطلوب"),
  type: z.enum(["individual", "company", "foundation", "group"]),
  phone: z.string().min(9, "الهاتف مطلوب"),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  city: z.string().optional().nullable(),
  stage: z.enum(["lead", "prospect", "active", "negotiation", "closed", "lost"]),
  source: z.string().optional().nullable(),
  interest_type: z.string().optional().nullable(),
  budget: z.coerce.number().nonnegative().optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  next_followup_at: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
type FormValues = z.infer<typeof schema>;
type Client = Awaited<ReturnType<typeof listAdminClients>>[0];

// ─── Activity Panel inside Sheet ───────────────────────────────────────────
function ActivityPanel({ client }: { client: Client }) {
  const qc = useQueryClient();
  const [actType, setActType] = useState<string>("note");
  const [actNotes, setActNotes] = useState("");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["client-activities", client.id],
    queryFn: () => listClientActivities({ data: { clientId: client.id } }),
  });

  const addAct = useMutation({
    mutationFn: () =>
      addClientActivity({
        data: {
          client_id: client.id,
          type: actType as
            | "call"
            | "meeting"
            | "whatsapp"
            | "email"
            | "visit"
            | "note"
            | "stage_change"
            | "lead_converted",
          notes: actNotes || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-activities", client.id] });
      setActNotes("");
      toast.success("تم إضافة النشاط");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {/* Add activity form */}
      <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground">إضافة نشاط</p>
        <Select value={actType} onValueChange={setActType}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ACTIVITY_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          placeholder="ملاحظات (اختياري)..."
          value={actNotes}
          onChange={(e) => setActNotes(e.target.value)}
          rows={2}
          className="text-sm"
        />
        <Button
          size="sm"
          className="btn-hero w-full"
          onClick={() => addAct.mutate()}
          disabled={addAct.isPending}
        >
          {addAct.isPending ? <Loader2 className="h-3 w-3 animate-spin me-1" /> : null}
          إضافة
        </Button>
      </div>

      {/* Timeline */}
      {isLoading && (
        <div className="text-center py-4 text-muted-foreground text-sm">جاري التحميل…</div>
      )}
      {!isLoading && activities.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">لا توجد أنشطة بعد</p>
      )}
      <div className="space-y-3">
        {activities.map((act) => {
          const Icon = ACTIVITY_ICONS[act.type] ?? StickyNote;
          return (
            <div key={act.id} className="flex gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{ACTIVITY_LABELS[act.type]}</p>
                {act.notes && <p className="text-xs text-muted-foreground mt-0.5">{act.notes}</p>}
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: ar })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Kanban Column ──────────────────────────────────────────────────────────
function KanbanColumn({
  stage,
  clients,
  onEdit,
  onDelete,
  onDrop,
  onCardClick,
}: {
  stage: (typeof STAGES)[0];
  clients: Client[];
  onEdit: (c: Client) => void;
  onDelete: (id: string) => void;
  onDrop: (clientId: string, newStage: string) => void;
  onCardClick: (c: Client) => void;
}) {
  const totalBudget = clients.reduce((s, c) => s + (c.budget ?? 0), 0);

  return (
    <div
      className="flex flex-col min-w-60 w-60 shrink-0"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("clientId");
        if (id) onDrop(id, stage.value);
      }}
    >
      <div
        className={`px-3 py-2 rounded-t-lg border text-xs font-semibold flex items-center justify-between ${STAGE_COLORS[stage.value]}`}
      >
        <span>{stage.label}</span>
        <span className="opacity-70">{clients.length}</span>
      </div>
      <div className="flex-1 bg-muted/40 rounded-b-lg border border-t-0 border-border p-2 space-y-2 min-h-75">
        {clients.map((c) => {
          const isOverdue = c.next_followup_at && new Date(c.next_followup_at) <= new Date();
          return (
            <div
              key={c.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("clientId", c.id)}
              onClick={() => onCardClick(c)}
              className="bg-background border border-border rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-1">
                <p className="font-semibold text-sm leading-tight">{c.name}</p>
                <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button className="p-1 hover:bg-muted rounded" onClick={() => onEdit(c)}>
                    <Edit2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                  <button className="p-1 hover:bg-muted rounded" onClick={() => onDelete(c.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              </div>
              {c.city && <p className="text-xs text-muted-foreground">{c.city}</p>}
              {c.budget && (
                <p className="text-xs font-medium text-primary"><SarAmount value={c.budget} /></p>
              )}
              {c.rating && (
                <p className="text-xs text-amber-500">
                  {"★".repeat(c.rating)}
                  {"☆".repeat(5 - c.rating)}
                </p>
              )}
              {isOverdue && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>متابعة متأخرة</span>
                </div>
              )}
            </div>
          );
        })}
        {clients.length === 0 && (
          <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/50 border-2 border-dashed border-border rounded-lg">
            أسقط هنا
          </div>
        )}
      </div>
      {totalBudget > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-1">
          <SarAmount value={totalBudget} /> إجمالي الميزانية
        </p>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
function ClientsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [sheetClient, setSheetClient] = useState<Client | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [lostDialog, setLostDialog] = useState<{ clientId: string; fromStage: string } | null>(
    null,
  );

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => listAdminClients(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "individual",
      phone: "",
      email: "",
      city: "",
      stage: "lead",
      source: "",
      interest_type: "",
      budget: undefined,
      rating: undefined,
      next_followup_at: "",
      notes: "",
    },
  });

  const save = useMutation({
    mutationFn: (v: FormValues) => upsertClient({ data: v as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      setOpen(false);
      toast.success("تم الحفظ");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteClient({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      setDeleteId(null);
      setDeleteError(null);
      toast.success("تم الحذف");
    },
    onError: () => setDeleteError("حدث خطأ أثناء الحذف"),
  });

  const moveStage = useMutation({
    mutationFn: async ({
      client,
      newStage,
      reason,
    }: {
      client: Client;
      newStage: string;
      reason?: string;
    }) => {
      await upsertClient({ data: { ...client, stage: newStage } as never });
      const { addClientActivity } = await import("@/lib/client-activities.functions");
      await addClientActivity({
        data: {
          client_id: client.id,
          type: "stage_change",
          notes: reason
            ? `تم النقل من ${STAGES.find((s) => s.value === client.stage)?.label} إلى ${STAGES.find((s) => s.value === newStage)?.label}. السبب: ${reason}`
            : `تم النقل من ${STAGES.find((s) => s.value === client.stage)?.label} إلى ${STAGES.find((s) => s.value === newStage)?.label}`,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      toast.success("تم تحديث المرحلة");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openCreate() {
    form.reset({
      name: "",
      type: "individual",
      phone: "",
      email: "",
      city: "",
      stage: "lead",
      source: "",
      interest_type: "",
      budget: undefined,
      rating: undefined,
      next_followup_at: "",
      notes: "",
    });
    setOpen(true);
  }

  function openEdit(c: Client) {
    form.reset({
      ...c,
      email: c.email ?? "",
      city: c.city ?? "",
      source: c.source ?? "",
      interest_type: c.interest_type ?? "",
      budget: c.budget ?? undefined,
      rating: c.rating ?? undefined,
      next_followup_at: c.next_followup_at
        ? new Date(c.next_followup_at).toISOString().slice(0, 10)
        : "",
      notes: c.notes ?? "",
    });
    setOpen(true);
  }

  function handleDrop(clientId: string, newStage: string) {
    const client = clients.find((c) => c.id === clientId);
    if (!client || client.stage === newStage) return;
    if (newStage === "lost") {
      setLostDialog({ clientId, fromStage: client.stage ?? "lead" });
      return;
    }
    moveStage.mutate({ client, newStage });
  }

  function confirmLost() {
    if (!lostDialog) return;
    const client = clients.find((c) => c.id === lostDialog.clientId);
    if (!client) return;
    moveStage.mutate({ client, newStage: "lost", reason: lostReason });
    setLostDialog(null);
    setLostReason("");
  }

  const filtered = clients.filter((c) => {
    if (stageFilter !== "all" && c.stage !== stageFilter) return false;
    if (search && !c.name.includes(search) && !(c.phone ?? "").includes(search)) return false;
    return true;
  });

  const overdueCount = clients.filter(
    (c) => c.next_followup_at && new Date(c.next_followup_at) <= new Date(),
  ).length;

  return (
    <div>
      <PageHeader
        title="العملاء (CRM)"
        breadcrumbs={[{ label: "لوحة التحكم", to: "/admin" }, { label: "العملاء" }]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === "list" ? "kanban" : "list")}
            >
              {viewMode === "list" ? (
                <>
                  <LayoutGrid className="h-4 w-4 ms-1" />
                  كانبان
                </>
              ) : (
                <>
                  <List className="h-4 w-4 ms-1" />
                  قائمة
                </>
              )}
            </Button>
            <Button onClick={openCreate} className="btn-hero">
              <Plus className="h-4 w-4 ms-2" />
              إضافة عميل
            </Button>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {[
          { label: "إجمالي العملاء", value: clients.length },
          {
            label: "نشط / تفاوض",
            value: clients.filter((c) => ["active", "negotiation"].includes(c.stage ?? "")).length,
          },
          { label: "صفقات مغلقة", value: clients.filter((c) => c.stage === "closed").length },
          { label: "متابعات متأخرة", value: overdueCount, danger: overdueCount > 0 },
        ].map((s) => (
          <div
            key={s.label}
            className={`card-elegant p-5 text-center ${s.danger ? "border-destructive/40" : ""}`}
          >
            <div
              className={`text-3xl font-bold tabular ${s.danger ? "text-destructive" : "text-primary"}`}
            >
              {s.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 px-4 pb-4">
        {[{ value: "all", label: "الكل" }, ...STAGES].map((s) => (
          <button
            key={s.value}
            onClick={() => setStageFilter(s.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              stageFilter === s.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:border-primary/50"
            }`}
          >
            {s.label}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو الهاتف…"
          className="px-3 py-1.5 rounded-full text-xs border border-border bg-background ms-auto min-w-40 focus:outline-none focus:border-primary"
        />
      </div>

      {isLoading && <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div>}

      {!isLoading && clients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Users className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">لا يوجد عملاء</p>
          <Button onClick={openCreate} className="btn-hero">
            <Plus className="h-4 w-4 ms-2" />
            إضافة عميل
          </Button>
        </div>
      )}

      {/* ── Kanban View ── */}
      {viewMode === "kanban" && !isLoading && (
        <div className="overflow-x-auto px-4 pb-6">
          <div className="flex gap-3 w-max">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage.value}
                stage={stage}
                clients={clients.filter((c) => c.stage === stage.value)}
                onEdit={openEdit}
                onDelete={(id) => {
                  setDeleteId(id);
                  setDeleteError(null);
                }}
                onDrop={handleDrop}
                onCardClick={setSheetClient}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── List View ── */}
      {viewMode === "list" && !isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 px-4 pb-4">
          {filtered.map((c) => {
            const isOverdue = c.next_followup_at && new Date(c.next_followup_at) <= new Date();
            return (
              <div
                key={c.id}
                className="card-elegant p-5 space-y-3 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSheetClient(c)}
              >
                <div
                  className="flex items-start justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-base">{c.name}</h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STAGE_COLORS[c.stage ?? "lead"]}`}
                      >
                        {STAGES.find((s) => s.value === c.stage)?.label}
                      </span>
                      {c.city && <span className="text-xs text-muted-foreground">{c.city}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
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
                <div className="space-y-1 text-sm text-muted-foreground">
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{c.phone}</span>
                      <a
                        href={buildWhatsAppUrl(c.phone, `السلام عليكم ${c.name}`)}
                        target="_blank"
                        rel="noopener"
                        className="ms-auto text-green-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                  {c.rating != null && (
                    <div className="text-xs text-amber-500">
                      {"★".repeat(c.rating)}
                      {"☆".repeat(5 - c.rating)}
                    </div>
                  )}
                  {c.next_followup_at && (
                    <div
                      className={`text-xs flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : ""}`}
                    >
                      <Calendar className="h-3 w-3" />
                      {new Date(c.next_followup_at).toLocaleDateString("ar-SA")}
                      {isOverdue && " ⚠️"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Client Detail Sheet ── */}
      <Sheet open={!!sheetClient} onOpenChange={(o) => !o && setSheetClient(null)}>
        <SheetContent side="left" className="w-full sm:w-105 overflow-y-auto">
          {sheetClient && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle>{sheetClient.name}</SheetTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STAGE_COLORS[sheetClient.stage ?? "lead"]}`}
                  >
                    {STAGES.find((s) => s.value === sheetClient.stage)?.label}
                  </span>
                  {sheetClient.rating && (
                    <span className="text-xs text-amber-500">
                      {"★".repeat(sheetClient.rating)}
                      {"☆".repeat(5 - sheetClient.rating)}
                    </span>
                  )}
                  {sheetClient.phone && (
                    <a
                      href={buildWhatsAppUrl(sheetClient.phone, `السلام عليكم ${sheetClient.name}`)}
                      target="_blank"
                      rel="noopener"
                      className="ms-auto"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-200 h-7 text-xs"
                      >
                        <MessageCircle className="h-3 w-3 ms-1" />
                        واتساب
                      </Button>
                    </a>
                  )}
                </div>
              </SheetHeader>

              <Tabs defaultValue="details">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="details" className="flex-1">
                    التفاصيل
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex-1">
                    النشاط
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-3 text-sm">
                  {sheetClient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{sheetClient.phone}</span>
                    </div>
                  )}
                  {sheetClient.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{sheetClient.email}</span>
                    </div>
                  )}
                  {sheetClient.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{sheetClient.city}</span>
                    </div>
                  )}
                  {sheetClient.budget && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">الميزانية:</span>
                      <span className="font-semibold text-primary">
                        <SarAmount value={sheetClient.budget} />
                      </span>
                    </div>
                  )}
                  {sheetClient.source && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">المصدر:</span>
                      <span>{sheetClient.source}</span>
                    </div>
                  )}
                  {sheetClient.next_followup_at && (
                    <div
                      className={`flex items-center gap-2 ${new Date(sheetClient.next_followup_at) <= new Date() ? "text-destructive" : ""}`}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>
                        موعد المتابعة:{" "}
                        {new Date(sheetClient.next_followup_at).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  )}
                  {sheetClient.notes && (
                    <div className="border-t border-border pt-3 text-muted-foreground text-xs">
                      {sheetClient.notes}
                    </div>
                  )}
                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        openEdit(sheetClient);
                        setSheetClient(null);
                      }}
                    >
                      <Edit2 className="h-3 w-3 ms-1" />
                      تعديل
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="activity">
                  <ActivityPanel client={sheetClient} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.getValues("id") ? "تعديل عميل" : "إضافة عميل"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((v) => save.mutate(v as FormValues))}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label>الاسم *</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>النوع</Label>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">فرد</SelectItem>
                        <SelectItem value="company">شركة</SelectItem>
                        <SelectItem value="foundation">مؤسسة</SelectItem>
                        <SelectItem value="group">مجموعة</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label>المرحلة</Label>
                <Controller
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>المدينة</Label>
                <Input {...form.register("city")} />
              </div>
              <div className="space-y-1">
                <Label>المصدر</Label>
                <Input {...form.register("source")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>نوع الاهتمام</Label>
                <Input {...form.register("interest_type")} />
              </div>
              <div className="space-y-1">
                <Label>الميزانية</Label>
                <Input {...form.register("budget")} type="number" min="0" dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>التقييم</Label>
                <Controller
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <Select
                      value={field.value != null ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {"★".repeat(n)}
                            {"☆".repeat(5 - n)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label>موعد المتابعة</Label>
                <Input {...form.register("next_followup_at")} type="date" dir="ltr" />
              </div>
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

      {/* Lost reason dialog */}
      <AlertDialog open={!!lostDialog} onOpenChange={(o) => !o && setLostDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>نقل إلى خسارة</AlertDialogTitle>
            <AlertDialogDescription>يرجى إدخال سبب الخسارة (اختياري)</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="سبب الخسارة..."
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            rows={3}
            className="my-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLostDialog(null)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLost}>تأكيد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                "هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع."
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
