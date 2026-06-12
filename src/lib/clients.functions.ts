import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listAdminClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const ClientInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  type: z.enum(["individual", "company", "foundation", "group"]).default("individual"),
  phone: z.string().min(9).max(20),
  email: z.string().email().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  stage: z.enum(["lead", "prospect", "active", "negotiation", "closed", "lost"]).default("lead"),
  source: z.string().max(100).optional().nullable(),
  interest_type: z.string().max(100).optional().nullable(),
  budget: z.number().nonnegative().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  next_followup_at: z.string().optional().nullable(),
  notes: z.string().max(3000).optional().nullable(),
});

export const upsertClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ClientInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("clients")
      .upsert(data as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("clients").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
