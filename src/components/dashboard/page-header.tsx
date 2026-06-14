import { type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, breadcrumbs, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 mb-6", className)}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb className="mb-1.5">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return (
                  <BreadcrumbItem key={i}>
                    {isLast ? (
                      <BreadcrumbPage className="text-xs text-muted-foreground">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <>
                        <BreadcrumbLink asChild>
                          <Link
                            to={crumb.to as never}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            {crumb.label}
                          </Link>
                        </BreadcrumbLink>
                        <BreadcrumbSeparator>
                          <ChevronLeft className="h-3 w-3" />
                        </BreadcrumbSeparator>
                      </>
                    )}
                  </BreadcrumbItem>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
