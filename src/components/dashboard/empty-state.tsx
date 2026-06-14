import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    to?: string;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

const iconSize = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-10 px-4 text-muted-foreground",
        className,
      )}
    >
      {Icon && <Icon className={cn(iconSize[size], "opacity-40 mb-3")} />}
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm max-w-xs">{description}</p>}
      {action && (
        <div className="mt-4">
          {action.to ? (
            <Button asChild variant="outline" size="sm">
              <Link to={action.to as never}>{action.label}</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
