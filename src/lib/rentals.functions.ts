import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// --- Units ---
export const listAdminUnits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("units")
      .select("*, property:properties(id,title,city)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    id: z.string().uuid().optional(),
    property_id: z.string().uuid(),
    unit_number: z.string().min(1).max(50),
    floor: z.coerce.number().int().optional().nullable(),
    area_sqm: z.coerce.number().nonnegative().optional().nullable(),
    bedrooms: z.coerce.number().int().nonnegative().optional().nullable(),
    bathrooms: z.coerce.number().int().nonnegative().optional().nullable(),
    status: z.enum(["vacant", "rented", "under_maintenance"]).default("vacant"),
    notes: z.string().max(1000).optional().nullable(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("units").upsert(data as never).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("units").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Tenants ---
export const listAdminTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tenants").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(200),
    phone: z.string().min(9).max(20),
    email: z.string().email().optional().or(z.literal("")).nullable(),
    national_id: z.string().max(20).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("tenants").upsert(data as never).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tenants").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- Contracts ---
export const listAdminContracts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("rental_contracts")
      .select("*, unit:units(id,unit_number,property:properties(id,title,city)), tenant:tenants(id,name,phone)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({
    id: z.string().uuid().optional(),
    unit_id: z.string().uuid(),
    tenant_id: z.string().uuid(),
    start_date: z.string(),
    end_date: z.string(),
    rent_amount: z.coerce.number().positive(),
    payment_frequency: z.enum(["monthly", "quarterly", "biannual", "annual"]).default("monthly"),
    deposit_amount: z.coerce.number().nonnegative().optional().nullable(),
    status: z.enum(["draft", "active", "expired", "cancelled"]).default("draft"),
    notes: z.string().max(2000).optional().nullable(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("rental_contracts").upsert(data as never).select().single();
    if (error) throw new Error(error.message);
    if (data.status === "active") {
      await context.supabase.from("units").update({ status: "rented" as never }).eq("id", data.unit_id);
    }
    return row;
  });

export const deleteContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("rental_contracts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
