import { type ReactNode, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { TableRowSkeleton } from "./loading-skeleton";

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  skeletonRows?: number;
  emptyState?: ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onSort?: (key: string, dir: "asc" | "desc") => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading,
  skeletonRows = 5,
  emptyState,
  pagination,
  onSort,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function handleSort(key: string) {
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortDir(newDir);
    onSort?.(key, newDir);
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

  function buildPages(current: number, total: number): (number | "...")[] {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++)
      pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={cn("text-start", col.width)}>
                  {col.sortable ? (
                    <button
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.header}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRowSkeleton key={i} cols={columns.length} />
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center p-0">
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={keyExtractor(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className="text-start">
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && totalPages > 1 && (
        <Pagination>
          <PaginationContent className="gap-1">
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                السابق
              </Button>
            </PaginationItem>
            {buildPages(pagination.page, totalPages).map((p, i) =>
              p === "..." ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === pagination.page}
                    onClick={() => pagination.onPageChange(p as number)}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
              >
                التالي
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
