import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listClientActivities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ clientId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("client_activities")
      .select("*")
      .eq("client_id", data.clientId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addClientActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        client_id: z.string().uuid(),
        type: z.enum([
          "call",
          "meeting",
          "whatsapp",
          "email",
          "visit",
          "note",
          "stage_change",
          "lead_converted",
        ]),
        notes: z.string().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("client_activities")
      .insert({
        client_id: data.client_id,
        type: data.type,
        notes: data.notes ?? null,
        created_by: context.userId,
      } as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await context.supabase
      .from("clients")
      .update({ updated_at: new Date().toISOString() } as never)
      .eq("id", data.client_id);
    return row;
  });
