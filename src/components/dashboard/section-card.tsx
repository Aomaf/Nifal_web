import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({
  title,
  subtitle,
  headerAction,
  children,
  className,
  noPadding,
}: SectionCardProps) {
  return (
    <Card className={cn("card-dashboard shadow-none", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {subtitle && <CardDescription className="mt-0.5 text-xs">{subtitle}</CardDescription>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      </CardHeader>
      <CardContent className={cn(noPadding ? "p-0" : "")}>{children}</CardContent>
    </Card>
  );
}
