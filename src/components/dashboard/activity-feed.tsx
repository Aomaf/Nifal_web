import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ListItemSkeleton } from "./loading-skeleton";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export interface ActivityItem {
  id: string;
  icon?: LucideIcon;
  iconColor?: "primary" | "success" | "accent" | "warning" | "destructive" | "muted";
  text: string;
  timestamp: string | Date;
  badge?: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
  emptyMessage?: string;
  className?: string;
}

const iconColorClasses: Record<NonNullable<ActivityItem["iconColor"]>, string> = {
  primary: "bg-[var(--color-primary-tint)] text-primary",
  success: "bg-success/10 text-success",
  accent: "bg-accent/15 text-accent-dark",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function ActivityFeed({
  items,
  loading,
  maxItems,
  emptyMessage = "لا يوجد نشاط حديث",
  className,
}: ActivityFeedProps) {
  if (loading) {
    return (
      <div className={cn("space-y-1 px-1", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  const visible = maxItems ? items.slice(0, maxItems) : items;

  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">{emptyMessage}</p>;
  }

  return (
    <div className={cn("relative space-y-0", className)}>
      {/* vertical timeline line — physical right for RTL */}
      <div className="absolute right-[18px] top-4 bottom-4 w-px bg-border" />
      {visible.map((item) => {
        const Icon = item.icon;
        const colorClass = iconColorClasses[item.iconColor ?? "muted"];
        const ts = typeof item.timestamp === "string" ? new Date(item.timestamp) : item.timestamp;
        const timeAgo = formatDistanceToNow(ts, {
          addSuffix: true,
          locale: ar,
        });

        return (
          <div key={item.id} className="flex items-start gap-3 py-2.5 pe-10">
            <div
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center shrink-0 z-10",
                colorClass,
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-foreground leading-snug">{item.text}</p>
                {item.badge && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
