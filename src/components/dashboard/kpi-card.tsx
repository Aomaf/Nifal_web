import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { KpiCardSkeleton } from "./loading-skeleton";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: {
    value: number;
    period?: string;
  };
  tint?: "primary" | "success" | "accent" | "warning" | "destructive";
  loading?: boolean;
  className?: string;
}

const tintClasses: Record<NonNullable<KpiCardProps["tint"]>, string> = {
  primary: "bg-[var(--color-primary-tint)] text-primary",
  success: "bg-success/10 text-success",
  accent: "bg-accent/15 text-accent-dark",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  tint = "primary",
  loading,
  className,
}: KpiCardProps) {
  if (loading) return <KpiCardSkeleton className={className} />;

  const displayValue = typeof value === "number" ? formatNumber(value) : value;

  const trendPositive = trend && trend.value > 0;
  const trendNegative = trend && trend.value < 0;

  return (
    <div className={cn("card-stat animate-card-in", className)}>
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
            tintClasses[tint],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trendPositive && "text-success",
              trendNegative && "text-destructive",
              !trendPositive && !trendNegative && "text-muted-foreground",
            )}
          >
            {trendPositive && <TrendingUp className="h-3.5 w-3.5" />}
            {trendNegative && <TrendingDown className="h-3.5 w-3.5" />}
            <span>
              {trendPositive && "+"}
              {trend.value}%
            </span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tabular text-foreground leading-tight">
          {displayValue}
        </div>
        <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
        {trend?.period && (
          <div className="text-xs text-muted-foreground/70 mt-0.5">{trend.period}</div>
        )}
      </div>
    </div>
  );
}
