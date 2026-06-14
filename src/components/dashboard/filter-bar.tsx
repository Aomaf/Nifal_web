import { RotateCcw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters: Array<{
    key: string;
    placeholder: string;
    options: FilterOption[];
    value: string;
    onChange: (val: string) => void;
  }>;
  search?: {
    value: string;
    placeholder?: string;
    onChange: (val: string) => void;
  };
  onReset: () => void;
  className?: string;
}

export function FilterBar({ filters, search, onReset, className }: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap gap-3 items-center", className)}>
      {search && (
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            dir="auto"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? "بحث..."}
            className="ps-9"
          />
        </div>
      )}
      {filters.map((f) => (
        <Select key={f.key} value={f.value} onValueChange={f.onChange}>
          <SelectTrigger className="min-w-[140px]">
            <SelectValue placeholder={f.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {f.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      <Button variant="ghost" size="sm" onClick={onReset} className="shrink-0">
        <RotateCcw className="h-4 w-4 me-1.5" />
        إعادة ضبط
      </Button>
    </div>
  );
}
