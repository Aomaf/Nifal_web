import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Turn low-level Postgres RLS/permission errors into a clear Arabic message.
// Other errors pass through unchanged.
function propertyWriteError(error: { message: string; code?: string }): Error {
  const isPermission =
    error.code === "42501" || /row-level security|permission denied/i.test(error.message);
  return new Error(
    isPermission
      ? "ليس لديك صلاحية لإدارة العقارات. تواصل مع المدير العام لمنحك صلاحية إدارة العقارات."
      : error.message,
  );
}

const ListFilters = z.object({
  city: z.string().optional(),
  type: z.string().optional(),
  purpose: z.enum(["sale", "rent"]).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minBeds: z.number().optional(),
  search: z.string().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "most_viewed"]).default("newest"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(60).default(20),
  featuredOnly: z.boolean().optional(),
});

export const listPublicProperties = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => ListFilters.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("properties")
      .select(
        "id,title,city,district,type,purpose,price,area_sqm,bedrooms,bathrooms,status,is_featured,is_negotiable,views_count,created_at,attributes, property_images(image_url,is_primary,sort_order)",
        { count: "exact" },
      )
      .eq("is_published", true);

    if (data.featuredOnly) q = q.eq("is_featured", true);
    if (data.city) q = q.eq("city", data.city);
    if (data.type) q = q.eq("type", data.type as never);
    if (data.purpose) q = q.eq("purpose", data.purpose);
    if (data.minPrice != null) q = q.gte("price", data.minPrice);
    if (data.maxPrice != null) q = q.lte("price", data.maxPrice);
    if (data.minBeds != null) q = q.gte("bedrooms", data.minBeds);
    if (data.search) q = q.ilike("title", `%${data.search}%`);

    switch (data.sort) {
      case "price_asc":
        q = q.order("price", { ascending: true });
        break;
      case "price_desc":
        q = q.order("price", { ascending: false });
        break;
      case "most_viewed":
        q = q.order("views_count", { ascending: false });
        break;
      default:
        q = q.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
    }

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    const { data: rows, count, error } = await q.range(from, to);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

export const getPropertyByRegaCode = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ rega_ad_code: z.string().min(1).max(50) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Normalize: strip all whitespace, search case-insensitively
    const code = data.rega_ad_code.replace(/\s/g, "");
    const { data: property, error } = await supabaseAdmin
      .from("properties")
      .select(
        "id,title,city,district,type,purpose,price,area_sqm,bedrooms,bathrooms,status,rega_ad_code,property_images(image_url,is_primary,sort_order)",
      )
      .ilike("rega_ad_code", code)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return property ?? null;
  });

export const getPublicProperty = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: property, error } = await supabaseAdmin
      .from("properties")
      .select("*, property_images(*), property_amenities(*), owner:owners(name,phone)")
      .eq("id", data.id)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!property) return null;
    // increment views (fire and forget)
    await supabaseAdmin
      .from("properties")
      .update({ views_count: (property.views_count ?? 0) + 1 })
      .eq("id", data.id);
    return property;
  });

export const getHomeStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ count: totalProps }, { data: cities }, { count: availableCount }] = await Promise.all([
    supabaseAdmin
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabaseAdmin.from("properties").select("city").eq("is_published", true),
    supabaseAdmin
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .eq("status", "available"),
  ]);
  const uniqueCities = new Set((cities ?? []).map((c) => c.city)).size;
  return {
    totalProperties: totalProps ?? 0,
    citiesServed: uniqueCities,
    availableProjects: availableCount ?? 0,
    completedDeals: 124,
    happyClients: 380,
  };
});

export const listLatestProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select(
      "id,title,city,district,type,purpose,price,area_sqm,bedrooms,bathrooms,status,is_featured,sold_percentage,views_count,created_at,property_images(image_url,is_primary,sort_order)",
    )
    .eq("is_published", true)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listBestSellingProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select(
      "id,title,city,district,type,purpose,price,area_sqm,bedrooms,bathrooms,status,is_featured,sold_percentage,views_count,created_at,property_images(image_url,is_primary,sort_order)",
    )
    .eq("is_published", true)
    .not("sold_percentage", "is", null)
    .gt("sold_percentage", 0)
    .order("sold_percentage", { ascending: false })
    .limit(6);
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ============== ADMIN ==============

export const listAdminProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        status: z.string().optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("properties")
      .select("*, property_images(image_url,is_primary,sort_order)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (data.search) q = q.ilike("title", `%${data.search}%`);
    if (data.status) q = q.eq("status", data.status as never);

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    const { data: rows, count, error } = await q.range(from, to);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

export const exportAdminPropertiesCSV = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("properties")
      .select(
        "id,title,city,district,type,purpose,price,area_sqm,bedrooms,bathrooms,status,is_published,is_featured,views_count,rega_ad_code,created_at",
      )
      .order("created_at", { ascending: false });
    if (data.ids?.length) q = q.in("id", data.ids);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const PropertyInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
  city: z.string().min(1).max(100),
  district: z.string().max(100).optional().nullable(),
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
    "commercial_hall",
  ]),
  purpose: z.enum(["sale", "rent"]),
  price: z.number().nonnegative(),
  area_sqm: z.number().nonnegative().optional().nullable(),
  bedrooms: z.number().int().nonnegative().optional().nullable(),
  bathrooms: z.number().int().nonnegative().optional().nullable(),
  status: z.enum(["available", "sold", "rented", "reserved"]).default("available"),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(false),
  rega_ad_code: z.string().max(50).optional().nullable(),
  sold_percentage: z.number().min(0).max(100).optional().nullable(),
  handover_date: z.string().optional().nullable(),
  hero_video_url: z.string().url().optional().or(z.literal("")).nullable(),
  is_negotiable: z.boolean().default(false),
  // Pasted Google Maps link; coordinates are derived from it on submit.
  map_url: z.string().max(2000).optional().or(z.literal("")).nullable(),
  location_lat: z.number().min(-90).max(90).optional().nullable(),
  location_lng: z.number().min(-180).max(180).optional().nullable(),
  tags: z.array(z.string()).default([]),
  is_archived: z.boolean().default(false),
  // Type-specific fields (see src/lib/property-fields.ts). Values are strings
  // (select) or numbers; nulls are pruned client-side before submit.
  attributes: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
});

export const upsertProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => PropertyInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("properties")
      .upsert(data as never)
      .select()
      .single();
    if (error) throw propertyWriteError(error);
    return row;
  });

export const deleteProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("properties").delete().eq("id", data.id);
    if (error) throw propertyWriteError(error);
    return { ok: true };
  });

export const togglePropertyFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        field: z.enum(["is_published", "is_featured"]),
        value: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const update = (
      data.field === "is_published" ? { is_published: data.value } : { is_featured: data.value }
    ) as never;
    const { error } = await context.supabase.from("properties").update(update).eq("id", data.id);
    if (error) throw propertyWriteError(error);
    return { ok: true };
  });

export const getCurrentUserRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { roles: (data ?? []).map((r) => r.role), userId: context.userId };
  });
