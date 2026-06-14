import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listAdminOwners = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("owners")
      .select("*, properties(id,price,status,title,city,type)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const OwnerInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  phone: z.string().min(9).max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  national_id: z.string().max(20).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const upsertOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => OwnerInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("owners")
      .upsert(data as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("owners").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
