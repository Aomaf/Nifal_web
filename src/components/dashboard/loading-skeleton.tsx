import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("card-stat", className)}>
      <div className="flex items-start justify-between">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols }: { cols: number }) {
  const widths = ["w-32", "w-24", "w-20", "w-16", "w-28", "w-20"];
  return (
    <tr className="border-b">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-3">
          <Skeleton className={cn("h-4", widths[i % widths.length])} />
        </td>
      ))}
    </tr>
  );
}

export function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-2", className)}>
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-2.5 w-32" />
      </div>
    </div>
  );
}

export function SectionCardSkeleton({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("card-dashboard p-4 space-y-1", className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}
