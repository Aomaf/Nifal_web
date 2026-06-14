import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RequestInput = z.object({
  id: z.string().uuid().optional(),
  unit_id: z.string().uuid().optional().nullable(),
  property_id: z.string().uuid().optional().nullable(),
  tenant_id: z.string().uuid().optional().nullable(),
  category: z.enum(["ac", "electrical", "plumbing", "carpentry", "painting", "other"]),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
});

export const listAdminMaintenanceRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        status: z.string().optional(),
        priority: z.string().optional(),
        category: z.string().optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("maintenance_requests")
      .select(
        "*, unit:units(id,unit_number), property:properties(id,title), tenant:tenants(id,name,phone)",
      )
      .order("priority", { ascending: true }) // high first when sorted by created_at ASC, so we flip
      .order("created_at", { ascending: false });

    if (data.status && data.status !== "all") q = q.eq("status", data.status as never);
    if (data.priority && data.priority !== "all") q = q.eq("priority", data.priority as never);
    if (data.category && data.category !== "all") q = q.eq("category", data.category as never);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertMaintenanceRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => RequestInput.parse(data))
  .handler(async ({ data, context }) => {
    const payload = { ...data, created_by: context.userId };
    const { data: row, error } = await context.supabase
      .from("maintenance_requests")
      .upsert(payload as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const assignTechnician = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        technician_name: z.string().min(1),
        estimated_cost: z.number().nonnegative().optional().nullable(),
        notes: z.string().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("maintenance_requests")
      .update({
        status: "in_progress" as never,
        technician_name: data.technician_name,
        estimated_cost: data.estimated_cost ?? null,
        assigned_at: new Date().toISOString(),
        description: data.notes
          ? await context.supabase
              .from("maintenance_requests")
              .select("description")
              .eq("id", data.id)
              .single()
              .then(
                (r) =>
                  (r.data?.description ?? "") +
                  (data.notes ? `\nملاحظات التعيين: ${data.notes}` : ""),
              )
          : undefined,
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const closeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        actual_cost: z.number().nonnegative().optional().nullable(),
        closure_notes: z.string().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("maintenance_requests")
      .update({
        status: "closed" as never,
        actual_cost: data.actual_cost ?? null,
        closure_notes: data.closure_notes ?? null,
        closed_at: new Date().toISOString(),
      } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reopenRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("maintenance_requests")
      .update({ status: "reopened" as never })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMaintenanceStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows } = await context.supabase
      .from("maintenance_requests")
      .select("status, priority, closed_at");
    const all = rows ?? [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return {
      newCount: all.filter((r) => r.status === "new").length,
      inProgressCount: all.filter((r) => r.status === "in_progress").length,
      closedThisMonth: all.filter(
        (r) => r.status === "closed" && r.closed_at && r.closed_at >= startOfMonth,
      ).length,
      highPriorityOpen: all.filter(
        (r) => r.priority === "high" && ["new", "in_progress", "reopened"].includes(r.status),
      ).length,
    };
  });
