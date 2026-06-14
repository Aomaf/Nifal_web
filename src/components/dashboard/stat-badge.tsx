import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type StatBadgeVariant =
  | "status-available"
  | "status-sold"
  | "status-rented"
  | "status-reserved"
  | "status-vacant"
  | "priority-high"
  | "priority-medium"
  | "priority-low"
  | "stage-lead"
  | "stage-prospect"
  | "stage-active"
  | "stage-negotiation"
  | "stage-closed"
  | "stage-lost"
  | "role-super-admin"
  | "role-sales-manager"
  | "role-sales"
  | "role-property-manager"
  | "role-accountant"
  | "role-marketing"
  | "published"
  | "draft";

const LABEL_MAP: Record<StatBadgeVariant, string> = {
  "status-available": "متاح",
  "status-sold": "تم البيع",
  "status-rented": "مؤجر",
  "status-reserved": "محجوز",
  "status-vacant": "شاغر",
  "priority-high": "عالي",
  "priority-medium": "متوسط",
  "priority-low": "منخفض",
  "stage-lead": "طلب",
  "stage-prospect": "مُرشّح",
  "stage-active": "نشط",
  "stage-negotiation": "تفاوض",
  "stage-closed": "مُغلق",
  "stage-lost": "خسارة",
  "role-super-admin": "مدير عام",
  "role-sales-manager": "مدير مبيعات",
  "role-sales": "مندوب",
  "role-property-manager": "مدير عقارات",
  "role-accountant": "محاسب",
  "role-marketing": "تسويق",
  published: "منشور",
  draft: "مسودة",
};

const PUBLISHED_CLASS = "bg-success/10 text-success border-success/30";
const DRAFT_CLASS = "bg-muted text-muted-foreground border-border";

function getVariantClass(variant: StatBadgeVariant): string {
  if (variant === "published") return PUBLISHED_CLASS;
  if (variant === "draft") return DRAFT_CLASS;
  return variant;
}

interface StatBadgeProps {
  variant: StatBadgeVariant;
  label?: string;
  className?: string;
}

export function StatBadge({ variant, label, className }: StatBadgeProps) {
  return (
    <Badge
      className={cn("border text-xs font-medium px-2 py-0.5", getVariantClass(variant), className)}
    >
      {label ?? LABEL_MAP[variant]}
    </Badge>
  );
}

export function getStatusBadgeVariant(status: string): StatBadgeVariant {
  const map: Record<string, StatBadgeVariant> = {
    available: "status-available",
    sold: "status-sold",
    rented: "status-rented",
    reserved: "status-reserved",
    vacant: "status-vacant",
    high: "priority-high",
    medium: "priority-medium",
    low: "priority-low",
    lead: "stage-lead",
    prospect: "stage-prospect",
    active: "stage-active",
    negotiation: "stage-negotiation",
    closed: "stage-closed",
    lost: "stage-lost",
    super_admin: "role-super-admin",
    sales_manager: "role-sales-manager",
    sales: "role-sales",
    property_manager: "role-property-manager",
    accountant: "role-accountant",
    marketing: "role-marketing",
  };
  return map[status] ?? "draft";
}
