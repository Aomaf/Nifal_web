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

// --- Public offer submission (خيار مساومة) ------------------------------
// Unauthenticated: called from the public property page when a visitor
// submits a price offer. Writes a lead with source='offer' so it lands in
// the admin Leads screen. Uses supabaseAdmin because anon has no INSERT
// policy on leads — the input is validated and the shape is fixed here,
// so no visitor-controlled column can be set.
const PublicOfferInput = z.object({
  property_id: z.string().uuid(),
  name: z.string().trim().min(2).max(200),
  phone: z
    .string()
    .trim()
    .regex(/^0?5\d{8}$/, "رقم جوال سعودي غير صحيح"),
  amount: z.number().positive().max(1_000_000_000),
  message: z.string().trim().max(1000).optional(),
});

export const submitPropertyOffer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => PublicOfferInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Only accept offers on a published, non-archived, negotiable property.
    const { data: property, error: pe } = await supabaseAdmin
      .from("properties")
      .select("id,title,price,is_negotiable,is_published,is_archived")
      .eq("id", data.property_id)
      .maybeSingle();
    if (pe) throw new Error(pe.message);
    if (!property || !property.is_published || property.is_archived) {
      throw new Error("العقار غير متاح");
    }
    if (!property.is_negotiable) throw new Error("هذا العقار غير قابل للمساومة");

    const offer = new Intl.NumberFormat("en-US").format(data.amount);
    const asking = new Intl.NumberFormat("en-US").format(Number(property.price));
    const notes = [
      `عرض سعر: ${offer} ريال (السعر المعلن: ${asking} ريال)`,
      `العقار: ${property.title}`,
      data.message ? `ملاحظة العميل: ${data.message}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const phone = data.phone.startsWith("0") ? data.phone : `0${data.phone}`;

    const { error } = await supabaseAdmin.from("leads").insert({
      name: data.name,
      phone,
      property_id: data.property_id,
      notes,
      source: "offer",
      status: "new",
    } as never);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
