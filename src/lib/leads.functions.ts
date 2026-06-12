import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listAdminLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("leads")
      .select("*, property:properties(id,title,city)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const LeadInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  property_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).default("new"),
  source: z.string().max(100).optional().nullable(),
});

export const upsertLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => LeadInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("leads")
      .upsert(data as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const convertLeadToClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: lead, error: le } = await context.supabase
      .from("leads")
      .select("*")
      .eq("id", data.leadId)
      .single();
    if (le || !lead) throw new Error("Lead not found");
    const { data: client, error: ce } = await context.supabase
      .from("clients")
      .insert({
        name: lead.name,
        phone: lead.phone ?? "",
        email: lead.email,
        stage: "lead" as never,
        notes: lead.notes,
        source: lead.source,
      })
      .select()
      .single();
    if (ce || !client) throw new Error(ce?.message ?? "Failed to create client");
    await context.supabase
      .from("leads")
      .update({ status: "converted" as never, converted_client_id: client.id })
      .eq("id", data.leadId);
    return { client };
  });
