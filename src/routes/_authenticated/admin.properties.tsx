import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  listAdminProperties,
  upsertProperty,
  deleteProperty,
  togglePropertyFlag,
  exportAdminPropertiesCSV,
} from "@/lib/properties.functions";
import {
  uploadPropertyImage,
  deletePropertyImage,
  reorderPropertyImages,
  listPropertyImages,
} from "@/lib/storage.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Loader2,
  ImagePlus,
  X,
  GripVertical,
  CheckCircle2,
  Images,
  Download,
  ChevronRight,
  ChevronLeft,
  Search,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PROPERTY_TYPE_LABELS } from "@/lib/format";
import { ATTRIBUTE_FIELDS, TYPE_FIELDS } from "@/lib/property-fields";
import { SarAmount } from "@/components/ui/sar-icon";

// Download rows as CSV file
function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  const headers = [
    "العنوان",
    "المدينة",
    "الحي",
    "النوع",
    "الغرض",
    "السعر",
    "المساحة",
    "غرف النوم",
    "الحمامات",
    "الحالة",
    "منشور",
    "مميز",
    "المشاهدات",
    "رمز REGA",
    "تاريخ الإضافة",
  ];
  const typeMap: Record<string, string> = PROPERTY_TYPE_LABELS;
  const purposeMap: Record<string, string> = { sale: "للبيع", rent: "للإيجار" };
  const statusMap: Record<string, string> = {
    available: "متاح",
    sold: "مباع",
    rented: "مؤجر",
    reserved: "محجوز",
  };
  const csvRows = [
    headers.join(","),
    ...rows.map((r) =>
      [
        `"${r.title}"`,
        `"${r.city}"`,
        `"${r.district ?? ""}"`,
        `"${typeMap[r.type as string] ?? r.type}"`,
        `"${purposeMap[r.purpose as string] ?? r.purpose}"`,
        r.price,
        r.area_sqm ?? "",
        r.bedrooms ?? "",
        r.bathrooms ?? "",
        `"${statusMap[r.status as string] ?? r.status}"`,
        r.is_published ? "نعم" : "لا",
        r.is_featured ? "نعم" : "لا",
        r.views_count ?? 0,
        `"${r.rega_ad_code ?? ""}"`,
        `"${(r.created_at as string)?.split("T")[0] ?? ""}"`,
      ].join(","),
    ),
  ].join("\n");
  const bom = "﻿"; // UTF-8 BOM for Excel Arabic support
  const blob = new Blob([bom + csvRows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const Route = createFileRoute("/_authenticated/admin/properties")({
  component: AdminProperties,
});

const schema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2, "العنوان مطلوب").max(200),
  description: z.string().max(5000).optional().nullable(),
  city: z.string().min(1, "المدينة مطلوبة"),
  district: z.string().optional().nullable(),
  type: z.enum([
    "villa",
    "apartment",
    "office",
    "shop",
    "industrial",
    "residential_land",
    "commercial_land",
    "industrial_land",
    "building",
    "floor",
    "istiraha",
    "chalet",
    "house",
    "farm",
  ]),
  purpose: z.enum(["sale", "rent"]),
  price: z.coerce.number().nonnegative(),
  area_sqm: z.coerce.number().nonnegative().optional().nullable(),
  bedrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  bathrooms: z.coerce.number().int().nonnegative().optional().nullable(),
  status: z.enum(["available", "sold", "rented", "reserved"]).default("available"),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(false),
  rega_ad_code: z.string().optional().nullable(),
  sold_percentage: z.coerce.number().min(0).max(100).optional().nullable(),
  handover_date: z.string().optional().nullable(),
  hero_video_url: z.string().url("رابط غير صالح").optional().nullable().or(z.literal("")),
  tags: z.string().default(""),
  is_archived: z.boolean().default(false),
  // Type-specific fields (see src/lib/property-fields.ts).
  attributes: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
});
type FormValues = z.infer<typeof schema>;

// Staged image (not yet uploaded)
type StagedImage = {
  key: string;
  preview: string; // object URL
  base64: string;
  filename: string;
  isPrimary: boolean;
};

// Saved image (already in DB)
type SavedImage = {
  id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
};

function parseTags(value: string) {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// Compress image to WebP via canvas
async function compressToWebP(file: File): Promise<{ base64: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 1600;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas error"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("compression failed"));
          const reader = new FileReader();
          reader.onloadend = () =>
            resolve({
              base64: reader.result as string,
              filename: file.name.replace(/\.[^.]+$/, ".webp"),
            });
          reader.readAsDataURL(blob);
        },
        "image/webp",
        0.85,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Image Manager ────────────────────────────────────────────────────────────
function ImageManager({
  propertyId,
  savedImages,
  stagedImages,
  setStagedImages,
  onDeleteSaved,
  onReorderSaved,
}: {
  propertyId?: string;
  savedImages: SavedImage[];
  stagedImages: StagedImage[];
  setStagedImages: (imgs: StagedImage[]) => void;
  onDeleteSaved: (img: SavedImage) => void;
  onReorderSaved: (imgs: SavedImage[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const dragType = useRef<"saved" | "staged" | null>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      setCompressing(true);
      try {
        const results: StagedImage[] = [];
        for (const file of Array.from(files)) {
          const { base64, filename } = await compressToWebP(file);
          const preview = base64;
          results.push({
            key: `${Date.now()}-${Math.random()}`,
            preview,
            base64,
            filename,
            isPrimary:
              savedImages.length === 0 && stagedImages.length === 0 && results.length === 0,
          });
        }
        setStagedImages([...stagedImages, ...results]);
      } catch {
        toast.error("فشل ضغط الصور");
      } finally {
        setCompressing(false);
      }
    },
    [savedImages.length, stagedImages, setStagedImages],
  );

  const setStaged_Primary = (key: string) => {
    setStagedImages(stagedImages.map((s) => ({ ...s, isPrimary: s.key === key })));
    // also clear primary on saved images
    onReorderSaved(savedImages.map((s) => ({ ...s, is_primary: false })));
  };

  const setSaved_Primary = (id: string) => {
    onReorderSaved(savedImages.map((s) => ({ ...s, is_primary: s.id === id })));
    setStagedImages(stagedImages.map((s) => ({ ...s, isPrimary: false })));
  };

  const removeStaged = (key: string) => {
    setStagedImages(stagedImages.filter((s) => s.key !== key));
  };

  // Drag-and-drop reorder for saved images
  const handleSavedDragStart = (index: number) => {
    dragIndex.current = index;
    dragType.current = "saved";
  };
  const handleSavedDrop = (index: number) => {
    if (dragIndex.current === null || dragType.current !== "saved") return;
    const reordered = [...savedImages];
    const [moved] = reordered.splice(dragIndex.current, 1);
    reordered.splice(index, 0, moved);
    onReorderSaved(reordered.map((img, i) => ({ ...img, sort_order: i })));
    dragIndex.current = null;
  };

  const allCount = savedImages.length + stagedImages.length;

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        {compressing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <ImagePlus className="h-6 w-6" />
        )}
        <span className="text-sm font-medium">
          {compressing ? "جاري ضغط الصور..." : "اضغط لرفع الصور أو اسحبها هنا"}
        </span>
        <span className="text-xs">JPEG, PNG, WebP — يتم الضغط تلقائياً إلى WebP</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {allCount === 0 && (
        <p className="text-center text-sm text-muted-foreground py-2">لا توجد صور بعد</p>
      )}

      {/* Saved images */}
      {savedImages.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            الصور المحفوظة ({savedImages.length})
          </p>
          <div className="grid grid-cols-3 gap-3">
            {savedImages.map((img, i) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => handleSavedDragStart(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleSavedDrop(i)}
                className={`relative rounded-lg overflow-hidden aspect-square border-2 cursor-grab active:cursor-grabbing transition-colors ${img.is_primary ? "border-primary" : "border-border"}`}
              >
                <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                {/* Primary badge */}
                {img.is_primary && (
                  <div className="absolute top-1 inset-s-1">
                    <CheckCircle2 className="h-4 w-4 text-primary drop-shadow" />
                  </div>
                )}
                {/* Drag handle */}
                <div className="absolute top-1 inset-e-1 opacity-60">
                  <GripVertical className="h-4 w-4 text-white drop-shadow" />
                </div>
                {/* Actions */}
                <div className="absolute inset-x-0 bottom-0 flex gap-1 p-1 bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setSaved_Primary(img.id)}
                    className="flex-1 text-[10px] text-white font-medium text-center"
                  >
                    رئيسية
                  </button>
                  <button type="button" onClick={() => onDeleteSaved(img)} className="text-red-300">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staged images (pending upload) */}
      {stagedImages.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            في انتظار الرفع ({stagedImages.length}) — ستُرفع عند الحفظ
          </p>
          <div className="grid grid-cols-3 gap-3">
            {stagedImages.map((img) => (
              <div
                key={img.key}
                className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-colors ${img.isPrimary ? "border-primary" : "border-border"}`}
              >
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                {img.isPrimary && (
                  <div className="absolute top-1 inset-s-1">
                    <CheckCircle2 className="h-4 w-4 text-primary drop-shadow" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex gap-1 p-1 bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setStaged_Primary(img.key)}
                    className="flex-1 text-[10px] text-white font-medium text-center"
                  >
                    رئيسية
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStaged(img.key)}
                    className="text-red-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!propertyId && stagedImages.length > 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2">
          سيتم رفع الصور بعد حفظ العقار أولاً
        </p>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

function AdminProperties() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<FormValues | null>(null);
  const [open, setOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-properties", page, search],
    queryFn: () =>
      listAdminProperties({ data: { page, pageSize: PAGE_SIZE, search: search || undefined } }),
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Reset page when search changes
  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
    setSelectedIds(new Set());
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-properties"] });

  const toggle = useMutation({
    mutationFn: (vars: { id: string; field: "is_published" | "is_featured"; value: boolean }) =>
      togglePropertyFlag({ data: vars }),
    onSuccess: invalidate,
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProperty({ data: { id } }),
    onSuccess: () => {
      toast.success("تم الحذف");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Bulk mutations
  const bulkPublish = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids)
        await togglePropertyFlag({ data: { id, field: "is_published", value: true } });
    },
    onSuccess: () => {
      toast.success(`تم نشر ${selectedIds.size} عقار`);
      setSelectedIds(new Set());
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkUnpublish = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids)
        await togglePropertyFlag({ data: { id, field: "is_published", value: false } });
    },
    onSuccess: () => {
      toast.success(`تم إلغاء نشر ${selectedIds.size} عقار`);
      setSelectedIds(new Set());
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkFeature = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids)
        await togglePropertyFlag({ data: { id, field: "is_featured", value: true } });
    },
    onSuccess: () => {
      toast.success(`تم تمييز ${selectedIds.size} عقار`);
      setSelectedIds(new Set());
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await deleteProperty({ data: { id } });
    },
    onSuccess: () => {
      toast.success(`تم حذف ${selectedIds.size} عقار`);
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleExport = async (ids?: string[]) => {
    setExporting(true);
    try {
      const exportRows = await exportAdminPropertiesCSV({ data: { ids } });
      downloadCSV(
        exportRows as unknown as Record<string, unknown>[],
        `عقارات-${new Date().toISOString().split("T")[0]}.csv`,
      );
      if (ids?.length) setSelectedIds(new Set());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  // Selection helpers
  const allOnPageSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someOnPageSelected = rows.some((r) => selectedIds.has(r.id));
  const toggleAll = () => {
    if (allOnPageSelected) {
      const next = new Set(selectedIds);
      rows.forEach((r) => next.delete(r.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      rows.forEach((r) => next.add(r.id));
      setSelectedIds(next);
    }
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (p: Record<string, unknown>) => {
    setEditing({
      id: p.id as string,
      title: p.title as string,
      description: (p.description as string) ?? null,
      city: p.city as string,
      district: (p.district as string) ?? null,
      type: p.type as FormValues["type"],
      purpose: p.purpose as FormValues["purpose"],
      price: Number(p.price),
      area_sqm: p.area_sqm != null ? Number(p.area_sqm) : null,
      bedrooms: (p.bedrooms as number) ?? null,
      bathrooms: (p.bathrooms as number) ?? null,
      status: p.status as FormValues["status"],
      is_featured: !!(p.is_featured as boolean),
      is_published: !!(p.is_published as boolean),
      rega_ad_code: (p.rega_ad_code as string) ?? null,
      sold_percentage: (p.sold_percentage as number) ?? null,
      handover_date: (p.handover_date as string) ?? null,
      hero_video_url: (p.hero_video_url as string) ?? null,
      tags: ((p.tags as string[]) ?? []).join(", "),
      is_archived: !!(p.is_archived as boolean),
      attributes: (p.attributes as Record<string, string | number>) ?? {},
    });
    setOpen(true);
  };

  const isBulkBusy =
    bulkPublish.isPending ||
    bulkUnpublish.isPending ||
    bulkFeature.isPending ||
    bulkDelete.isPending;

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">إدارة العقارات</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} عقار
            {selectedIds.size > 0 && (
              <span className="ms-2 text-primary font-medium">· {selectedIds.size} محدد</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport()} disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ms-1 hidden sm:inline">تصدير</span>
          </Button>
          <Button className="btn-hero h-10" onClick={openNew}>
            <Plus className="ms-2 h-4 w-4" /> عقار جديد
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute inset-y-0 inset-e-3 my-auto h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="ابحث باسم العقار..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pe-9"
        />
      </div>

      {/* Master checkbox row */}
      {rows.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={allOnPageSelected}
            ref={(el) => {
              if (el)
                (el as HTMLButtonElement).dataset.indeterminate =
                  someOnPageSelected && !allOnPageSelected ? "true" : "false";
            }}
            onCheckedChange={toggleAll}
            aria-label="تحديد الكل"
          />
          <span>{allOnPageSelected ? "إلغاء تحديد الصفحة" : "تحديد الصفحة"}</span>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-10">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
      )}

      {/* Property list */}
      <div className="grid gap-4">
        {rows.map((p) => {
          const cover =
            (p.property_images as { image_url: string; is_primary: boolean }[] | null)?.find(
              (i) => i.is_primary,
            )?.image_url ?? (p.property_images as { image_url: string }[] | null)?.[0]?.image_url;
          const imgCount = (p.property_images as unknown[] | null)?.length ?? 0;
          const isSelected = selectedIds.has(p.id);

          return (
            <div
              key={p.id}
              className={`card-elegant p-4 flex flex-wrap gap-4 items-center transition-colors ${isSelected ? "ring-2 ring-primary/40 bg-primary/5" : ""}`}
            >
              {/* Checkbox */}
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleOne(p.id)}
                aria-label={`تحديد ${p.title}`}
                className="shrink-0"
              />

              {/* Cover image */}
              <div className="relative h-20 w-28 rounded-lg bg-muted overflow-hidden shrink-0">
                <img
                  src={
                    cover ??
                    `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=60`
                  }
                  alt=""
                  className="w-full h-full object-cover"
                />
                {imgCount > 0 && (
                  <span className="absolute bottom-1 inset-e-1 text-[10px] bg-black/60 text-white rounded px-1">
                    {imgCount}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-50">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold">{p.title}</h3>
                  {p.is_published ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">
                      منشور
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      مسودة
                    </span>
                  )}
                  {imgCount === 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      بدون صور
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.city}
                  {p.district ? ` · ${p.district}` : ""} · {PROPERTY_TYPE_LABELS[p.type]}
                </p>
                <p className="text-sm font-semibold text-primary tabular mt-1">
                  <SarAmount value={Number(p.price)} />
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  title={p.is_published ? "إلغاء النشر" : "نشر"}
                  onClick={() =>
                    toggle.mutate({ id: p.id, field: "is_published", value: !p.is_published })
                  }
                >
                  {p.is_published ? (
                    <Eye className="h-4 w-4 text-success" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="تمييز"
                  onClick={() =>
                    toggle.mutate({ id: p.id, field: "is_featured", value: !p.is_featured })
                  }
                >
                  <Star
                    className={`h-4 w-4 ${p.is_featured ? "text-accent-dark fill-accent" : "text-muted-foreground"}`}
                  />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(p as never)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف العقار</AlertDialogTitle>
                      <AlertDialogDescription>
                        هل أنت متأكد من حذف "{p.title}"؟ لا يمكن التراجع.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate(p.id)}>حذف</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            الصفحة {page} من {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            التالي
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Floating bulk toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 inset-x-4 z-50 flex items-center justify-between gap-2 rounded-xl bg-foreground text-background shadow-2xl px-4 py-3 max-w-2xl mx-auto">
          <span className="text-sm font-medium shrink-0">{selectedIds.size} محدد</span>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="secondary"
              disabled={isBulkBusy}
              onClick={() => bulkPublish.mutate([...selectedIds])}
            >
              {bulkPublish.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
              <span className="ms-1">نشر</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={isBulkBusy}
              onClick={() => bulkUnpublish.mutate([...selectedIds])}
            >
              {bulkUnpublish.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
              <span className="ms-1">إخفاء</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={isBulkBusy}
              onClick={() => bulkFeature.mutate([...selectedIds])}
            >
              {bulkFeature.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Star className="h-3 w-3" />
              )}
              <span className="ms-1">تمييز</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={isBulkBusy || exporting}
              onClick={() => handleExport([...selectedIds])}
            >
              {exporting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              <span className="ms-1">تصدير</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isBulkBusy}
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="h-3 w-3" />
              <span className="ms-1">حذف</span>
            </Button>
          </div>
          <button
            className="text-background/60 hover:text-background shrink-0"
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف {selectedIds.size} عقار</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف {selectedIds.size} عقار بشكل نهائي. هل أنت متأكد؟ لا يمكن التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDelete.mutate([...selectedIds])}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDelete.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
              حذف {selectedIds.size} عقار
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PropertyDialog open={open} onOpenChange={setOpen} initial={editing} onSaved={invalidate} />
    </div>
  );
}

// ─── Property Dialog ────────────────────────────────────────────────────────
function PropertyDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: FormValues | null;
  onSaved: () => void;
}) {
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Load existing images when editing
  const { data: loadedImages, isLoading: imagesLoading } = useQuery({
    queryKey: ["property-images", initial?.id],
    queryFn: () => listPropertyImages({ data: { propertyId: initial!.id! } }),
    enabled: !!initial?.id && open,
  });

  // Seed the locally-editable saved images once the query resolves.
  // (Must NOT setState inside `select` — that runs every render and loops → React #301.)
  useEffect(() => {
    if (loadedImages) setSavedImages(loadedImages);
  }, [loadedImages]);

  // Reset staged images when dialog opens/closes
  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setStagedImages([]);
      setSavedImages([]);
      setPublishError(null);
    }
    onOpenChange(v);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    values: (initial ?? {
      title: "",
      city: "الرياض",
      type: "apartment",
      purpose: "sale",
      price: 0,
      status: "available",
      is_featured: false,
      is_published: false,
      sold_percentage: null,
      handover_date: null,
      hero_video_url: null,
      tags: "",
      is_archived: false,
      attributes: {},
    }) as FormValues,
  });

  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: async (v: FormValues) => {
      const totalImages = savedImages.length + stagedImages.length;

      // Enforce: must have at least 1 image to publish
      if (v.is_published && totalImages === 0) {
        setPublishError("يجب إضافة صورة واحدة على الأقل قبل النشر");
        throw new Error("يجب إضافة صورة واحدة على الأقل قبل النشر");
      }
      setPublishError(null);

      // 1. Save property metadata.
      // Prune attributes to only the keys this type uses (dropping stale values
      // left over from a previous type), and exclude bedrooms/bathrooms which
      // persist as their own columns.
      const allowedKeys = (TYPE_FIELDS[v.type] ?? []).filter(
        (k) => k !== "bedrooms" && k !== "bathrooms",
      );
      const cleanAttributes: Record<string, string | number> = {};
      for (const k of allowedKeys) {
        const val = (v.attributes as Record<string, string | number>)?.[k];
        if (val != null && val !== "") cleanAttributes[k] = val;
      }
      const row = await upsertProperty({
        data: {
          ...v,
          hero_video_url: v.hero_video_url || null,
          tags: parseTags(v.tags),
          attributes: cleanAttributes,
        },
      });

      const propertyId = row.id;

      // 2. Upload staged images
      if (stagedImages.length > 0) {
        setUploadingImages(true);
        const baseOrder = savedImages.length;
        // If no saved images and no primary set, make first staged primary
        const hasPrimary =
          savedImages.some((s) => s.is_primary) || stagedImages.some((s) => s.isPrimary);

        for (let i = 0; i < stagedImages.length; i++) {
          const img = stagedImages[i];
          const isPrimary = img.isPrimary || (!hasPrimary && i === 0);
          await uploadPropertyImage({
            data: {
              propertyId,
              base64: img.base64,
              filename: img.filename,
              isPrimary,
              sortOrder: baseOrder + i,
            },
          });
        }
        setUploadingImages(false);
      }

      // 3. Persist reordering / primary changes on saved images
      if (savedImages.length > 0) {
        await reorderPropertyImages({
          data: {
            updates: savedImages.map((img, i) => ({
              id: img.id,
              sort_order: i,
              is_primary: img.is_primary,
            })),
          },
        });
      }

      qc.invalidateQueries({ queryKey: ["property-images", propertyId] });
      return row;
    },
    onSuccess: () => {
      toast.success("تم الحفظ");
      setStagedImages([]);
      handleOpenChange(false);
      onSaved();
    },
    onError: (e) => {
      setUploadingImages(false);
      if (!e.message.includes("صورة")) toast.error(e.message);
    },
  });

  const handleDeleteSaved = useMutation({
    mutationFn: (img: SavedImage) =>
      deletePropertyImage({ data: { id: img.id, image_url: img.image_url } }),
    onSuccess: (_, img) => {
      setSavedImages((prev) => prev.filter((s) => s.id !== img.id));
      toast.success("تم حذف الصورة");
    },
    onError: (e) => toast.error(e.message),
  });

  const isSubmitting = save.isPending || uploadingImages;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "تعديل عقار" : "عقار جديد"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit((v) => save.mutate(v))}>
          <Tabs defaultValue="details" dir="rtl">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="details" className="flex-1">
                التفاصيل
              </TabsTrigger>
              <TabsTrigger value="images" className="flex-1">
                الصور
                {savedImages.length + stagedImages.length > 0 && (
                  <span className="ms-1.5 rounded-full bg-primary/15 text-primary text-[10px] px-1.5 py-0.5">
                    {savedImages.length + stagedImages.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                الإعدادات
              </TabsTrigger>
            </TabsList>

            {/* ── Details Tab ── */}
            <TabsContent value="details" className="space-y-4 mt-0">
              <div>
                <Label>العنوان</Label>
                <Input {...form.register("title")} />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>المدينة</Label>
                  <Input {...form.register("city")} />
                </div>
                <div>
                  <Label>الحي</Label>
                  <Input {...form.register("district")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>النوع</Label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(v) => form.setValue("type", v as FormValues["type"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROPERTY_TYPE_LABELS).map(([k, l]) => (
                        <SelectItem key={k} value={k}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الغرض</Label>
                  <Select
                    value={form.watch("purpose")}
                    onValueChange={(v) => form.setValue("purpose", v as FormValues["purpose"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">للبيع</SelectItem>
                      <SelectItem value="rent">للإيجار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>السعر</Label>
                  <Input type="number" step="1000" {...form.register("price")} />
                </div>
                <div>
                  <Label>المساحة (م²)</Label>
                  <Input type="number" {...form.register("area_sqm")} />
                </div>
              </div>
              <div>
                <Label>الحالة</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as FormValues["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">متاح</SelectItem>
                    <SelectItem value="sold">مباع</SelectItem>
                    <SelectItem value="rented">مؤجر</SelectItem>
                    <SelectItem value="reserved">محجوز</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type-specific fields — driven by TYPE_FIELDS (src/lib/property-fields.ts).
                  Changes when the "type" select changes. bedrooms/bathrooms are real
                  columns; everything else lives in the `attributes` JSONB object. */}
              {(TYPE_FIELDS[form.watch("type")] ?? []).length > 0 && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {(TYPE_FIELDS[form.watch("type")] ?? []).map((key) => {
                    const field = ATTRIBUTE_FIELDS[key];
                    if (!field) return null;
                    const isColumn = key === "bedrooms" || key === "bathrooms";
                    const attrs = (form.watch("attributes") ?? {}) as Record<
                      string,
                      string | number
                    >;
                    const value = isColumn
                      ? (form.watch(key as "bedrooms" | "bathrooms") ?? "")
                      : (attrs[key] ?? "");
                    const setValue = (v: string) => {
                      if (isColumn) {
                        form.setValue(
                          key as "bedrooms" | "bathrooms",
                          v === "" ? null : (Number(v) as never),
                        );
                      } else {
                        const next = {
                          ...((form.watch("attributes") ?? {}) as Record<string, string | number>),
                        };
                        if (v === "") delete next[key];
                        else next[key] = field.kind === "number" ? Number(v) : v;
                        form.setValue("attributes", next);
                      }
                    };
                    return (
                      <div key={key}>
                        <Label>{field.label}</Label>
                        {field.kind === "select" ? (
                          <Select value={String(value)} onValueChange={setValue}>
                            <SelectTrigger>
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type="number"
                            step={field.integer ? "1" : "any"}
                            value={String(value)}
                            onChange={(e) => setValue(e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div>
                <Label>الوصف</Label>
                <Textarea rows={4} {...form.register("description")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>رمز الإعلان (REGA)</Label>
                  <Input dir="ltr" {...form.register("rega_ad_code")} />
                </div>
                <div>
                  <Label>رابط الفيديو</Label>
                  <Input dir="ltr" placeholder="https://..." {...form.register("hero_video_url")} />
                  {form.formState.errors.hero_video_url && (
                    <p className="text-xs text-destructive mt-1">
                      {form.formState.errors.hero_video_url.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>نسبة المبيعات % (خارطة)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    {...form.register("sold_percentage")}
                  />
                </div>
                <div>
                  <Label>تاريخ التسليم</Label>
                  <Input type="date" dir="ltr" {...form.register("handover_date")} />
                </div>
              </div>
              <div>
                <Label>الوسوم (مفصولة بفاصلة)</Label>
                <Input placeholder="مميز, جديد, قريباً" {...form.register("tags")} />
              </div>
            </TabsContent>

            {/* ── Images Tab ── */}
            <TabsContent value="images" className="mt-0">
              {imagesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ImageManager
                  propertyId={initial?.id}
                  savedImages={savedImages}
                  stagedImages={stagedImages}
                  setStagedImages={setStagedImages}
                  onDeleteSaved={(img) => handleDeleteSaved.mutate(img)}
                  onReorderSaved={setSavedImages}
                />
              )}
              {publishError && (
                <p className="mt-3 text-sm text-destructive bg-destructive/5 rounded-md px-3 py-2">
                  {publishError}
                </p>
              )}
            </TabsContent>

            {/* ── Settings Tab ── */}
            <TabsContent value="settings" className="space-y-3 mt-0">
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted">
                <Label htmlFor="pub" className="cursor-pointer">
                  منشور للعامة
                </Label>
                <Switch
                  id="pub"
                  checked={form.watch("is_published")}
                  onCheckedChange={(v) => {
                    form.setValue("is_published", v);
                    if (v) setPublishError(null);
                  }}
                />
              </div>
              {form.watch("is_published") && savedImages.length + stagedImages.length === 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2">
                  يجب إضافة صورة واحدة على الأقل قبل النشر — انتقل إلى تبويب الصور
                </p>
              )}
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted">
                <Label htmlFor="feat" className="cursor-pointer">
                  عقار مميز (يظهر في الصفحة الرئيسية)
                </Label>
                <Switch
                  id="feat"
                  checked={form.watch("is_featured")}
                  onCheckedChange={(v) => form.setValue("is_featured", v)}
                />
              </div>
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div>
                  <Label htmlFor="arch" className="cursor-pointer">
                    أرشفة العقار
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    العقارات المؤرشفة تُخفى من الموقع
                  </p>
                </div>
                <Switch
                  id="arch"
                  checked={form.watch("is_archived")}
                  onCheckedChange={(v) => form.setValue("is_archived", v)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" className="btn-hero" disabled={isSubmitting}>
              {isSubmitting ? (uploadingImages ? "جاري رفع الصور..." : "جاري الحفظ...") : "حفظ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
