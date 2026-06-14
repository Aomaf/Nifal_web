import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const uploadPropertyImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        propertyId: z.string().uuid(),
        base64: z.string().min(10),
        filename: z.string().min(1),
        isPrimary: z.boolean().default(false),
        sortOrder: z.number().int().default(0),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const base64Data = data.base64.includes(",") ? data.base64.split(",")[1] : data.base64;
    const buf = Buffer.from(base64Data, "base64");
    const ext = "webp";
    const path = `${data.propertyId}/${Date.now()}-${data.sortOrder}.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("property-images")
      .upload(path, buf, { contentType: "image/webp", upsert: false });
    if (upErr) throw new Error(upErr.message);

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("property-images").getPublicUrl(path);

    const { data: row, error } = await context.supabase
      .from("property_images")
      .insert({
        property_id: data.propertyId,
        image_url: publicUrl,
        is_primary: data.isPrimary,
        sort_order: data.sortOrder,
      } as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as { id: string; image_url: string; is_primary: boolean; sort_order: number };
  });

export const deletePropertyImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), image_url: z.string() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Extract storage path from public URL
    const url = new URL(data.image_url);
    const pathParts = url.pathname.split("/property-images/");
    if (pathParts[1]) {
      await supabaseAdmin.storage.from("property-images").remove([pathParts[1]]);
    }
    const { error } = await context.supabase.from("property_images").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderPropertyImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        updates: z.array(
          z.object({
            id: z.string().uuid(),
            sort_order: z.number().int(),
            is_primary: z.boolean(),
          }),
        ),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    for (const u of data.updates) {
      const { error } = await context.supabase
        .from("property_images")
        .update({ sort_order: u.sort_order, is_primary: u.is_primary } as never)
        .eq("id", u.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const listPropertyImages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ propertyId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("property_images")
      .select("id, image_url, is_primary, sort_order")
      .eq("property_id", data.propertyId)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as {
      id: string;
      image_url: string;
      is_primary: boolean;
      sort_order: number;
    }[];
  });
